<?php

namespace App\Providers;

use App\Services\Payments\PaymentGateway;
use App\Services\Payments\SimulatedGateway;
use App\Services\Payments\StripeGateway;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\ServiceProvider;
use Stripe\StripeClient;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Stripe test mode when keys are configured, otherwise the simulated provider.
        $this->app->singleton(PaymentGateway::class, function () {
            return config('shop.payment_driver') === 'stripe'
                ? new StripeGateway(new StripeClient((string) config('services.stripe.secret')))
                : new SimulatedGateway;
        });
    }

    public function boot(): void
    {
        JsonResource::withoutWrapping();

        RateLimiter::for('auth', fn (Request $request) => Limit::perMinute(10)->by($request->ip()));
        RateLimiter::for('search', fn (Request $request) => Limit::perMinute(120)->by($request->ip()));
        RateLimiter::for('checkout', fn (Request $request) => Limit::perMinute(10)->by($request->user()?->id ?: $request->ip()));
    }
}
