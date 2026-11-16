<?php

namespace App\Services\Payments;

final readonly class PaymentIntentData
{
    public function __construct(
        public string $reference,
        public string $clientSecret,
    ) {}
}
