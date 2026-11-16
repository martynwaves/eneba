<?php

namespace Database\Seeders;

use App\Models\Banner;
use App\Models\Brand;
use App\Models\Currency;
use App\Models\DiscountCode;
use App\Models\HomepageBlock;
use App\Models\NavLink;
use App\Models\Product;
use App\Models\Shortcut;
use Illuminate\Database\Seeder;

/** Navigation, hero promos, quick links, brand tiles, currencies and the homepage layout. */
class ContentSeeder extends Seeder
{
    private const GTA_VI_STORE = '/store?q=grand%20theft%20auto%20vi';

    public function run(): void
    {
        $data = require database_path('data/catalog.php');

        $this->seedNavigation();
        $this->seedBanners();
        $this->seedShortcuts();
        $this->seedBrands($data['brands']);
        $this->seedCurrencies($data['currencies']);
        $this->seedHomepage();
        $this->seedDiscountCodes();
    }

    /** Demo coupons for the cart's "Got discount code?" box (listed in the README). */
    public function seedDiscountCodes(): void
    {
        foreach ([
            ['ENEBA10', 'percent', 10, 0, 2000],
            ['WELCOME5', 'fixed', 500, 2500, null],
            ['GAMER15', 'percent', 15, 5000, 3000],
        ] as [$code, $type, $value, $minimum, $cap]) {
            DiscountCode::firstOrCreate(['code' => $code], [
                'type' => $type,
                'value' => $value,
                'min_subtotal_cents' => $minimum,
                'max_discount_cents' => $cap,
            ]);
        }
    }

    private function seedNavigation(): void
    {
        $links = [
            ['Categories', '/store', 'menu'],
            ['Cheap Games', '/store?type=game&sort=discount', 'default'],
            ['Software', '/store?type=software', 'default'],
            ['eGift Cards', '/store?type=egift_card', 'default'],
            ['Eneba Gift Cards', '/store?brand=eneba', 'default'],
            ['PROBABLY STOLEN', $this->productLink(4348910, 'global'), 'default'],
            ['FM27', $this->productLink(4530370, 'europe'), 'default'],
            ['GTA VI', self::GTA_VI_STORE, 'highlight'],
        ];

        foreach ($links as $i => [$label, $url, $style]) {
            NavLink::create(['label' => $label, 'link_url' => $url, 'style' => $style, 'sort' => $i]);
        }
    }

    /** Eneba's current hero promos; each has a wide (expanded) and a narrow (collapsed) crop. */
    private function seedBanners(): void
    {
        $img = fn (string $path) => "https://imgproxy.eneba.games/{$path}";

        $promos = [
            [
                'GTA VI countdown', 'Be GTA VI ready', self::GTA_VI_STORE,
                'Rh9r0hs8CKVnV2tt3HnwQUqNfIqwsveifRoFdHJpGOc/c:1500:400:nowe:150:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/R2E4UldNNllzd1Bz/c1NqRUZWeTdYbWF0/TS1LZkJJU05qOHVz/anlfUWx4dy5qcGc',
                'Cs29fNG0G7v6K2893zT9VRWR2Sg25ejtUyzBdjE_DcE/c:200:400:nowe:1800:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/R2E4UldNNllzd1Bz/c1NqRUZWeTdYbWF0/TS1LZkJJU05qOHVz/anlfUWx4dy5qcGc',
            ],
            [
                'Cheap games', 'Games -90% off', '/store?type=game&sort=discount',
                'TX3PcFuOh7PIgU6XU9imyOA5hMB6pnnBYJCSYNGeWws/c:1500:400:nowe:150:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/Y0V3MXowbm5QU01H/endTSi12a2VIZUNt/eXFVTUZ5NVIwb2hY/bmtLVnB6TS5qcGc',
                'IEP70IJnLy3yQEudqGb9S04n957i0RK22sZynJVcFKo/c:200:400:nowe:1800:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/Y0V3MXowbm5QU01H/endTSi12a2VIZUNt/eXFVTUZ5NVIwb2hY/bmtLVnB6TS5qcGc',
            ],
            [
                'Phantom Blade Zero', 'Defy death', $this->productLink(4115450, 'global'),
                'iBS7HveyeqInjMFLJDBCvvKKTluySg8c3QkKuECW10U/c:1500:400:nowe:150:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/ekVxSUpsZE16Zlpz/cF8xYmh5LV9rVnN1/VVRsNUtNYmpPQXhT/bUljQ1hsMC5qcGc',
                'sb9HzCW7j3JUCnjKPWQ5EuSZqjf3bc_9lLEwHaJbhGU/c:200:400:nowe:1800:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/ekVxSUpsZE16Zlpz/cF8xYmh5LV9rVnN1/VVRsNUtNYmpPQXhT/bUljQ1hsMC5qcGc',
            ],
            [
                'Software', 'Cheaper software', '/store?type=software',
                'mSFXuRc6cB0MbqDQ5deKXNOcx6hlbypLUJLW2Qe1hWk/c:1500:400:nowe:150:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/Yno0M0cwTW0zSnM5/VUJiZ1NHRWc2bmU0/Y2huQkV3UEREM1Ux/N3RqNTNOYy5qcGc',
                'lluJOgJNgBzZNULzBBSGBSMsSR4ZT9lAwSno2gGQgSk/c:200:400:nowe:1800:0/czM6Ly9zbGlkZXIu/ZW5lYmEuZ2FtZXMv/Yno0M0cwTW0zSnM5/VUJiZ1NHRWc2bmU0/Y2huQkV3UEREM1Ux/N3RqNTNOYy5qcGc',
            ],
        ];

        foreach ($promos as $i => [$title, $subtitle, $link, $wide, $narrow]) {
            Banner::create([
                'placement' => 'hero',
                'title' => $title,
                'subtitle' => $subtitle,
                'image_url' => $img($wide),
                'image_narrow_url' => $img($narrow),
                'link_url' => $link,
                'sort' => $i,
            ]);
        }
    }

