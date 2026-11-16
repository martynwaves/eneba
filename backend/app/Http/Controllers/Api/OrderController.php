<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Models\ProductKey;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $orders = $request->user()->orders()
            ->whereIn('status', [Order::PAID, Order::PENDING, Order::REFUNDED])
            ->with('items.keys', 'items.product.region', 'items.seller')
            ->latest()
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

        return response()->json(['data' => new OrderResource($order->load('items.keys', 'items.product.region', 'items.seller'))]);
    }

    /** Keys library: every key the user has bought, newest first (codes stay hidden until revealed). */
    public function keys(Request $request): JsonResponse
    {
        $keys = ProductKey::query()
            ->where('status', ProductKey::SOLD)
            ->whereHas('orderItem.order', fn ($q) => $q->where('user_id', $request->user()->id)->where('status', Order::PAID))
            ->with('orderItem.order', 'orderItem.product')
            ->latest('updated_at')
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
            ]),
            'meta' => ['current_page' => $keys->currentPage(), 'last_page' => $keys->lastPage(), 'total' => $keys->total()],
        ]);
    }

    /** Show a purchased key's code. Revealing is recorded, like Eneba's "unviewed keys" policy. */
    public function reveal(Request $request, Order $order, ProductKey $key): JsonResponse
    {
        abort_unless($order->user_id === $request->user()->id && $order->status === Order::PAID, 404);
        abort_unless($key->status === ProductKey::SOLD && $order->items()->whereKey($key->order_item_id)->exists(), 404);

        if (! $key->revealed_at) {
            $key->forceFill(['revealed_at' => now()])->save();
        }

        return response()->json(['data' => [
            'id' => $key->id,
            'code' => $key->code,
            'revealed_at' => $key->revealed_at->toIso8601String(),
        ]]);
    }
}
