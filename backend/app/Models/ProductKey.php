<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ProductKey extends Model
{
    public const AVAILABLE = 'available';

    public const RESERVED = 'reserved';

    public const SOLD = 'sold';

    protected $guarded = ['id'];

    protected $hidden = ['code'];

    protected function casts(): array
    {
        return [
            'code' => 'encrypted',
            'reserved_until' => 'datetime',
            'revealed_at' => 'datetime',
        ];
    }

    public function offer(): BelongsTo
    {
        return $this->belongsTo(Offer::class);
    }

    public function orderItem(): BelongsTo
    {
        return $this->belongsTo(OrderItem::class);
    }

    /** Keys that can be handed to a new buyer right now. */
    public function scopeSellable(Builder $query): Builder
    {
        return $query->where(function (Builder $q) {
            $q->where('status', self::AVAILABLE)
                ->orWhere(fn (Builder $r) => $r->where('status', self::RESERVED)->where('reserved_until', '<', now()));
        });
    }
}
