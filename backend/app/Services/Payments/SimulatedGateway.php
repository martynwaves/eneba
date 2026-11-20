<?php

namespace App\Services\Payments;

use App\Models\Order;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

/**
 * Stand-in provider used when no Stripe keys are configured (and in tests). The browser
 * never sends card details here, only the outcome picked from Stripe-style test cards.
 */
class SimulatedGateway implements PaymentGateway
{
    public function driver(): string
    {
        return 'simulated';
    }

    public function createIntent(Order $order): PaymentIntentData
    {
        $reference = 'sim_'.Str::random(24);
        Cache::put($this->key($reference), self::REQUIRES_PAYMENT_METHOD, now()->addDay());

        return new PaymentIntentData($reference, $reference.'_secret_'.Str::random(16));
    }

    /** Apply the outcome of the simulated card form: "success" or "decline". */
    public function simulate(Order $order, string $outcome): void
    {
        Cache::put(
            $this->key($order->payment_reference),
            $outcome === 'success' ? self::SUCCEEDED : self::REQUIRES_PAYMENT_METHOD,
            now()->addDay(),
        );
    }

    public function resume(Order $order): ?PaymentIntentData
    {
        return $this->status($order) === self::REQUIRES_PAYMENT_METHOD
            ? new PaymentIntentData($order->payment_reference, $order->payment_reference.'_secret_resumed')
            : null;
    }

    public function status(Order $order): string
    {
        return Cache::get($this->key($order->payment_reference), self::REQUIRES_PAYMENT_METHOD);
    }

    public function updateAmount(Order $order, int $amountCents): void
    {
        // Nothing to update: the simulated card form only reports an outcome.
    }

    public function cancel(Order $order): void
    {
        Cache::put($this->key($order->payment_reference), self::CANCELED, now()->addDay());
    }

    public function refund(Order $order, ?int $amountCents = null, ?string $idempotencyKey = null): void
    {
        // No money moves in the simulator; a full refund just forgets the payment.
        if ($amountCents === null) {
            Cache::forget($this->key($order->payment_reference));
        }
    }

    private function key(string $reference): string
    {
        return "simulated-payment:{$reference}";
    }
}
