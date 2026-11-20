<?php

namespace Database\Seeders;

use App\Models\Genre;
use App\Models\Offer;
use App\Models\Platform;
use App\Models\Product;
use App\Models\Region;
use App\Models\Seller;
use App\Support\KeyGenerator;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Builds the demo marketplace: platforms, regions, categories, sellers, products,
 * competing seller offers and a pool of (fake) digital keys per offer.
 */
class CatalogSeeder extends Seeder
{
    private const NAME_OVERRIDES = [
        'ELDEN RING' => 'Elden Ring',
        'ELDEN RING Shadow of the Erdtree' => 'Elden Ring: Shadow of the Erdtree',
        'HELLDIVERS 2' => 'Helldivers 2',
        'MONSTER HUNTER RISE' => 'Monster Hunter Rise',
        'DARK SOULS III' => 'Dark Souls III',
        'DARK SOULS: REMASTERED' => 'Dark Souls: Remastered',
        'ARMORED CORE VI FIRES OF RUBICON' => 'Armored Core VI: Fires of Rubicon',
        "Ghost of Tsushima DIRECTOR'S CUT" => "Ghost of Tsushima Director's Cut",
        'EA SPORTS FC 24' => 'EA Sports FC 24',
        'EA SPORTS FC 25' => 'EA Sports FC 25',
        'STAR WARS Jedi: Survivor' => 'Star Wars Jedi: Survivor',
        'STAR WARS Jedi: Fallen Order' => 'Star Wars Jedi: Fallen Order',
        'STAR WARS: Squadrons' => 'Star Wars: Squadrons',
        'STAR WARS Zero Company' => 'Star Wars Zero Company',
        'Total War: WARHAMMER III' => 'Total War: Warhammer III',
        'Total War: THREE KINGDOMS' => 'Total War: Three Kingdoms',
        'TEKKEN 8' => 'Tekken 8',
        'SILENT HILL 2' => 'Silent Hill 2',
        'SILENT HILL f' => 'Silent Hill f',
        'PAYDAY 3' => 'Payday 3',
        'PAYDAY 2' => 'Payday 2',
        'FINAL FANTASY VII REMAKE INTERGRADE' => 'Final Fantasy VII Remake Intergrade',
        'FINAL FANTASY VII REBIRTH' => 'Final Fantasy VII Rebirth',
        'FINAL FANTASY XVI' => 'Final Fantasy XVI',
        "DEATH STRANDING DIRECTOR'S CUT" => "Death Stranding Director's Cut",
        'OMORI' => 'Omori',
        'KINGDOM HEARTS IV' => 'Kingdom Hearts IV',
        'NINJA GAIDEN 4' => 'Ninja Gaiden 4',
        'PRAGMATA' => 'Pragmata',
        'MARVEL Tōkon: Fighting Souls' => 'Marvel Tōkon: Fighting Souls',
        'Hi-Fi RUSH' => 'Hi-Fi Rush',
        'EXODUS' => 'Exodus',
    ];

    /** Cashback percentages sellers offer; zeros make roughly a third of offers cashback-free. */
    private const CASHBACK_STEPS = [0, 0, 0, 3, 5, 5, 6, 8, 11, 14];

    /** @var Collection<string, Platform> */
    private Collection $platforms;

    /** @var Collection<string, Region> */
    private Collection $regions;

    /** @var Collection<int, Seller> */
    private Collection $sellers;

    /** @var array<string, int> category slug => id */
    private array $genreIds = [];

    /** @var array<string, mixed> */
    private array $data;

