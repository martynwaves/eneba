<?php

namespace App\Services\Homepage\Providers;

use App\Models\Brand;
use App\Models\HomepageBlock;
use App\Models\User;
use App\Services\Homepage\BlockProvider;

/** Source: the `brands` table (brand storefront tiles, e.g. Netflix or Amazon gift cards). */
class BrandsProvider implements BlockProvider
{
    public function data(HomepageBlock $block, ?User $user): array
    {
        return [
            'brands' => Brand::where('is_featured', true)
                ->orderBy('sort')
                ->get(['id', 'slug', 'name', 'image_url', 'link_url'])
                ->toArray(),
        ];
    }

    public function cacheable(?User $user): bool
    {
        return true;
    }
}
