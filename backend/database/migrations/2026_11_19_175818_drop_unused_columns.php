<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Columns that nothing reads: the API never returned them, or the storefront never showed them. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn(['short_description', 'features', 'metacritic', 'release_label']));
        Schema::table('sellers', fn (Blueprint $table) => $table->dropColumn(['sales_count', 'country_code']));
        Schema::table('banners', fn (Blueprint $table) => $table->dropColumn(['eyebrow', 'cta_label', 'accent_color']));
        Schema::table('shortcuts', fn (Blueprint $table) => $table->dropColumn('icon'));
    }

    public function down(): void
    {
        Schema::table('shortcuts', fn (Blueprint $table) => $table->string('icon')->nullable());
        Schema::table('banners', function (Blueprint $table) {
            $table->string('eyebrow')->nullable();
            $table->string('cta_label')->nullable();
            $table->string('accent_color', 9)->nullable();
        });
        Schema::table('sellers', function (Blueprint $table) {
            $table->unsignedInteger('sales_count')->default(0);
            $table->string('country_code', 2)->nullable();
        });
        Schema::table('products', function (Blueprint $table) {
            $table->text('short_description')->nullable();
            $table->jsonb('features')->nullable();
            $table->unsignedSmallInteger('metacritic')->nullable();
            $table->string('release_label')->nullable();
        });
    }
};
