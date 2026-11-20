<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\User;
use App\Services\Commerce\CartService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /** The guest cart and wishlist that register and login carry along (see mergeGuestState). */
    private const GUEST_STATE_RULES = [
        'cart' => ['sometimes', 'array', 'max:50'],
        'cart.*.offer_id' => ['required_with:cart', 'integer'],
        'cart.*.quantity' => ['required_with:cart', 'integer', 'min:1', 'max:10'],
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
            ...self::GUEST_STATE_RULES,
        ]);

        $email = strtolower($data['email']);
        $user = User::create([
            // Like Eneba, an account only needs an email; the display name defaults to its local part.
            'name' => filled($data['name'] ?? null) ? $data['name'] : Str::limit(Str::before($email, '@'), 60, ''),
            'email' => $email,
            'password' => $data['password'],
        ]);
        $this->mergeGuestState($user, $data);

        return $this->tokenResponse($user, 201);
    }

    public function login(Request $request): JsonResponse
    {
        $data = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
            ...self::GUEST_STATE_RULES,
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
        // Every sign-in issues a token; clear this user's lapsed ones instead of keeping them forever.
        $user->tokens()->where('created_at', '<', now()->subMinutes(config('sanctum.expiration')))->delete();
        $token = $user->createToken('web')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $this->present($user)], $status);
    }

    private function present(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            // The Eneba Wallet: seller cashback and refunds land here, and checkout can spend it.
            'cashback_balance' => (int) $user->cashback_balance_cents,
            'wishlist_count' => $user->wishlist()->count(),
            'created_at' => $user->created_at?->toIso8601String(),
        ];
    }
}
