<?php

use App\Models\CartItem;
use App\Models\DiscountCode;
use App\Models\Order;
use App\Models\ProductKey;
use App\Models\User;
use App\Services\Payments\PaymentGateway;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Exceptions;

it('prices a guest cart from server data', function () {
    $product = product('Guest Game', ['PixelVault' => [1999, 1]]);
    $offerId = $product->offers()->first()->id;

    $this->postJson('/api/cart/preview', ['items' => [['offer_id' => $offerId, 'quantity' => 3]]])
        ->assertOk()
        ->assertJsonPath('data.lines.0.problem', 'insufficient_stock')
        ->assertJsonPath('data.summary.has_problems', true);
});

it('adds to an existing cart line, up to 10 per offer', function () {
    signIn();
    $offerId = product('Stacked Game', ['PixelVault' => [999, 12]])->offers()->first()->id;

    addToCart($offerId, 4);
    addToCart($offerId, 3);
    expect(CartItem::sole()->quantity)->toBe(7);

    addToCart($offerId, 9);
    expect(CartItem::sole()->quantity)->toBe(10);
});

it('runs the full purchase: reserve, pay, deliver keys', function () {
    $user = signIn();
    $product = product('Bought Game', ['PixelVault' => [1999, 3]]);
    $offer = $product->offers()->first();
    addToCart($offer->id, 2);

    $checkout = $this->postJson('/api/checkout')->assertCreated();
    $number = $checkout->json('order.number');

    expect($checkout->json('order.total'))->toBe(2 * 1999 + config('shop.service_fee_cents'))
        ->and(ProductKey::where('status', 'reserved')->count())->toBe(2)
        ->and($offer->fresh()->stock)->toBe(1);

    $order = $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])
        ->assertOk()
        ->assertJsonPath('order.status', 'paid')
        ->json('order');

    expect($order['items'][0]['keys'])->toHaveCount(2)
        ->and(ProductKey::where('status', 'sold')->count())->toBe(2)
        ->and($user->cartItems()->count())->toBe(0)
        ->and($product->fresh()->stock)->toBe(1);

    $keyId = $order['items'][0]['keys'][0]['id'];
    $code = $this->postJson("/api/orders/{$number}/keys/{$keyId}/reveal")->assertOk()->json('data.code');
    expect($code)->toMatch('/^[A-Z0-9]{5}(-[A-Z0-9]{5}){2}$/');

    // Coming back to the order later still shows the revealed key.
    $this->getJson("/api/orders/{$number}")->assertJsonPath('data.items.0.keys.0.code', $code);
});

it('credits seller cashback to the buyer once the order is paid', function () {
    $user = signIn();
    $offer = product('Cashback Game', ['PixelVault' => [2000, 2]])->offers()->first();
    $offer->update(['cashback_percent' => 10]);
    addToCart($offer->id, 2);
    $number = $this->postJson('/api/checkout')->json('order.number');

    expect($user->fresh()->cashback_balance_cents)->toBe(0);

    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertOk();
    // Confirming twice (browser + webhook) must not pay cashback twice.
    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertOk();

    expect($user->fresh()->cashback_balance_cents)->toBe(400);
    signIn($user->fresh());
    $this->getJson('/api/auth/me')->assertJsonPath('data.cashback_balance', 400);
});

it('lists bought keys in the keys library and exposes profile stats', function () {
    $user = signIn();
    $offer = product('Library Game', ['PixelVault' => [1500, 2]])->offers()->first();
    addToCart($offer->id, 2);
    $number = $this->postJson('/api/checkout')->json('order.number');
    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertOk();

    $this->getJson('/api/keys')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.order_number', $number)
        ->assertJsonPath('data.0.revealed', false)
        ->assertJsonPath('data.0.code', null);

    signIn($user->fresh());
    $this->getJson('/api/auth/me')->assertJsonPath('data.wishlist_count', 0);
});

