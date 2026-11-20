# Eneba Marketplace – Frontend

React 19 + TypeScript storefront, built with Vite. See the [root README](../README.md) for features, local setup and deployment.

```bash
npm install
cp .env.example .env       # VITE_API_URL points at the Laravel API, including /api
npm run dev                # http://localhost:5173
```

| Script | What it does |
|---|---|
| `npm run build` | Type-checks and builds to `dist/` (what Vercel runs) |
| `npm test` | Vitest component and unit tests |
| `npm run lint` | Oxlint |
| `npm run typecheck` | TypeScript only |

`VITE_API_URL` is baked in at build time, so changing it on Vercel needs a redeploy.

Layout:

- `src/pages/` – one component per route (`src/router.tsx`)
- `src/components/` – home blocks, product page, cart, checkout, layout and shared UI
- `src/api/queries.ts` – TanStack Query hooks for every API call
- `src/stores/` – Zustand stores (auth token, guest cart and wishlist, settings, discount code, toasts)
- `src/hooks/useCart.ts` – one cart API for guests (local) and signed-in users (server)
- `src/lib/` – API client, price formatting, Stripe loader, brand icons and link constants