    public function run(): void
    {
        mt_srand(2077);
        $this->data = require database_path('data/catalog.php');

        foreach ($this->data['platforms'] as $i => $p) {
            Platform::create($p + ['sort' => $i]);
        }
        foreach ($this->data['regions'] as $i => $r) {
            Region::create($r + ['sort' => $i]);
        }
        foreach ($this->data['genres'] as $i => $g) {
            $this->genreIds[$g['slug']] = Genre::create([
                'slug' => $g['slug'],
                'name' => $g['name'],
                'icon_url' => "https://assets.eneba.games/tag/v2/{$g['icon']}.svg",
                'sort' => $i,
            ])->id;
        }
        foreach ($this->data['sellers'] as $s) {
            Seller::create($s + [
                'slug' => Str::slug($s['name']),
                'is_verified' => $s['rating'] >= 9.0,
                'rating_count' => mt_rand(800, 60000),
            ]);
        }

        $this->platforms = Platform::all()->keyBy('slug');
        $this->regions = Region::all()->keyBy('slug');
        $this->sellers = Seller::all();

        $games = json_decode(file_get_contents(database_path('data/games.json')), true);
        foreach ($games as $index => $game) {
            $this->seedGame($game, $index);
        }
        foreach ($this->data['manual_games'] as $game) {
            $this->seedManualGame($game);
        }
        // Product-page extras (languages, trailer, about text, per-OS requirements).
        Artisan::call('catalog:import-steam-extras');
        foreach ($this->data['non_game_products'] as $item) {
            $this->seedNonGame($item);
        }
    }

    private function seedGame(array $game, int $index): void
    {
        $name = $this->cleanName($game['name']);
        $appId = (int) $game['steam_app_id'];
        $publisher = $game['publishers'][0] ?? null;

        $pcPlatform = 'steam';
        foreach ($this->data['pc_platform_by_publisher'] as $fragment => $platform) {
            if ($publisher && str_contains($publisher, $fragment)) {
                $pcPlatform = $platform;
            }
        }

        if (isset($this->data['forced_variants'][$appId])) {
            $variants = $this->data['forced_variants'][$appId];
        } else {
            $variants = [[$pcPlatform, $game['coming_soon'] ? 'global' : $this->pickRegion(['global' => 70, 'europe' => 20, 'rest-of-world' => 10])]];
            // The best known games are also sold region-locked for Europe, like on Eneba.
            if ($index < 25 && $variants[0][1] === 'global') {
                $variants[] = [$pcPlatform, 'europe'];
            }
            foreach ($this->data['extra_pc_platforms'] as $platform => $ids) {
                if (in_array($appId, $ids, true)) {
                    $variants[] = [$platform, 'global'];
                }
            }
            foreach ($this->data['console_variants'] as $platform => $ids) {
                if (in_array($appId, $ids, true)) {
                    $variants[] = [$platform, $this->pickRegion(['europe' => 55, 'global' => 25, 'north-america' => 15, 'united-kingdom' => 5])];
                }
            }
        }

        $releaseDate = $this->parseDate($game['release_date'] ?? null);
        $msrp = $game['price_cents'] ?: ($game['type'] === 'dlc' ? 2999 : 6999);
        // Popularity: famous catalogue order, review scores and a boost for this season's releases.
        $popularity = (int) (max(0, 160 - $index) * mt_rand(40, 120)
            + ($game['metacritic'] ?? 70) * 20
            + ($this->data['popularity_boost'][$appId] ?? 0));

        foreach ($variants as [$platformSlug, $regionSlug]) {
            $platform = $this->platforms[$platformSlug];
            $isConsole = in_array($platform->family, ['playstation', 'xbox', 'nintendo'], true);

            $product = $this->createProduct([
                'name' => $name,
                'type' => $game['type'],
                'platform' => $platform,
                'region' => $this->regions[$regionSlug],
                'steam_app_id' => $appId,
                'description' => $this->longDescription($name, $game, $platform),
                'developer' => $game['developers'][0] ?? null,
                'publisher' => $publisher,
                'release_date' => $game['coming_soon'] && ! $releaseDate?->isFuture() ? null : $releaseDate,
                'coming_soon' => (bool) $game['coming_soon'],
                'cover_url' => $game['cover_image'],
                'header_url' => $game['header_image'],
                'screenshots' => $game['screenshots'],
                'operating_systems' => $isConsole ? [$platform->device_label] : array_keys(array_filter($game['platforms'] ?? ['windows' => true])),
                'msrp_cents' => $isConsole ? (int) round($msrp * 1.15 / 100) * 100 - 1 : $msrp,
                'sales_count' => (int) ($popularity
                    * ($regionSlug === 'global' ? 1 : 0.45)
                    * ($isConsole ? 0.6 : 1)
                    * (in_array($platformSlug, ['gog', 'epic-games'], true) ? 0.35 : 1)),
                'search_aliases' => $this->data['search_aliases'][$appId] ?? null,
            ]);
            $product->genres()->sync($this->gameGenres($game['genres'], $appId));

            $soldOut = ! $game['coming_soon'] && mt_rand(1, 100) <= 4; // a few products are sold out, like on Eneba
            $this->seedOffers($product, $product->msrp_cents, [0.32, 0.92], $soldOut, $platform->family);
        }
    }

