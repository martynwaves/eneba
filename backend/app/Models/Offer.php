<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Offer extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function seller(): BelongsTo
    {
        return $this->belongsTo(Seller::class);
    }

    public function keys(): HasMany
    {
        return $this->hasMany(ProductKey::class);
    }

    public function scopePurchasable(Builder $query): Builder
    {
        return $query->where('offers.is_active', true)->where('offers.stock', '>', 0);
    }

    /** Recount sellable keys (available, or reserved with an expired hold). */
    public function refreshStock(): void
    {
        $this->stock = $this->keys()->sellable()->count();
        $this->save();
    }
}
