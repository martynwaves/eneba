import clsx from 'clsx'
import { Check } from 'lucide-react'
import { Fragment } from 'react'
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { useSettings } from '../../stores/settings'
import { useUi } from '../../stores/ui'
import { AddedToCartModal } from '../cart/CartDropdown'
import { Footer } from './Footer'
import { LOGO_URL } from './Header'
import { LocaleButton, SettingsModal } from './SettingsModal'
import { Toaster } from './Toaster'

const STEPS = ['Cart', 'Payment', 'Get your product']

/** Eneba's focused checkout chrome: logo, progress steps and locale, no store navigation. */
export function CheckoutLayout() {
  const { pathname } = useLocation()
  const currency = useSettings((s) => s.currency.code)
  const { settingsOpen, openSettings, closeSettings } = useUi()
  const current = pathname.startsWith('/checkout') ? 2 : 1

  return (
    <Fragment key={currency}>
      <div className="flex min-h-screen flex-col">
        <header className="bg-[#3a1291]">
          <div className="mx-auto flex h-[74px] max-w-[1440px] items-center gap-6 px-4 md:px-10 xl:px-[200px]">
            <Link to="/" aria-label="Eneba home" className="shrink-0">
              <img src={LOGO_URL} alt="Eneba logo" width={155} height={48} className="h-9 w-auto md:h-11" />
            </Link>
            <CheckoutSteps current={current} />
            <LocaleButton onClick={openSettings} className="hidden shrink-0 lg:flex" />
          </div>
        </header>
        <main className="flex-1 pb-16">
          <Outlet />
        </main>
        <Footer />
      </div>
      <Toaster />
      <AddedToCartModal />
      {settingsOpen && <SettingsModal onClose={closeSettings} />}
      <ScrollRestoration getKey={(location) => location.pathname} />
    </Fragment>
  )
}

export function CheckoutSteps({ current }: { current: 1 | 2 | 3 }) {
  return (
    <ol className="flex flex-1 items-center gap-3 text-[13px] md:text-sm" aria-label="Checkout progress">
      {STEPS.map((label, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'current' : 'todo'
        return (
          <li key={label} className={clsx('flex items-center gap-3', n < STEPS.length && 'flex-1')} aria-current={state === 'current' ? 'step' : undefined}>
            <span
              className={clsx(
                'grid size-7 shrink-0 place-items-center rounded-full text-xs font-extrabold',
                state === 'current' && 'bg-green text-white',
                state === 'done' && 'border-2 border-green text-green',
                state === 'todo' && 'bg-white/25 text-white/50',
              )}
            >
              {state === 'done' ? <Check className="size-4" strokeWidth={3} /> : n}
            </span>
            <span className={clsx('hidden whitespace-nowrap sm:inline', state === 'current' && 'text-green', state === 'todo' && 'text-white/40')}>{label}</span>
            {n < STEPS.length && <span className={clsx('hidden h-px flex-1 sm:block', state === 'todo' ? 'bg-white/25' : 'bg-green/60')} />}
          </li>
        )
      })}
    </ol>
  )
}
