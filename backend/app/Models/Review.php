<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Review extends Model
{
    protected $guarded = ['id'];

    /** What buyers can score separately, besides the overall rating. */
    public const ASPECTS = ['gameplay', 'story', 'graphics', 'soundtrack'];

    protected function casts(): array
    {
        return ['is_verified_purchase' => 'boolean', 'aspects' => 'array'];
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
