<?php

namespace Database\Factories;

use App\Models\DiscountCode;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DiscountCode>
 */
class DiscountCodeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'code' => strtoupper(fake()->unique()->bothify('SAVE##??')),
            'type' => 'percent',
            'value' => 10,
            'min_subtotal_cents' => 0,
            'max_discount_cents' => null,
            'is_active' => true,
            'expires_at' => null,
        ];
    }

    /** A flat amount off, in cents. */
    public function fixed(int $cents): static
    {
        return $this->state(['type' => 'fixed', 'value' => $cents]);
    }

    public function expired(): static
    {
        return $this->state(['expires_at' => now()->subDay()]);
    }
}