    private function seedShortcuts(): void
    {
        $icons = json_decode(file_get_contents(database_path('data/shortcut-icons.json')), true);

        $items = [
            ['Games', 'gamepad', '/store?type=game'],
            ['Gaming eCards', 'gaming-card', '/store?type=gift_card'],
            ['eGift Cards', 'gift', '/store?type=egift_card'],
            ['E-money', 'coins', '/store?type=e_money'],
            ['Steam', 'steam', '/store?platform=steam&type=game'],
            ['Steam Gift Cards', 'steam', '/store?brand=steam'],
            ['PSN', 'playstation', '/store?platform=psn'],
            ['Xbox', 'xbox', '/store?platform=xbox-live'],
            ['FIFA', 'gamepad', '/store?brand=ea-sports-fc'],
            ['Fortnite', 'gamepad', '/store?brand=fortnite'],
            ['Amazon', 'gift', '/store?brand=amazon'],
            ['Apple', 'gift', '/store?brand=apple'],
            ['Mobile games', 'gamepad', '/store?brand=mobile-games'],
            ['Spotify', 'gift', '/store?brand=spotify'],
            ['Netflix', 'gift', '/store?brand=netflix'],
            ['Nintendo', 'nintendo', '/store?platform=nintendo-eshop'],
            ['DLCs', 'puzzle', '/store?type=dlc'],
            ['Pre-orders', 'calendar', '/store?preorder=1'],
            ['Cheap games', 'percent', '/store?type=game&price_max=10'],
        ];

        foreach ($items as $i => [$label, $icon, $link]) {
            Shortcut::create([
                'label' => $label,
                'icon' => $icon,
                'icon_svg' => $icons[$label] ?? null,
                'link_url' => $link,
                'sort' => $i,
            ]);
        }
    }

    /** @param array<int, array{slug: string, name: string, image: string}> $brands */
    private function seedBrands(array $brands): void
    {
        foreach ($brands as $i => $brand) {
            Brand::create([
                'slug' => $brand['slug'],
                'name' => $brand['name'],
                'image_url' => "https://static.eneba.games/{$brand['image']}",
                'link_url' => "/store?brand={$brand['slug']}",
                'sort' => $i,
                'is_featured' => true,
            ]);
        }
    }

    /** @param array<int, array{code: string, name: string, symbol: string, rate: float}> $currencies */
    private function seedCurrencies(array $currencies): void
    {
        foreach ($currencies as $i => $currency) {
            Currency::create($currency + ['sort' => $i]);
        }
    }

    private function seedHomepage(): void
    {
        $blocks = [
            ['hero', 'hero', 'banners', null, null, null, []],
            ['shortcuts', 'shortcuts', 'shortcuts', null, null, null, []],
            ['recommended', 'product_row', 'recommended', 'Recommended for you',
                'Picked for you based on what you buy and save. Sign in to make it more personal.', '/store', ['limit' => 5, 'link_label' => 'See all']],
            ['top-games', 'product_carousel', 'bestsellers', 'Top games',
                'The games other players are buying the most right now.', '/store?type=game&sort=bestselling', ['limit' => 15, 'type' => ['game', 'dlc']]],
            ['egift-cards', 'brand_carousel', 'brands', 'Best selling eGift Cards',
                'Gift cards for shopping, streaming, food and travel brands.', '/store?type=egift_card', []],
            ['gift-cards', 'product_carousel', 'bestsellers', 'Best selling gift cards',
                'Top-ups and gift cards for Steam, PlayStation, Xbox, Roblox and more.', '/store?type=gift_card', ['limit' => 15, 'type' => ['gift_card', 'game_points']]],
            ['upcoming', 'product_carousel', 'upcoming', 'Upcoming games',
                'Pre-order upcoming releases and get your key on launch day.', '/store?preorder=1', ['limit' => 15]],
            ['categories', 'genre_grid', 'genres', 'Categories', null, null, ['columns' => 7, 'initial_rows' => 1, 'more_rows' => 2]],
        ];

        foreach ($blocks as $i => [$key, $type, $source, $title, $subtitle, $link, $config]) {
            HomepageBlock::create([
                'key' => $key,
                'type' => $type,
                'source' => $source,
                'title' => $title,
                'subtitle' => $subtitle,
                'link_url' => $link,
                'config' => $config,
                'sort' => $i,
            ]);
        }
    }

    private function productLink(int $steamAppId, string $region): string
    {
        $product = Product::where('steam_app_id', $steamAppId)
            ->whereHas('region', fn ($q) => $q->where('slug', $region))
            ->whereHas('platform', fn ($q) => $q->where('family', 'pc'))
            ->first();

        return $product ? '/'.$product->slug : '/store';
    }
}
