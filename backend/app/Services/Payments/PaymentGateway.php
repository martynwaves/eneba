<?php

namespace App\Services\Payments;

use App\Models\Order;

interface PaymentGateway
{
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

    public function refund(Order $order): void;
}
