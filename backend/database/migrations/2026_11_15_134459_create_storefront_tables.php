<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Header navigation bar items.
        Schema::create('nav_links', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('link_url');
            $table->string('style')->default('default'); // default | menu | highlight
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Brand storefront tiles (e.g. the "Best selling eGift Cards" row).
        Schema::create('brands', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('image_url');
            $table->string('link_url');
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_featured')->default(false);
            $table->timestamps();
        });

        // Display currencies for the region/language/currency settings popup.
        Schema::create('currencies', function (Blueprint $table) {
            $table->id();
            $table->string('code', 3)->unique();
            $table->string('name');
            $table->string('symbol', 8);
            $table->decimal('rate', 14, 6);   // units of this currency per 1 EUR
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->timestamps();
        });

        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('cashback_balance_cents')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('users', fn (Blueprint $table) => $table->dropColumn('cashback_balance_cents'));
        Schema::dropIfExists('newsletter_subscribers');
        Schema::dropIfExists('currencies');
        Schema::dropIfExists('brands');
        Schema::dropIfExists('nav_links');
    }
};
