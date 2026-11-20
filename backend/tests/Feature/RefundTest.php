<?php

use App\Models\DiscountCode;
use App\Models\Offer;
use App\Models\Order;
use App\Models\ProductKey;
use App\Models\User;

/**
 * Buys the signed-in user's cart with the simulated card (optionally with part of it paid from
 * the wallet) and returns the paid order's JSON.
 *
 * @return array<string, mixed>
 */
function buyCart(?string $code = null, bool $useWallet = false): array
{
    $number = test()->postJson('/api/checkout', ['code' => $code])->assertCreated()->json('order.number');
    if ($useWallet) {
        test()->postJson("/api/orders/{$number}/wallet", ['use' => true])->assertOk();
    }

    return test()->postJson("/api/orders/{$number}/confirm", ['simulate' => 'success'])->assertOk()->json('order');
}

function keyIds(array $order): array
{
    return collect($order['items'])->flatMap(fn (array $item) => collect($item['keys'])->pluck('id'))->all();
}

it('refunds an unrevealed key, returns it to stock and keeps the earned cashback in the wallet', function () {
    $user = signIn();
    $offer = product('Refund Game', ['PixelVault' => [2000, 3]])->offers()->first();
    $offer->update(['cashback_percent' => 5]);
    addToCart($offer->id, 2);
    $order = buyCart();
    [$keyId] = keyIds($order);

    expect($order['items'][0]['keys'][0]['refund_amount'])->toBe(2000 - 100)
        ->and($user->fresh()->cashback_balance_cents)->toBe(200);

    $this->postJson("/api/orders/{$order['number']}/keys/{$keyId}/refund")
        ->assertOk()
        ->assertJsonPath('refund', ['amount' => 1900, 'to_card' => 1900, 'to_wallet' => 0])
        ->assertJsonPath('order.status', 'paid')
        ->assertJsonPath('order.refunded', 1900)
        ->assertJsonPath('order.items.0.refunded_quantity', 1)
        ->assertJsonCount(1, 'order.items.0.keys');

    expect(ProductKey::find($keyId)->status)->toBe(ProductKey::AVAILABLE)
        ->and($offer->fresh()->stock)->toBe(2)
        ->and($user->fresh()->cashback_balance_cents)->toBe(200);
});

it('marks the order refunded once every key is refunded, and never refunds a key twice', function () {
    signIn();
    addToCart(product('Single Game', ['PixelVault' => [1500, 1]])->offers()->first()->id);
    $order = buyCart();
    [$keyId] = keyIds($order);

    $this->postJson("/api/orders/{$order['number']}/keys/{$keyId}/refund")->assertOk()->assertJsonPath('order.status', 'refunded');
    $this->postJson("/api/orders/{$order['number']}/keys/{$keyId}/refund")->assertNotFound();
    $this->getJson('/api/keys')->assertJsonCount(0, 'data');
});

it('takes the discount share off the refund', function () {
    signIn();
    addToCart(product('Discount Game', ['PixelVault' => [1500, 2]])->offers()->first()->id, 2);
    DiscountCode::factory()->fixed(500)->create(['code' => 'FIVEOFF']);
    $order = buyCart('FIVEOFF');

    // €5 off €30 of keys: each €15 key carries €2.50 of the discount.
    expect(collect($order['items'][0]['keys'])->pluck('refund_amount')->all())->toBe([1250, 1250]);
});

it('refunds the card share first, then puts the rest back in the wallet', function () {
    $user = signIn();
    $user->forceFill(['cashback_balance_cents' => 400])->save();
    addToCart(product('Split Game', ['PixelVault' => [1500, 2]])->offers()->first()->id, 2);
    $order = buyCart(useWallet: true);
    [$first, $second] = keyIds($order);
    expect($order['card_amount'])->toBe(2600)->and($user->fresh()->cashback_balance_cents)->toBe(0);

    $this->postJson("/api/orders/{$order['number']}/keys/{$first}/refund")->assertJsonPath('refund', ['amount' => 1500, 'to_card' => 1500, 'to_wallet' => 0]);
    $this->postJson("/api/orders/{$order['number']}/keys/{$second}/refund")->assertJsonPath('refund', ['amount' => 1500, 'to_card' => 1100, 'to_wallet' => 400]);

    expect($user->fresh()->cashback_balance_cents)->toBe(400)
        ->and(Order::where('number', $order['number'])->value('status'))->toBe(Order::REFUNDED);
});

it('refuses revealed keys and other people\'s keys', function () {
    signIn();
    addToCart(product('Guarded Game', ['PixelVault' => [1500, 2]])->offers()->first()->id, 2);
    $order = buyCart();
    [$revealed, $hidden] = keyIds($order);

    $this->postJson("/api/orders/{$order['number']}/keys/{$revealed}/reveal")->assertOk();
    $this->postJson("/api/orders/{$order['number']}/keys/{$revealed}/refund")->assertUnprocessable()->assertJsonValidationErrors('key');

    signIn(User::factory()->create());
    $this->postJson("/api/orders/{$order['number']}/keys/{$hidden}/refund")->assertNotFound();
    expect(Offer::first()->stock)->toBe(0);
});
