<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * System requirements describe the PC version of a game. Importing steam-extras.json had also
 * given console editions (PSN, Xbox, Nintendo) their game's Windows/Mac requirements, so those
 * product pages listed PC specs; this clears them. The Windows-only `requirements` column goes
 * as well: `platform_requirements` holds the same text per OS. A PC row that somehow only has
 * the old column is copied over first, so nothing is lost. Rolling back brings the column back
 * empty.
 */
return new class extends Migration
{
    public function up(): void
    {
        $pcPlatforms = DB::table('platforms')->where('family', 'pc')->select('id');

        DB::table('products')
            ->whereIn('platform_id', $pcPlatforms)
            ->whereNotNull('requirements')
            ->where(fn ($query) => $query->whereNull('platform_requirements')->orWhereRaw("platform_requirements::text in ('{}', '[]')"))
            ->update(['platform_requirements' => DB::raw("json_build_object('windows', requirements)")]);

        DB::table('products')->whereNotIn('platform_id', $pcPlatforms)->update(['platform_requirements' => null]);

        Schema::table('products', fn (Blueprint $table) => $table->dropColumn('requirements'));
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->jsonb('requirements')->nullable());
    }
};
