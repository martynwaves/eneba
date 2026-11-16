<?php

namespace App\Services\Homepage\Providers;

use App\Models\HomepageBlock;
use App\Models\User;
use App\Services\Catalog\ProductQuery;
use Illuminate\Database\Eloquent\Builder;

/** Source: live offer prices compared with each product's regular price. */
class DealsProvider extends ProductListProvider
{
    protected function query(HomepageBlock $block, ?User $user): Builder
    {
        $minDiscount = (int) ($block->config['min_discount'] ?? 30);
        $discount = ProductQuery::DISCOUNT_SQL;

        return $this->base()
            ->whereIn('products.type', ['game', 'dlc'])
            ->whereRaw("{$discount} >= ?", [$minDiscount])
            ->orderByRaw("{$discount} desc")
            ->orderByDesc('products.sales_count');
    }
}
