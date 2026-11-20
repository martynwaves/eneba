<?php

namespace App\Services\Homepage\Providers;

use App\Http\Resources\ProductCardResource;
use App\Models\HomepageBlock;
use App\Models\Product;
use App\Models\User;
use App\Services\Homepage\BlockProvider;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;

/** Shared plumbing for blocks that show a row of product cards. */
abstract class ProductListProvider implements BlockProvider
{
    abstract protected function query(HomepageBlock $block, ?User $user): Builder;

    public function data(HomepageBlock $block, ?User $user): array
    {
        $limit = (int) ($block->config['limit'] ?? 12);

        $products = $this->query($block, $user)
            ->orderBy('products.id') // last tie-breaker, so the row is the same on every load
            ->with(['platform', 'region'])
            ->limit($limit * 4)
            ->get();

        return ['products' => $this->cards($this->distinctGames($products, $limit))];
    }

    public function cacheable(?User $user): bool
    {
        return true;
    }

    protected function base(): Builder
    {
        return Product::query()->active()->inStock()->select('products.*')->withBestOffer();
    }

    /** Narrow a list by the block's config: `type`, `platform`, `brand` and `genre` lists. */
    protected function applyConfigFilters(Builder $query, HomepageBlock $block): Builder
    {
        $config = $block->config ?? [];

        return $query
            ->when($config['type'] ?? null, fn (Builder $q, array $types) => $q->whereIn('products.type', $types))
            ->when($config['brand'] ?? null, fn (Builder $q, array $brands) => $q->whereIn('products.brand', $brands))
            ->when($config['platform'] ?? null, fn (Builder $q, array $platforms) => $q->whereHas('platform', fn ($p) => $p->whereIn('slug', $platforms)))
            ->when($config['genre'] ?? null, fn (Builder $q, $genres) => $q->whereHas('genres', fn ($g) => $g->whereIn('slug', (array) $genres)));
    }

    /**
     * Keep one card per game so a row is not filled with five editions of the same title.
     *
     * @param  Collection<int, Product>  $products
     * @return Collection<int, Product>
     */
    protected function distinctGames(Collection $products, int $limit): Collection
    {
        return $products->unique('base_title')->take($limit)->values();
    }

    protected function cards(Collection $products): array
    {
        return ProductCardResource::collection($products)->resolve();
    }
}
