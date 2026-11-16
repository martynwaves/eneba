<?php

namespace App\Services\Catalog;

use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/**
 * "N people watching this product": distinct visitors who opened the product page in the last
 * few minutes. Visitors are kept as anonymous hashes in the cache, never stored in the database.
 */
class ProductWatchers
{
    public const WINDOW_SECONDS = 600;

    /** Record this visit and return how many distinct visitors are on the page right now. */
    public function record(Product $product, Request $request): int
    {
        $key = "product-watchers:{$product->id}";
        $visitor = hash('sha256', $request->ip().'|'.$request->userAgent());
        $now = now()->getTimestamp();

        return Cache::lock("{$key}:lock", 3)->block(2, function () use ($key, $visitor, $now) {
            /** @var array<string, int> $seen */
            $seen = Cache::get($key, []);
            $seen = array_filter($seen, fn (int $at) => $at > $now - self::WINDOW_SECONDS);
            $seen[$visitor] = $now;
            Cache::put($key, $seen, self::WINDOW_SECONDS);

            return count($seen);
        });
    }
}
