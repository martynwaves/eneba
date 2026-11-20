<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** The deals newsletter was removed: nothing ever sent it, so the sign-ups only stored addresses. */
return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('newsletter_subscribers');
    }

    public function down(): void
    {
        Schema::create('newsletter_subscribers', function (Blueprint $table) {
            $table->id();
            $table->string('email')->unique();
            $table->timestamps();
        });
    }
};
