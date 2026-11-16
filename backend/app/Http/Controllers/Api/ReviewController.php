<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ReviewResource;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Review;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request, string $slug): JsonResponse
    {
        $product = Product::active()->where('slug', $slug)->firstOrFail();
        $reviews = $product->reviews()->latest()->paginate(8);

        $distribution = $product->reviews()
            ->selectRaw('rating, count(*) as total')
            ->groupBy('rating')
            ->pluck('total', 'rating');

        return response()->json([
            'data' => ReviewResource::collection($reviews->items()),
            'meta' => [
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
                'total' => $reviews->total(),
            ],
            'summary' => [
                'average' => $product->rating_avg,
                'count' => $product->rating_count,
                'distribution' => collect([5, 4, 3, 2, 1])->mapWithKeys(fn ($r) => [$r => (int) ($distribution[$r] ?? 0)]),
                'aspects' => $this->aspectAverages($product),
            ],
        ]);
    }

    /** One review per user per product; posting again updates it. */
    public function store(Request $request, string $slug): JsonResponse
    {
        $product = Product::active()->where('slug', $slug)->firstOrFail();
        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'body' => ['required', 'string', 'min:10', 'max:1000'],
            'aspects' => ['nullable', 'array:'.implode(',', Review::ASPECTS)],
            'aspects.*' => ['nullable', 'integer', 'min:1', 'max:5'],
        ]);
        $user = $request->user();

        $verified = OrderItem::where('product_id', $product->id)
            ->whereHas('order', fn ($q) => $q->where('user_id', $user->id)->where('status', Order::PAID))
            ->exists();

        $review = Review::updateOrCreate(
            ['product_id' => $product->id, 'user_id' => $user->id],
            ['author_name' => $user->name, 'rating' => $data['rating'], 'body' => $data['body'], 'aspects' => array_filter($data['aspects'] ?? []) ?: null, 'is_verified_purchase' => $verified],
        );
        $product->refreshRating();

        return response()->json(['data' => new ReviewResource($review)], $review->wasRecentlyCreated ? 201 : 200);
    }

    /**
     * Average score per aspect across the reviews that rated it (null when nobody has).
     *
     * @return array<string, float|null>
     */
    private function aspectAverages(Product $product): array
    {
        $columns = collect(Review::ASPECTS)->map(fn (string $aspect) => "avg((aspects->>'{$aspect}')::int) as {$aspect}")->join(', ');
        $row = $product->reviews()->toBase()->selectRaw($columns)->first();

        return collect(Review::ASPECTS)->mapWithKeys(fn (string $aspect) => [$aspect => $row->{$aspect} !== null ? round((float) $row->{$aspect}, 1) : null])->all();
    }
}
