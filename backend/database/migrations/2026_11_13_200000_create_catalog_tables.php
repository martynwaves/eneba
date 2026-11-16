<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Trigram matching powers typo-tolerant and partial-name search.
        DB::statement('CREATE EXTENSION IF NOT EXISTS pg_trgm');

        Schema::create('platforms', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');            // Shown in filters, e.g. "Steam"
            $table->string('device_label');    // Shown in titles, e.g. "PC", "PS5"
            $table->string('key_label');       // Shown in titles, e.g. "Steam Key"
            $table->string('family');          // pc | playstation | xbox | nintendo | other
            $table->string('activation_url')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('regions', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');            // "GLOBAL", "EUROPE", ...
            $table->string('description')->nullable();
            $table->string('color', 9)->default('#23c299'); // label colour on product cards
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('genres', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->string('icon_url')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->timestamps();
        });

        Schema::create('sellers', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('name');
            $table->decimal('rating', 4, 2)->default(0);       // 0-10 like Eneba
            $table->unsignedInteger('rating_count')->default(0);
            $table->unsignedInteger('sales_count')->default(0);
            $table->boolean('is_verified')->default(false);
            $table->string('avatar_color', 9)->default('#5825cc');
            $table->string('country_code', 2)->nullable();
            $table->timestamps();
        });

        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->string('base_title');
            $table->string('type')->index();                 // game | dlc | gift_card | egift_card | e_money | subscription | game_points | software
            $table->string('brand')->nullable()->index();    // storefront brand, e.g. "netflix", "steam", "eneba"
            $table->foreignId('platform_id')->constrained()->cascadeOnDelete();
            $table->foreignId('region_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('steam_app_id')->nullable()->index();
            $table->text('short_description')->nullable();
            $table->text('description')->nullable();
            $table->string('developer')->nullable();
            $table->string('publisher')->nullable();
            $table->date('release_date')->nullable()->index();
            $table->boolean('coming_soon')->default(false)->index(); // announced, not yet released
            $table->string('release_label')->nullable();             // e.g. "2027", "To be announced"
            $table->string('cover_url')->nullable();
            $table->string('header_url')->nullable();
            // Tile art for products without box art (gift cards, top-ups): {brand, label, sublabel}
            $table->jsonb('art')->nullable();
            $table->jsonb('screenshots')->nullable();
            $table->jsonb('requirements')->nullable();
            $table->jsonb('operating_systems')->nullable();
            $table->jsonb('features')->nullable();
            $table->unsignedSmallInteger('metacritic')->nullable();
            $table->unsignedInteger('msrp_cents')->nullable();
            // Denormalised offer summary, refreshed whenever offers or stock change.
            $table->unsignedInteger('min_price_cents')->nullable()->index();
            $table->unsignedInteger('offers_count')->default(0);
            $table->unsignedInteger('stock')->default(0);
            $table->unsignedTinyInteger('cashback_percent')->default(0); // of the cheapest offer
            $table->unsignedInteger('sales_count')->default(0)->index();
            $table->decimal('rating_avg', 3, 2)->default(0);
            $table->unsignedInteger('rating_count')->default(0);
            $table->string('search_aliases')->nullable();     // abbreviations, e.g. "gta 5 gtav"
            $table->text('search_text');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        DB::statement('CREATE INDEX products_search_text_trgm ON products USING gin (search_text gin_trgm_ops)');

        Schema::create('genre_product', function (Blueprint $table) {
            $table->foreignId('genre_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->primary(['genre_id', 'product_id']);
        });

        Schema::create('offers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('seller_id')->constrained()->cascadeOnDelete();
            $table->unsignedInteger('price_cents');
            $table->unsignedInteger('stock')->default(0);   // available keys, denormalised
            $table->unsignedTinyInteger('cashback_percent')->default(0); // credited to the buyer's wallet
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            $table->unique(['product_id', 'seller_id']);
            $table->index(['product_id', 'is_active', 'price_cents']);
        });

        Schema::create('product_keys', function (Blueprint $table) {
            $table->id();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->text('code');                              // encrypted at rest
            $table->string('status')->default('available');    // available | reserved | sold
            $table->unsignedBigInteger('order_item_id')->nullable()->index();
            $table->timestamp('reserved_until')->nullable();
            $table->timestamp('revealed_at')->nullable();
            $table->timestamps();
            $table->index(['offer_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('product_keys');
        Schema::dropIfExists('offers');
        Schema::dropIfExists('genre_product');
        Schema::dropIfExists('products');
        Schema::dropIfExists('sellers');
        Schema::dropIfExists('genres');
        Schema::dropIfExists('regions');
        Schema::dropIfExists('platforms');
    }
};
