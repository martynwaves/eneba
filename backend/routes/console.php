<?php

use App\Models\Order;
use App\Models\Product;
use App\Models\User;
use App\Services\Commerce\StockService;
use Database\Seeders\DatabaseSeeder;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schedule;

Artisan::command('shop:sweep', function (StockService $stock) {
    $count = $stock->sweepExpired();
    $this->info("Expired {$count} abandoned order(s).");
})->purpose('Expire abandoned checkouts and return their reserved keys to stock');

Schedule::command('shop:sweep')->everyFiveMinutes();

/*
 * Used by the Docker entrypoint on every boot: migrate, and seed the demo catalog only when the
 * database is still empty (so redeploys never wipe orders or accounts).
 */
Artisan::command('app:bootstrap', function () {
    $this->call('migrate', ['--force' => true]);

    // A first-boot seed that was cut off leaves products behind but never reaches its last step
    // (the demo account). With no orders yet there is nothing to lose, so start that database over.
    $interrupted = Product::query()->exists()
        && User::where('email', DatabaseSeeder::DEMO_EMAIL)->doesntExist()
        && Order::query()->doesntExist();
    if ($interrupted) {
        $this->warn('Found an interrupted demo seed - resetting the database...');
        $this->call('migrate:fresh', ['--force' => true]);
    }

    if (Product::query()->doesntExist()) {
        $this->info('Empty catalog - seeding demo data...');
        // All or nothing: a restart mid-seed rolls back instead of leaving half a catalog.
        DB::transaction(fn () => $this->call('db:seed', ['--force' => true]));
        $this->info('Demo data ready.');
    }
})->purpose('Run migrations and seed demo data on first deploy');
