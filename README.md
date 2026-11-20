# Eneba Marketplace

A digital-key marketplace built in Eneba's style: browse a catalog, compare offers from several sellers, search with typo tolerance, buy with Stripe (test mode) and receive the key instantly.

**Live:** https://eneba-two.vercel.app (API: https://eneba-api-9su6.onrender.com/api)

| Part | Stack |
|---|---|
| Frontend (`frontend/`) | React 19, TypeScript, Vite, React Router, TanStack Query, Zustand, Tailwind CSS v4, Stripe Elements |
| Backend (`backend/`) | PHP 8.4, Laravel 13, Sanctum token auth, Stripe PHP SDK, Pest |
| Database | PostgreSQL 17 with `pg_trgm` (Neon in production) |
| Hosting | Vercel (frontend) · Render free Docker web service (API) · Neon free Postgres |

## Features

**Store** (`/store`)
- Lists every product, with filters for platform, region, product type, genre, price range and "in stock only".
- Each filter option shows a live count. Counts are computed with every *other* filter applied, so ticking PSN doesn't hide the Steam option.
- Sorting: popularity, price up/down, newest, biggest discount, rating, and relevance when searching.
- All state lives in the URL, so results are shareable and the back button works. Sold-out products stay visible but sink to the bottom.

**Homepage** (`/`)
- Assembled entirely from the backend. `GET /api/homepage` returns the ordered block layout from the `homepage_blocks` table.
- Each block then loads from its own endpoint, `GET /api/homepage/blocks/{key}`. Each block's data comes from its own provider class:
  - hero promos → `banners` table (scheduled; wide + narrow artwork for the expanding strip)
  - quick links → `shortcuts` table (labels, links and SVG icons)
  - recommended → the visitor's own orders and wishlist genres
  - top games / best selling gift cards → paid orders in the last 30 days plus historical sales, narrowed by block config
  - best selling eGift Cards → `brands` table (brand storefront tiles)
  - upcoming games → release dates and "coming soon" flags
  - categories → `genres` table with live product counts
  - also available: deals, new releases and config-driven collections
- The header nav bar (`nav_links` table) and the region/language/currency options (`/api/settings`) also come from the backend.
- The React side only maps block types to components. Unknown types are ignored, and a failing block shows a retry box without breaking the page.

**Search**
- A live autocomplete box in the header on every page, plus full results in the store.
- Built on PostgreSQL trigram similarity (`pg_trgm`):
  - **Typos**: "wicher 3" finds The Witcher 3, "cyberpnk" finds Cyberpunk 2077, "hogwart legasy" finds Hogwarts Legacy.
  - **Partial names**: "witch", "hogw".
  - **Abbreviations**: "gta", "rdr2", "bg3".
  - **Platform words**: "elden ring ps5".
- Every word of the query must match, either literally or fuzzily, so "steam wallet" doesn't return every Steam game.
- When there is no literal match, the UI says "Showing results for …".
- See `backend/app/Services/Catalog/TextMatch.php`.

**Product page** (`/:slug`, the same URL style as eneba.com)
- Box art, the Steam trailer, a screenshot gallery with lightbox, region/platform/activation info, and the other platform and region versions with prices.
- Every seller's offer with price, rating, cashback, stock warnings, and "lowest price" / "best cashback" / featured badges.
- The wishlist count across all accounts, and how many people are viewing the page right now.
- Description, per-OS system requirements, reviews with per-aspect scores (verified-purchase flag, write your own), and similar products.

