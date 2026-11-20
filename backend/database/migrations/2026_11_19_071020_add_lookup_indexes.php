<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PostgreSQL doesn't index foreign keys by itself. These cover the lookups the API makes on
 * every order, product and wishlist view, and enforce one review per buyer per product
 * (reviews without an account, like the seeded ones, have no user and are not limited).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->index(['user_id', 'status']));
        Schema::table('order_items', function (Blueprint $table) {
            $table->index('order_id');
            $table->index('product_id');
        });
        Schema::table('genre_product', fn (Blueprint $table) => $table->index('product_id'));
        Schema::table('wishlist_items', fn (Blueprint $table) => $table->index('product_id'));
        Schema::table('reviews', fn (Blueprint $table) => $table->unique(['product_id', 'user_id']));
    }

    public function down(): void
    {
        Schema::table('reviews', fn (Blueprint $table) => $table->dropUnique(['product_id', 'user_id']));
        Schema::table('wishlist_items', fn (Blueprint $table) => $table->dropIndex(['product_id']));
        Schema::table('genre_product', fn (Blueprint $table) => $table->dropIndex(['product_id']));
        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['order_id']);
            $table->dropIndex(['product_id']);
        });
        Schema::table('orders', fn (Blueprint $table) => $table->dropIndex(['user_id', 'status']));
    }
};