it('prices a discount code into the cart and explains why one does not apply', function () {
    $offerId = product('Coupon Game', ['PixelVault' => [3000, 5]])->offers()->first()->id;
    DiscountCode::factory()->create(['code' => 'TENOFF', 'max_discount_cents' => 200]);
    DiscountCode::factory()->fixed(500)->create(['code' => 'BIGSPEND', 'min_subtotal_cents' => 5000]);
    DiscountCode::factory()->expired()->create(['code' => 'OLD']);
    $preview = fn (string $code) => $this->postJson('/api/cart/preview', [
        'items' => [['offer_id' => $offerId, 'quantity' => 1]],
        'code' => $code,
    ])->assertOk();

    $preview('tenoff')
        ->assertJsonPath('data.summary.discount_code', 'TENOFF')
        ->assertJsonPath('data.summary.discount', 200)
        ->assertJsonPath('data.summary.total', 2800 + config('shop.service_fee_cents'));
    $preview('BIGSPEND')
        ->assertJsonPath('data.summary.discount', 0)
        ->assertJsonPath('data.summary.discount_error', 'This code needs an order of at least €50.00.');
    $preview('OLD')->assertJsonPath('data.summary.discount_error', 'This discount code is not valid.');
});

it('keeps a code applied, without blaming its minimum, while nothing in the cart can be bought', function () {
    $offerId = product('Sold Out Coupon Game', ['PixelVault' => [3000, 0]])->offers()->first()->id;
    DiscountCode::factory()->create(['code' => 'TENOFF']);

    $this->postJson('/api/cart/preview', ['items' => [['offer_id' => $offerId, 'quantity' => 1]], 'code' => 'TENOFF'])
        ->assertOk()
        ->assertJsonPath('data.summary.discount_code', 'TENOFF')
        ->assertJsonPath('data.summary.discount', 0)
        ->assertJsonPath('data.summary.discount_error', null);
});

it('lists only working discount codes for testers', function () {
    DiscountCode::factory()->create(['code' => 'GAMER15', 'value' => 15, 'min_subtotal_cents' => 5000, 'max_discount_cents' => 3000]);
    DiscountCode::factory()->expired()->create(['code' => 'OLD']);

    $this->getJson('/api/config')
        ->assertOk()
        ->assertJsonCount(1, 'data.demo_discount_codes')
        ->assertJsonPath('data.demo_discount_codes.0', ['code' => 'GAMER15', 'summary' => '15% off orders of €50+, up to €30']);
});

it('charges the discounted total at checkout and rejects an invalid code', function () {
    signIn();
    addToCart(product('Coupon Game', ['PixelVault' => [3000, 5]])->offers()->first()->id);
    DiscountCode::factory()->fixed(500)->create(['code' => 'FIVEOFF']);

    $this->postJson('/api/checkout', ['code' => 'NOPE'])->assertUnprocessable()->assertJsonValidationErrors('discount');

    $order = $this->postJson('/api/checkout', ['code' => 'fiveoff'])->assertCreated()->json('order');
    expect($order['discount'])->toBe(500)
        ->and($order['discount_code'])->toBe('FIVEOFF')
        ->and($order['total'])->toBe(2500 + config('shop.service_fee_cents'));
});

it('pays from the Eneba Wallet only when the balance covers the order', function () {
    $user = signIn();
    $offer = product('Wallet Game', ['PixelVault' => [1500, 2]])->offers()->first();
    addToCart($offer->id);
    $number = $this->postJson('/api/checkout')->json('order.number');

    $this->postJson("/api/orders/{$number}/pay-with-wallet")->assertUnprocessable()->assertJsonValidationErrors('wallet');

    $user->forceFill(['cashback_balance_cents' => 2000])->save();
    $this->postJson("/api/orders/{$number}/pay-with-wallet")
        ->assertOk()
        ->assertJsonPath('order.status', 'paid')
        ->assertJsonPath('order.payment_provider', 'wallet');

    expect($user->fresh()->cashback_balance_cents)->toBe(2000 - 1500);
});

it('refuses wallet payment once the card payment has gone through', function () {
    $user = signIn();
    $user->forceFill(['cashback_balance_cents' => 2000])->save();
    addToCart(product('Double Pay Game', ['PixelVault' => [1500, 2]])->offers()->first()->id);
    $number = $this->postJson('/api/checkout')->json('order.number');
    app(PaymentGateway::class)->simulate(Order::where('number', $number)->first(), 'success');

    $this->postJson("/api/orders/{$number}/pay-with-wallet")->assertUnprocessable()->assertJsonValidationErrors('wallet');

    expect($user->fresh()->cashback_balance_cents)->toBe(2000);
});

