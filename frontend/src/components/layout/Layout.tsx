import { Fragment, type ReactNode } from 'react'
import { Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useSettings } from '../../stores/settings'
import { useUi } from '../../stores/ui'
import { AddedToCartModal } from '../cart/CartDropdown'
import { Footer } from './Footer'
import { Header } from './Header'
import { SettingsModal } from './SettingsModal'
import { Toaster } from './Toaster'

/** The store layout: full header with search and category bar. */
export function Layout() {
  const { pathname } = useLocation()

  return (
    <PageShell>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[200] focus:bg-cta focus:px-4 focus:py-2 focus:text-black"
      >
        Skip to content
      </a>
      <Header />
      {/* The homepage ends in a full-width band that meets the footer; other pages need room. */}
      <main id="main" className={pathname === '/' ? 'flex-1' : 'flex-1 pb-16'}>
        <Outlet />
      </main>
      <Footer />
    </PageShell>
  )
}

/** What the store and checkout layouts share: the page column and the app-wide overlays. */
export function PageShell({ children }: { children: ReactNode }) {
  const currency = useSettings((s) => s.currency.code)
  const { settingsOpen, closeSettings } = useUi()

  return (
    // Re-render every price when the display currency changes.
    <Fragment key={currency}>
      <div className="flex min-h-screen flex-col">{children}</div>
      <Toaster />
      <AddedToCartModal />
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
      <ScrollRestoration getKey={(location) => location.pathname} />
    </Fragment>
  )
}
