<?php

namespace App\Services\Commerce;

use App\Models\Order;
use App\Models\Product;
use App\Models\ProductKey;
use App\Models\User;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Instant refunds for keys the buyer hasn't revealed (Eneba's "unviewed keys" policy). The key
 * goes back on sale, and the money goes back the way it came: the card share first, then the
 * wallet share. See Order::keyRefundCents() for the amount.
 */
class KeyRefunds
{
    public function __construct(
        private PaymentGateway $gateway,
        private StockService $stock,
    ) {}

    /** @return array{amount: int, to_card: int, to_wallet: int} */
    public function refund(Order $order, ProductKey $key): array
    {
        $refund = DB::transaction(function () use ($order, $key) {
            $order = Order::whereKey($order->id)->lockForUpdate()->with('items')->firstOrFail();
            $key = ProductKey::whereKey($key->id)->lockForUpdate()->firstOrFail();
            $item = $order->items->firstWhere('id', $key->order_item_id);

            if ($order->status !== Order::PAID || ! $item || $key->status !== ProductKey::SOLD) {
                throw ValidationException::withMessages(['key' => 'This key can no longer be refunded.']);
            }
            if ($key->revealed_at) {
                throw ValidationException::withMessages(['key' => "Revealed keys can't be refunded."]);
            }

            $amount = $order->keyRefundCents($item);
            $toCard = min($amount, max(0, $order->cardAmountCents() - $order->refunded_cents));
            $toWallet = $amount - $toCard;

            // The provider is called while the rows are locked: if it fails, nothing changes here,
            // and its idempotency key makes a retry safe if the commit below were to fail instead.
            if ($toCard > 0) {
                try {
                    $this->gateway->refund($order, $toCard, "refund-{$order->number}-key-{$key->id}");
                } catch (Throwable $e) {
                    report($e);
                    throw ValidationException::withMessages(['key' => "The refund couldn't be processed right now. Please try again."]);
                }
            }
            if ($toWallet > 0) {
                User::whereKey($order->user_id)->increment('cashback_balance_cents', $toWallet);
            }

            // Nobody has seen the code, so the key can be sold again.
            $key->update(['status' => ProductKey::AVAILABLE, 'order_item_id' => null, 'reserved_until' => null]);
            $item->increment('refunded_quantity');
            Product::whereKey($item->product_id)->where('sales_count', '>', 0)->decrement('sales_count');

            $keysLeft = $order->items->sum(fn ($line) => $line->quantity - $line->refunded_quantity);
            $order->update([
                'refunded_cents' => $order->refunded_cents + $amount,
                'status' => $keysLeft > 0 ? Order::PAID : Order::REFUNDED,
            ]);

            return ['amount' => $amount, 'to_card' => $toCard, 'to_wallet' => $toWallet, 'offer_id' => $item->offer_id];
        });

        $this->stock->refreshOffers(array_filter([$refund['offer_id']]));
        unset($refund['offer_id']);

        return $refund;
    }
}
