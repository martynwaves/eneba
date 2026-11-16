<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\DiscountCode;
use App\Models\Genre;
use App\Models\Platform;
use App\Models\Product;
use App\Models\Region;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class CatalogController extends Controller
{
    /** Everything the store sidebar needs to render its filter groups. */
    public function filters(): JsonResponse
    {
        $data = Cache::remember('catalog:filters', 300, fn () => [
            'platforms' => Platform::orderBy('sort')->get(['slug', 'name', 'family']),
            'regions' => Region::orderBy('sort')->get(['slug', 'name', 'description']),
            'genres' => Genre::withCount('products')->orderByDesc('products_count')->get(['id', 'slug', 'name'])
                ->map(fn ($g) => ['slug' => $g->slug, 'name' => $g->name]),
            'types' => collect(Product::TYPES)->map(fn ($label, $slug) => ['slug' => $slug, 'name' => $label])->values(),
            'sorts' => [
                ['value' => 'popular', 'label' => 'Popularity: Most popular'],
                ['value' => 'price_asc', 'label' => 'Price: Low to high'],
                ['value' => 'price_desc', 'label' => 'Price: High to low'],
                ['value' => 'newest', 'label' => 'Release date: Newest'],
                ['value' => 'discount', 'label' => 'Discount: Highest'],
                ['value' => 'rating', 'label' => 'Rating: Highest'],
            ],
        ]);

        return response()->json(['data' => $data]);
    }

    /** Public runtime settings for the frontend (which payment UI to show, fees). */
    public function config(): JsonResponse
    {
        return response()->json(['data' => [
            'currency' => config('shop.currency'),
            'service_fee' => config('shop.service_fee_cents'),
            'payment' => [
                'driver' => config('shop.payment_driver'),
                'stripe_publishable_key' => config('shop.payment_driver') === 'stripe' ? config('services.stripe.key') : null,
            ],
            // Demo build: the cart lists the working codes so testers can try discounts.
            'demo_discount_codes' => DiscountCode::orderBy('id')->get()
                ->filter(fn (DiscountCode $code) => $code->isUsable())
                ->map(fn (DiscountCode $code) => ['code' => $code->code, 'summary' => $code->summary()])
                ->values(),
        ]]);
    }
}
