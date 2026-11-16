<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /** Demo account for reviewers (also in the README). Created last, so it marks a finished seed. */
    public const DEMO_EMAIL = 'demo@eneba.test';

    public function run(): void
    {
        $this->call([
            CatalogSeeder::class,
            ContentSeeder::class,
            ReviewSeeder::class,
        ]);

        User::firstOrCreate(
            ['email' => self::DEMO_EMAIL],
            ['name' => 'Demo Gamer', 'password' => 'demo12345'],
        );
    }
}
