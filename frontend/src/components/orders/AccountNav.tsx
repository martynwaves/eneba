import clsx from 'clsx'
import { NavLink } from 'react-router'

const LINKS = [
  { to: '/account/orders', label: 'My orders' },
  { to: '/account/keys', label: 'Keys library' },
  { to: '/wishlist', label: 'Wishlist' },
  { to: '/account', label: 'Account settings', end: true },
]

export function AccountNav() {
  return (
    <nav aria-label="Account" className="scrollbar-none flex gap-1 overflow-x-auto border-b border-white/10">
      {LINKS.map((l) => (
        <NavLink
          key={l.to}
          to={l.to}
          end={l.end}
          className={({ isActive }) =>
            clsx('shrink-0 border-b-2 px-4 py-3 text-sm font-extrabold transition-colors', isActive ? 'border-cta text-white' : 'border-transparent text-muted hover:text-white')
          }
        >
          {l.label}
        </NavLink>
      ))}
    </nav>
  )
}
