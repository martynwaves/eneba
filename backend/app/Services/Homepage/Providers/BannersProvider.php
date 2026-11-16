<?php

namespace App\Services\Homepage\Providers;

use App\Models\Banner;
use App\Models\HomepageBlock;
use App\Models\User;
use App\Services\Homepage\BlockProvider;

/** Source: the `banners` table (scheduled hero promos with wide and narrow artwork). */
class BannersProvider implements BlockProvider
{
    public function data(HomepageBlock $block, ?User $user): array
    {
        return [
            'slides' => Banner::live()
                ->where('placement', 'hero')
                ->orderBy('sort')
                ->get()
                ->map(fn (Banner $b) => [
                    'id' => $b->id,
                    'title' => $b->title,
                    'subtitle' => $b->subtitle,
                    'image_url' => $b->image_url,
                    'image_narrow_url' => $b->image_narrow_url ?? $b->image_url,
                    'link_url' => $b->link_url,
                ])
                ->all(),
        ];
    }

    public function cacheable(?User $user): bool
    {
        return true;
    }
}
