<?php

use App\Services\Homepage\Providers;

return [
    // homepage_blocks.source => provider class
    'providers' => [
        'banners' => Providers\BannersProvider::class,
        'shortcuts' => Providers\ShortcutsProvider::class,
        'recommended' => Providers\RecommendedProvider::class,
        'bestsellers' => Providers\BestsellersProvider::class,
        'deals' => Providers\DealsProvider::class,
        'new_releases' => Providers\NewReleasesProvider::class,
        'collection' => Providers\CollectionProvider::class,
        'upcoming' => Providers\UpcomingProvider::class,
        'brands' => Providers\BrandsProvider::class,
        'genres' => Providers\GenresProvider::class,
    ],

    'cache_seconds' => (int) env('HOMEPAGE_CACHE_SECONDS', 120),
];
