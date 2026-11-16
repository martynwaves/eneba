<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Product extends Model
{
    public const TYPES = [
        'game' => 'Game',
        'dlc' => 'DLC',
        'gift_card' => 'Gaming eCards',
        'egift_card' => 'eGift Cards',
        'game_points' => 'Game points',
        'e_money' => 'E-money',
        'subscription' => 'Subscription',
        'software' => 'Software',
    ];

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'release_date' => 'date',
            'coming_soon' => 'boolean',
            'screenshots' => 'array',
            'art' => 'array',
            'requirements' => 'array',
            'operating_systems' => 'array',
            'features' => 'array',
            'languages' => 'array',
            'trailer' => 'array',
            'about' => 'array',
            'platform_requirements' => 'array',
            'rating_avg' => 'float',
            'is_active' => 'boolean',
        ];
    }

    protected static function booted(): void
    {
        static::saving(function (Product $product) {
            if (blank($product->search_text) || $product->isDirty(['base_title', 'platform_id', 'region_id', 'search_aliases'])) {
                $product->search_text = $product->buildSearchText();
            }
        });
    }

    /**
     * What search matches against: the game name, common abbreviations, platform and region.
     * Boilerplate from the listing title ("Launcher Key", "Gift Card") is left out on purpose,
     * because fuzzy matching would otherwise find "wicher" inside "launcher".
     */
    public function buildSearchText(): string
    {
        $platform = Platform::find($this->platform_id);
        $region = Region::find($this->region_id);

        return self::normalize(implode(' ', array_filter([
            $this->base_title,
            $this->search_aliases,
            $platform ? str_replace('-', ' ', $platform->slug).' '.$platform->device_label : null,
            $region?->name,
        ])));
    }

    /** Lower-case, accent-free, punctuation-free text used on both sides of a search match. */
    public static function normalize(string $text): string
    {
        $text = Str::lower(Str::ascii($text));
        $text = preg_replace('/[^a-z0-9]+/', ' ', $text) ?? '';

        return trim(preg_replace('/\s+/', ' ', $text) ?? '');
    }

    public function platform(): BelongsTo
    {
        return $this->belongsTo(Platform::class);
    }

    public function region(): BelongsTo
    {
        return $this->belongsTo(Region::class);
    }

    public function genres(): BelongsToMany
    {
        return $this->belongsToMany(Genre::class);
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    /** Users who saved this product to their wishlist. */
    public function wishlistedBy(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'wishlist_items');
    }

    public function reviews(): HasMany
    {
        return $this->hasMany(Review::class);
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('products.is_active', true);
    }

    public function scopeInStock(Builder $query): Builder
    {
        return $query->where('products.stock', '>', 0);
    }

    /** Adds `best_offer_id`: the cheapest purchasable offer, used by "Add to cart" on cards. */
    public function scopeWithBestOffer(Builder $query): Builder
    {
        return $query->addSelect(['best_offer_id' => Offer::select('offers.id')
            ->whereColumn('offers.product_id', 'products.id')
            ->where('offers.is_active', true)
            ->where('offers.stock', '>', 0)
            ->orderBy('offers.price_cents')
            ->limit(1)]);
    }

    /** Announced games and games with a future release date are sold as pre-orders. */
    public function scopeUpcoming(Builder $query): Builder
    {
        return $query->where(fn (Builder $q) => $q
            ->where('products.coming_soon', true)
            ->orWhereDate('products.release_date', '>', now()->toDateString()));
    }

    public function isPreorder(): bool
    {
        return $this->coming_soon || ($this->release_date?->isFuture() ?? false);
    }

    public function discountPercent(): ?int
    {
        if (! $this->msrp_cents || ! $this->min_price_cents || $this->min_price_cents >= $this->msrp_cents) {
            return null;
        }

        return (int) round(100 - ($this->min_price_cents / $this->msrp_cents * 100));
    }

    /** Refresh the denormalised cheapest-offer / stock summary used by listings. */
    public function refreshOfferSummary(): void
    {
        $summary = $this->offers()
            ->where('is_active', true)
            ->where('stock', '>', 0)
            ->selectRaw('min(price_cents) as min_price, count(*) as offers, coalesce(sum(stock), 0) as stock')
            ->toBase()
            ->first();

        $cheapest = $this->offers()
            ->where('is_active', true)
            ->where('stock', '>', 0)
            ->orderBy('price_cents')
            ->first(['cashback_percent']);

        $this->min_price_cents = $summary?->min_price;
        $this->offers_count = (int) ($summary?->offers ?? 0);
        $this->stock = (int) ($summary?->stock ?? 0);
        $this->cashback_percent = (int) ($cheapest?->cashback_percent ?? 0);
        $this->saveQuietly();
    }

    public function refreshRating(): void
    {
        $agg = $this->reviews()->selectRaw('avg(rating) as avg, count(*) as cnt')->toBase()->first();
        $this->rating_avg = round((float) ($agg?->avg ?? 0), 2);
        $this->rating_count = (int) ($agg?->cnt ?? 0);
        $this->saveQuietly();
    }
}
