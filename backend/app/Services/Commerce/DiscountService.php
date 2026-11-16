<?php

namespace App\Services\Commerce;

use App\Models\DiscountCode;

/** Validates discount codes and works out what they take off an order. */
class DiscountService
{
    /** Stripe can't charge less than this, so a discount never brings a total below it. */
    public const MIN_CHARGE_CENTS = 50;

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

        $discount = $discountCode->discountFor($subtotalCents);
        if ($discount === 0) {
            $minimum = number_format($discountCode->min_subtotal_cents / 100, 2);

            return ['code' => null, 'discount' => 0, 'error' => "This code needs an order of at least €{$minimum}."];
        }

        $discount = min($discount, max(0, $subtotalCents + $feeCents - self::MIN_CHARGE_CENTS));

        return ['code' => $discountCode->code, 'discount' => $discount, 'error' => null];
    }
}
