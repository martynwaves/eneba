<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Models\Product;
use App\Services\Catalog\ProductQuery;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    /** Autocomplete for the header search box. */
    public function suggest(Request $request): JsonResponse
    {
        $request->validate(['q' => ['required', 'string', 'max:100']]);

        $query = new ProductQuery(['q' => $request->string('q')->toString(), 'sort' => 'relevance']);
        if (! $query->match || $query->match->isEmpty()) {
            return response()->json(['query' => $request->input('q'), 'products' => [], 'titles' => [], 'total' => 0, 'corrected_to' => null]);
        }

        $matches = $query->sorted()->with(['platform', 'region'])->limit(30)->get();
        $total = $query->build()->count();

        $literal = Product::active()->where(fn ($q) => $query->match->allTokens($q))->exists();

        return response()->json([
            'query' => $query->filters['q'],
            'products' => ProductCardResource::collection($matches->take(6)),
            // Distinct game names make good one-click search terms.
            'titles' => $matches->pluck('base_title')->unique()->take(4)->values(),
            'total' => $total,
            'corrected_to' => ! $literal && $matches->isNotEmpty() ? $matches->first()->base_title : null,
        ]);
    }
}
