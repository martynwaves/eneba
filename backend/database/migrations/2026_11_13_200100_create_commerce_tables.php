<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cart_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->constrained()->cascadeOnDelete();
            $table->unsignedSmallInteger('quantity')->default(1);
            $table->timestamps();
            $table->unique(['user_id', 'offer_id']);
        });

        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('number')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('status')->default('pending')->index(); // pending | paid | failed | expired | cancelled | refunded
            $table->string('currency', 3)->default('EUR');
            $table->unsignedInteger('subtotal_cents');
            $table->unsignedInteger('service_fee_cents')->default(0);
            $table->unsignedInteger('total_cents');
            $table->string('payment_provider');               // stripe | simulated | wallet
            $table->string('payment_reference')->nullable()->index();
            $table->timestamp('paid_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::create('order_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('order_id')->constrained()->cascadeOnDelete();
            $table->foreignId('offer_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('product_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('seller_id')->nullable()->constrained()->nullOnDelete();
            // Snapshot of what was bought, so history survives catalog changes.
            $table->string('product_title');
            $table->string('product_slug');
            $table->string('cover_url')->nullable();
            $table->string('platform_name');
            $table->string('region_name');
            $table->string('seller_name');
            $table->unsignedInteger('unit_price_cents');
            $table->unsignedTinyInteger('cashback_percent')->default(0);
            $table->unsignedSmallInteger('quantity');
            $table->timestamps();
        });

        Schema::table('product_keys', function (Blueprint $table) {
            $table->foreign('order_item_id')->references('id')->on('order_items')->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('product_keys', fn (Blueprint $table) => $table->dropForeign(['order_item_id']));
        Schema::dropIfExists('order_items');
        Schema::dropIfExists('orders');
        Schema::dropIfExists('cart_items');
    }
};
