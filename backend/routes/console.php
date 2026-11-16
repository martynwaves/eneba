<?php

use App\Models\Product;
use App\Services\Commerce\StockService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('shop:sweep', function (StockService $stock) {
    $count = $stock->sweepExpired();
    $this->info("Expired {$count} abandoned order(s).");
})->purpose('Expire abandoned checkouts and return their reserved keys to stock');

Schedule::command('shop:sweep')->everyFiveMinutes();

/*
 * Used by the Docker entrypoint on every deploy: migrate, and seed the demo catalog
 * only when the database is still empty (so redeploys never wipe orders or accounts).
 */
Artisan::command('app:bootstrap', function () {
    $this->call('migrate', ['--force' => true]);

    if (Product::query()->doesntExist()) {
        $this->info('Empty catalog - seeding demo data...');
        $this->call('db:seed', ['--force' => true]);
    }
})->purpose('Run migrations and seed demo data on first deploy');
