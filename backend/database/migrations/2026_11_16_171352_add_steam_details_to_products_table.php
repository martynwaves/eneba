<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->json('languages')->nullable();             // supported interface/subtitle languages
            $table->json('trailer')->nullable();               // {name, thumb, hls}
            $table->json('about')->nullable();                 // [{type: heading|paragraph, text}]
            $table->json('platform_requirements')->nullable(); // {windows|mac|linux: {minimum, recommended}}
        });
    }

    public function down(): void
    {
        Schema::table('products', fn (Blueprint $table) => $table->dropColumn(['languages', 'trailer', 'about', 'platform_requirements']));
    }
};
