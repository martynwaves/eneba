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
    public function __construct(private PaymentGateway $gateway) {}

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
        $items = $order->items()->get(['id', 'offer_id']);

        ProductKey::whereIn('order_item_id', $items->pluck('id'))
            ->where('status', ProductKey::RESERVED)
            ->update(['status' => ProductKey::AVAILABLE, 'order_item_id' => null, 'reserved_until' => null]);

        $this->refreshOffers($items->pluck('offer_id')->filter());
    }

    /** Expire pending orders (all, or one buyer's) whose reservation window has passed. Safe to run any time. */
    public function sweepExpired(?int $userId = null): int
    {
        $expired = Order::where('status', Order::PENDING)
            ->where('expires_at', '<', now())
            ->when($userId, fn ($query) => $query->where('user_id', $userId))
            ->get();

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

        // A wallet-only order has no card payment left to cancel.
        if ($closed && $order->payment_reference && $order->payment_provider !== 'wallet') {
            try {
                $this->gateway->cancel($order);
            } catch (\Throwable $e) {
                report($e); // a late payment is still handled by fulfilment (re-acquire or refund)
            }
        }
    }
}
