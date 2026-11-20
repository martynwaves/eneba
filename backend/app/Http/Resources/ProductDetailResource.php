<?php

namespace App\Http\Resources;

use App\Models\Offer;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

/**
 * Full product page payload: details, every seller offer and sibling editions.
 *
 * @mixin Product
 */
class ProductDetailResource extends ProductCardResource
{
    /** @param Collection<int, Product> $variants */
    public function __construct(Product $resource, private Collection $variants, private Collection $similar, private int $watching = 0)
    {
        parent::__construct($resource);
    }

    public function toArray(Request $request): array
    {
        // The id breaks ties, so equal offers keep their order and badges ("Lowest price") don't hop between them.
        $offers = $this->offers
            ->sortBy([['stock', 'desc'], ['price_cents', 'asc'], ['id', 'asc']])
            ->values();
        $purchasable = $offers->filter(fn (Offer $o) => $o->is_active && $o->stock > 0);
        $lowestId = $purchasable->sortBy('price_cents')->first()?->id;
        $bestCashbackId = $purchasable->where('cashback_percent', '>', 0)->sortByDesc('cashback_percent')->first()?->id;
        // The featured offer balances price and seller reputation, like Eneba's buy box.
        $featured = $purchasable->sortBy(fn (Offer $o) => $o->price_cents * (1 + (10 - $o->seller->rating) / 10))->first();

        return [
            ...parent::toArray($request),
            'description' => $this->description,
            'developer' => $this->developer,
            'publisher' => $this->publisher,
            'screenshots' => $this->screenshots ?? [],
            // Steam's per-OS requirements, kept on PC editions only.
            'platform_requirements' => $this->platform_requirements ?: (object) [],
            'languages' => $this->languages ?? [],
            'trailer' => $this->trailer,
            'about' => $this->about ?? [],
            'steam_app_id' => $this->steam_app_id,
            'wishlist_count' => $this->wishlist_count ?? 0,
            'watching' => $this->watching,
            'operating_systems' => $this->operating_systems ?? [],
            'genres' => $this->genres->map(fn ($g) => ['slug' => $g->slug, 'name' => $g->name])->values(),
            'activation' => [
                'platform' => $this->platform->name,
                'key_label' => $this->platform->key_label,
                'url' => $this->platform->activation_url,
            ],
            'featured_offer_id' => $featured?->id,
            'offers' => $offers->map(fn (Offer $o) => [
                'id' => $o->id,
                'price' => $o->price_cents,
                'stock' => $o->stock,
                'in_stock' => $o->is_active && $o->stock > 0,
                'is_lowest' => $o->id === $lowestId,
                'is_best_cashback' => $o->id === $bestCashbackId,
                'cashback_percent' => $o->cashback_percent,
                'seller' => new SellerResource($o->seller),
            ]),
            'variants' => $this->variants->map(fn (Product $p) => [
                'slug' => $p->slug,
                'platform' => $p->platform->name,
                'region' => $p->region->name,
                'min_price' => $p->min_price_cents,
                'in_stock' => $p->stock > 0,
                'is_current' => $p->id === $this->id,
            ])->values(),
            'similar' => ProductCardResource::collection($this->similar),
        ];
    }
}
