<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\NavLink;
use App\Models\NewsletterSubscriber;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;

/** Site-wide content shown on every page: navigation bar, locale options, newsletter. */
class StorefrontController extends Controller
{
    public function navigation(): JsonResponse
    {
        $links = Cache::remember('storefront:navigation', 300, fn () => NavLink::where('is_active', true)
            ->orderBy('sort')
            ->get(['id', 'label', 'link_url', 'style'])
            ->toArray());

        return response()->json(['data' => $links]);
    }

    /** Options for the region / language / currency popup. */
    public function settings(): JsonResponse
    {
        return response()->json(['data' => [
            'default_region' => config('locales.default_region'),
            'regions' => config('locales.regions'),
            'languages' => config('locales.languages'),
            'currencies' => Currency::orderBy('sort')->get(['code', 'name', 'symbol', 'rate'])->toArray(),
            'charge_currency' => config('shop.currency'),
        ]]);
    }

    public function subscribe(Request $request): JsonResponse
    {
        $data = $request->validate(['email' => ['required', 'email', 'max:255']]);
        $subscriber = NewsletterSubscriber::firstOrCreate(['email' => strtolower($data['email'])]);

        return response()->json([
            'message' => $subscriber->wasRecentlyCreated ? 'You are subscribed to game deals!' : 'You are already subscribed.',
        ], $subscriber->wasRecentlyCreated ? 201 : 200);
    }
}
