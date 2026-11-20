<?php

namespace App\Services\Payments;

use App\Models\Order;

interface PaymentGateway
{
    /** Stripe can't charge less than this (50 euro cents), so orders and card shares never go below it. */
    public const MIN_CHARGE_CENTS = 50;

    public const SUCCEEDED = 'succeeded';

    public const PROCESSING = 'processing';

    public const REQUIRES_ACTION = 'requires_action';

    public const REQUIRES_PAYMENT_METHOD = 'requires_payment_method';

    public const CANCELED = 'canceled';

    public function driver(): string;

    /** Start a payment for the order; returns the provider reference and the client secret. */
    public function createIntent(Order $order): PaymentIntentData;

    /** The open payment's details again if it can still be paid, otherwise null. */
    public function resume(Order $order): ?PaymentIntentData;

    /** Current provider-side status, normalised to the constants above. */
    public function status(Order $order): string;

    /** Change what the open payment will charge (e.g. after part of it moves to the wallet). */
    public function updateAmount(Order $order, int $amountCents): void;

    public function cancel(Order $order): void;

    /**
     * Refund the order's card payment: all of it, or `$amountCents` of it. A retry with the
     * same `$idempotencyKey` never refunds twice.
     */
    public function refund(Order $order, ?int $amountCents = null, ?string $idempotencyKey = null): void;
}
