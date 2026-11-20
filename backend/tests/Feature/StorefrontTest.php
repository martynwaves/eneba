<?php

use App\Models\Currency;
use App\Models\NavLink;

it('serves the navigation bar in order without inactive links', function () {
    NavLink::create(['label' => 'GTA 6', 'link_url' => '/store?q=gta', 'style' => 'highlight', 'sort' => 2]);
    NavLink::create(['label' => 'Categories', 'link_url' => '/store', 'style' => 'menu', 'sort' => 1]);
    NavLink::create(['label' => 'Hidden', 'link_url' => '/x', 'sort' => 3, 'is_active' => false]);

    $this->getJson('/api/navigation')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonPath('data.0.label', 'Categories')
        ->assertJsonPath('data.1.style', 'highlight');
});

it('serves region, language and currency options', function () {
    Currency::create(['code' => 'USD', 'name' => 'US Dollar', 'symbol' => '$', 'rate' => 1.16]);

    $data = $this->getJson('/api/settings')->assertOk()->json('data');

    expect($data['currencies'][0])->toMatchArray(['code' => 'USD', 'rate' => 1.16])
        ->and(collect($data['regions'])->firstWhere('code', 'lithuania')['flag'])->toBe('lithuania')
        ->and($data['charge_currency'])->toBe('EUR');
});