**Checkout**
- Guests can build a cart in the browser. The server still prices it, so prices and stock are always authoritative. The guest cart is merged into the account cart on sign-in.
- Checkout requires sign-in. It reserves keys with `SELECT … FOR UPDATE SKIP LOCKED`, so a key can never be sold twice.
- Reserved keys are held for 30 minutes. Abandoned checkouts expire and their keys return to stock.
- Discount codes can be applied on the cart page. The server validates them and re-prices the order at checkout.
- Payment goes through a Stripe PaymentIntent with Stripe's card field. Eneba Wallet (cashback) balance can pay the whole order, or part of it with the card covering the rest.
- The backend only fulfils an order after verifying the payment with Stripe, either via the browser confirmation or the signed webhook. Fulfilment is idempotent.
- Keys are stored encrypted and revealed one at a time, and each reveal is recorded (Eneba's "unviewed keys" policy).
- Unrevealed keys can be refunded instantly from the order page or the keys library. The key goes back on sale, and the money goes back the way it was paid: the card share first (a partial Stripe refund), then the wallet share. A key refunds its price less its share of any discount code and less the cashback it earned, which stays in the wallet. Once every key is refunded the order shows as refunded.
- If no Stripe keys are configured, a built-in simulated provider with Stripe's test card numbers is used instead, so the app works without keys.

**Auth**
- Register and log in with Laravel Sanctum bearer tokens, valid for 30 days. Password rules and rate limiting apply.
- Checkout, orders, the keys library, account settings and posting reviews need an account, on both the API (401) and the frontend (redirect to login and back). Guests can still keep a cart and a wishlist in the browser; both move into the account on sign-in.

**Catalog data**
- 192 real games pulled from Steam's public store API (names, box art, screenshots, genres, regular prices) by `backend/database/data/fetch-steam.mjs`. The result is committed as `games.json`, so seeding never depends on Steam.
- Product-page extras (supported languages, the main trailer, Windows/Mac/Linux requirements and the "About this game" text) come from `fetch-steam-extras.mjs` into the committed `steam-extras.json`. Seeding applies them, with system requirements on the PC editions only; on an existing database run `php artisan catalog:import-steam-extras`.
- The games, plus GTA VI and Minecraft (not on Steam, added by hand), are expanded into about 310 platform/region SKUs (Steam, PSN, Xbox, Nintendo, EA, Ubisoft, GOG, Epic…), plus about 70 gift cards, subscriptions, game points and software products.
- 12 sellers; each product gets 2–7 competing offers, each with its own price, cashback and key stock.

## Running locally (Windows)

Prerequisites: PHP 8.4 with `pdo_pgsql`, `intl`, `mbstring`, `zip`, `openssl`; Composer; PostgreSQL 17; Node 22+.

```bash
# 1. Database (once)
psql -U postgres -c "CREATE ROLE eneba LOGIN PASSWORD 'eneba_local' CREATEDB;"
psql -U postgres -c "CREATE DATABASE eneba OWNER eneba;"
psql -U postgres -c "CREATE DATABASE eneba_test OWNER eneba;"
psql -U postgres -d eneba -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"
psql -U postgres -d eneba_test -c "CREATE EXTENSION IF NOT EXISTS pg_trgm;"

# 2. API on http://localhost:8000
cd backend
cp .env.example .env        # set DB_PASSWORD=eneba_local (+ Stripe test keys if you have them)
composer setup              # install, APP_KEY, migrate and seed the demo catalog
php artisan serve

# 3. Frontend on http://localhost:5173 (new terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

**Demo account:** `demo@eneba.test` / `demo12345`. You can also register a new account.

**Test cards:**
- `4242 4242 4242 4242` succeeds.
- `4000 0000 0000 0002` is declined.
- Any future expiry date and any CVC work.

**Discount codes** (enter them on the cart page):
- `ENEBA10`: 10% off, up to €20.
- `WELCOME5`: €5 off orders of €25 or more.
- `GAMER15`: 15% off orders of €50 or more, up to €30.

### Tests

```bash
cd backend && php vendor/bin/pest      # feature tests: search, filters, homepage blocks, auth, checkout, wallet, discounts
cd frontend && npm test                 # component/unit tests
cd frontend && npm run lint && npm run typecheck
```

GitHub Actions (`.github/workflows/ci.yml`) runs both suites on every push.

## Deploying (free tiers)

1. **Neon**: create a project (Postgres 17) and copy the **direct** connection string, e.g. `postgresql://user:pass@ep-xxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`. The `pg_trgm` extension is created by the first migration.
2. **Render**: go to New → **Blueprint** and pick this repository. `render.yaml` creates the `eneba-api` Docker service. Fill in the secret variables:
   - `APP_KEY`: output of `php artisan key:generate --show`. Keep it stable, because purchased keys are encrypted with it.
   - `DB_URL`: the Neon string.
   - `APP_URL`: `https://eneba-api.onrender.com` (your service URL).
   - `FRONTEND_URL`: your Vercel URL (fill in after step 3).
   - `STRIPE_KEY` / `STRIPE_SECRET`: from https://dashboard.stripe.com/test/apikeys.

   The service runs in Frankfurt (`region` in `render.yaml`), so create the Neon project in AWS eu-central-1 (Frankfurt) too: the API makes many small queries, and a database on another continent makes it slow.

   The web server starts straight away. Migrations run alongside it on every boot, and on the very first boot the demo catalog is seeded in the background (about a minute, during which the store is empty). The seed runs in one transaction, so an interrupted seed leaves nothing behind and simply runs again on the next boot.
3. **Vercel**: Add New → Project → this repo, with **Root Directory** `frontend`. Add the env var `VITE_API_URL=https://eneba-api.onrender.com/api` and deploy. Then put the Vercel URL into Render's `FRONTEND_URL`.
4. **Stripe webhook** (optional but recommended): Workbench → Webhooks → Create an event destination.
   - Scope **Your account**, payload style **Snapshot** (the handler reads the PaymentIntent from the event), and the default API version.
   - Events: `payment_intent.succeeded` and `payment_intent.canceled`.
   - Destination type **Webhook endpoint**, URL `https://eneba-api.onrender.com/api/webhooks/stripe`.
   - Put the signing secret (`whsec_…`) into `STRIPE_WEBHOOK_SECRET` on Render. Until it is set, the endpoint returns 404.
5. **Keep-alive**: Render's free plan sleeps after 15 minutes without traffic, and the first request after that takes about 30–50 seconds. A free cron-job.org job calling `https://eneba-api.onrender.com/up` every 10 minutes keeps it awake. `/up` doesn't touch the database, so Neon can still suspend and save its free compute hours. Staying awake all month uses about 744 of Render's 750 free instance hours, so only one free service can be kept awake this way.

## API overview

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/products` | – | Store listing: `q, platform, region, type, genre, price_min, price_max, in_stock, sort, page` |
| GET | `/api/products/{slug}` | – | Product, all offers, versions, similar |
| GET | `/api/products/{slug}/reviews` · POST | – · ✔ | Reviews |
| GET | `/api/search/suggest?q=` | – | Autocomplete |
| GET | `/api/catalog/filters` · `/api/config` | – | Filter options · payment settings |
| GET | `/api/homepage` · `/api/homepage/blocks/{key}` | – | Layout · block content |
| GET | `/api/navigation` · `/api/settings` | – | Header nav · region/language/currency options |
| POST | `/api/auth/register` · `/login` · `/logout` | – · – · ✔ | Auth |
| GET/PATCH | `/api/auth/me` | ✔ | Profile |
| POST | `/api/cart/preview` | – | Price a guest cart |
| GET · POST · PATCH/DELETE | `/api/cart` · `/api/cart/items` · `/api/cart/items/{offer}` | ✔ | Account cart · add a line · change or remove a line |
| POST | `/api/checkout` | ✔ | Reserve keys, open payment |
| POST | `/api/orders/{number}/confirm` · `/cancel` | ✔ | Verify payment and deliver keys · cancel |
| POST | `/api/orders/{number}/wallet` · `/pay-with-wallet` | ✔ | Put wallet balance towards the order · pay it fully from the wallet |
| GET | `/api/orders` · `/api/orders/{number}` | ✔ | Order history |
| GET | `/api/keys` | ✔ | Keys library |
| POST | `/api/orders/{number}/keys/{id}/reveal` · `/refund` | ✔ | Reveal a key · refund an unrevealed key |
| GET/POST/DELETE | `/api/wishlist`, `/api/wishlist/{productId}` | ✔ | Wishlist |
| POST | `/api/webhooks/stripe` | signature | Stripe events |

## Project layout

```
backend/
  app/Services/Catalog/      ProductQuery (filters, facets, sorting), TextMatch (pg_trgm search)
  app/Services/Homepage/     BlockProvider interface + one provider per block source
  app/Services/Commerce/     CartService, DiscountService, CheckoutService (key reservation), OrderFulfillment, KeyRefunds, StockService
  app/Services/Payments/     PaymentGateway interface, StripeGateway, SimulatedGateway
  database/data/             games.json and steam-extras.json (from Steam), catalog.php (platforms, sellers, gift cards)
  Dockerfile, docker/        Render image (Apache + PHP 8.4)
frontend/
  src/components/home/       BlockRenderer + block components
  src/pages/                 Home, Store, Product, Cart, Checkout, Order(s), Wishlist, Auth, Account
  src/api/queries.ts         TanStack Query hooks for every API call
  src/hooks/useCart.ts       one cart API for guests (local) and signed-in users (server)
  src/stores/                Zustand stores: auth token, guest cart and wishlist, settings, discount code, toasts
  src/lib/                   API client, price formatting, Stripe loader, brand icons, link constants
render.yaml                  Render blueprint
```
