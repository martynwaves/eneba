<?php

namespace App\Services\Homepage\Providers;

use App\Models\HomepageBlock;
use App\Models\Order;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;

/**
 * Source: the visitor's own purchases and wishlist. Signed-in buyers get games from the
 * genres they buy and save; everyone else gets well-rated popular picks that rotate daily.
 */
class RecommendedProvider extends ProductListProvider
{
    public function cacheable(?User $user): bool
    {
        return $user === null;
    }

    protected function query(HomepageBlock $block, ?User $user): Builder
    {
        $query = $this->base()->whereIn('products.type', ['game', 'dlc']);

        $genreIds = $user ? $this->tasteProfile($user) : [];
        if ($genreIds) {
            $owned = DB::table('order_items')
                ->join('orders', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.user_id', $user->id)
                ->where('orders.status', Order::PAID)
                ->join('products', 'products.id', '=', 'order_items.product_id')
                ->pluck('products.base_title');

            return $query
                ->whereHas('genres', fn ($q) => $q->whereIn('genres.id', $genreIds))
                ->whereNotIn('products.base_title', $owned)
                ->orderByRaw('products.rating_avg * ln(products.sales_count + 2) desc');
        }

        // Stable for a day, different tomorrow.
        $seed = (int) now()->format('Ymd');

        return $query
            ->where('products.rating_avg', '>=', 4)
            ->orderByRaw('md5(products.id::text || ?) asc', [(string) $seed]);
    }

    /** @return int[] genre ids ranked by how often they appear in the user's orders and wishlist */
    private function tasteProfile(User $user): array
    {
        $productIds = DB::table('order_items')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.user_id', $user->id)
            ->where('orders.status', Order::PAID)
            ->pluck('order_items.product_id')
            ->merge(DB::table('wishlist_items')->where('user_id', $user->id)->pluck('product_id'));

        if ($productIds->isEmpty()) {
            return [];
        }

        return DB::table('genre_product')
            ->whereIn('product_id', $productIds)
            ->groupBy('genre_id')
            ->orderByRaw('count(*) desc')
            ->limit(3)
            ->pluck('genre_id')
            ->all();
    }
}
