<?php

namespace App\Services\Commerce;

use App\Models\CartItem;
use App\Models\Offer;
use App\Models\Order;
use App\Models\ProductKey;
use App\Models\User;
use App\Services\Payments\PaymentGateway;
use App\Services\Payments\PaymentIntentData;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Turns the signed-in user's cart into a pending order: keys are reserved under row locks
 * (SELECT ... FOR UPDATE SKIP LOCKED) so two buyers can never get the same key, then a
 * payment is opened with the configured provider.
 */
class CheckoutService
{
    public function __construct(
        private PaymentGateway $gateway,
        private StockService $stock,
        private DiscountService $discounts,
    ) {}

    /** @return array{0: Order, 1: PaymentIntentData} */
    public function start(User $user, ?string $discountCode = null): array
    {
        $this->stock->sweepExpired();

        $items = $user->cartItems()->with('offer.product.platform', 'offer.product.region', 'offer.seller')->orderBy('id')->get();
        if ($items->isEmpty()) {
            throw ValidationException::withMessages(['cart' => 'Your cart is empty.']);
        }

        // Coming back to checkout with the same cart picks up the open order, so the keys stay
        // reserved and the reservation clock keeps running instead of restarting.
        $open = Order::where('user_id', $user->id)->where('status', Order::PENDING)->with('items')->latest('id')->first();
        if ($open && $this->matchesCart($open, $items, $discountCode)) {
            $intent = rescue(fn () => $this->gateway->resume($open), null);
            if ($intent) {
                return [$open, $intent];
            }
        }

        // One open checkout per user: abandoning a payment page must not hoard stock.
        Order::where('user_id', $user->id)->where('status', Order::PENDING)->get()
            ->each(fn (Order $o) => $this->stock->close($o, Order::CANCELLED));

        $expiresAt = now()->addMinutes(config('shop.reservation_minutes'));

        $order = DB::transaction(function () use ($user, $items, $expiresAt, $discountCode) {
            $order = Order::create([
                'number' => Order::newNumber(),
                'user_id' => $user->id,
                'status' => Order::PENDING,
                'currency' => config('shop.currency'),
                'subtotal_cents' => 0,
                'total_cents' => 0,
                'payment_provider' => $this->gateway->driver(),
                'expires_at' => $expiresAt,
            ]);

            $subtotal = 0;
            foreach ($items as $item) {
                /** @var CartItem $item */
                $offer = Offer::whereKey($item->offer_id)->lockForUpdate()->first();
                $product = $item->offer->product;

                if (! $offer || ! $offer->is_active || ! $product->is_active) {
                    throw ValidationException::withMessages(['cart' => "{$product->title} is no longer available."]);
                }

                $keys = ProductKey::where('offer_id', $offer->id)
                    ->sellable()
                    ->orderBy('id')
                    ->limit($item->quantity)
                    ->lock('for update skip locked')
                    ->get(['id']);

                if ($keys->count() < $item->quantity) {
                    throw ValidationException::withMessages([
                        'cart' => $keys->isEmpty()
                            ? "{$product->title} from {$item->offer->seller->name} just sold out."
                            : "Only {$keys->count()} left of {$product->title} from {$item->offer->seller->name}.",
                    ]);
                }

                $orderItem = $order->items()->create([
                    'offer_id' => $offer->id,
                    'product_id' => $product->id,
                    'seller_id' => $offer->seller_id,
                    'product_title' => $product->title,
                    'product_slug' => $product->slug,
                    'cover_url' => $product->cover_url ?? $product->header_url,
                    'platform_name' => $product->platform->name,
                    'region_name' => $product->region->name,
                    'seller_name' => $item->offer->seller->name,
                    'unit_price_cents' => $offer->price_cents,
                    'cashback_percent' => $offer->cashback_percent,
                    'quantity' => $item->quantity,
                ]);

                ProductKey::whereIn('id', $keys->pluck('id'))->update([
                    'status' => ProductKey::RESERVED,
                    'order_item_id' => $orderItem->id,
                    'reserved_until' => $expiresAt,
                ]);

                $subtotal += $offer->price_cents * $item->quantity;
            }

            $fee = (int) config('shop.service_fee_cents');
            $discount = $this->discounts->evaluate($discountCode, $subtotal, $fee);
            if ($discount['error']) {
                throw ValidationException::withMessages(['discount' => $discount['error']]);
            }
            $total = $subtotal + $fee - $discount['discount'];
            // Stripe can't charge less; say so instead of failing later as "provider unavailable".
            if ($total < PaymentGateway::MIN_CHARGE_CENTS) {
                throw ValidationException::withMessages(['cart' => 'The minimum order is €'.number_format(PaymentGateway::MIN_CHARGE_CENTS / 100, 2).'.']);
            }
            $order->update([
                'subtotal_cents' => $subtotal,
                'service_fee_cents' => $fee,
                'discount_code' => $discount['code'],
                'discount_cents' => $discount['discount'],
                'total_cents' => $total,
            ]);

            return $order;
        });

        $this->stock->refreshOffers($items->pluck('offer_id'));

        try {
            $intent = $this->gateway->createIntent($order);
        } catch (\Throwable $e) {
            $order->update(['status' => Order::FAILED]);
            $this->stock->releaseOrder($order);
            report($e);
            throw ValidationException::withMessages(['payment' => 'The payment provider is unavailable right now. Please try again.']);
        }

        $order->update(['payment_reference' => $intent->reference]);

        return [$order->fresh('items'), $intent];
    }

    /**
     * Same offers, quantities, prices and discount code as the cart now holds.
     *
     * @param  Collection<int, CartItem>  $items
     */
    private function matchesCart(Order $order, Collection $items, ?string $discountCode): bool
    {
        $code = strtoupper(trim((string) $discountCode)) ?: null;
        $cart = $items->map(fn (CartItem $item) => "{$item->offer_id}:{$item->quantity}:{$item->offer->price_cents}")->sort()->values()->all();
        $ordered = $order->items->map(fn ($item) => "{$item->offer_id}:{$item->quantity}:{$item->unit_price_cents}")->sort()->values()->all();

        return $cart === $ordered && $code === $order->discount_code;
    }
}
