<?php

namespace App\Services\Commerce;

use App\Models\Offer;
use App\Models\Order;
use App\Models\ProductKey;
use App\Services\Payments\PaymentGateway;
use Illuminate\Support\Facades\DB;

/** Keeps offer/product stock counters in sync with the key pool and releases stale holds. */
class StockService
{
    /** @param iterable<int> $offerIds */
    public function refreshOffers(iterable $offerIds): void
    {
        $offers = Offer::with('product')->whereIn('id', collect($offerIds)->unique())->get();
        foreach ($offers as $offer) {
            $offer->refreshStock();
        }
        foreach ($offers->pluck('product')->unique('id') as $product) {
            $product->refreshOfferSummary();
        }
    }

    /** Return an order's reserved keys to the pool. */
    public function releaseOrder(Order $order): void
    {
        $itemIds = $order->items()->pluck('id');
        $offerIds = $order->items()->pluck('offer_id')->filter();

        ProductKey::whereIn('order_item_id', $itemIds)
            ->where('status', ProductKey::RESERVED)
            ->update(['status' => ProductKey::AVAILABLE, 'order_item_id' => null, 'reserved_until' => null]);

        $this->refreshOffers($offerIds);
    }

    /** Expire pending orders whose reservation window has passed. Safe to run any time. */
    public function sweepExpired(): int
    {
        $expired = Order::where('status', Order::PENDING)->where('expires_at', '<', now())->get();

        foreach ($expired as $order) {
            $this->close($order, Order::EXPIRED);
        }

        return $expired->count();
    }

    /** Move a pending order to a final non-paid status, cancel its payment and free its keys. */
    public function close(Order $order, string $status): void
    {
        $closed = DB::transaction(function () use ($order, $status) {
            $locked = Order::whereKey($order->id)->lockForUpdate()->first();
            if ($locked?->status !== Order::PENDING) {
                return false;
            }
            $locked->update(['status' => $status]);
            $this->releaseOrder($locked);

            return true;
        });

        if ($closed && $order->payment_reference) {
            try {
                app(PaymentGateway::class)->cancel($order);
            } catch (\Throwable $e) {
                report($e); // a late payment is still handled by fulfilment (re-acquire or refund)
            }
        }
    }
}
