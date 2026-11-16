<?php

namespace App\Console\Commands;

use App\Models\Product;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('catalog:import-steam-extras')]
#[Description('Copy languages, trailers, descriptions and per-OS requirements from database/data/steam-extras.json onto products')]
class ImportSteamExtras extends Command
{
    public function handle(): int
    {
        $path = database_path('data/steam-extras.json');
        if (! is_file($path)) {
            $this->warn('No steam-extras.json found; run database/data/fetch-steam-extras.mjs first.');

            return self::SUCCESS;
        }

        $extras = json_decode(file_get_contents($path), true);
        $updated = 0;

        foreach ($extras as $appId => $extra) {
            $updated += Product::where('steam_app_id', (int) $appId)->update([
                'languages' => json_encode($extra['languages'] ?? []),
                'trailer' => isset($extra['trailer']['hls']) ? json_encode($extra['trailer']) : null,
                'about' => json_encode($extra['about'] ?? []),
                'platform_requirements' => json_encode($extra['requirements'] ?? (object) []),
            ]);
        }

        $this->info("Updated {$updated} products from ".count($extras).' Steam entries.');

        return self::SUCCESS;
    }
}
