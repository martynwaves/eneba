<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
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
            return response()->json(['products' => [], 'total' => 0, 'corrected_to' => null]);
        }

        $matches = $query->sorted()->with(['platform', 'region'])->limit(6)->get();

        return response()->json([
            'products' => ProductCardResource::collection($matches),
            'total' => $query->build()->count(),
            'corrected_to' => $query->correctedTo($matches->first()),
        ]);
    }
}
