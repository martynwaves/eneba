<?php

namespace App\Services\Commerce;

use App\Models\CartItem;
use App\Models\Order;
use App\Models\Product;
use App\Models\ProductKey;
use App\Models\Seller;
use App\Models\User;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Delivers keys once a payment has succeeded. Idempotent: the browser confirmation and the
 * Stripe webhook may both call it, and only the first one does the work.
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
                        throw new RuntimeException("Not enough keys left for order item {$item->id}");
                    }

                    ProductKey::whereIn('id', $keys->pluck('id'))->update([
                        'status' => ProductKey::SOLD,
                        'order_item_id' => $item->id,
                        'reserved_until' => null,
                    ]);

                    Product::whereKey($item->product_id)->increment('sales_count', $item->quantity);
                    Seller::whereKey($item->seller_id)->increment('sales_count', $item->quantity);
                }

                // Card + wallet split: the wallet's share is taken now that the card has paid. If the
                // balance is gone, the whole order is refunded (the transaction rolls back).
                if ($locked->wallet_cents > 0 && $locked->payment_provider !== 'wallet') {
                    $buyer = User::whereKey($locked->user_id)->lockForUpdate()->first();
                    if ($buyer->cashback_balance_cents < $locked->wallet_cents) {
                        throw new RuntimeException("Wallet balance no longer covers order {$locked->number}");
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
        } catch (RuntimeException $e) {
            // Paid, but the stock is gone (very late payment on an expired order): refund it.
            report($e);
            $order->update(['status' => Order::REFUNDED]);
            $this->stock->releaseOrder($order);
            if ($order->payment_provider === 'wallet') {
                User::whereKey($order->user_id)->increment('cashback_balance_cents', $order->total_cents);
            } else {
                try {
                    $this->gateway->refund($order);
                } catch (\Throwable $refundError) {
                    report($refundError);
                }
            }
        }

        $this->stock->refreshOffers($order->items()->pluck('offer_id')->filter());

        return $order->fresh(['items.keys', 'items.product']);
    }
}
