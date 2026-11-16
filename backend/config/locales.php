<?php

/*
 * Options for the "Update your settings" popup. Flags use Eneba's round flag artwork:
 * https://static.eneba.games/flags/lang/v2/{flag}.svg
 */
return [
    'default_region' => 'lithuania',

    // `regions` lists the product regions a key must have to be redeemable there.
    'regions' => array_map(
        fn (array $r) => ['code' => $r[0], 'name' => $r[1], 'flag' => $r[0], 'product_regions' => $r[2]],
        [
            ['global', 'Global', ['global']],
            ['south_america', 'LATAM', ['global', 'rest-of-world']],
            ['europe', 'Europe', ['global', 'europe']],
            ['middle_east', 'Middle East', ['global', 'rest-of-world']],
            ['argentina', 'Argentina', ['global', 'rest-of-world']],
            ['australia', 'Australia', ['global', 'rest-of-world']],
            ['austria', 'Austria', ['global', 'europe']],
            ['belgium', 'Belgium', ['global', 'europe']],
            ['brazil', 'Brazil', ['global', 'rest-of-world']],
            ['bulgaria', 'Bulgaria', ['global', 'europe']],
            ['canada', 'Canada', ['global', 'north-america']],
            ['croatia', 'Croatia', ['global', 'europe']],
            ['cyprus', 'Cyprus', ['global', 'europe']],
            ['czech_republic', 'Czech Republic', ['global', 'europe']],
            ['denmark', 'Denmark', ['global', 'europe']],
            ['finland', 'Finland', ['global', 'europe']],
            ['france', 'France', ['global', 'europe']],
            ['germany', 'Germany', ['global', 'europe']],
            ['greece', 'Greece', ['global', 'europe']],
            ['hungary', 'Hungary', ['global', 'europe']],
            ['india', 'India', ['global', 'rest-of-world']],
            ['ireland', 'Ireland', ['global', 'europe']],
            ['italy', 'Italy', ['global', 'europe']],
            ['japan', 'Japan', ['global', 'rest-of-world']],
            ['latvia', 'Latvia', ['global', 'europe']],
            ['lithuania', 'Lithuania', ['global', 'europe']],
            ['mexico', 'Mexico', ['global', 'rest-of-world']],
            ['netherlands', 'Netherlands', ['global', 'europe']],
            ['norway', 'Norway', ['global', 'europe']],
            ['poland', 'Poland', ['global', 'europe']],
            ['portugal', 'Portugal', ['global', 'europe']],
            ['romania', 'Romania', ['global', 'europe']],
            ['serbia', 'Serbia', ['global', 'europe']],
            ['slovakia', 'Slovakia', ['global', 'europe']],
            ['slovenia', 'Slovenia', ['global', 'europe']],
            ['spain', 'Spain', ['global', 'europe']],
            ['sweden', 'Sweden', ['global', 'europe']],
            ['switzerland', 'Switzerland', ['global', 'europe']],
            ['turkey', 'Turkey', ['global', 'rest-of-world']],
            ['ukraine', 'Ukraine', ['global', 'rest-of-world']],
            ['united_kingdom', 'United Kingdom', ['global', 'europe', 'united-kingdom']],
            ['united_states', 'United States', ['global', 'north-america', 'united-states']],
        ],
    ),

    // The storefront is written in English; these variants only change regional wording.
    'languages' => [
        ['code' => 'en-EU', 'name' => 'English EU'],
        ['code' => 'en-GB', 'name' => 'English UK'],
        ['code' => 'en-US', 'name' => 'English US'],
        ['code' => 'en-CA', 'name' => 'English CA'],
        ['code' => 'en-AU', 'name' => 'English AU'],
    ],
];
