<?php

namespace App\Services\Homepage\Providers;

use App\Models\HomepageBlock;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/** Source: release dates. Announced and not-yet-released games, soonest first. */
class UpcomingProvider extends ProductListProvider
{
    protected function query(HomepageBlock $block, ?User $user): Builder
    {
        return $this->applyConfigFilters($this->base(), $block)
            ->whereIn('products.type', ['game', 'dlc'])
            ->upcoming()
            ->orderByRaw('products.release_date asc nulls last')
            ->orderByDesc('products.sales_count');
    }
}
