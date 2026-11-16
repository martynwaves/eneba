<?php

namespace App\Services\Homepage\Providers;

use App\Models\HomepageBlock;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Source: order history. Ranks by units sold through real checkouts in the last 30 days,
 * on top of each product's historical sales counter. The block config can narrow it down
 * (e.g. `type: [gift_card, game_points]` for "Best selling gift cards").
 */
class BestsellersProvider extends ProductListProvider
{
    protected function query(HomepageBlock $block, ?User $user): Builder
    {
        $recent = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', Order::PAID)
            ->where('orders.paid_at', '>=', now()->subDays(30))
            ->groupBy('order_items.product_id')
            ->selectRaw('order_items.product_id, sum(order_items.quantity) as units');

        return $this->applyConfigFilters($this->base(), $block)
            ->leftJoinSub($recent, 'recent_sales', 'recent_sales.product_id', '=', 'products.id')
            ->orderByRaw('products.sales_count + coalesce(recent_sales.units, 0) * 500 desc');
    }
}
