<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Currency;
use App\Models\NavLink;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

/** Site-wide content shown on every page: navigation bar and locale options. */
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
            'regions' => config('locales.regions'),
            'languages' => config('locales.languages'),
            'currencies' => Currency::orderBy('sort')->get(['code', 'name', 'symbol', 'rate'])->toArray(),
            'charge_currency' => config('shop.currency'),
        ]]);
    }
}
