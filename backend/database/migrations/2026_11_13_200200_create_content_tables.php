<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Content source for the homepage hero block: each promo has a wide and a narrow image.
        Schema::create('banners', function (Blueprint $table) {
            $table->id();
            $table->string('placement')->index();   // hero
            $table->string('eyebrow')->nullable();
            $table->string('title');
            $table->string('subtitle')->nullable();
            $table->string('image_url');            // wide (expanded) artwork
            $table->string('image_narrow_url')->nullable(); // narrow (collapsed) artwork
            $table->string('cta_label')->nullable();
            $table->string('link_url');
            $table->string('accent_color', 9)->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->timestamps();
        });

        // Content source for the category shortcut strip.
        Schema::create('shortcuts', function (Blueprint $table) {
            $table->id();
            $table->string('label');
            $table->string('icon');                 // icon key, used when no SVG is stored
            $table->text('icon_svg')->nullable();   // monochrome SVG drawn with currentColor
            $table->string('link_url');
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Layout of the homepage: which blocks, in which order, fed by which provider.
        Schema::create('homepage_blocks', function (Blueprint $table) {
            $table->id();
            $table->string('key')->unique();
            $table->string('type');                 // hero | shortcuts | product_carousel | product_grid | promo_strip
            $table->string('source');               // provider that supplies the block's data
            $table->string('title')->nullable();
            $table->string('subtitle')->nullable();
            $table->string('link_url')->nullable();
            $table->jsonb('config')->nullable();
            $table->unsignedSmallInteger('sort')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('reviews', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();
            $table->string('author_name');
            $table->unsignedTinyInteger('rating');
            $table->text('body');
            $table->boolean('is_verified_purchase')->default(false);
            $table->timestamps();
            $table->index(['product_id', 'created_at']);
        });

        Schema::create('wishlist_items', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('product_id')->constrained()->cascadeOnDelete();
            $table->timestamp('created_at')->useCurrent();
            $table->primary(['user_id', 'product_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('wishlist_items');
        Schema::dropIfExists('reviews');
        Schema::dropIfExists('homepage_blocks');
        Schema::dropIfExists('shortcuts');
        Schema::dropIfExists('banners');
    }
};
