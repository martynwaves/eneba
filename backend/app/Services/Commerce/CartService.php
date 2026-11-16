<?php

namespace App\Services\Commerce;

use App\Http\Resources\ProductCardResource;
use App\Http\Resources\SellerResource;
use App\Models\CartItem;
use App\Models\Offer;
use App\Models\User;
use Illuminate\Support\Collection;

/**
 * Builds priced cart lines. Signed-in carts live in `cart_items`; guest carts live in the
 * browser and are priced through preview() so prices and stock always come from the server.
 */
class CartService
{
    public function __construct(private DiscountService $discounts) {}

    /** @return array{lines: array, summary: array} */
    public function forUser(User $user, ?string $code = null): array
    {
        $items = $user->cartItems()->with('offer.product.platform', 'offer.product.region', 'offer.seller')->orderBy('id')->get();

        return $this->present($items->map(fn (CartItem $i) => ['offer' => $i->offer, 'quantity' => $i->quantity]), $code);
    }

    /**
     * @param  array<int, array{offer_id: int, quantity: int}>  $items
     * @return array{lines: array, summary: array}
     */
    public function preview(array $items, ?string $code = null): array
    {
        $quantities = collect($items)->groupBy('offer_id')->map(fn ($g) => (int) $g->sum('quantity'));
        $offers = Offer::with('product.platform', 'product.region', 'seller')
            ->whereIn('id', $quantities->keys())
            ->get()
            ->keyBy('id');

        return $this->present($quantities->map(fn ($qty, $id) => ['offer' => $offers[$id] ?? null, 'quantity' => $qty])
            ->filter(fn ($row) => $row['offer'] !== null)
            ->values(), $code);
    }

    public function add(User $user, Offer $offer, int $quantity): void
    {
        $item = CartItem::firstOrNew(['user_id' => $user->id, 'offer_id' => $offer->id]);
        $item->quantity = min(config('shop.max_quantity_per_item'), ($item->exists ? $item->quantity : 0) + $quantity);
        $item->save();
    }

    public function set(User $user, Offer $offer, int $quantity): void
    {
        if ($quantity <= 0) {
            CartItem::where('user_id', $user->id)->where('offer_id', $offer->id)->delete();

            return;
        }
        CartItem::updateOrCreate(
            ['user_id' => $user->id, 'offer_id' => $offer->id],
            ['quantity' => min(config('shop.max_quantity_per_item'), $quantity)],
        );
    }

    /** Fold a guest cart into the user's cart after they sign in. */
    public function merge(User $user, array $items): void
    {
        $offers = Offer::whereIn('id', collect($items)->pluck('offer_id'))->get()->keyBy('id');
        foreach ($items as $item) {
            if ($offer = $offers[$item['offer_id']] ?? null) {
                $this->add($user, $offer, (int) $item['quantity']);
            }
        }
    }

    /** @param Collection<int, array{offer: Offer, quantity: int}> $rows */
    private function present(Collection $rows, ?string $code): array
    {
        $lines = $rows->map(function (array $row) {
            /** @var Offer $offer */
            $offer = $row['offer'];
            $quantity = $row['quantity'];
            $available = $offer->is_active && $offer->product->is_active ? $offer->stock : 0;

            $problem = match (true) {
                $available === 0 => 'out_of_stock',
                $available < $quantity => 'insufficient_stock',
                default => null,
            };

            return [
                'offer_id' => $offer->id,
                'quantity' => $quantity,
                'unit_price' => $offer->price_cents,
                'cashback_percent' => $offer->cashback_percent,
                'line_total' => $offer->price_cents * $quantity,
                'available_stock' => $available,
                'problem' => $problem,
                'product' => (new ProductCardResource($offer->product))->resolve(),
                'seller' => (new SellerResource($offer->seller))->resolve(),
            ];
        })->values();

        $valid = $lines->whereNull('problem');
        $subtotal = (int) $valid->sum('line_total');
        $fee = $subtotal > 0 ? (int) config('shop.service_fee_cents') : 0;
        $discount = $this->discounts->evaluate($code, $subtotal, $fee);

        return [
            'lines' => $lines->all(),
            'summary' => [
                'items_count' => (int) $lines->sum('quantity'),
                'subtotal' => $subtotal,
                'service_fee' => $fee,
                'discount' => $discount['discount'],
                'discount_code' => $discount['code'],
                'discount_error' => $discount['error'],
                'total' => $subtotal + $fee - $discount['discount'],
                'currency' => config('shop.currency'),
                'has_problems' => $lines->whereNotNull('problem')->isNotEmpty(),
            ],
        ];
    }
}
