<?php

use App\Models\Offer;
use App\Models\Platform;
use App\Models\Product;
use App\Models\Region;
use App\Models\Seller;
use App\Models\User;
use App\Support\KeyGenerator;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature');

/*
 * Small catalog builders so tests stay fast and explicit instead of relying on the full
 * demo seed.
 */
function platform(string $slug = 'steam'): Platform
{
    $family = $slug === 'psn' ? 'playstation' : 'pc';

    return Platform::firstOrCreate(['slug' => $slug], [
        'name' => Str::headline($slug),
        'device_label' => $family === 'pc' ? 'PC' : 'PS5',
        'key_label' => Str::headline($slug).' Key',
        'family' => $family,
    ]);
}

function region(string $slug = 'global'): Region
{
    return Region::firstOrCreate(['slug' => $slug], ['name' => Str::upper(str_replace('-', ' ', $slug))]);
}

function seller(string $name = 'PixelVault', float $rating = 9.8): Seller
{
    return Seller::firstOrCreate(['slug' => Str::slug($name)], ['name' => $name, 'rating' => $rating, 'is_verified' => true]);
}

/** Creates a product with one offer per [seller => [price, stock]] entry and real key rows. */
function product(string $name, array $offers = ['PixelVault' => [1999, 3]], array $attributes = []): Product
{
    $platform = platform($attributes['platform'] ?? 'steam');
    $region = region($attributes['region'] ?? 'global');
    unset($attributes['platform'], $attributes['region']);

    $product = Product::create(array_merge([
        'slug' => Str::slug($platform->slug.' '.$name.' '.$region->slug),
        'title' => "{$name} ({$platform->device_label}) {$platform->key_label} {$region->name}",
        'base_title' => $name,
        'type' => 'game',
        'platform_id' => $platform->id,
        'region_id' => $region->id,
        'msrp_cents' => 5999,
        'search_text' => '',
    ], $attributes));

    foreach ($offers as $sellerName => [$price, $stock]) {
        $offer = Offer::create([
            'product_id' => $product->id,
            'seller_id' => seller($sellerName)->id,
            'price_cents' => $price,
            'stock' => $stock,
        ]);
        for ($i = 0; $i < $stock; $i++) {
            $offer->keys()->create(['code' => KeyGenerator::for('pc')]);
        }
    }
    $product->refreshOfferSummary();

    return $product->fresh();
}

function signIn(?User $user = null): User
{
    $user ??= User::factory()->create();
    test()->actingAs($user, 'sanctum');

    return $user;
}
