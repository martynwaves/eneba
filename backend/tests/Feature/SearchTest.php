<?php

beforeEach(function () {
    product('The Witcher 3: Wild Hunt');
    product('Cyberpunk 2077');
    product('Hogwarts Legacy');
    product('Steam Wallet Gift Card 20 EUR', attributes: ['type' => 'gift_card']);
    product('Grand Theft Auto V', attributes: ['search_aliases' => 'gta 5 gtav']);
    product('Elden Ring', attributes: ['platform' => 'psn', 'region' => 'europe']);
});

function suggest(string $q): array
{
    return test()->getJson('/api/search/suggest?q='.urlencode($q))->assertOk()->json();
}

it('finds products despite typos', function (string $query, string $expected) {
    $result = suggest($query);

    expect($result['products'])->not->toBeEmpty()
        ->and($result['products'][0]['base_title'])->toBe($expected);
})->with([
    ['wicher 3', 'The Witcher 3: Wild Hunt'],
    ['cyberpnk', 'Cyberpunk 2077'],
    ['hogwart legasy', 'Hogwarts Legacy'],
    ['elden rign', 'Elden Ring'],
]);

it('finds products by partial names and abbreviations', function (string $query, string $expected) {
    expect(suggest($query)['products'][0]['base_title'])->toBe($expected);
})->with([
    ['witch', 'The Witcher 3: Wild Hunt'],
    ['hogw', 'Hogwarts Legacy'],
    ['gta', 'Grand Theft Auto V'],
    ['steam wallet', 'Steam Wallet Gift Card 20 EUR'],
]);

it('requires every word to match so multi-word queries stay precise', function () {
    $titles = collect(suggest('steam wallet')['products'])->pluck('base_title');

    expect($titles)->toHaveCount(1)->and($titles[0])->toBe('Steam Wallet Gift Card 20 EUR');
});

it('reports what it searched for when the query had a typo', function () {
    expect(suggest('cyberpnk')['corrected_to'])->toBe('Cyberpunk 2077')
        ->and(suggest('cyberpunk')['corrected_to'])->toBeNull();
});

it('matches platform words too', function () {
    $titles = collect(suggest('elden ring ps5')['products'])->pluck('title');

    expect($titles)->toHaveCount(1)->and($titles[0])->toContain('PS5');
});

it('returns nothing for gibberish', function () {
    expect(suggest('qqqzzzxx')['total'])->toBe(0);
});

it('powers the full store search, with no correction when the words exist', function () {
    $this->getJson('/api/products?q=witcher')
        ->assertOk()
        ->assertJsonPath('meta.total', 1)
        ->assertJsonPath('data.0.base_title', 'The Witcher 3: Wild Hunt')
        ->assertJsonPath('search.corrected_to', null);
});
