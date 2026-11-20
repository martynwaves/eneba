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
                'total' => $paginator->total(),
            ],
            'facets' => $query->facets(),
            'search' => $query->match ? ['corrected_to' => $query->correctedTo($paginator->items()[0] ?? null)] : null,
        ]);
    }

    public function show(Request $request, string $slug, ProductWatchers $watchers): JsonResponse
    {
        // Wishes from everyone but the viewer: the page adds the viewer's own wish (account or
        // browser) on top, so the count stays right as they toggle it.
        $viewerId = $request->user('sanctum')?->id;
        $product = Product::active()
            ->where('slug', $slug)
            ->with(['platform', 'region', 'genres', 'offers.seller'])
            ->withCount(['wishlistedBy as wishlist_count' => fn ($query) => $query->when($viewerId, fn ($q) => $q->where('users.id', '!=', $viewerId))])
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
            ->orderBy('products.id')
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
            ->orderBy('products.id')
            ->limit(60)
            ->get()
            ->unique('base_title')
            ->take(20)
            ->values();

        return response()->json(['data' => new ProductDetailResource($product, $variants, $similar, $watchers->record($product, $request))]);
    }
}
