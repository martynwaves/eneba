<?php

namespace App\Services\Commerce;

use App\Models\DiscountCode;
use App\Services\Payments\PaymentGateway;

/**
 * Validates discount codes and works out what they take off an order. A discount never brings
 * a total below the smallest amount a card can be charged.
 */
class DiscountService
{
    /**
     * @return array{code: ?string, discount: int, error: ?string}
     */
    public function evaluate(?string $code, int $subtotalCents, int $feeCents = 0): array
    {
        $code = $code !== null ? strtoupper(trim($code)) : '';
        if ($code === '') {
            return ['code' => null, 'discount' => 0, 'error' => null];
        }

        $discountCode = DiscountCode::where('code', $code)->first();
        if (! $discountCode || ! $discountCode->isUsable()) {
            return ['code' => null, 'discount' => 0, 'error' => 'This discount code is not valid.'];
        }

        if ($subtotalCents < $discountCode->min_subtotal_cents) {
            $minimum = number_format($discountCode->min_subtotal_cents / 100, 2);

            return ['code' => null, 'discount' => 0, 'error' => "This code needs an order of at least €{$minimum}."];
        }

        // Nothing purchasable in the cart (every line sold out) leaves the code applied at €0.
        $discount = min($discountCode->discountFor($subtotalCents), max(0, $subtotalCents + $feeCents - PaymentGateway::MIN_CHARGE_CENTS));

        return ['code' => $discountCode->code, 'discount' => $discount, 'error' => null];
    }
}
