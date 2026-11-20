# Eneba Marketplace – API

Laravel 13 JSON API for the marketplace. See the [root README](../README.md) for features, local setup and deployment.

```bash
cp .env.example .env       # then set DB_PASSWORD (and Stripe test keys, if you have them)
composer setup             # install, APP_KEY, migrate and seed the demo catalog
php artisan serve          # http://localhost:8000/api
php vendor/bin/pest        # tests (uses the eneba_test database)
```

Useful commands:

- `php artisan app:bootstrap` migrates the database, and seeds it only if the catalog is empty, so it is safe to run on every boot. The Docker entrypoint and `composer setup` run it.
- `php artisan shop:sweep` expires abandoned checkouts and returns their keys to stock. The scheduler runs it every five minutes wherever one is running (`php artisan schedule:work`); every checkout also runs it first, which is what keeps stock right on Render.
- `php artisan catalog:import-steam-extras` copies languages, trailers, "About this game" text and per-OS requirements (PC editions only) from `steam-extras.json` onto an existing catalog.
- `node database/data/fetch-steam.mjs` rebuilds `games.json`, and `node database/data/fetch-steam-extras.mjs` rebuilds `steam-extras.json`, from Steam's public store API.
