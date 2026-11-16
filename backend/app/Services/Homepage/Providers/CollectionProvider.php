<?php

namespace App\Services\Homepage\Providers;

use App\Models\HomepageBlock;
use App\Models\User;
use App\Services\Catalog\ProductQuery;
use Illuminate\Database\Eloquent\Builder;

/**
 * Source: the catalog itself, filtered by the block's config (type, genre, platform, price).
 * Lets editors add rows like "Top RPG games" or "Games under €10" without code changes.
 */
class CollectionProvider extends ProductListProvider
{
    protected function query(HomepageBlock $block, ?User $user): Builder
    {
        $config = $block->config ?? [];
        $priceMax = isset($config['price_max']) ? $config['price_max'] / 100 : null;

        return (new ProductQuery([
            'type' => $config['type'] ?? [],
            'genre' => $config['genre'] ?? [],
            'platform' => $config['platform'] ?? [],
            'region' => $config['region'] ?? [],
            'price_max' => $priceMax,
            'in_stock' => true,
            'sort' => $config['sort'] ?? 'popular',
        ]))->sorted();
    }
}
