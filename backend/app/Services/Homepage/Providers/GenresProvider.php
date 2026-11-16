<?php

namespace App\Services\Homepage\Providers;

use App\Models\Genre;
use App\Models\HomepageBlock;
use App\Models\User;
use App\Services\Homepage\BlockProvider;

/** Source: game categories with live counts of the active products in each. */
class GenresProvider implements BlockProvider
{
    public function data(HomepageBlock $block, ?User $user): array
    {
        $genres = Genre::query()
            ->withCount(['products' => fn ($q) => $q->where('products.is_active', true)])
            ->orderBy('sort')
            ->get()
            ->filter(fn (Genre $g) => $g->products_count > 0)
            ->map(fn (Genre $g) => [
                'slug' => $g->slug,
                'name' => $g->name,
                'icon_url' => $g->icon_url,
                'count' => $g->products_count,
                'link_url' => "/store?genre={$g->slug}",
            ])
            ->values()
            ->all();

        return [
            'genres' => $genres,
            'columns' => (int) ($block->config['columns'] ?? 7),
            'initial_rows' => (int) ($block->config['initial_rows'] ?? 1),
            'more_rows' => (int) ($block->config['more_rows'] ?? 2),
        ];
    }

    public function cacheable(?User $user): bool
    {
        return true;
    }
}