it('splits an order between the wallet and the card, taking the balance only once the card pays', function () {
    $user = signIn();
    $user->forceFill(['cashback_balance_cents' => 400])->save();
    addToCart(product('Split Game', ['PixelVault' => [1500, 2]])->offers()->first()->id);
    $number = $this->postJson('/api/checkout')->json('order.number');

    $this->postJson("/api/orders/{$number}/wallet", ['use' => true])
        ->assertOk()
        ->assertJsonPath('order.wallet_amount', 400)
        ->assertJsonPath('order.card_amount', 1100);
    expect($user->fresh()->cashback_balance_cents)->toBe(400);

    // A declined card leaves the balance alone.
    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'decline'])->assertStatus(402);
    expect($user->fresh()->cashback_balance_cents)->toBe(400);

    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertOk()->assertJsonPath('order.status', 'paid');
    expect($user->fresh()->cashback_balance_cents)->toBe(0);

    $this->postJson("/api/orders/{$number}/wallet", ['use' => false])->assertUnprocessable();
});

it('can take the wallet back off an order and refuses an empty balance', function () {
    signIn();
    addToCart(product('Split Game', ['PixelVault' => [1500, 2]])->offers()->first()->id);
    $number = $this->postJson('/api/checkout')->json('order.number');

    $this->postJson("/api/orders/{$number}/wallet", ['use' => true])->assertUnprocessable()->assertJsonValidationErrors('wallet');
    $this->postJson("/api/orders/{$number}/wallet", ['use' => false])->assertOk()->assertJsonPath('order.card_amount', 1500);
});

it('picks up the open order on a return visit instead of restarting the reservation', function () {
    signIn();
    $offerId = product('Return Game', ['PixelVault' => [1500, 5]])->offers()->first()->id;
    addToCart($offerId);

    $first = $this->postJson('/api/checkout')->assertCreated()->json('order');
    $this->travel(5)->minutes();
    $again = $this->postJson('/api/checkout')->assertCreated()->json('order');

    expect($again['number'])->toBe($first['number'])
        ->and($again['expires_at'])->toBe($first['expires_at'])
        ->and(ProductKey::where('status', 'reserved')->count())->toBe(1);

    // A changed cart gets a fresh order and the old reservation is released.
    addToCart($offerId);
    $changed = $this->postJson('/api/checkout')->assertCreated()->json('order');
    expect($changed['number'])->not->toBe($first['number'])
        ->and(Order::where('number', $first['number'])->value('status'))->toBe(Order::CANCELLED)
        ->and(ProductKey::where('status', 'reserved')->count())->toBe(2);
});

it('keeps the order payable after a declined card', function () {
    signIn();
    $offer = product('Declined Game')->offers()->first();
    addToCart($offer->id);
    $number = $this->postJson('/api/checkout')->json('order.number');

    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'decline'])->assertStatus(402);
    expect(Order::where('number', $number)->value('status'))->toBe('pending');

    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertOk()->assertJsonPath('order.status', 'paid');
});

it('refunds a late payment whose keys sold out after the reservation lapsed', function () {
    $buyer = signIn();
    $offer = product('Late Game', ['PixelVault' => [999, 1]])->offers()->first();
    addToCart($offer->id);
    $number = $this->postJson('/api/checkout')->json('order.number');
    $this->travel(config('shop.reservation_minutes') + 1)->minutes();
    $this->artisan('shop:sweep')->assertSuccessful();

    signIn(User::factory()->create());
    addToCart($offer->id);
    $otherNumber = $this->postJson('/api/checkout')->json('order.number');
    $this->postJson("/api/orders/{$otherNumber}/confirm", ['simulate' => 'success'])->assertOk();

    signIn($buyer);
    app(PaymentGateway::class)->simulate(Order::where('number', $number)->first(), 'success');
    $this->postJson("/api/orders/{$number}/confirm")->assertOk()->assertJsonPath('order.status', 'refunded');

    expect(ProductKey::where('status', 'sold')->sole()->orderItem->order->number)->toBe($otherNumber);
});

