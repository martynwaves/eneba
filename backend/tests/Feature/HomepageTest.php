<?php

use App\Models\Banner;
use App\Models\Brand;
use App\Models\Genre;
use App\Models\HomepageBlock;
use App\Models\Shortcut;

beforeEach(function () {
    product('Bestselling Game', ['PixelVault' => [999, 3]], ['msrp_cents' => 1099, 'sales_count' => 9000, 'release_date' => now()->subDays(20)]);
    product('Deal Game', ['PixelVault' => [1000, 3]], ['msrp_cents' => 6000, 'sales_count' => 10]);
    Banner::create(['placement' => 'hero', 'title' => 'Big launch', 'image_url' => 'https://example.test/a.jpg', 'link_url' => '/store']);
    Banner::create(['placement' => 'hero', 'title' => 'Expired', 'image_url' => 'https://example.test/b.jpg', 'link_url' => '/store', 'ends_at' => now()->subDay()]);
    Shortcut::create(['label' => 'Games', 'link_url' => '/store?type=game']);

    foreach ([
        ['hero', 'hero', 'banners'],
        ['shortcuts', 'shortcuts', 'shortcuts'],
        ['bestsellers', 'product_carousel', 'bestsellers'],
        ['deals', 'product_grid', 'deals'],
        ['new', 'product_carousel', 'new_releases'],
        ['hidden', 'product_carousel', 'bestsellers'],
    ] as $i => [$key, $type, $source]) {
        HomepageBlock::create(['key' => $key, 'type' => $type, 'source' => $source, 'title' => $key, 'sort' => $i, 'is_active' => $key !== 'hidden', 'config' => ['min_discount' => 50]]);
    }
});

it('returns the layout in order with one endpoint per block', function () {
    $this->getJson('/api/homepage')
        ->assertOk()
        ->assertJsonCount(5, 'data')
        ->assertJsonPath('data.0.key', 'hero')
        ->assertJsonPath('data.2.endpoint', '/homepage/blocks/bestsellers');
});

it('serves each block from its own provider', function () {
    $this->getJson('/api/homepage/blocks/hero')->assertOk()
        ->assertJsonCount(1, 'data.content.slides')          // the expired banner is filtered out
        ->assertJsonPath('data.content.slides.0.title', 'Big launch');

    $this->getJson('/api/homepage/blocks/shortcuts')->assertJsonPath('data.content.items.0.label', 'Games');
    $this->getJson('/api/homepage/blocks/bestsellers')->assertJsonPath('data.content.products.0.base_title', 'Bestselling Game');
    $this->getJson('/api/homepage/blocks/deals')->assertJsonCount(1, 'data.content.products')->assertJsonPath('data.content.products.0.base_title', 'Deal Game');
    $this->getJson('/api/homepage/blocks/new')->assertJsonPath('data.content.products.0.base_title', 'Bestselling Game');
});

it('returns lists, not objects, when a block is served from cache', function () {
    // The test cache serializes values like production (CACHE_ARRAY_SERIALIZE in phpunit.xml).
    foreach ([1, 2] as $attempt) {
        $content = $this->getJson('/api/homepage/blocks/hero')->assertOk()->json('data.content');
        expect($content['slides'])->toBeArray()->toHaveKey(0)
            ->and(array_is_list($content['slides']))->toBeTrue("slides should be a JSON list on request {$attempt}");
    }
});

it('serves upcoming games, brand tiles and categories from their own sources', function () {
    $genre = Genre::create(['slug' => 'rpg', 'name' => 'RPG', 'icon_url' => 'https://example.test/rpg.svg', 'sort' => 1]);
    product('Released Game')->genres()->attach($genre);
    product('Future Game', attributes: ['release_date' => now()->addMonths(3)]);
    product('Announced Game', attributes: ['coming_soon' => true]);
    Brand::create(['slug' => 'netflix', 'name' => 'Netflix', 'image_url' => 'https://example.test/n.jpg', 'link_url' => '/store?brand=netflix', 'is_featured' => true]);

    foreach ([['upcoming', 'upcoming'], ['brands', 'brands'], ['genres', 'genres']] as $i => [$key, $source]) {
        HomepageBlock::create(['key' => $key, 'type' => 'x', 'source' => $source, 'sort' => 10 + $i, 'config' => ['link_label' => 'See all']]);
    }

    $upcoming = $this->getJson('/api/homepage/blocks/upcoming')->assertOk()->json('data.content.products');
    expect(collect($upcoming)->pluck('base_title')->all())->toBe(['Future Game', 'Announced Game'])
        ->and(collect($upcoming)->every(fn ($p) => $p['is_preorder']))->toBeTrue();

    $this->getJson('/api/homepage/blocks/brands')->assertJsonPath('data.content.brands.0.name', 'Netflix')->assertJsonPath('data.link_label', 'See all');
    $this->getJson('/api/homepage/blocks/genres')
        ->assertJsonPath('data.content.genres.0.name', 'RPG')
        ->assertJsonPath('data.content.genres.0.count', 1);
});

it('narrows bestsellers by the block config', function () {
    product('Gift Card', ['PixelVault' => [1000, 2]], ['type' => 'gift_card', 'sales_count' => 1]);
    HomepageBlock::create(['key' => 'gift-cards', 'type' => 'product_carousel', 'source' => 'bestsellers', 'sort' => 20, 'config' => ['type' => ['gift_card']]]);

    $this->getJson('/api/homepage/blocks/gift-cards')
        ->assertJsonCount(1, 'data.content.products')
        ->assertJsonPath('data.content.products.0.base_title', 'Gift Card');
});

it('does not serve inactive blocks', function () {
    $this->getJson('/api/homepage/blocks/hidden')->assertNotFound();
});
