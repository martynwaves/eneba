<?php

namespace App\Services\Commerce;

use RuntimeException;

/**
 * A paid order that can't be delivered: its keys sold out before a very late payment arrived,
 * or the wallet balance it relied on has been spent. OrderFulfillment refunds these.
 */
class UndeliverableOrder extends RuntimeException {}
