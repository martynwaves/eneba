<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            CatalogSeeder::class,
            ContentSeeder::class,
            ReviewSeeder::class,
        ]);

        // Demo account for reviewers (also documented in the README).
        User::firstOrCreate(
            ['email' => 'demo@eneba.test'],
            ['name' => 'Demo Gamer', 'password' => 'demo12345'],
        );
    }
}
