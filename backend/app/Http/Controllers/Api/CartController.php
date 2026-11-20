<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Offer;
use App\Services\Commerce\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(private CartService $cart) {}

    /** Price a guest cart kept in the browser. */
    public function preview(Request $request): JsonResponse
    {
        $data = $request->validate([
            'items' => ['present', 'array', 'max:50'],
            'items.*.offer_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1', 'max:10'],
            'code' => ['nullable', 'string', 'max:40'],
        ]);

        return response()->json(['data' => $this->cart->preview($data['items'], $data['code'] ?? null)]);
    }

    public function show(Request $request): JsonResponse
    {
        // An optional discount code is priced into the summary.
        return response()->json(['data' => $this->cart->forUser($request->user(), $request->string('code')->toString() ?: null)]);
    }

    public function add(Request $request): JsonResponse
    {
        $data = $request->validate([
            'offer_id' => ['required', 'integer', 'exists:offers,id'],
            'quantity' => ['sometimes', 'integer', 'min:1', 'max:10'],
        ]);
        $offer = Offer::findOrFail($data['offer_id']);
        abort_unless($offer->is_active && $offer->stock > 0 && $offer->product->is_active, 422, 'This offer is out of stock.');

        $this->cart->add($request->user(), $offer, $data['quantity'] ?? 1);

        return $this->show($request);
    }

    public function update(Request $request, Offer $offer): JsonResponse
    {
        $data = $request->validate(['quantity' => ['required', 'integer', 'min:0', 'max:10']]);
        $this->cart->set($request->user(), $offer, $data['quantity']);

        return $this->show($request);
    }

    public function remove(Request $request, Offer $offer): JsonResponse
    {
        $this->cart->set($request->user(), $offer, 0);

        return $this->show($request);
    }
}
