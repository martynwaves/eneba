# Eneba Marketplace – API

Laravel 13 JSON API for the marketplace. See the [root README](../README.md) for features, local setup and deployment.

```bash
composer install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
php artisan serve          # http://localhost:8000/api
php vendor/bin/pest        # tests (uses the eneba_test database)
```

Useful commands:

- `php artisan shop:sweep` expires abandoned checkouts and returns their keys to stock. It is scheduled every five minutes and also runs on each checkout.
- `php artisan app:bootstrap` migrates the database, and seeds it only if the catalog is empty. The Docker entrypoint runs this.
- `node database/data/fetch-steam.mjs` rebuilds `games.json` from Steam's public store API.
