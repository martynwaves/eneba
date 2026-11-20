<?php

namespace App\Services\Commerce;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductKey;
use App\Models\User;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;

/**
 * Delivers keys once a payment has succeeded. Idempotent: the browser confirmation and the
 * Stripe webhook may both call it, and only the first one does the work. Any other error (a
 * database hiccup, say) rolls back and propagates, so the caller can retry instead of refunding.
 */
class OrderFulfillment
{
    public function __construct(
        private PaymentGateway $gateway,
        private StockService $stock,
    ) {}

    public function fulfill(Order $order): Order
    {
        try {
            DB::transaction(function () use ($order) {
                $locked = Order::whereKey($order->id)->lockForUpdate()->with('items')->first();
                // Expired or cancelled orders can still be paid late: we try to re-acquire keys.
                if (! in_array($locked->status, [Order::PENDING, Order::EXPIRED, Order::CANCELLED], true)) {
                    return;
                }

                foreach ($locked->items as $item) {
                    $keys = ProductKey::where('order_item_id', $item->id)
                        ->where('status', ProductKey::RESERVED)
                        ->lockForUpdate()
                        ->get(['id']);

                    $missing = $item->quantity - $keys->count();
                    if ($missing > 0 && $item->offer_id) {
                        $keys = $keys->merge(ProductKey::where('offer_id', $item->offer_id)
                            ->sellable()
                            ->orderBy('id')
                            ->limit($missing)
                            ->lock('for update skip locked')
                            ->get(['id']));
                    }
                    if ($keys->count() < $item->quantity) {
                        throw new UndeliverableOrder("Not enough keys left for order item {$item->id}");
                    }

                    ProductKey::whereIn('id', $keys->pluck('id'))->update([
                        'status' => ProductKey::SOLD,
                        'order_item_id' => $item->id,
                        'reserved_until' => null,
                    ]);

                    Product::whereKey($item->product_id)->increment('sales_count', $item->quantity);
                }

                // The wallet's share (all of it, or the part next to a card payment) is taken together
                // with the keys. If the balance is gone, the transaction rolls back and the card
                // part is refunded below.
                if ($locked->wallet_cents > 0) {
                    $buyer = User::whereKey($locked->user_id)->lockForUpdate()->first();
                    if ($buyer->cashback_balance_cents < $locked->wallet_cents) {
                        throw new UndeliverableOrder("Wallet balance no longer covers order {$locked->number}");
                    }
                    $buyer->decrement('cashback_balance_cents', $locked->wallet_cents);
                }

                $locked->update(['status' => Order::PAID, 'paid_at' => now()]);

                // Seller cashback lands in the buyer's Eneba wallet.
                $cashback = (int) $locked->items->sum(fn ($item) => intdiv($item->unit_price_cents * $item->quantity * $item->cashback_percent, 100));
                if ($cashback > 0) {
                    User::whereKey($locked->user_id)->increment('cashback_balance_cents', $cashback);
                }

                CartItem::where('user_id', $locked->user_id)
                    ->whereIn('offer_id', $locked->items->pluck('offer_id')->filter())
                    ->delete();
            });
        } catch (UndeliverableOrder $e) {
            // Paid, but the keys (very late payment on an expired order) or the wallet balance are
            // gone. The rollback already undid any wallet deduction; only a card payment needs
            // refunding.
            report($e);
            $order->update(['status' => Order::REFUNDED]);
            $this->stock->releaseOrder($order);
            if ($order->payment_provider !== 'wallet') {
                try {
                    $this->gateway->refund($order);
                } catch (\Throwable $refundError) {
                    report($refundError);
                }
            }
        }

        $this->stock->refreshOffers($order->items()->pluck('offer_id')->filter());

        return $order->fresh();
    }
}
