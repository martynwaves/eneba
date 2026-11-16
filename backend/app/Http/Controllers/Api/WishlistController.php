<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProductCardResource;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $products = $request->user()->wishlist()
            ->with(['platform', 'region'])
            ->orderByPivot('created_at', 'desc')
            ->get();

        return response()->json([
            'data' => ProductCardResource::collection($products),
            'ids' => $products->pluck('id'),
        ]);
    }

    public function store(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlist()->syncWithoutDetaching([$product->id]);

        return $this->index($request);
    }

    public function destroy(Request $request, Product $product): JsonResponse
    {
        $request->user()->wishlist()->detach($product->id);

        return $this->index($request);
    }
}
