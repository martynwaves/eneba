<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = $request->user()->wishlist()
            ->select('products.*')
            ->withBestOffer()
            ->with(['platform', 'region'])
            ->orderByPivot('created_at', 'desc')
            ->orderByDesc('products.id') // saves within the same second would otherwise swap places
            ->get();

        return response()->json([
            'data' => ProductCardResource::collection($products),
            'ids' => $products->pluck('id'),
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        // One statement: a double-clicked heart sends two saves, and the second must not trip the primary key.
        DB::table('wishlist_items')->insertOrIgnore(['user_id' => $request->user()->id, 'product_id' => $product->id]);

        return $this->index($request);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlist()->detach($product->id);

        return $this->index($request);
    }
}
