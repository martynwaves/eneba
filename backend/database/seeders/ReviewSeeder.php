<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ReviewSeeder extends Seeder
{
    public function run(): void
    {
        mt_srand(42);
        $data = require database_path('data/catalog.php');
        $snippets = $data['review_snippets'];
        $names = $data['reviewer_names'];
        $rows = [];

        Product::query()->orderBy('id')->each(function (Product $product) use (&$rows, $snippets, $names) {
            $count = $product->sales_count > 6000 ? mt_rand(3, 12) : mt_rand(0, 4);
            for ($i = 0; $i < $count; $i++) {
                $roll = mt_rand(1, 100);
                $rating = $roll <= 68 ? 5 : ($roll <= 90 ? 4 : ($roll <= 97 ? 3 : 2));
                $date = now()->subDays(mt_rand(1, 700))->subMinutes(mt_rand(0, 1440));
                $rows[] = [
                    'product_id' => $product->id,
                    'author_name' => $names[array_rand($names)],
                    'rating' => $rating,
                    'body' => $snippets[$rating][array_rand($snippets[$rating])],
                    'is_verified_purchase' => mt_rand(1, 100) <= 80,
                    'created_at' => $date,
                    'updated_at' => $date,
                ];
            }
        });

        foreach (array_chunk($rows, 500) as $chunk) {
            DB::table('reviews')->insert($chunk);
        }

        Product::query()->each(fn (Product $p) => $p->refreshRating());
    }
}
