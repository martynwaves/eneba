<?php

namespace App\Services\Homepage\Providers;

use App\Models\HomepageBlock;
use App\Models\Shortcut;
use App\Models\User;
use App\Services\Homepage\BlockProvider;

/** Source: the `shortcuts` table (the category quick links under the hero). */
class ShortcutsProvider implements BlockProvider
{
    public function data(HomepageBlock $block, ?User $user): array
    {
        return [
            'items' => Shortcut::where('is_active', true)
                ->orderBy('sort')
                ->get(['id', 'label', 'icon_svg', 'link_url'])
                ->toArray(),
        ];
    }

    public function cacheable(?User $user): bool
    {
        return true;
    }
}
