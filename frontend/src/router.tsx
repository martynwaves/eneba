import { createBrowserRouter } from 'react-router'
import { AuthLayout } from './components/layout/AuthLayout'
import { CheckoutLayout } from './components/layout/CheckoutLayout'
import { Layout } from './components/layout/Layout'
import { RequireAuth } from './components/RequireAuth'
import { PageSpinner } from './components/ui/Spinner'
import { CartPage } from './pages/CartPage'
import { HomePage } from './pages/HomePage'
import { NotFoundPage } from './pages/NotFoundPage'
import { ProductPage } from './pages/ProductPage'
import { StorePage } from './pages/StorePage'

// Browsing pages ship in the main bundle; account, auth and payment pages load on demand.
const lazyPage = (load: () => Promise<{ Component: React.ComponentType }>) => ({ lazy: load, HydrateFallback: PageSpinner })

export const router = createBrowserRouter([
  {
    // Sign-in pages have Eneba's standalone layout, without the store header and footer.
    element: <AuthLayout />,
    children: [
      { path: 'login', ...lazyPage(() => import('./pages/AuthPages').then((m) => ({ Component: m.LoginPage }))) },
      { path: 'register', ...lazyPage(() => import('./pages/AuthPages').then((m) => ({ Component: m.RegisterPage }))) },
    ],
  },
  {
    // Cart and checkout use the focused checkout header with progress steps.
    element: <CheckoutLayout />,
    children: [
      { path: 'cart', element: <CartPage /> },
      {
        element: <RequireAuth />,
        children: [{ path: 'checkout', ...lazyPage(() => import('./pages/CheckoutPage').then((m) => ({ Component: m.CheckoutPage }))) }],
      },
    ],
  },
  {
    element: <Layout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'store', element: <StorePage /> },
      { path: 'wishlist', ...lazyPage(() => import('./pages/WishlistPage').then((m) => ({ Component: m.WishlistPage }))) },
      {
        // Account pages and order history are for signed-in users only.
        element: <RequireAuth />,
        children: [
          { path: 'account', ...lazyPage(() => import('./pages/AccountPage').then((m) => ({ Component: m.AccountPage }))) },
          { path: 'account/orders', ...lazyPage(() => import('./pages/OrdersPage').then((m) => ({ Component: m.OrdersPage }))) },
          { path: 'account/keys', ...lazyPage(() => import('./pages/KeysLibraryPage').then((m) => ({ Component: m.KeysLibraryPage }))) },
          { path: 'account/orders/:number', ...lazyPage(() => import('./pages/OrderPage').then((m) => ({ Component: m.OrderPage }))) },
        ],
      },
      // Product pages live at the root, like eneba.com/steam-elden-ring-pc-steam-key-global
      { path: ':slug', element: <ProductPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
])
