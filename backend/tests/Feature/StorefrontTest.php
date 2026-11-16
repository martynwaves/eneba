<?php

use App\Models\Currency;
use App\Models\NavLink;
use App\Models\NewsletterSubscriber;

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

it('subscribes to the newsletter once per email', function () {
    $this->postJson('/api/newsletter', ['email' => 'Gamer@Example.com'])->assertCreated();
    $this->postJson('/api/newsletter', ['email' => 'gamer@example.com'])->assertOk();
    $this->postJson('/api/newsletter', ['email' => 'not-an-email'])->assertUnprocessable();

    expect(NewsletterSubscriber::count())->toBe(1);
});
