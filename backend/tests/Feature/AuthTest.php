<?php

use App\Models\NewsletterSubscriber;
use App\Models\User;

it('registers a user and returns a token', function () {
    $response = $this->postJson('/api/auth/register', [
        'name' => 'New Gamer',
        'email' => 'New@Example.com',
        'password' => 'secret123',
        'password_confirmation' => 'secret123',
    ])->assertCreated()->assertJsonStructure(['token', 'user' => ['id', 'name', 'email']]);

    expect($response->json('user.email'))->toBe('new@example.com');

    $this->withToken($response->json('token'))->getJson('/api/auth/me')->assertOk()->assertJsonPath('data.name', 'New Gamer');
});

it('validates registration input', function () {
    User::factory()->create(['email' => 'taken@example.com']);

    $this->postJson('/api/auth/register', ['email' => 'taken@example.com', 'password' => 'short'])
        ->assertUnprocessable()
        ->assertJsonValidationErrors(['email', 'password']);
});

it('registers with just an email and password, naming the account after the email', function () {
    $this->postJson('/api/auth/register', ['email' => 'martynwaves@example.com', 'password' => 'secret123', 'newsletter' => true])
        ->assertCreated()
        ->assertJsonPath('user.name', 'martynwaves');

    expect(NewsletterSubscriber::where('email', 'martynwaves@example.com')->exists())->toBeTrue();
});

it('logs in with valid credentials only', function () {
    User::factory()->create(['email' => 'gamer@example.com', 'password' => 'secret123']);

    $this->postJson('/api/auth/login', ['email' => 'gamer@example.com', 'password' => 'wrong'])->assertUnprocessable();
    $this->postJson('/api/auth/login', ['email' => 'gamer@example.com', 'password' => 'secret123'])->assertOk()->assertJsonStructure(['token']);
});

it('protects account routes', function (string $method, string $uri) {
    $this->json($method, $uri)->assertUnauthorized();
})->with([
    ['GET', '/api/auth/me'],
    ['GET', '/api/cart'],
    ['POST', '/api/checkout'],
    ['GET', '/api/orders'],
    ['GET', '/api/wishlist'],
]);

it('merges the guest cart on login', function () {
    $product = product('Merged Game');
    User::factory()->create(['email' => 'gamer@example.com', 'password' => 'secret123']);
    $offerId = $product->offers()->first()->id;

    $token = $this->postJson('/api/auth/login', [
        'email' => 'gamer@example.com',
        'password' => 'secret123',
        'cart' => [['offer_id' => $offerId, 'quantity' => 2]],
    ])->json('token');

    $this->withToken($token)->getJson('/api/cart')
        ->assertJsonPath('data.lines.0.offer_id', $offerId)
        ->assertJsonPath('data.summary.items_count', 2);
});

it('merges the guest wishlist on login and ignores unknown products', function () {
    $saved = product('Saved Game');
    User::factory()->create(['email' => 'gamer@example.com', 'password' => 'secret123']);

    $token = $this->postJson('/api/auth/login', [
        'email' => 'gamer@example.com',
        'password' => 'secret123',
        'wishlist' => [$saved->id, 999999],
    ])->json('token');

    $this->withToken($token)->getJson('/api/wishlist')->assertJsonPath('ids', [$saved->id]);
});

it('revokes the token on logout', function () {
    $user = User::factory()->create(['password' => 'secret123']);
    $token = $user->createToken('web')->plainTextToken;

    $this->withToken($token)->postJson('/api/auth/logout')->assertOk();
    $this->app['auth']->forgetGuards();
    $this->withToken($token)->getJson('/api/auth/me')->assertUnauthorized();
});
