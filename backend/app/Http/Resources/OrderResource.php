<?php

namespace App\Http\Resources;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\ProductKey;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Order */
class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $paid = $this->status === Order::PAID;

        return [
            'number' => $this->number,
            'status' => $this->status,
            'currency' => $this->currency,
            'subtotal' => $this->subtotal_cents,
            'service_fee' => $this->service_fee_cents,
            'discount' => $this->discount_cents,
            'discount_code' => $this->discount_code,
            'total' => $this->total_cents,
            'wallet_amount' => $this->wallet_cents,
            'card_amount' => $this->cardAmountCents(),
            'payment_provider' => $this->payment_provider,
            'created_at' => $this->created_at?->toIso8601String(),
            'paid_at' => $this->paid_at?->toIso8601String(),
            'expires_at' => $this->expires_at?->toIso8601String(),
            'items_count' => (int) $this->items->sum('quantity'),
            'items' => $this->items->map(fn (OrderItem $item) => [
                'id' => $item->id,
                'product_title' => $item->product_title,
                'product_slug' => $item->product_slug,
                'cover_url' => $item->cover_url,
                'art' => $item->product?->art,
                'platform_name' => $item->platform_name,
                'region_name' => $item->region_name,
                'seller_name' => $item->seller_name,
                'seller_avatar_color' => $item->seller?->avatar_color,
                'region_slug' => $item->product?->region?->slug,
                'cashback_percent' => $item->cashback_percent,
                'unit_price' => $item->unit_price_cents,
                'quantity' => $item->quantity,
                // Unrevealed codes are never sent; the buyer reveals each one explicitly.
                'keys' => $paid
                    ? $item->keys->where('status', ProductKey::SOLD)->values()->map(fn (ProductKey $key) => [
                        'id' => $key->id,
                        'revealed' => $key->revealed_at !== null,
                        'revealed_at' => $key->revealed_at?->toIso8601String(),
                        // Only keys the buyer has already chosen to reveal are sent back.
                        'code' => $key->revealed_at ? $key->code : null,
                    ])
                    : [],
            ])->values(),
        ];
    }
}
