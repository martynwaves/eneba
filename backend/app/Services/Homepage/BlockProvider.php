<?php

namespace App\Services\Homepage;

use App\Models\HomepageBlock;
use App\Models\User;

/**
 * Supplies the content of one kind of homepage block. Each provider owns its data source
 * (a table, an aggregate over orders, a filtered product query...), and the frontend only
 * renders whatever the provider returns.
 */
interface BlockProvider
{
    /** @return array<string, mixed> */
    public function data(HomepageBlock $block, ?User $user): array;

    /** Whether the result may be shared between visitors (and cached). */
    public function cacheable(?User $user): bool;
}
