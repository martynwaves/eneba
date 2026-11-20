<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Many trailer thumbnails pointed at a 600x337 still that newer Steam trailers don't have, so the
 * product page showed a broken image. steam-extras.json now has working URLs; this copies them
 * onto databases that were seeded before the fix (a fresh database is seeded with them already).
 * There is nothing to roll back: the old URLs were broken.
 */
return new class extends Migration
{
    public function up(): void
    {
        $extras = json_decode(file_get_contents(database_path('data/steam-extras.json')), true, flags: JSON_THROW_ON_ERROR);

        foreach ($extras as $appId => $extra) {
            if (isset($extra['trailer']['hls'])) {
                DB::table('products')->where('steam_app_id', (int) $appId)->update(['trailer' => json_encode($extra['trailer'])]);
            }
        }
    }
};
