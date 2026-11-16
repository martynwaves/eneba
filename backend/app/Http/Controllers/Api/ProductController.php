<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Http\Resources\ProductDetailResource;
use App\Models\Product;
use App\Services\Catalog\ProductQuery;
use App\Services\Catalog\ProductWatchers;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    /** Store listing: filters, sorting, text search, pagination and facet counts. */
    public function index(Request $request): JsonResponse
    {
        $request->validate([
            'q' => ['nullable', 'string', 'max:100'],
            'sort' => ['nullable', 'string'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:60'],
            'price_min' => ['nullable', 'numeric', 'min:0'],
            'price_max' => ['nullable', 'numeric', 'min:0'],
        ]);

        $query = new ProductQuery($request->all());
        $paginator = $query->sorted()
            ->with(['platform', 'region'])
            ->paginate((int) $request->input('per_page', 24))
            ->withQueryString();

        return response()->json([
            'data' => ProductCardResource::collection($paginator->items()),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
            ],
            'facets' => $query->facets(),
            'applied' => $query->filters,
            'search' => $query->match ? [
                'query' => $query->filters['q'],
                'corrected_to' => $this->correction($query, $paginator->items()),
            ] : null,
        ]);
    }

    public function show(Request $request, string $slug, ProductWatchers $watchers): JsonResponse
    {
        $product = Product::active()
            ->where('slug', $slug)
            ->with(['platform', 'region', 'genres', 'offers.seller'])
            ->withCount('wishlistedBy as wishlist_count')
            ->firstOrFail();

        $variants = Product::active()
            ->with(['platform', 'region'])
            ->where(fn ($q) => $product->steam_app_id
                ? $q->where('steam_app_id', $product->steam_app_id)
                : $q->where('base_title', $product->base_title))
            ->join('platforms', 'platforms.id', '=', 'products.platform_id')
            ->join('regions', 'regions.id', '=', 'products.region_id')
            ->orderBy('platforms.sort')
            ->orderBy('regions.sort')
            ->select('products.*')
            ->get();

        $genreIds = $product->genres->pluck('id');
        $similar = Product::active()
            ->inStock()
            ->select('products.*')
            ->withBestOffer()
            ->with(['platform', 'region'])
            ->where('type', $product->type)
            ->where('base_title', '!=', $product->base_title)
            ->when($genreIds->isNotEmpty(), fn ($q) => $q->whereHas('genres', fn ($g) => $g->whereIn('genres.id', $genreIds)))
            ->orderByDesc('sales_count')
            ->limit(60)
            ->get()
            ->unique('base_title')
            ->take(20)
            ->values();

        return response()->json(['data' => new ProductDetailResource($product, $variants, $similar, $watchers->record($product, $request))]);
    }

    /**
     * When nothing contains the literal query but fuzzy matches exist, tell the visitor
     * what we searched for instead ("Showing results for ...").
     *
     * @param  array<int, Product>  $items
     */
    private function correction(ProductQuery $query, array $items): ?string
    {
        if (! $items || $query->match->isEmpty()) {
            return null;
        }

        $literalExists = Product::active()
            ->where(fn ($q) => $query->match->allTokens($q))
            ->exists();

        return $literalExists ? null : $items[0]->base_title;
    }
}
