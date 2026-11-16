<?php

use Illuminate\Support\Facades\Route;

// This service is a JSON API; the storefront is the React app.
Route::get('/', fn () => response()->json([
    'name' => config('app.name').' API',
    'status' => 'ok',
    'docs' => url('/api/homepage'),
]));
