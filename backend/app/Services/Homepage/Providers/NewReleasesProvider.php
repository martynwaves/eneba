<?php

namespace App\Services\Homepage\Providers;

use App\Models\HomepageBlock;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/** Source: product release dates. */
class NewReleasesProvider extends ProductListProvider
{
    protected function query(HomepageBlock $block, ?User $user): Builder
    {
        $days = (int) ($block->config['days'] ?? 365);

        return $this->base()
            ->whereIn('products.type', ['game', 'dlc'])
            ->whereBetween('products.release_date', [now()->subDays($days)->toDateString(), now()->toDateString()])
            ->orderByDesc('products.release_date')
            ->orderByDesc('products.sales_count');
    }
}