it('leaves a paid order to be retried, not refunded, when the database fails during delivery', function () {
    Exceptions::fake();
    signIn();
    addToCart(product('Flaky Game')->offers()->first()->id);
    $number = $this->postJson('/api/checkout')->json('order.number');

    $failing = true;
    Order::updating(function (Order $order) use (&$failing) {
        if ($failing && $order->status === Order::PAID) {
            throw new QueryException('pgsql', 'update "orders"', [], new RuntimeException('could not write to disk'));
        }
    });

    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertServerError();
    expect(Order::where('number', $number)->value('status'))->toBe('pending');
    Exceptions::assertReported(QueryException::class);

    $failing = false;
    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertOk()->assertJsonPath('order.status', 'paid');
});

it('never sells the same key twice', function () {
    $offer = product('Last Copy', ['PixelVault' => [999, 1]])->offers()->first();

    signIn();
    addToCart($offer->id);
    $this->postJson('/api/checkout')->assertCreated();

    // A second buyer finds it reserved.
    signIn(User::factory()->create());
    CartItem::create(['user_id' => auth()->id(), 'offer_id' => $offer->id, 'quantity' => 1]);
    $this->postJson('/api/checkout')->assertUnprocessable()->assertJsonValidationErrors('cart');
});

it('returns reserved keys to stock when a checkout expires', function () {
    signIn();
    $offer = product('Abandoned Game', ['PixelVault' => [999, 2]])->offers()->first();
    addToCart($offer->id, 2);
    $number = $this->postJson('/api/checkout')->json('order.number');
    expect($offer->fresh()->stock)->toBe(0);

    $this->travel(config('shop.reservation_minutes') + 1)->minutes();
    $this->artisan('shop:sweep')->assertSuccessful();

    expect(Order::where('number', $number)->value('status'))->toBe('expired')
        ->and($offer->fresh()->stock)->toBe(2);
});

it('closes a lapsed checkout when the buyer opens it, without a scheduler', function () {
    signIn();
    $offer = product('Forgotten Game', ['PixelVault' => [999, 1]])->offers()->first();
    addToCart($offer->id);
    $number = $this->postJson('/api/checkout')->json('order.number');

    $this->travel(config('shop.reservation_minutes') + 1)->minutes();

    $this->getJson("/api/orders/{$number}")->assertOk()->assertJsonPath('data.status', 'expired');
    $this->getJson('/api/orders')->assertOk()->assertJsonCount(0, 'data');
    expect($offer->fresh()->stock)->toBe(1);
});

it('does not let users see other people\'s orders', function () {
    signIn();
    $offer = product('Private Game')->offers()->first();
    addToCart($offer->id);
    $number = $this->postJson('/api/checkout')->json('order.number');

    signIn(User::factory()->create());
    $this->getJson("/api/orders/{$number}")->assertNotFound();
    $this->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertNotFound();
});

it('rejects an empty cart at checkout', function () {
    signIn();
    $this->postJson('/api/checkout')->assertUnprocessable()->assertJsonValidationErrors('cart');
});

it('rejects Stripe webhooks with a bad signature', function () {
    $this->postJson('/api/webhooks/stripe', ['type' => 'payment_intent.succeeded'], ['Stripe-Signature' => 't=1,v1=bad'])
        ->assertStatus(400);
});

it('refuses an order below the smallest amount a card can be charged', function () {
    signIn();
    addToCart(product('Tiny Game', ['PixelVault' => [40, 1]])->offers()->first()->id);

    $this->postJson('/api/checkout')->assertUnprocessable()->assertJsonValidationErrors('cart');
    expect(Order::count())->toBe(0);
});

it('won\'t add an offer of a hidden product to the cart', function () {
    signIn();
    $offer = product('Hidden Game', ['PixelVault' => [1500, 2]], ['is_active' => false])->offers()->first();

    $this->postJson('/api/cart/items', ['offer_id' => $offer->id])->assertUnprocessable();
});