    /** Games that are not on Steam (GTA VI, Minecraft) with Eneba's own artwork. */
    private function seedManualGame(array $game): void
    {
        $releaseDate = Carbon::parse($game['release_date']);

        foreach ($game['variants'] as [$platformSlug, $regionSlug, $cover]) {
            $platform = $this->platforms[$platformSlug];
            $product = $this->createProduct([
                'name' => $game['name'],
                'type' => 'game',
                'platform' => $platform,
                'region' => $this->regions[$regionSlug],
                'description' => $game['description']."\n\nActivate the key on {$platform->name} and start playing right away. Every key is sold by a verified seller and is covered by Eneba's buyer protection.",
                'developer' => $game['developer'],
                'publisher' => $game['publisher'],
                'release_date' => $releaseDate,
                'cover_url' => $cover,
                'operating_systems' => [$platform->device_label],
                'msrp_cents' => $game['msrp'],
                'sales_count' => 9000 + ($game['sales_boost'] ?? 0) + mt_rand(0, 4000),
                'search_aliases' => $game['aliases'],
            ]);
            $product->genres()->sync(collect($game['genres'])->map(fn ($slug) => $this->genreIds[$slug])->all());
            $this->seedOffers($product, $game['msrp'], [0.78, 0.95], false, $platform->family);
        }
    }

    private function seedNonGame(array $item): void
    {
        $platform = $this->platforms[$item['platform']];
        $region = $this->regions[$item['region']];
        $typeLabel = Product::TYPES[$item['type']];

        $product = $this->createProduct([
            'name' => $item['name'],
            'type' => $item['type'],
            'brand' => $item['brand'],
            'platform' => $platform,
            'region' => $region,
            'description' => "Buy {$item['name']} at a lower price on Eneba. This {$typeLabel} product is delivered instantly as a digital code after payment. "
                ."Make sure your account region matches {$region->name} before redeeming. Codes are sold by verified sellers and covered by Eneba's buyer protection.",
            'cover_url' => $item['cover'] ?? null,
            'art' => $item['art'] ?? null,
            'operating_systems' => [],
            'msrp_cents' => $item['face'],
            'sales_count' => mt_rand(2000, 16000),
        ]);

        $range = $item['type'] === 'software' ? [0.06, 0.25] : [0.88, 1.04];
        $this->seedOffers($product, $item['face'], $range, false, $platform->family);
    }

    /** @param array<string, mixed> $attributes */
    private function createProduct(array $attributes): Product
    {
        /** @var Platform $platform */
        $platform = $attributes['platform'];
        /** @var Region $region */
        $region = $attributes['region'];
        $name = $attributes['name'];

        $title = match (true) {
            in_array($attributes['type'], ['game', 'dlc'], true) => "{$name} ({$platform->device_label}) {$platform->key_label} {$region->name}",
            $attributes['type'] === 'software' => "{$name} (PC) Key {$region->name}",
            $platform->slug === 'other' => "{$name} Key {$region->name}",
            default => "{$name} {$platform->key_label} {$region->name}",
        };

        unset($attributes['platform'], $attributes['region'], $attributes['name']);

        return Product::create($attributes + [
            'slug' => $this->uniqueSlug($platform->slug.' '.$title),
            'title' => $title,
            'base_title' => $name,
            'platform_id' => $platform->id,
            'region_id' => $region->id,
            'search_text' => '',
        ]);
    }

