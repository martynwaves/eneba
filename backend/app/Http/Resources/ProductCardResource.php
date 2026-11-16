<?php

namespace App\Http\Resources;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** Compact product shape used by listings, carousels and search suggestions. */
/** @mixin Product */
class ProductCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'title' => $this->title,
            'base_title' => $this->base_title,
            'type' => $this->type,
            'platform' => [
                'slug' => $this->platform->slug,
                'name' => $this->platform->name,
                'family' => $this->platform->family,
            ],
            'region' => [
                'slug' => $this->region->slug,
                'name' => $this->region->name,
                'color' => $this->region->color,
            ],
            'cover_url' => $this->cover_url,
            'header_url' => $this->header_url,
            'art' => $this->art,
            'min_price' => $this->min_price_cents,
            'msrp' => $this->msrp_cents,
            'discount_percent' => $this->discountPercent(),
            'offers_count' => $this->offers_count,
            'best_offer_id' => $this->best_offer_id ?? null,
            'cashback_percent' => $this->cashback_percent,
            'brand' => $this->brand,
            'in_stock' => $this->stock > 0,
            'rating_avg' => $this->rating_avg,
            'rating_count' => $this->rating_count,
            'release_date' => $this->release_date?->toDateString(),
            'release_label' => $this->release_label,
            'is_preorder' => $this->isPreorder(),
        ];
    }
}
