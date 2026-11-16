<?php

namespace App\Http\Resources;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Review */
class ReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'author_name' => $this->author_name,
            'rating' => $this->rating,
            'aspects' => $this->aspects,
            'body' => $this->body,
            'is_verified_purchase' => $this->is_verified_purchase,
            'is_mine' => $request->user() !== null && $this->user_id === $request->user()->id,
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
