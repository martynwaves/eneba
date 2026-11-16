<?php

return [
    'currency' => 'EUR',

    // Optional flat service fee per order (Eneba currently shows none: "--").
    'service_fee_cents' => (int) env('SHOP_SERVICE_FEE_CENTS', 0),

    // How long keys stay reserved for a pending order before they return to stock.
    'reservation_minutes' => (int) env('SHOP_RESERVATION_MINUTES', 30),

    'max_quantity_per_item' => 10,

    // "stripe" when STRIPE_SECRET is set, otherwise the built-in simulated provider.
    'payment_driver' => env('PAYMENT_DRIVER', env('STRIPE_SECRET') ? 'stripe' : 'simulated'),
];
