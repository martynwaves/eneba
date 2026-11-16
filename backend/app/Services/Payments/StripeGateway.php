<?php

namespace App\Services\Payments;

use App\Models\Order;
use Stripe\StripeClient;

/** Stripe in test mode: PaymentIntents confirmed by Stripe's Payment Element in the browser. */
class StripeGateway implements PaymentGateway
{
    public function __construct(private StripeClient $stripe) {}

    public function driver(): string
    {
        return 'stripe';
    }

    public function createIntent(Order $order): PaymentIntentData
    {
        $intent = $this->stripe->paymentIntents->create([
            'amount' => $order->cardAmountCents(),
            'currency' => strtolower($order->currency),
            // Methods come from the Stripe dashboard; the checkout confirms with Stripe's card field.
            'automatic_payment_methods' => ['enabled' => true, 'allow_redirects' => 'never'],
            'description' => "Eneba order {$order->number}",
            'metadata' => [
                'order_number' => $order->number,
                'user_id' => (string) $order->user_id,
            ],
        ], ['idempotency_key' => 'order-'.$order->number]);

        return new PaymentIntentData($intent->id, $intent->client_secret);
    }

    public function resume(Order $order): ?PaymentIntentData
    {
        $intent = $this->stripe->paymentIntents->retrieve($order->payment_reference);

        return in_array($intent->status, ['requires_payment_method', 'requires_confirmation', 'requires_action'], true)
            ? new PaymentIntentData($intent->id, $intent->client_secret)
            : null;
    }

    public function status(Order $order): string
    {
        $intent = $this->stripe->paymentIntents->retrieve($order->payment_reference);

        return match ($intent->status) {
            'succeeded' => self::SUCCEEDED,
            'processing' => self::PROCESSING,
            'requires_action', 'requires_confirmation' => self::REQUIRES_ACTION,
            'canceled' => self::CANCELED,
            default => self::REQUIRES_PAYMENT_METHOD,
        };
    }

    public function updateAmount(Order $order, int $amountCents): void
    {
        $this->stripe->paymentIntents->update($order->payment_reference, ['amount' => $amountCents]);
    }

    public function cancel(Order $order): void
    {
        $intent = $this->stripe->paymentIntents->retrieve($order->payment_reference);
        if (in_array($intent->status, ['requires_payment_method', 'requires_confirmation', 'requires_action'], true)) {
            $this->stripe->paymentIntents->cancel($order->payment_reference);
        }
    }

    public function refund(Order $order): void
    {
        $this->stripe->refunds->create(['payment_intent' => $order->payment_reference]);
    }
}
