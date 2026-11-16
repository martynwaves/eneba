<?php

namespace App\Models;

use Database\Factories\DiscountCodeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DiscountCode extends Model
{
    /** @use HasFactory<DiscountCodeFactory> */
    use HasFactory;

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'expires_at' => 'datetime',
        ];
    }

    public function isUsable(): bool
    {
        return $this->is_active && ($this->expires_at === null || $this->expires_at->isFuture());
    }

    /** Human-readable terms, e.g. "15% off orders of €50+, up to €30". */
    public function summary(): string
    {
        $euros = fn (int $cents): string => '€'.number_format($cents / 100, $cents % 100 === 0 ? 0 : 2);

        return ($this->type === 'percent' ? "{$this->value}% off" : $euros($this->value).' off')
            .($this->min_subtotal_cents > 0 ? ' orders of '.$euros($this->min_subtotal_cents).'+' : '')
            .($this->max_discount_cents !== null ? ', up to '.$euros($this->max_discount_cents) : '');
    }

    /** Discount in cents for a given subtotal (0 when the minimum isn't met). */
    public function discountFor(int $subtotalCents): int
    {
        if ($subtotalCents < $this->min_subtotal_cents) {
            return 0;
        }

        $discount = $this->type === 'percent'
            ? intdiv($subtotalCents * $this->value, 100)
            : $this->value;

        if ($this->max_discount_cents !== null) {
            $discount = min($discount, $this->max_discount_cents);
        }

        return min($discount, $subtotalCents);
    }
}
