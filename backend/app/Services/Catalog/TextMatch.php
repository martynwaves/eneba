<?php

namespace App\Services\Catalog;

use App\Models\Product;
use Illuminate\Database\Eloquent\Builder;

/**
 * Typo-tolerant, partial-name product matching built on PostgreSQL pg_trgm.
 *
 * Every word of the query has to match the product, either
 *   - literally, as the start of a word ("witch 3" finds "The Witcher 3", "hogw" finds "Hogwarts"), or
 *   - approximately, by trigram word similarity ("wicher", "cyberpnk", "legasy").
 * Requiring every word keeps multi-word queries precise ("steam wallet" does not return
 * every Steam game) while each word may still contain a typo.
 *
 * Matching is strict first; only when that finds nothing does ProductQuery retry with
 * relaxed similarity thresholds, so heavy typos ("elden rign") still find something.
 *
 * Both sides are normalised the same way (lower-case, ASCII, no punctuation), so accents and
 * symbols like ":" or "™" never get in the way.
 */
class TextMatch
{
    public readonly string $normalized;

    /** @var string[] */
    public readonly array $tokens;

    /** @var array<string, bool> tokens that literally start a word somewhere in the catalog */
    private array $literal = [];

    public function __construct(private string $query, public readonly bool $relaxed = false)
    {
        $this->normalized = Product::normalize($query);
        $this->tokens = array_slice(array_values(array_filter(explode(' ', $this->normalized), fn ($t) => $t !== '')), 0, 8);

        // A word that already exists in the catalog ("witch" -> "witcher") is taken as intended,
        // so it is not also fuzzy-matched against look-alikes ("switch"). Unknown words get fuzzy matching.
        if (! $relaxed) {
            foreach ($this->tokens as $token) {
                $this->literal[$token] = Product::active()->where(fn (Builder $q) => $this->wordPrefix($q, $token))->exists();
            }
        }
    }

    public function relax(): self
    {
        return new self($this->query, true);
    }

    public function isEmpty(): bool
    {
        return $this->tokens === [];
    }

    /** Short words produce few trigrams, so they need a stricter similarity cut-off. */
    public function threshold(string $token): ?float
    {
        $length = mb_strlen($token);

        return match (true) {
            $length <= 2 => null,   // "3", "ii": literal match only
            $length === 3 => 0.6,
            $length <= 5 => $this->relaxed ? 0.4 : 0.5,
            default => $this->relaxed ? 0.34 : 0.45,
        };
    }

    public function constrain(Builder $query): void
    {
        foreach ($this->tokens as $token) {
            $threshold = ($this->literal[$token] ?? false) ? null : $this->threshold($token);
            $query->where(function (Builder $q) use ($token, $threshold) {
                $this->wordPrefix($q, $token);
                if ($threshold !== null) {
                    $q->orWhereRaw('word_similarity(?, products.search_text) >= ?', [$token, $threshold]);
                }
            });
        }
    }

    /** Only products where every token literally starts a word (no fuzzy matching). */
    public function allTokens(Builder $query): Builder
    {
        foreach ($this->tokens as $token) {
            $query->where(fn (Builder $q) => $this->wordPrefix($q, $token));
        }

        return $query;
    }

    private function wordPrefix(Builder $query, string $token): void
    {
        // Tokens only contain [a-z0-9], so they are safe inside LIKE patterns.
        $query->where(fn (Builder $q) => $q
            ->where('products.search_text', 'like', $token.'%')
            ->orWhere('products.search_text', 'like', '% '.$token.'%'));
    }

    public function orderByRelevance(Builder $query): void
    {
        if ($this->isEmpty()) {
            $query->orderByDesc('sales_count');

            return;
        }

        $allTokens = implode(' and ', array_fill(0, count($this->tokens), "(' ' || products.search_text) like ?"));

        $query->orderByRaw(
            "(case when products.search_text like ? then 1.0 else 0 end)
             + (case when {$allTokens} then 0.6 else 0 end)
             + word_similarity(?, products.search_text) desc",
            [$this->normalized.'%', ...array_map(fn ($t) => '% '.$t.'%', $this->tokens), $this->normalized]
        )->orderByDesc('sales_count');
    }
}
