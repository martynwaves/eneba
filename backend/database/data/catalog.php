<?php

/*
 * Static reference data for the demo catalog. Game details (names, art, genres, prices)
 * come from games.json, which fetch-steam.mjs builds from Steam's public store API.
 */
return [
    'platforms' => [
        ['slug' => 'steam', 'name' => 'Steam', 'device_label' => 'PC', 'key_label' => 'Steam Key', 'family' => 'pc', 'activation_url' => 'https://store.steampowered.com/account/registerkey'],
        ['slug' => 'psn', 'name' => 'PSN', 'device_label' => 'PS5', 'key_label' => 'PSN Key', 'family' => 'playstation', 'activation_url' => 'https://store.playstation.com/redeem'],
        ['slug' => 'xbox-live', 'name' => 'Xbox Live', 'device_label' => 'Xbox Series X|S', 'key_label' => 'XBOX LIVE Key', 'family' => 'xbox', 'activation_url' => 'https://redeem.microsoft.com'],
        ['slug' => 'nintendo-eshop', 'name' => 'Nintendo eShop', 'device_label' => 'Nintendo Switch', 'key_label' => 'Nintendo eShop Key', 'family' => 'nintendo', 'activation_url' => 'https://ec.nintendo.com/redeem'],
        ['slug' => 'ea-app', 'name' => 'EA App', 'device_label' => 'PC', 'key_label' => 'EA App Key', 'family' => 'pc', 'activation_url' => 'https://www.ea.com/ea-app'],
        ['slug' => 'ubisoft-connect', 'name' => 'Ubisoft Connect', 'device_label' => 'PC', 'key_label' => 'Ubisoft Connect Key', 'family' => 'pc', 'activation_url' => 'https://store.ubisoft.com'],
        ['slug' => 'rockstar', 'name' => 'Rockstar Games Launcher', 'device_label' => 'PC', 'key_label' => 'Rockstar Games Launcher Key', 'family' => 'pc', 'activation_url' => 'https://socialclub.rockstargames.com/activate'],
        ['slug' => 'gog', 'name' => 'GOG', 'device_label' => 'PC', 'key_label' => 'GOG Key', 'family' => 'pc', 'activation_url' => 'https://www.gog.com/redeem'],
        ['slug' => 'epic-games', 'name' => 'Epic Games', 'device_label' => 'PC', 'key_label' => 'Epic Games Key', 'family' => 'pc', 'activation_url' => 'https://store.epicgames.com/redeem'],
        ['slug' => 'battle-net', 'name' => 'Battle.net', 'device_label' => 'PC', 'key_label' => 'Battle.net Key', 'family' => 'pc', 'activation_url' => 'https://account.battle.net/key'],
        ['slug' => 'microsoft-store', 'name' => 'Microsoft Store', 'device_label' => 'PC', 'key_label' => 'Microsoft Key', 'family' => 'pc', 'activation_url' => 'https://account.microsoft.com/billing/redeem'],
        ['slug' => 'other', 'name' => 'Other', 'device_label' => 'PC', 'key_label' => 'Key', 'family' => 'other', 'activation_url' => null],
    ],

    // Single-country regions are shown in pink on cards, like on Eneba.
    'regions' => [
        ['slug' => 'global', 'name' => 'GLOBAL', 'description' => 'Can be activated worldwide', 'color' => '#23c299'],
        ['slug' => 'europe', 'name' => 'EUROPE', 'description' => 'Can be activated in European countries', 'color' => '#23c299'],
        ['slug' => 'north-america', 'name' => 'NORTH AMERICA', 'description' => 'Can be activated in the United States and Canada', 'color' => '#23c299'],
        ['slug' => 'united-states', 'name' => 'UNITED STATES', 'description' => 'Can be activated in the United States only', 'color' => '#ff5c93'],
        ['slug' => 'united-kingdom', 'name' => 'UNITED KINGDOM', 'description' => 'Can be activated in the United Kingdom only', 'color' => '#ff5c93'],
        ['slug' => 'rest-of-world', 'name' => 'REST OF THE WORLD', 'description' => 'Cannot be activated in Europe or North America', 'color' => '#23c299'],
    ],

    // Eneba's game categories, in the order the homepage shows them.
    'genres' => [
        ['slug' => 'action', 'name' => 'Action', 'icon' => 'action'],
        ['slug' => 'adventure', 'name' => 'Adventure', 'icon' => 'adventure'],
        ['slug' => 'simulation', 'name' => 'Simulation', 'icon' => 'simulation'],
        ['slug' => 'strategy', 'name' => 'Strategy', 'icon' => 'strategy'],
        ['slug' => 'rpg', 'name' => 'RPG', 'icon' => 'rpg'],
        ['slug' => 'indie', 'name' => 'Indie', 'icon' => 'indie'],
        ['slug' => 'fps', 'name' => 'FPS / TPS', 'icon' => 'fps'],
        ['slug' => 'puzzle', 'name' => 'Puzzle', 'icon' => 'puzzle'],
        ['slug' => 'sport', 'name' => 'Sport', 'icon' => 'sport'],
        ['slug' => 'racing', 'name' => 'Racing', 'icon' => 'racing'],
        ['slug' => 'fighting', 'name' => 'Fighting', 'icon' => 'fighting'],
        ['slug' => 'platform', 'name' => 'Platform', 'icon' => 'platform'],
        ['slug' => 'hack-slash', 'name' => 'Hack & Slash', 'icon' => 'hack-slash'],
        ['slug' => 'arcade', 'name' => 'Arcade', 'icon' => 'arcade'],
        ['slug' => 'point-click', 'name' => 'Point & Click', 'icon' => 'point-click'],
        ['slug' => 'mmo', 'name' => 'MMO', 'icon' => 'mmo'],
        ['slug' => 'music', 'name' => 'Music', 'icon' => 'music'],
        ['slug' => 'educational', 'name' => 'Educational', 'icon' => 'educational'],
    ],

    // Steam genre => category slug. Steam genres not listed (Casual, Early Access...) are ignored.
    'steam_genre_map' => [
        'Action' => 'action', 'Adventure' => 'adventure', 'Simulation' => 'simulation', 'Strategy' => 'strategy',
        'RPG' => 'rpg', 'Indie' => 'indie', 'Sports' => 'sport', 'Racing' => 'racing', 'Massively Multiplayer' => 'mmo',
    ],

    // Categories Steam's genre list doesn't express (shooters, fighting games...), by Steam app id.
    'extra_genres' => [
        'fps' => [1091500, 1716740, 553850, 2050650, 1238810, 1517290, 1238840, 1237970, 2369390, 552520, 976730, 1144200,
            1272080, 218620, 1029690, 220, 546560, 550, 2183900, 107410, 1874880, 2807960, 1285190, 3768760, 3010850, 3079210,
            1361210, 3008130, 1196590, 418370, 3764200, 388860, 2439280, 3788800],
        'puzzle' => [620, 400, 1092790, 753640, 2379780, 569860],
        'fighting' => [1364780, 1778820, 1971870, 3787240],
        'platform' => [367520, 1030300, 504230, 268910, 588650],
        'hack-slash' => [1145360, 1145350, 2358720, 2344520, 2694490, 4115450, 2638890, 1113560, 524220, 2627260, 1817230, 814380],
        'arcade' => [1794680, 2379780, 268910],
        'point-click' => [569860, 632470, 1222140],
        'mmo' => [1151340],
        'music' => [1817230, 620980],
        'educational' => [220200, 427520],
    ],

    // Extra popularity for this season's releases, so "Top games" reflects what is new and hot.
    'popularity_boost' => [
        2807960 => 9000, 4348910 => 9500, 4530370 => 9000, 4115450 => 8500, 1030300 => 8000, 1285190 => 7000,
        3764200 => 7000, 2947440 => 5500, 3008130 => 5500, 3768760 => 6000, 2868840 => 6000, 1962700 => 6500,
        3321460 => 5000, 3751260 => 5000, 2638890 => 4500, 2627260 => 4000, 3357650 => 4500, 2075800 => 4000,
    ],

    // Exact storefront/region combinations for titles linked from the navigation and hero.
    'forced_variants' => [
        4530370 => [['steam', 'europe']],                       // FM27
        4348910 => [['steam', 'global']],                       // Probably Stolen
        4115450 => [['steam', 'global'], ['psn', 'europe']],    // Phantom Blade Zero
    ],

    // Games that are not on Steam, using Eneba's own box art.
    'manual_games' => [
        [
            'name' => 'Grand Theft Auto VI', 'aliases' => 'gta 6 gta vi gta6', 'release_date' => '2026-11-19', 'msrp' => 7999,
            'developer' => 'Rockstar Games', 'publisher' => 'Rockstar Games', 'genres' => ['action', 'adventure'],
            'description' => 'Grand Theft Auto VI heads to the state of Leonida, home to the neon-soaked streets of Vice City and beyond, in the biggest, most immersive evolution of the series yet.',
            'variants' => [
                ['psn', 'europe', 'https://imgproxy.eneba.games/h4lHEqYEsvijlRQMATdtQMePjXWzusr34uJMpSsrswY/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy91/c2J3UzdicXN4bTdK/enMwdEp1Mk55bEI4/eTFzazdUMFhQOVRD/SDRUdTRnLmpwZw'],
                ['psn', 'united-kingdom', 'https://imgproxy.eneba.games/h4lHEqYEsvijlRQMATdtQMePjXWzusr34uJMpSsrswY/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy91/c2J3UzdicXN4bTdK/enMwdEp1Mk55bEI4/eTFzazdUMFhQOVRD/SDRUdTRnLmpwZw'],
                ['xbox-live', 'europe', 'https://imgproxy.eneba.games/tujQD7GovFXtDgDqmE1TxJRHuYL-9C0z5ae1P4Mv230/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9R/N0xORWFzT1A2Wi10/eTg5YmRvOXQtVW8x/MjBzQ011eExTWDZ4/RGxYTFE0LmpwZw'],
            ],
        ],
        [
            'name' => 'Grand Theft Auto VI: Ultimate Edition', 'aliases' => 'gta 6 gta vi gta6', 'release_date' => '2026-11-19', 'msrp' => 9999,
            'developer' => 'Rockstar Games', 'publisher' => 'Rockstar Games', 'genres' => ['action', 'adventure'],
            'description' => 'The Ultimate Edition of Grand Theft Auto VI with the base game plus bonus in-game content and early unlocks.',
            'variants' => [
                ['xbox-live', 'global', 'https://imgproxy.eneba.games/U5BkyC-ZPGPAk2ZY4JKgb1m2drx1otPZ3zElHIzSCFM/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9f/U1lfYVVlVDdqOE1n/UzhQcTlTZDZJbEJn/ZzFuVmR1cF9ZYUVv/ZDJZemVnLmM2ZWJi/MjVlLTkxNjctNGZm/Yy1hODRhLWI5NWJm/YzdiODIwYw'],
                ['xbox-live', 'europe', 'https://imgproxy.eneba.games/tgWR1KA3x6Zf0MIGO1mBSEw9kp9zOo5C_mIywKNdziI/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy8t/Unc3anVHT0pvbkdM/YzZYTXMtYTBtenpP/UWR5ZzdSZUtzRmY1/bzJBdDZjLmpwZw'],
            ],
        ],
        [
            'name' => 'Minecraft: Java & Bedrock Edition', 'aliases' => 'mc minecraft java bedrock', 'release_date' => '2011-11-18', 'msrp' => 2999,
            'developer' => 'Mojang Studios', 'publisher' => 'Xbox Game Studios', 'genres' => ['adventure', 'simulation', 'indie'], 'sales_boost' => 30000,
            'description' => 'Explore infinite worlds and build everything from the simplest homes to the grandest castles. Includes both the Java and Bedrock editions for PC.',
            'variants' => [
                ['other', 'global', 'https://imgproxy.eneba.games/HFctKs2s7yb7zhAs0t_IixbCiF7Ewpe_gj15SCBhQMY/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy93/NV9aR2wxaHJ2Unpu/THpTVlhUZW4yUjlZ/eE5SRkd3M0JZUk5Q/UlRQejJFLnBuZw'],
                ['microsoft-store', 'global', 'https://imgproxy.eneba.games/HFctKs2s7yb7zhAs0t_IixbCiF7Ewpe_gj15SCBhQMY/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy93/NV9aR2wxaHJ2Unpu/THpTVlhUZW4yUjlZ/eE5SRkd3M0JZUk5Q/UlRQejJFLnBuZw'],
            ],
        ],
    ],

    'sellers' => [
        ['name' => 'PixelVault', 'rating' => 9.92, 'country_code' => 'LT', 'avatar_color' => '#f15a24'],
        ['name' => 'KeyForge Store', 'rating' => 9.85, 'country_code' => 'PL', 'avatar_color' => '#23c299'],
        ['name' => 'NorthKeys', 'rating' => 9.78, 'country_code' => 'SE', 'avatar_color' => '#3a86ff'],
        ['name' => 'LootLane', 'rating' => 9.71, 'country_code' => 'DE', 'avatar_color' => '#ff006e'],
        ['name' => 'RapidCodes', 'rating' => 9.64, 'country_code' => 'NL', 'avatar_color' => '#fad318'],
        ['name' => 'Level Up Keys', 'rating' => 9.55, 'country_code' => 'ES', 'avatar_color' => '#8338ec'],
        ['name' => 'Arcadia Digital', 'rating' => 9.49, 'country_code' => 'FR', 'avatar_color' => '#06d6a0'],
        ['name' => 'Questly', 'rating' => 9.33, 'country_code' => 'IT', 'avatar_color' => '#ef476f'],
        ['name' => 'CodeCrate', 'rating' => 9.21, 'country_code' => 'CZ', 'avatar_color' => '#118ab2'],
        ['name' => 'Neon Market', 'rating' => 9.05, 'country_code' => 'LV', 'avatar_color' => '#ff9f1c'],
        ['name' => 'Bitwise Games', 'rating' => 8.84, 'country_code' => 'EE', 'avatar_color' => '#2ec4b6'],
        ['name' => 'GG Deals Hub', 'rating' => 8.62, 'country_code' => 'RO', 'avatar_color' => '#e71d36'],
    ],

    // Publisher name fragment => PC platform the key is redeemed on.
    'pc_platform_by_publisher' => [
        'Electronic Arts' => 'ea-app',
        'Ubisoft' => 'ubisoft-connect',
        'Rockstar' => 'rockstar',
        'Blizzard' => 'battle-net',
    ],

    // Extra PC storefront variants for titles that are sold there too.
    'extra_pc_platforms' => [
        'gog' => [292030, 1091500, 1086940, 413150, 367520, 1145360, 504230, 268910, 391540, 588650, 294100, 1771300, 379430],
        'epic-games' => [990080, 2358720, 1174180, 1593500, 1091500, 2208920],
    ],

    // Common abbreviations people type into search, keyed by Steam app id.
    'search_aliases' => [
        271590 => 'gta 5 gta v gtav', 1174180 => 'rdr2 rdr 2', 1086940 => 'bg3', 1091500 => 'cp2077',
        292030 => 'witcher 3 tw3', 2050650 => 're4 resident evil 4', 883710 => 're2', 952060 => 're3', 418370 => 're7',
        1196590 => 're8 village', 1551360 => 'fh5', 1293830 => 'fh4', 1971870 => 'mk1', 1771300 => 'kcd2 kcd 2',
        379430 => 'kcd', 1364780 => 'sf6', 2669320 => 'fifa 25 fc25', 2195250 => 'fifa 24 fc24', 976730 => 'mcc',
        1328670 => 'mass effect le', 553850 => 'hd2', 2246340 => 'mh wilds mhw', 582010 => 'mhw', 1446780 => 'mhr',
        2183900 => 'sm2 space marine', 1888160 => 'ac6 armored core 6', 2208920 => 'ac valhalla', 812140 => 'ac odyssey',
        582160 => 'ac origins', 3159330 => 'ac shadows', 2322010 => 'gow ragnarok', 1593500 => 'gow', 1817070 => 'spiderman',
        2651280 => 'spiderman 2', 1817190 => 'spiderman miles', 1888930 => 'tlou', 2531310 => 'tlou2 tlou 2',
        489830 => 'skyrim se', 2694490 => 'poe2 poe 2', 2344520 => 'd4 diablo 4', 2488620 => 'f1 2024',
        2252570 => 'fm24 fm 24', 1462040 => 'ff7 remake ffvii', 2909400 => 'ff7 rebirth ffvii', 2515020 => 'ff16 ffxvi',
        1687950 => 'p5r persona 5', 2161700 => 'p3r persona 3', 1850570 => 'ds death stranding', 546560 => 'hla',
        550 => 'l4d2', 4000 => 'gmod', 220 => 'hl2', 108600 => 'pz', 1903340 => 'expedition 33 e33',
    ],

    // Steam app ids that also get console versions.
    'console_variants' => [
        'psn' => [1245620, 1091500, 292030, 271590, 1174180, 1086940, 2050650, 990080, 2358720, 553850, 2246340, 2669320, 2195250,
            1364780, 1778820, 1971870, 2208920, 3159330, 2369390, 2161700, 1627720, 2054970, 1903340, 1771300, 2124490, 413150,
            367520, 1145360, 2183900, 2488620, 814380, 1888160, 1687950],
        'xbox-live' => [1245620, 1091500, 292030, 271590, 1174180, 1086940, 1716740, 1551360, 990080, 2669320, 2208920, 2369390,
            976730, 1293830, 413150, 367520, 553850, 1971870, 1778820, 2183900, 1771300, 1903340, 1623730, 1627720, 2440510],
        'nintendo-eshop' => [413150, 367520, 1145360, 504230, 268910, 588650, 105600, 292030, 1794680, 2379780, 391540, 646570,
            1092790, 753640, 1687950, 1971870],
    ],

    /*
     * Products without a Steam page. `cover` uses Eneba's own artwork where one exists;
     * everything else gets a brand tile drawn from `art`.
     */
    'non_game_products' => (function (): array {
        $tile = fn (string $file) => "https://static.eneba.games/{$file}";
        $img = fn (string $path) => "https://imgproxy.eneba.games/{$path}";

        return [
            // Gaming eCards
            ['name' => 'Steam Wallet Gift Card 5 EUR', 'type' => 'gift_card', 'brand' => 'steam', 'platform' => 'steam', 'region' => 'europe', 'face' => 500, 'cover' => $img('SkikGb2hfUjEr00gHrdCIyaMrJUyTdUT1tHO05nnyFs/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9Q/YllBdWhvZlpERFhn/T2ZIZTZLVXM0WnNW/bHBQamc2QUltY2k5/YTZDVGx3LmpwZWc')],
            ['name' => 'Steam Wallet Gift Card 10 EUR', 'type' => 'gift_card', 'brand' => 'steam', 'platform' => 'steam', 'region' => 'europe', 'face' => 1000, 'art' => ['brand' => 'steam', 'label' => '€10', 'sublabel' => 'Wallet top-up']],
            ['name' => 'Steam Wallet Gift Card 20 EUR', 'type' => 'gift_card', 'brand' => 'steam', 'platform' => 'steam', 'region' => 'europe', 'face' => 2000, 'cover' => $img('j0bm2v4_76YbxYZNHSxAO42w9lDD9zLp3KxoLZ-rEfQ/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9S/dF9xbllzdzNmSnFN/TFlCSFh5RExRTVJF/QjRha2x3dDkxVm8w/ckE0WUpZLmpwZWc')],
            ['name' => 'Steam Wallet Gift Card 50 EUR', 'type' => 'gift_card', 'brand' => 'steam', 'platform' => 'steam', 'region' => 'europe', 'face' => 5000, 'art' => ['brand' => 'steam', 'label' => '€50', 'sublabel' => 'Wallet top-up']],
            ['name' => 'Steam Wallet Gift Card 100 EUR', 'type' => 'gift_card', 'brand' => 'steam', 'platform' => 'steam', 'region' => 'europe', 'face' => 10000, 'art' => ['brand' => 'steam', 'label' => '€100', 'sublabel' => 'Wallet top-up']],
            ['name' => 'PlayStation Network Card 10 USD (USA)', 'type' => 'gift_card', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'united-states', 'face' => 920, 'cover' => $img('3Q84TySD2vGxKRZlIkbaoGaSOiI8RGINNT5-8IXEe9o/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9U/cTVoYzZYWVdvd1RD/SHEtLTg4RzktVkZZ/b2xIY205dWs2Wkxr/OFBOODA4LmpwZWc')],
            ['name' => 'PlayStation Network Card 25 USD (USA)', 'type' => 'gift_card', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'united-states', 'face' => 2300, 'cover' => $img('sohwxPwLNHLvlNUsFd-izH7dLDWlncfPva4VgILq-p4/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9L/NU5xS3ZpU2wwb29n/MzRJUjdUTmd6aEZE/SmZPRmc2VzZmZXct/NTJDVVljLmpwZWc')],
            ['name' => 'PlayStation Network Card 100 USD (USA)', 'type' => 'gift_card', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'united-states', 'face' => 9200, 'cover' => $img('4LHm5BJU_8H-aEByHOXuN8aVIyVFUt12h07NqD1Qr30/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy91/dTUxNnZkaW5KM3pV/aWxYU1JIYkNQQUJD/QXRCcmlxNm1Zai1q/aVBvelhNLmpwZWc')],
            ['name' => 'PlayStation Network Card 100 GBP (UK)', 'type' => 'gift_card', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'united-kingdom', 'face' => 11500, 'cover' => $img('c_lc8swm6NFZ_Lp8h0Ydg7AiPdbBfjD0xX8m3MdOG-s/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy84/U1lOdEkyT0o4OGF6/VEFoYWpHbE5obFpp/UFBuYWNUanZheXRz/VFRkRFZBLmpwZWc')],
            ['name' => 'PlayStation Network Card 25 EUR', 'type' => 'gift_card', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'europe', 'face' => 2500, 'art' => ['brand' => 'playstation', 'label' => '€25', 'sublabel' => 'PlayStation Store']],
            ['name' => 'PlayStation Network Card 50 EUR', 'type' => 'gift_card', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'europe', 'face' => 5000, 'art' => ['brand' => 'playstation', 'label' => '€50', 'sublabel' => 'PlayStation Store']],
            ['name' => 'Xbox Gift Card 10 EUR', 'type' => 'gift_card', 'brand' => 'xbox', 'platform' => 'xbox-live', 'region' => 'europe', 'face' => 1000, 'art' => ['brand' => 'xbox', 'label' => '€10', 'sublabel' => 'Xbox gift card']],
            ['name' => 'Xbox Gift Card 25 EUR', 'type' => 'gift_card', 'brand' => 'xbox', 'platform' => 'xbox-live', 'region' => 'europe', 'face' => 2500, 'art' => ['brand' => 'xbox', 'label' => '€25', 'sublabel' => 'Xbox gift card']],
            ['name' => 'Xbox Gift Card 50 EUR', 'type' => 'gift_card', 'brand' => 'xbox', 'platform' => 'xbox-live', 'region' => 'europe', 'face' => 5000, 'art' => ['brand' => 'xbox', 'label' => '€50', 'sublabel' => 'Xbox gift card']],
            ['name' => 'Nintendo eShop Card 15 EUR', 'type' => 'gift_card', 'brand' => 'nintendo', 'platform' => 'nintendo-eshop', 'region' => 'europe', 'face' => 1500, 'art' => ['brand' => 'nintendo', 'label' => '€15', 'sublabel' => 'eShop card']],
            ['name' => 'Nintendo eShop Card 50 EUR', 'type' => 'gift_card', 'brand' => 'nintendo', 'platform' => 'nintendo-eshop', 'region' => 'europe', 'face' => 5000, 'art' => ['brand' => 'nintendo', 'label' => '€50', 'sublabel' => 'eShop card']],
            ['name' => 'Battle.net Gift Card 20 EUR', 'type' => 'gift_card', 'brand' => 'battle-net', 'platform' => 'battle-net', 'region' => 'europe', 'face' => 2000, 'art' => ['brand' => 'battledotnet', 'label' => '€20', 'sublabel' => 'Balance']],
            ['name' => 'Roblox Card 25 USD', 'type' => 'gift_card', 'brand' => 'roblox', 'platform' => 'other', 'region' => 'global', 'face' => 2300, 'cover' => $img('TKe6eFIMAWUuJ8Q667ym8NUn2A9xKZrtDo3Qf3xsFNA/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy94/NjZLZ2RYaTdxQmNR/U2t3YmdDNjNNZVVC/c2FQM1poQ2JoQlIt/a2ZxMjB3LmpwZw')],

            // Game points and mobile top-ups
            ['name' => 'Roblox - 200 Robux', 'type' => 'game_points', 'brand' => 'roblox', 'platform' => 'other', 'region' => 'global', 'face' => 279, 'cover' => $img('IJzTiVNTXzdoTZ8Cx8Ldt3uE4UPumF4YmwZvxD17rts/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9C/ZWhmV2piZzFQVEg4/UlI4YVl1Z216UFFT/SzdHSDhVTGh6S2JU/LWI2a3Z3LmpwZw')],
            ['name' => 'Roblox - 1000 Robux', 'type' => 'game_points', 'brand' => 'roblox', 'platform' => 'other', 'region' => 'global', 'face' => 1049, 'cover' => $img('gJrNssRa3stNvSW0JfJyV7TFMfIRcC3W0cWJyzWzU7w/rs:fit:300/ar:1/czM6Ly9wcm9kdWN0/cy5lbmViYS5nYW1l/cy9wcm9kdWN0cy9F/T0FOdTQxZndJdVdJ/QS11YXZ0bkVqdU9D/a2g4Q2NCajVJV2lL/TFpCVXdvLmpwZw')],
            ['name' => 'Fortnite 1000 V-Bucks', 'type' => 'game_points', 'brand' => 'fortnite', 'platform' => 'epic-games', 'region' => 'global', 'face' => 899, 'art' => ['brand' => 'epicgames', 'label' => '1000', 'sublabel' => 'V-Bucks']],
            ['name' => 'Fortnite 2800 V-Bucks', 'type' => 'game_points', 'brand' => 'fortnite', 'platform' => 'epic-games', 'region' => 'global', 'face' => 2299, 'art' => ['brand' => 'epicgames', 'label' => '2800', 'sublabel' => 'V-Bucks']],
            ['name' => 'Valorant 1000 VP', 'type' => 'game_points', 'brand' => 'valorant', 'platform' => 'other', 'region' => 'europe', 'face' => 999, 'art' => ['brand' => 'riotgames', 'label' => '1000', 'sublabel' => 'Valorant Points']],
            ['name' => 'EA Sports FC 26 - 1050 FC Points', 'type' => 'game_points', 'brand' => 'ea-sports-fc', 'platform' => 'ea-app', 'region' => 'global', 'face' => 999, 'art' => ['brand' => 'ea', 'label' => '1050', 'sublabel' => 'FC Points']],
            ['name' => 'EA Sports FC 26 - 2800 FC Points', 'type' => 'game_points', 'brand' => 'ea-sports-fc', 'platform' => 'psn', 'region' => 'europe', 'face' => 2499, 'art' => ['brand' => 'ea', 'label' => '2800', 'sublabel' => 'FC Points']],
            ['name' => 'EA Sports FC 26 - 1600 FC Points', 'type' => 'game_points', 'brand' => 'ea-sports-fc', 'platform' => 'xbox-live', 'region' => 'global', 'face' => 1499, 'art' => ['brand' => 'ea', 'label' => '1600', 'sublabel' => 'FC Points']],
            ['name' => 'PUBG Mobile 660 UC', 'type' => 'game_points', 'brand' => 'mobile-games', 'platform' => 'other', 'region' => 'global', 'face' => 999, 'art' => ['brand' => 'mobile', 'label' => '660 UC', 'sublabel' => 'PUBG Mobile']],
            ['name' => 'Free Fire 520 Diamonds', 'type' => 'game_points', 'brand' => 'mobile-games', 'platform' => 'other', 'region' => 'global', 'face' => 499, 'art' => ['brand' => 'mobile', 'label' => '520', 'sublabel' => 'Free Fire Diamonds']],
            ['name' => 'Genshin Impact 980 Genesis Crystals', 'type' => 'game_points', 'brand' => 'mobile-games', 'platform' => 'other', 'region' => 'global', 'face' => 1499, 'art' => ['brand' => 'mobile', 'label' => '980', 'sublabel' => 'Genesis Crystals']],

            // eGift Cards
            ['name' => 'Eneba Gift Card 5 EUR', 'type' => 'egift_card', 'brand' => 'eneba', 'platform' => 'other', 'region' => 'global', 'face' => 500, 'art' => ['brand' => 'eneba', 'label' => '€5', 'sublabel' => 'Eneba Gift Card']],
            ['name' => 'Eneba Gift Card 10 EUR', 'type' => 'egift_card', 'brand' => 'eneba', 'platform' => 'other', 'region' => 'global', 'face' => 1000, 'art' => ['brand' => 'eneba', 'label' => '€10', 'sublabel' => 'Eneba Gift Card']],
            ['name' => 'Eneba Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'eneba', 'platform' => 'other', 'region' => 'global', 'face' => 2500, 'art' => ['brand' => 'eneba', 'label' => '€25', 'sublabel' => 'Eneba Gift Card']],
            ['name' => 'Eneba Gift Card 50 EUR', 'type' => 'egift_card', 'brand' => 'eneba', 'platform' => 'other', 'region' => 'global', 'face' => 5000, 'art' => ['brand' => 'eneba', 'label' => '€50', 'sublabel' => 'Eneba Gift Card']],
            ['name' => 'Eneba Gift Card 100 EUR', 'type' => 'egift_card', 'brand' => 'eneba', 'platform' => 'other', 'region' => 'global', 'face' => 10000, 'art' => ['brand' => 'eneba', 'label' => '€100', 'sublabel' => 'Eneba Gift Card']],
            ['name' => 'Razer Gold Gift Card 10 USD', 'type' => 'egift_card', 'brand' => 'razer-gold', 'platform' => 'other', 'region' => 'global', 'face' => 920, 'cover' => $tile('f5169931ef8d2fed99aa.jpg')],
            ['name' => 'Razer Gold Gift Card 25 USD', 'type' => 'egift_card', 'brand' => 'razer-gold', 'platform' => 'other', 'region' => 'global', 'face' => 2300, 'cover' => $tile('f5169931ef8d2fed99aa.jpg')],
            ['name' => 'Netflix Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'netflix', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'cover' => $tile('e44816d8742543111db5.jpg')],
            ['name' => 'Netflix Gift Card 50 EUR', 'type' => 'egift_card', 'brand' => 'netflix', 'platform' => 'other', 'region' => 'europe', 'face' => 5000, 'cover' => $tile('e44816d8742543111db5.jpg')],
            ['name' => 'Amazon Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'amazon', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'cover' => $tile('05d88e5cc868769e1136.jpg')],
            ['name' => 'Amazon Gift Card 50 EUR', 'type' => 'egift_card', 'brand' => 'amazon', 'platform' => 'other', 'region' => 'europe', 'face' => 5000, 'cover' => $tile('05d88e5cc868769e1136.jpg')],
            ['name' => 'Apple Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'apple', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'cover' => $tile('57605217f61c697ee3e2.jpg')],
            ['name' => 'Apple Gift Card 50 EUR', 'type' => 'egift_card', 'brand' => 'apple', 'platform' => 'other', 'region' => 'europe', 'face' => 5000, 'cover' => $tile('57605217f61c697ee3e2.jpg')],
            ['name' => 'Tinder Gold 1 Month', 'type' => 'egift_card', 'brand' => 'tinder', 'platform' => 'other', 'region' => 'global', 'face' => 1999, 'cover' => $tile('e62e6919b45e04f95505.jpg')],
            ['name' => 'Google Play Gift Card 15 EUR', 'type' => 'egift_card', 'brand' => 'google-play', 'platform' => 'other', 'region' => 'europe', 'face' => 1500, 'cover' => $tile('05417e7dd6621364a14d.jpg')],
            ['name' => 'Google Play Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'google-play', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'cover' => $tile('05417e7dd6621364a14d.jpg')],
            ['name' => 'Spotify Premium Gift Card 30 EUR', 'type' => 'egift_card', 'brand' => 'spotify', 'platform' => 'other', 'region' => 'europe', 'face' => 3000, 'cover' => $tile('613df508ab5f4207ab89.jpg')],
            ['name' => 'Spotify Premium Gift Card 10 EUR', 'type' => 'egift_card', 'brand' => 'spotify', 'platform' => 'other', 'region' => 'europe', 'face' => 1000, 'cover' => $tile('613df508ab5f4207ab89.jpg')],
            ['name' => 'Discord Nitro 1 Month', 'type' => 'egift_card', 'brand' => 'discord', 'platform' => 'other', 'region' => 'global', 'face' => 999, 'cover' => $tile('732b179984748df8e4c5.jpg')],
            ['name' => 'Zalando Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'zalando', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'cover' => $tile('834d1849549a8d8bb76d.jpg')],
            ['name' => 'Airbnb Gift Card 100 EUR', 'type' => 'egift_card', 'brand' => 'airbnb', 'platform' => 'other', 'region' => 'europe', 'face' => 10000, 'cover' => $tile('5fb9d285ac0d38d3ece2.jpg')],
            ['name' => 'Uber Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'uber', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'cover' => $tile('f3922d5ccca7acf49119.jpg')],
            ['name' => 'Uber Eats Gift Card 25 EUR', 'type' => 'egift_card', 'brand' => 'uber-eats', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'cover' => $tile('61672776203f4858421a.jpg')],
            ['name' => 'IKEA Gift Card 50 EUR', 'type' => 'egift_card', 'brand' => 'ikea', 'platform' => 'other', 'region' => 'europe', 'face' => 5000, 'cover' => $tile('a9eac987225c58ea44d1.jpg')],

            // E-money
            ['name' => 'Binance Gift Card 25 USD', 'type' => 'e_money', 'brand' => 'binance', 'platform' => 'other', 'region' => 'global', 'face' => 2300, 'cover' => $tile('72fdfccf3450e0cab80e.jpg')],
            ['name' => 'Binance Gift Card 50 USD', 'type' => 'e_money', 'brand' => 'binance', 'platform' => 'other', 'region' => 'global', 'face' => 4600, 'cover' => $tile('72fdfccf3450e0cab80e.jpg')],
            ['name' => 'Bitnovo Gift Card 50 EUR', 'type' => 'e_money', 'brand' => 'bitnovo', 'platform' => 'other', 'region' => 'europe', 'face' => 5000, 'cover' => $tile('004a49f98f45c0c5a5c9.jpg')],
            ['name' => 'Paysafecard 25 EUR', 'type' => 'e_money', 'brand' => 'paysafecard', 'platform' => 'other', 'region' => 'europe', 'face' => 2500, 'art' => ['brand' => 'paysafecard', 'label' => '€25', 'sublabel' => 'paysafecard']],
            ['name' => 'Paysafecard 50 EUR', 'type' => 'e_money', 'brand' => 'paysafecard', 'platform' => 'other', 'region' => 'europe', 'face' => 5000, 'art' => ['brand' => 'paysafecard', 'label' => '€50', 'sublabel' => 'paysafecard']],
            ['name' => 'Neosurf 20 EUR', 'type' => 'e_money', 'brand' => 'neosurf', 'platform' => 'other', 'region' => 'europe', 'face' => 2000, 'art' => ['brand' => 'neosurf', 'label' => '€20', 'sublabel' => 'Neosurf']],

            // Subscriptions
            ['name' => 'Xbox Game Pass Ultimate 1 Month', 'type' => 'subscription', 'brand' => 'xbox', 'platform' => 'xbox-live', 'region' => 'global', 'face' => 2299, 'art' => ['brand' => 'xbox', 'label' => '1 month', 'sublabel' => 'Game Pass Ultimate']],
            ['name' => 'Xbox Game Pass Ultimate 3 Months', 'type' => 'subscription', 'brand' => 'xbox', 'platform' => 'xbox-live', 'region' => 'global', 'face' => 6897, 'art' => ['brand' => 'xbox', 'label' => '3 months', 'sublabel' => 'Game Pass Ultimate']],
            ['name' => 'PlayStation Plus Essential 3 Months', 'type' => 'subscription', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'europe', 'face' => 2699, 'art' => ['brand' => 'playstation', 'label' => '3 months', 'sublabel' => 'PS Plus Essential']],
            ['name' => 'PlayStation Plus Extra 12 Months', 'type' => 'subscription', 'brand' => 'playstation', 'platform' => 'psn', 'region' => 'europe', 'face' => 12599, 'art' => ['brand' => 'playstation', 'label' => '12 months', 'sublabel' => 'PS Plus Extra']],
            ['name' => 'Nintendo Switch Online 12 Months', 'type' => 'subscription', 'brand' => 'nintendo', 'platform' => 'nintendo-eshop', 'region' => 'europe', 'face' => 1999, 'art' => ['brand' => 'nintendo', 'label' => '12 months', 'sublabel' => 'Switch Online']],
            ['name' => 'EA Play 1 Month', 'type' => 'subscription', 'brand' => 'ea', 'platform' => 'ea-app', 'region' => 'global', 'face' => 499, 'art' => ['brand' => 'ea', 'label' => '1 month', 'sublabel' => 'EA Play']],
            ['name' => 'Ubisoft+ Premium 1 Month', 'type' => 'subscription', 'brand' => 'ubisoft', 'platform' => 'ubisoft-connect', 'region' => 'europe', 'face' => 1799, 'art' => ['brand' => 'ubisoft', 'label' => '1 month', 'sublabel' => 'Ubisoft+ Premium']],

            // Software
            ['name' => 'Windows 11 Pro', 'type' => 'software', 'brand' => 'microsoft', 'platform' => 'microsoft-store', 'region' => 'global', 'face' => 25900, 'art' => ['brand' => 'windows', 'label' => 'Windows 11', 'sublabel' => 'Pro']],
            ['name' => 'Windows 11 Home', 'type' => 'software', 'brand' => 'microsoft', 'platform' => 'microsoft-store', 'region' => 'global', 'face' => 14500, 'art' => ['brand' => 'windows', 'label' => 'Windows 11', 'sublabel' => 'Home']],
            ['name' => 'Microsoft Office 2021 Professional Plus', 'type' => 'software', 'brand' => 'microsoft', 'platform' => 'microsoft-store', 'region' => 'global', 'face' => 59900, 'art' => ['brand' => 'office', 'label' => 'Office 2021', 'sublabel' => 'Professional Plus']],
            ['name' => 'Microsoft 365 Personal 1 Year', 'type' => 'software', 'brand' => 'microsoft', 'platform' => 'microsoft-store', 'region' => 'europe', 'face' => 9900, 'art' => ['brand' => 'office', 'label' => 'Microsoft 365', 'sublabel' => 'Personal · 1 year']],
            ['name' => 'NordVPN 1 Year', 'type' => 'software', 'brand' => 'nordvpn', 'platform' => 'other', 'region' => 'global', 'face' => 8900, 'art' => ['brand' => 'nordvpn', 'label' => 'NordVPN', 'sublabel' => '1 year']],
            ['name' => 'Kaspersky Premium 1 Device 1 Year', 'type' => 'software', 'brand' => 'kaspersky', 'platform' => 'other', 'region' => 'europe', 'face' => 5999, 'art' => ['brand' => 'kaspersky', 'label' => 'Kaspersky', 'sublabel' => 'Premium · 1 year']],
        ];
    })(),

    // Brand storefront tiles for the "Best selling eGift Cards" row (Eneba's tile artwork).
    'brands' => [
        ['slug' => 'razer-gold', 'name' => 'Razer Gold', 'image' => 'f5169931ef8d2fed99aa.jpg'],
        ['slug' => 'netflix', 'name' => 'Netflix', 'image' => 'e44816d8742543111db5.jpg'],
        ['slug' => 'amazon', 'name' => 'Amazon', 'image' => '05d88e5cc868769e1136.jpg'],
        ['slug' => 'apple', 'name' => 'Apple', 'image' => '57605217f61c697ee3e2.jpg'],
        ['slug' => 'tinder', 'name' => 'Tinder', 'image' => 'e62e6919b45e04f95505.jpg'],
        ['slug' => 'google-play', 'name' => 'Google Play', 'image' => '05417e7dd6621364a14d.jpg'],
        ['slug' => 'spotify', 'name' => 'Spotify', 'image' => '613df508ab5f4207ab89.jpg'],
        ['slug' => 'discord', 'name' => 'Discord', 'image' => '732b179984748df8e4c5.jpg'],
        ['slug' => 'zalando', 'name' => 'Zalando', 'image' => '834d1849549a8d8bb76d.jpg'],
        ['slug' => 'bitnovo', 'name' => 'Bitnovo', 'image' => '004a49f98f45c0c5a5c9.jpg'],
        ['slug' => 'airbnb', 'name' => 'Airbnb', 'image' => '5fb9d285ac0d38d3ece2.jpg'],
        ['slug' => 'binance', 'name' => 'Binance', 'image' => '72fdfccf3450e0cab80e.jpg'],
        ['slug' => 'uber', 'name' => 'Uber', 'image' => 'f3922d5ccca7acf49119.jpg'],
        ['slug' => 'uber-eats', 'name' => 'Uber Eats', 'image' => '61672776203f4858421a.jpg'],
        ['slug' => 'ikea', 'name' => 'IKEA', 'image' => 'a9eac987225c58ea44d1.jpg'],
    ],

    // Indicative display rates (units per 1 EUR). Checkout always charges EUR.
    'currencies' => [
        ['code' => 'EUR', 'name' => 'Euro', 'symbol' => '€', 'rate' => 1],
        ['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'rate' => 1.16],
        ['code' => 'GBP', 'name' => 'Pound Sterling', 'symbol' => '£', 'rate' => 0.87],
        ['code' => 'PLN', 'name' => 'Polski złoty', 'symbol' => 'zł', 'rate' => 4.24],
        ['code' => 'CZK', 'name' => 'Czech Koruna', 'symbol' => 'Kč', 'rate' => 24.3],
        ['code' => 'HUF', 'name' => 'Hungarian Forint', 'symbol' => 'Ft', 'rate' => 388],
        ['code' => 'RON', 'name' => 'Romanian Leu', 'symbol' => 'lei', 'rate' => 5.07],
        ['code' => 'SEK', 'name' => 'Swedish Krona', 'symbol' => 'kr', 'rate' => 11.0],
        ['code' => 'NOK', 'name' => 'Norwegian Krone', 'symbol' => 'kr', 'rate' => 11.7],
        ['code' => 'DKK', 'name' => 'Danish Krone', 'symbol' => 'kr', 'rate' => 7.46],
        ['code' => 'CHF', 'name' => 'Swiss Franc', 'symbol' => 'CHF', 'rate' => 0.93],
        ['code' => 'TRY', 'name' => 'Turkish Lira', 'symbol' => '₺', 'rate' => 48.6],
        ['code' => 'UAH', 'name' => 'Ukrainian Hryvnia', 'symbol' => '₴', 'rate' => 48.3],
        ['code' => 'CAD', 'name' => 'Canadian Dollar', 'symbol' => 'CA$', 'rate' => 1.62],
        ['code' => 'AUD', 'name' => 'Australian Dollar', 'symbol' => 'A$', 'rate' => 1.78],
        ['code' => 'BRL', 'name' => 'Brazilian Real', 'symbol' => 'R$', 'rate' => 6.25],
        ['code' => 'MXN', 'name' => 'Mexican Peso', 'symbol' => 'MX$', 'rate' => 21.4],
        ['code' => 'INR', 'name' => 'Indian Rupee', 'symbol' => '₹', 'rate' => 102.5],
        ['code' => 'JPY', 'name' => 'Japanese Yen', 'symbol' => '¥', 'rate' => 178],
    ],

    'review_snippets' => [
        5 => [
            'Key arrived instantly and activated without any issues. Great price!',
            'Third purchase here, always smooth. Highly recommend this seller.',
            'Cheaper than anywhere else and the code worked on the first try.',
            'Absolutely worth it. Activation took less than a minute.',
            'Fast delivery, legit key, will buy again.',
            'One of the best games I have played in years and I saved a lot buying here.',
        ],
        4 => [
            'Worked fine, only took a few minutes to receive the code.',
            'Good deal overall. Checkout could be a bit faster but no complaints.',
            'Key was valid. Price was a little higher than last week but still a bargain.',
            'Solid purchase, game runs great.',
        ],
        3 => [
            'The key worked, but I had to double check the region before buying.',
            'Decent price, delivery took longer than expected.',
        ],
        2 => [
            'Code worked after contacting support, but it took a day.',
        ],
    ],

    'reviewer_names' => ['Wiiwi', 'Maka', 'Hj', 'Heng0582', 'Syra', 'Lukas', 'Ieva', 'Tomas_G', 'NoScope', 'Pixelated', 'Marta', 'GameOn',
        'Ruta', 'Kestas', 'Dovydas', 'Zygis', 'Ada', 'Jonas', 'Rokas', 'Aiste', 'Vytas', 'Kotryna', 'Mantas', 'Greta'],
];
