<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Seller extends Model
{
    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'rating' => 'float',
            'is_verified' => 'boolean',
        ];
    }

    public function offers(): HasMany
    {
        return $this->hasMany(Offer::class);
    }

    /** Eneba-style wording for a 0-10 seller score. */
    public function ratingLabel(): string
    {
        return match (true) {
            $this->rating >= 9.8 => 'Superb',
            $this->rating >= 9.5 => 'Excellent',
            $this->rating >= 9.0 => 'Very good',
            $this->rating >= 8.0 => 'Good',
            default => 'Fair',
        };
    }
}
