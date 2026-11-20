<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\ProductKey;
use App\Services\Commerce\KeyRefunds;
use App\Services\Commerce\StockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderController extends Controller
{
    public function __construct(private StockService $stock) {}

    public function index(Request $request): JsonResponse
    {
        // Nothing runs the scheduler on Render, so close this buyer's lapsed checkouts before
        // listing them; they would otherwise show as "Awaiting payment" until the next checkout.
        $this->stock->sweepExpired($request->user()->id);

        $orders = $request->user()->orders()
            ->whereIn('status', [Order::PAID, Order::PENDING, Order::REFUNDED])
            ->with(OrderResource::RELATIONS)
            ->latest()
            ->orderByDesc('id')
            ->paginate(10);

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function show(Request $request, Order $order): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id, 404);

        if ($order->status === Order::PENDING && $order->expires_at?->isPast()) {
            $this->stock->sweepExpired($order->user_id);
            $order->refresh();
        }

        return response()->json(['data' => new OrderResource($order->load(OrderResource::RELATIONS))]);
    }

    /** Keys library: every key the user has bought, newest first (codes stay hidden until revealed). */
    public function keys(Request $request): JsonResponse
    {
        $keys = ProductKey::query()
            ->where('status', ProductKey::SOLD)
            ->whereHas('orderItem.order', fn ($q) => $q->where('user_id', $request->user()->id)->where('status', Order::PAID))
            ->with('orderItem.order', 'orderItem.product')
            // Newest purchase first. Not updated_at: revealing a key would move it to the top.
            ->orderByDesc('order_item_id')
            ->orderBy('id')
            ->paginate(20);

        return response()->json([
            'data' => collect($keys->items())->map(fn (ProductKey $key) => [
                'id' => $key->id,
                'revealed' => $key->revealed_at !== null,
                'code' => $key->revealed_at ? $key->code : null,
                'order_number' => $key->orderItem->order->number,
                'purchased_at' => $key->orderItem->order->paid_at?->toIso8601String(),
                'product_title' => $key->orderItem->product_title,
                'product_slug' => $key->orderItem->product_slug,
                'cover_url' => $key->orderItem->cover_url,
                'art' => $key->orderItem->product?->art,
                'platform_name' => $key->orderItem->platform_name,
                'region_name' => $key->orderItem->region_name,
                'refund_amount' => $key->revealed_at ? null : $key->orderItem->order->keyRefundCents($key->orderItem),
            ]),
            'meta' => ['current_page' => $keys->currentPage(), 'last_page' => $keys->lastPage(), 'total' => $keys->total()],
        ]);
    }

    /** Show a purchased key's code. Revealing is recorded: a revealed key can no longer be refunded. */
    public function reveal(Request $request, Order $order, ProductKey $key): JsonResponse
    {
        $this->authorizeKey($request, $order, $key);

        // Locked like a refund (KeyRefunds), so a reveal and a refund sent at the same moment can't
        // both succeed: whichever comes second sees the key revealed, or no longer sold.
        $key = DB::transaction(function () use ($key) {
            $locked = ProductKey::whereKey($key->id)->lockForUpdate()->firstOrFail();
            abort_unless($locked->status === ProductKey::SOLD && $locked->order_item_id === $key->order_item_id, 404);
            if (! $locked->revealed_at) {
                $locked->forceFill(['revealed_at' => now()])->save();
            }

            return $locked;
        });

        return response()->json(['data' => [
            'id' => $key->id,
            'code' => $key->code,
        ]]);
    }

    /** Refund a key the buyer hasn't revealed; the money goes back the way it was paid. */
    public function refund(Request $request, Order $order, ProductKey $key, KeyRefunds $refunds): JsonResponse
    {
        $this->authorizeKey($request, $order, $key);
        $refund = $refunds->refund($order, $key);

        return response()->json([
            'refund' => $refund,
            'order' => new OrderResource($order->fresh()->load(OrderResource::RELATIONS)),
        ]);
    }

    /** Only the buyer's own sold keys, in their own paid order. */
    private function authorizeKey(Request $request, Order $order, ProductKey $key): void
    {
        abort_unless($order->user_id === $request->user()->id && $order->status === Order::PAID, 404);
        abort_unless($key->status === ProductKey::SOLD && $order->items()->whereKey($key->order_item_id)->exists(), 404);
    }
}
