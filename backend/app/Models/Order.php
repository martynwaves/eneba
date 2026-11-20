<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Str;

class Order extends Model
{
    public const PENDING = 'pending';

    public const PAID = 'paid';

    public const FAILED = 'failed';

    public const EXPIRED = 'expired';

    public const REFUNDED = 'refunded';

    public const CANCELLED = 'cancelled';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'paid_at' => 'datetime',
            'expires_at' => 'datetime',
        ];
    }

    /** What the card has to pay once the wallet's share is taken off. */
    public function cardAmountCents(): int
    {
        return $this->total_cents - (int) $this->wallet_cents;
    }

    /**
     * What refunding one unrevealed key of a line gives back: the key's price less its share of
     * the discount, less the cashback it earned (that stays in the wallet, so the buyer ends up
     * with exactly what they paid for the key).
     */
    public function keyRefundCents(OrderItem $item): int
    {
        $discountShare = $this->subtotal_cents > 0 ? intdiv((int) $this->discount_cents * $item->unit_price_cents, $this->subtotal_cents) : 0;
        $cashback = intdiv($item->unit_price_cents * $item->cashback_percent, 100);

        return max(0, $item->unit_price_cents - $discountShare - $cashback);
    }

    public static function newNumber(): string
    {
        return 'EN-'.now()->format('ymd').'-'.Str::upper(Str::random(6));
    }

    public function getRouteKeyName(): string
    {
        return 'number';
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /** In a fixed order, so a line doesn't move when a refund updates it. */
    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class)->orderBy('id');
    }
}
