<?php

namespace App\Support;

/** Generates realistic-looking (but fake) activation codes in each storefront's format. */
class KeyGenerator
{
    private const ALPHABET = 'ABCDEFGHJKLMNPQRSTVWXYZ23456789';

    public static function for(string $family): string
    {
        return match ($family) {
            'playstation' => self::groups(3, 4),
            'xbox' => self::groups(5, 5),
            'nintendo' => self::groups(4, 4),
            default => self::groups(3, 5),
        };
    }

    private static function groups(int $groups, int $length): string
    {
        $parts = [];
        for ($g = 0; $g < $groups; $g++) {
            $part = '';
            for ($i = 0; $i < $length; $i++) {
                $part .= self::ALPHABET[random_int(0, strlen(self::ALPHABET) - 1)];
            }
            $parts[] = $part;
        }

        return implode('-', $parts);
    }
}