    /**
     * Give a product 2-7 competing offers, each with its own stock of keys and cashback.
     *
     * @param  array{0: float, 1: float}  $priceRange  multiplier range applied to the reference price
     */
    private function seedOffers(Product $product, int $reference, array $priceRange, bool $soldOut, string $family): void
    {
        $sellers = $this->sellers->shuffle()->take(mt_rand(2, 7));
        // A product-level "market" discount keeps sellers' prices clustered realistically.
        $market = $priceRange[0] + (mt_rand() / mt_getrandmax()) * ($priceRange[1] - $priceRange[0]);
        $keys = [];
        $now = now();

        foreach ($sellers as $seller) {
            $spread = 1 + (mt_rand(-6, 14) / 100);
            // Never below 99 cents: Stripe can't charge less than 50 cents for an order.
            $price = max(99, (int) (round($reference * $market * $spread / 10) * 10) - 1);
            $stock = $soldOut ? 0 : (mt_rand(1, 100) <= 12 ? 0 : mt_rand(1, 9));

            $offer = Offer::create([
                'product_id' => $product->id,
                'seller_id' => $seller->id,
                'price_cents' => $price,
                'stock' => $stock,
                'cashback_percent' => self::CASHBACK_STEPS[array_rand(self::CASHBACK_STEPS)],
            ]);

            for ($i = 0; $i < $stock; $i++) {
                $keys[] = [
                    'offer_id' => $offer->id,
                    'code' => Crypt::encryptString(KeyGenerator::for($family)),
                    'status' => 'available',
                    'created_at' => $now,
                    'updated_at' => $now,
                ];
            }
        }

        foreach (array_chunk($keys, 500) as $chunk) {
            DB::table('product_keys')->insert($chunk);
        }
        $product->refreshOfferSummary();
    }

    /**
     * Map Steam genres plus curated extras (shooters, fighting games...) to Eneba's categories.
     *
     * @param  string[]  $steamGenres
     * @return int[]
     */
    private function gameGenres(array $steamGenres, int $appId): array
    {
        $slugs = collect($steamGenres)
            ->map(fn (string $g) => $this->data['steam_genre_map'][$g] ?? null)
            ->filter();

        foreach ($this->data['extra_genres'] as $slug => $ids) {
            if (in_array($appId, $ids, true)) {
                $slugs->push($slug);
            }
        }

        return $slugs->unique()->map(fn (string $slug) => $this->genreIds[$slug])->values()->all();
    }

    private function longDescription(string $name, array $game, Platform $platform): string
    {
        $dev = $game['developers'][0] ?? 'the studio';
        $genres = collect($game['genres'])->take(3)->map(fn ($g) => Str::lower($g))->join(', ', ' and ');
        $short = trim($game['short_description'] ?? '');

        return trim(implode("\n\n", array_filter([
            $short,
            "{$name} is a {$genres} title from {$dev}. Buying a {$platform->key_label} on Eneba is the quickest way to add it to your library: "
                .'pick the offer that suits you, pay securely and the key appears in your account right after checkout.',
            "Activate the key on {$platform->name} and start downloading straight away. Every key is sold by a verified seller and is covered by Eneba's buyer protection.",
        ])));
    }

    private function cleanName(string $name): string
    {
        $name = trim(preg_replace('/\s+/', ' ', str_replace(['™', '®', '©'], '', $name)));

        // Steam shouts some names ("ELDEN RING"); Eneba lists them in title case.
        return self::NAME_OVERRIDES[$name] ?? $name;
    }

    /** @param array<string, int> $weights */
    private function pickRegion(array $weights): string
    {
        $roll = mt_rand(1, array_sum($weights));
        foreach ($weights as $slug => $weight) {
            if (($roll -= $weight) <= 0) {
                return $slug;
            }
        }

        return array_key_first($weights);
    }

    private function parseDate(?string $value): ?Carbon
    {
        if (! $value || ! preg_match('/\d{1,2}\s+\w+,?\s+\d{4}|\w+\s+\d{1,2},?\s+\d{4}/', $value)) {
            return null; // "2027", "Coming soon", "To be announced"
        }
        try {
            return Carbon::parse(str_replace(',', '', $value));
        } catch (\Throwable) {
            return null;
        }
    }

    private function uniqueSlug(string $base): string
    {
        $slug = Str::slug(str_replace('|', ' ', $base));
        $candidate = $slug;
        $n = 2;
        while (Product::where('slug', $candidate)->exists()) {
            $candidate = $slug.'-'.$n++;
        }

        return $candidate;
    }
}
