<?php

namespace App\Http\Resources;

use App\Models\Seller;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Seller */
class SellerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'slug' => $this->slug,
            'name' => $this->name,
            'rating' => $this->rating,
            'rating_label' => $this->ratingLabel(),
            'rating_count' => $this->rating_count,
            'is_verified' => $this->is_verified,
            'avatar_color' => $this->avatar_color,
        ];
    }
}
