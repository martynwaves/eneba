<?php

namespace App\Services\Catalog;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

/**
 * Translates store filters (platform, region, type, genre, price, stock, text) into a
 * product query. Used by the store listing, the search endpoints and homepage blocks.
 */
class ProductQuery
{
    public const SORTS = ['relevance', 'popular', 'bestselling', 'price_asc', 'price_desc', 'newest', 'discount', 'rating'];

    /** @var array{platform: string[], region: string[], type: string[], genre: string[], brand: string[], ids: int[], preorder: bool, price_min: ?int, price_max: ?int, in_stock: bool, q: string, sort: string} */
    public array $filters;

    public ?TextMatch $match = null;

    public function __construct(array $input)
    {
        $list = fn (string $key) => array_values(array_filter(array_map('trim',
            is_array($input[$key] ?? null) ? $input[$key] : explode(',', (string) ($input[$key] ?? ''))
        )));

        $q = trim((string) ($input['q'] ?? ''));
        $sort = in_array($input['sort'] ?? null, self::SORTS, true) ? $input['sort'] : ($q !== '' ? 'relevance' : 'popular');

        $this->filters = [
            'platform' => $list('platform'),
            'region' => $list('region'),
            'type' => $list('type'),
            'genre' => $list('genre'),
            'brand' => $list('brand'),
            'ids' => array_values(array_filter(array_map('intval', $list('ids')))),
            'preorder' => filter_var($input['preorder'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'price_min' => isset($input['price_min']) && $input['price_min'] !== '' ? (int) round(((float) $input['price_min']) * 100) : null,
            'price_max' => isset($input['price_max']) && $input['price_max'] !== '' ? (int) round(((float) $input['price_max']) * 100) : null,
            'in_stock' => filter_var($input['in_stock'] ?? false, FILTER_VALIDATE_BOOLEAN),
            'q' => mb_substr($q, 0, 100),
            'sort' => $sort,
        ];

        if ($this->filters['q'] !== '') {
            $this->match = new TextMatch($this->filters['q']);
            // Strict first; loosen the typo tolerance only if that finds nothing.
            if (! $this->match->isEmpty() && $this->build()->doesntExist()) {
                $this->match = $this->match->relax();
            }
        }
    }

    /** Base query with every filter applied, optionally skipping some (used for facet counts). */
    public function build(array $except = []): Builder
    {
        $query = Product::query()->active();
        $f = $this->filters;

        if ($this->match) {
            $this->match->constrain($query);
        }
        if ($f['platform'] && ! in_array('platform', $except, true)) {
            $query->whereHas('platform', fn ($q) => $q->whereIn('slug', $f['platform']));
        }
        if ($f['region'] && ! in_array('region', $except, true)) {
            $query->whereHas('region', fn ($q) => $q->whereIn('slug', $f['region']));
        }
        if ($f['type'] && ! in_array('type', $except, true)) {
            $query->whereIn('products.type', $f['type']);
        }
        if ($f['genre'] && ! in_array('genre', $except, true)) {
            $query->whereHas('genres', fn ($q) => $q->whereIn('slug', $f['genre']));
        }
        if ($f['brand']) {
            $query->whereIn('products.brand', $f['brand']);
        }
        if ($f['ids']) {
            $query->whereIn('products.id', array_slice($f['ids'], 0, 100));
        }
        if ($f['preorder']) {
            $query->upcoming();
        }
        if (! in_array('price', $except, true)) {
            if ($f['price_min'] !== null) {
                $query->where('products.min_price_cents', '>=', $f['price_min']);
            }
            if ($f['price_max'] !== null) {
                $query->where('products.min_price_cents', '<=', $f['price_max']);
            }
        }
        if ($f['in_stock']) {
            $query->inStock();
        }

        return $query;
    }

    /** Query with filters and ordering applied, ready for pagination. */
    public function sorted(): Builder
    {
        $query = $this->build()->select('products.*')->withBestOffer();

        // Sold-out products stay visible (like on Eneba) but always sink to the bottom.
        $query->orderByRaw('(products.stock > 0) desc');

        match ($this->filters['sort']) {
            'relevance' => $this->match ? $this->match->orderByRelevance($query) : $query->orderByDesc('sales_count'),
            'price_asc' => $query->orderByRaw('products.min_price_cents asc nulls last'),
            'price_desc' => $query->orderByRaw('products.min_price_cents desc nulls last'),
            'newest' => $query->orderByRaw('products.release_date desc nulls last'),
            'discount' => $query->orderByRaw(self::DISCOUNT_SQL.' desc'),
            'rating' => $query->orderByDesc('rating_avg')->orderByDesc('rating_count'),
            default => $query->orderByDesc('sales_count'),
        };

        return $query->orderBy('products.id');
    }

    /**
     * Counts for each sidebar option, computed with every *other* filter applied so the
     * numbers tell the visitor what they would get by ticking that option.
     */
    public function facets(): array
    {
        $counts = fn (Builder $query, string $column) => $query
            ->groupBy($column)
            ->selectRaw("{$column} as slug, count(distinct products.id) as total")
            ->toBase()
            ->pluck('total', 'slug')
            ->map(fn ($v) => (int) $v)
            ->all();

        $price = $this->build(['price'])
            ->selectRaw('min(products.min_price_cents) as min, max(products.min_price_cents) as max')
            ->toBase()
            ->first();

        return [
            'platform' => $counts($this->build(['platform'])->join('platforms', 'platforms.id', '=', 'products.platform_id'), 'platforms.slug'),
            'region' => $counts($this->build(['region'])->join('regions', 'regions.id', '=', 'products.region_id'), 'regions.slug'),
            'genre' => $counts($this->build(['genre'])
                ->join('genre_product', 'genre_product.product_id', '=', 'products.id')
                ->join('genres', 'genres.id', '=', 'genre_product.genre_id'), 'genres.slug'),
            'type' => $counts($this->build(['type']), 'products.type'),
            'price' => [
                'min' => $price?->min !== null ? (int) $price->min : null,
                'max' => $price?->max !== null ? (int) $price->max : null,
            ],
        ];
    }

    /** SQL for a product's current discount in percent (used by deal blocks). */
    public const DISCOUNT_SQL = 'case when products.msrp_cents > 0 and products.min_price_cents is not null
        then round(100 - products.min_price_cents::numeric * 100 / products.msrp_cents) else 0 end';
}
