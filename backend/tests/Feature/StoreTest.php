<?php

use App\Models\User;

beforeEach(function () {
    product('Cheap Steam Game', ['PixelVault' => [499, 2]]);
    product('Pricey Steam Game', ['PixelVault' => [4999, 2]]);
    product('Console Game', ['PixelVault' => [2999, 2]], ['platform' => 'psn', 'region' => 'europe']);
    product('Sold Out Game', ['PixelVault' => [999, 0]]);
    product('Gift Card', ['PixelVault' => [2000, 5]], ['type' => 'gift_card']);
});

it('lists every active product with pagination meta', function () {
    $this->getJson('/api/products')
        ->assertOk()
        ->assertJsonPath('meta.total', 5)
        ->assertJsonStructure(['data' => [['id', 'slug', 'title', 'platform', 'region', 'min_price', 'best_offer_id']], 'meta', 'facets']);
});

it('filters by platform, region, type and price', function () {
    $this->getJson('/api/products?platform=psn')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.base_title', 'Console Game');
    $this->getJson('/api/products?region=europe')->assertJsonPath('meta.total', 1);
    $this->getJson('/api/products?type=gift_card')->assertJsonPath('meta.total', 1);
    $this->getJson('/api/products?price_min=10&price_max=40')->assertJsonPath('meta.total', 2);
    $this->getJson('/api/products?in_stock=1')->assertJsonPath('meta.total', 4);
});

it('filters by brand, pre-orders and explicit ids', function () {
    $netflix = product('Netflix Gift Card 25 EUR', ['PixelVault' => [2500, 3]], ['type' => 'egift_card', 'brand' => 'netflix']);
    product('Coming Game', attributes: ['coming_soon' => true]);

    $this->getJson('/api/products?brand=netflix')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.brand', 'netflix');
    $this->getJson('/api/products?preorder=1')->assertJsonPath('meta.total', 1)->assertJsonPath('data.0.base_title', 'Coming Game');
    $this->getJson("/api/products?ids={$netflix->id}")->assertJsonPath('meta.total', 1);
});

it('sorts by price in both directions and keeps sold-out items last', function () {
    $asc = $this->getJson('/api/products?sort=price_asc')->json('data.*.base_title');
    expect($asc[0])->toBe('Cheap Steam Game')->and(end($asc))->toBe('Sold Out Game');

    $desc = $this->getJson('/api/products?sort=price_desc')->json('data.*.base_title');
    expect($desc[0])->toBe('Pricey Steam Game');
});

it('computes facet counts while ignoring the facet itself', function () {
    $facets = $this->getJson('/api/products?platform=psn')->json('facets');

    // Ticking PSN must not hide the Steam option or its count.
    expect($facets['platform'])->toMatchArray(['psn' => 1, 'steam' => 4])
        ->and($facets['type'])->toMatchArray(['game' => 1]);
});

it('shows a product page with every seller offer', function () {
    $product = product('Compared Game', ['Seller A' => [1500, 1], 'Seller B' => [1400, 2], 'Seller C' => [1600, 0]]);

    $response = $this->getJson("/api/products/{$product->slug}")->assertOk();

    expect($response->json('data.offers'))->toHaveCount(3)
        ->and(collect($response->json('data.offers'))->firstWhere('is_lowest', true)['seller']['name'])->toBe('Seller B')
        ->and($response->json('data.min_price'))->toBe(1400);
});

it('shows how many people wishlisted and are watching a product', function () {
    $product = product('Popular Game', ['Seller A' => [1500, 3]]);
    User::factory()->count(3)->create()->each(fn (User $user) => $user->wishlist()->attach($product->id));

    $this->getJson("/api/products/{$product->slug}")->assertJsonPath('data.wishlist_count', 3)->assertJsonPath('data.watching', 1);
    // The same visitor reloading isn't counted twice; a different one is.
    $this->getJson("/api/products/{$product->slug}")->assertJsonPath('data.watching', 1);
    $this->withHeader('User-Agent', 'Another browser')->getJson("/api/products/{$product->slug}")->assertJsonPath('data.watching', 2);
});

it('averages the optional aspect scores of reviews', function () {
    $product = product('Rated Game', ['Seller A' => [1500, 3]]);
    signIn();
    $this->postJson("/api/products/{$product->slug}/reviews", [
        'rating' => 4,
        'body' => 'Great story, average sound.',
        'aspects' => ['story' => 5, 'soundtrack' => 3],
    ])->assertCreated()->assertJsonPath('data.aspects.story', 5);
    signIn();
    $this->postJson("/api/products/{$product->slug}/reviews", ['rating' => 5, 'body' => 'Loved every minute.', 'aspects' => ['story' => 4]])->assertCreated();

    $this->getJson("/api/products/{$product->slug}/reviews")
        ->assertJsonPath('summary.aspects.story', 4.5)
        ->assertJsonPath('summary.aspects.soundtrack', 3)
        ->assertJsonPath('summary.aspects.gameplay', null);

    $this->postJson("/api/products/{$product->slug}/reviews", ['rating' => 5, 'body' => 'Loved every minute.', 'aspects' => ['price' => 4]])
        ->assertUnprocessable();
});

it('returns 404 for unknown products', function () {
    $this->getJson('/api/products/does-not-exist')->assertNotFound();
});
