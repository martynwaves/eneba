<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\NewsletterSubscriber;
use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Commerce\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    private const WISHLIST_RULES = [
        'wishlist' => ['sometimes', 'array', 'max:200'],
        'wishlist.*' => ['integer'],
    ];

    public function __construct(private CartService $cart) {}

    /**
     * A cart and wishlist built while browsing as a guest move into the account on sign-in.
     *
     * @param  array{cart?: array<int, array{offer_id: int, quantity: int}>, wishlist?: int[]}  $data
     */
    private function mergeGuestState(User $user, array $data): void
    {
        $this->cart->merge($user, $data['cart'] ?? []);

        if (! empty($data['wishlist'])) {
            $user->wishlist()->syncWithoutDetaching(Product::whereIn('id', $data['wishlist'])->pluck('id'));
        }
    }

    public function register(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name' => ['nullable', 'string', 'max:60'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', Password::min(8)->letters()->numbers()],
            'newsletter' => ['sometimes', 'boolean'],
            'cart' => ['sometimes', 'array', 'max:50'],
            'cart.*.offer_id' => ['required_with:cart', 'integer'],
            'cart.*.quantity' => ['required_with:cart', 'integer', 'min:1', 'max:10'],
            ...self::WISHLIST_RULES,
        ]);

        $email = strtolower($data['email']);
        $user = User::create([
            // Like Eneba, an account only needs an email; the display name defaults to its local part.
            'name' => filled($data['name'] ?? null) ? $data['name'] : Str::limit(Str::before($email, '@'), 60, ''),
            'email' => $email,
            'password' => $data['password'],
        ]);
        if ($data['newsletter'] ?? false) {
            NewsletterSubscriber::firstOrCreate(['email' => $email]);
        }
        $this->mergeGuestState($user, $data);

        return $this->tokenResponse($user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            'cart' => ['sometimes', 'array', 'max:50'],
            'cart.*.offer_id' => ['required_with:cart', 'integer'],
            'cart.*.quantity' => ['required_with:cart', 'integer', 'min:1', 'max:10'],
            ...self::WISHLIST_RULES,
        ]);

        $user = User::where('email', strtolower($data['email']))->first();
        if (! $user || ! Hash::check($data['password'], $user->password)) {
            throw ValidationException::withMessages(['email' => 'These credentials do not match our records.']);
        }

        $this->mergeGuestState($user, $data);

        return $this->tokenResponse($user);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json(['message' => 'Signed out.']);
    }

    public function me(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->present($request->user())]);
    }

    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:60'],
            'current_password' => ['required_with:password', 'current_password:sanctum'],
            'password' => ['sometimes', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
        ]);

        $user->fill(array_filter([
            'name' => $data['name'] ?? null,
            'password' => $data['password'] ?? null,
        ]))->save();

        return response()->json(['data' => $this->present($user)]);
    }

    private function tokenResponse(User $user, int $status = 200): JsonResponse
    {
        $token = $user->createToken('web')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $this->present($user)], $status);
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'cashback_balance' => (int) $user->cashback_balance_cents,
            // Loyalty points: one Enebium per euro spent on paid orders.
            'enebium' => intdiv((int) $user->orders()->where('status', Order::PAID)->sum('total_cents'), 100),
            'cashback_earned' => (int) $user->orders()->where('status', Order::PAID)->join('order_items', 'order_items.order_id', '=', 'orders.id')
                ->sum(DB::raw('order_items.unit_price_cents * order_items.quantity * order_items.cashback_percent / 100')),
            'wishlist_count' => $user->wishlist()->count(),
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }
}
