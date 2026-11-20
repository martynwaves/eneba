<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Buyers can refund keys they haven't revealed; these record how much and how many. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            // Money returned so far, card share first, then the wallet share.
            $table->unsignedInteger('refunded_cents')->default(0);
        });
        Schema::table('order_items', function (Blueprint $table) {
            $table->unsignedSmallInteger('refunded_quantity')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('order_items', fn (Blueprint $table) => $table->dropColumn('refunded_quantity'));
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn('refunded_cents'));
    }
};
