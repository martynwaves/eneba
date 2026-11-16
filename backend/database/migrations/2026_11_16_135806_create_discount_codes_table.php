<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('discount_codes', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();               // stored upper-case
            $table->string('type');                         // percent | fixed
            $table->unsignedInteger('value');               // percent (10 = 10%) or cents
            $table->unsignedInteger('min_subtotal_cents')->default(0);
            $table->unsignedInteger('max_discount_cents')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('discount_code')->nullable();
            $table->unsignedInteger('discount_cents')->default(0);
        });
    }

    public function down(): void
    {
        Schema::table('orders', fn (Blueprint $table) => $table->dropColumn(['discount_code', 'discount_cents']));
        Schema::dropIfExists('discount_codes');
    }
};
