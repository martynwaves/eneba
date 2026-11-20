<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CatalogController;
use App\Http\Controllers\Api\CheckoutController;
use App\Http\Controllers\Api\HomepageController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\StorefrontController;
use App\Http\Controllers\Api\StripeWebhookController;
use App\Http\Controllers\Api\WishlistController;
use Illuminate\Support\Facades\Route;

// Site-wide content
Route::get('/navigation', [StorefrontController::class, 'navigation']);
Route::get('/settings', [StorefrontController::class, 'settings']);

// Public catalog
Route::get('/config', [CatalogController::class, 'config']);
Route::get('/catalog/filters', [CatalogController::class, 'filters']);
Route::get('/products', [ProductController::class, 'index']);
Route::get('/products/{slug}', [ProductController::class, 'show']);
Route::get('/products/{slug}/reviews', [ReviewController::class, 'index']);
Route::get('/search/suggest', [SearchController::class, 'suggest'])->middleware('throttle:search');

// Homepage: layout + one endpoint per block
Route::get('/homepage', [HomepageController::class, 'layout']);
Route::get('/homepage/blocks/{block}', [HomepageController::class, 'block']);

// Guest cart pricing
Route::post('/cart/preview', [CartController::class, 'preview']);

// Auth
Route::middleware('throttle:auth')->group(function () {
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

Route::post('/webhooks/stripe', StripeWebhookController::class);

// Signed-in only
Route::middleware('auth:sanctum')->group(function () {
    Route::get('/auth/me', [AuthController::class, 'me']);
    Route::patch('/auth/me', [AuthController::class, 'update']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);

    Route::get('/cart', [CartController::class, 'show']);
    Route::post('/cart/items', [CartController::class, 'add']);
    Route::patch('/cart/items/{offer}', [CartController::class, 'update']);
    Route::delete('/cart/items/{offer}', [CartController::class, 'remove']);

    Route::post('/checkout', [CheckoutController::class, 'store'])->middleware('throttle:checkout');
    Route::post('/orders/{order}/confirm', [CheckoutController::class, 'confirm']);
    Route::post('/orders/{order}/cancel', [CheckoutController::class, 'cancel']);
    Route::post('/orders/{order}/pay-with-wallet', [CheckoutController::class, 'payWithWallet']);
    Route::post('/orders/{order}/wallet', [CheckoutController::class, 'useWallet']);

    Route::get('/orders', [OrderController::class, 'index']);
    Route::get('/keys', [OrderController::class, 'keys']);
    Route::get('/orders/{order}', [OrderController::class, 'show']);
    Route::post('/orders/{order}/keys/{key}/reveal', [OrderController::class, 'reveal']);
    Route::post('/orders/{order}/keys/{key}/refund', [OrderController::class, 'refund']);

    Route::get('/wishlist', [WishlistController::class, 'index']);
    Route::post('/wishlist/{product}', [WishlistController::class, 'store']);
    Route::delete('/wishlist/{product}', [WishlistController::class, 'destroy']);

    Route::post('/products/{slug}/reviews', [ReviewController::class, 'store']);
});
