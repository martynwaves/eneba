import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Bot, CirclePlus, Gamepad2, Gem, Heart, LogOut, Menu, ShoppingCart, User as UserIcon, Wallet, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router'
import { useMe, useNavigation, useWishlist } from '../../api/queries'
import { useAuthActions } from '../../hooks/useAuthActions'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../lib/format'
import type { NavLink, User } from '../../lib/types'
import { useAuth } from '../../stores/auth'
import { useUi } from '../../stores/ui'
import { PlatformIcon } from '../ui/BrandIcon'
import { CartDropdown } from '../cart/CartDropdown'
import { SearchBox } from './SearchBox'
import { LocaleButton } from './SettingsModal'

export const LOGO_URL = 'https://static.eneba.games/branding/v2/logoFull.svg'

const CATEGORY_GROUPS = [
  {
    title: 'Products',
    links: [
      { label: 'Games', to: '/store?type=game' },
      { label: 'DLC', to: '/store?type=dlc' },
      { label: 'Gaming eCards', to: '/store?type=gift_card' },
      { label: 'eGift Cards', to: '/store?type=egift_card' },
      { label: 'Game points', to: '/store?type=game_points' },
      { label: 'E-money', to: '/store?type=e_money' },
      { label: 'Subscriptions', to: '/store?type=subscription' },
      { label: 'Software', to: '/store?type=software' },
    ],
  },
  {
    title: 'Platforms',
    links: [
      { label: 'Steam', to: '/store?platform=steam', platform: 'steam' },
      { label: 'PlayStation', to: '/store?platform=psn', platform: 'psn' },
      { label: 'Xbox', to: '/store?platform=xbox-live', platform: 'xbox-live' },
      { label: 'Nintendo', to: '/store?platform=nintendo-eshop', platform: 'nintendo-eshop' },
      { label: 'EA App', to: '/store?platform=ea-app', platform: 'ea-app' },
      { label: 'Ubisoft Connect', to: '/store?platform=ubisoft-connect', platform: 'ubisoft-connect' },
      { label: 'GOG', to: '/store?platform=gog', platform: 'gog' },
      { label: 'Epic Games', to: '/store?platform=epic-games', platform: 'epic-games' },
    ],
  },
  {
    title: 'Genres',
    links: [
      { label: 'Action', to: '/store?genre=action' },
      { label: 'Adventure', to: '/store?genre=adventure' },
      { label: 'RPG', to: '/store?genre=rpg' },
      { label: 'Strategy', to: '/store?genre=strategy' },
      { label: 'FPS / TPS', to: '/store?genre=fps' },
      { label: 'Simulation', to: '/store?genre=simulation' },
      { label: 'Indie', to: '/store?genre=indie' },
      { label: 'Racing', to: '/store?genre=racing' },
    ],
  },
]

export function Header() {
  const { count } = useCart()
  const user = useAuth((s) => s.user)
  const openSettings = useUi((s) => s.openSettings)
  const { data: navLinks } = useNavigation()
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const qc = useQueryClient()

  useEffect(() => setMenuOpen(false), [location.pathname, location.search])

  // On the homepage the logo refreshes it: back to the top with fresh block content.
  const onLogoClick = (e: React.MouseEvent) => {
    if (location.pathname !== '/') return
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
    qc.invalidateQueries({ queryKey: ['homepage'] })
    qc.invalidateQueries({ queryKey: ['homepage-block'] })
  }

  return (
    <header className="relative z-40">
      <div className="page-container">
        <div className="flex h-16 items-center gap-3 md:h-[72px] md:gap-5">
          <Link to="/" onClick={onLogoClick} className="shrink-0" aria-label="Eneba home">
            <img src={LOGO_URL} alt="Eneba logo" width={155} height={48} className="h-9 w-auto md:h-12" />
          </Link>

          <SearchBox className="hidden max-w-[480px] flex-1 md:block" />
          <LocaleButton onClick={openSettings} className="hidden shrink-0 py-2 lg:flex" />

          <div className="ml-auto flex items-center gap-1 md:gap-2">
            <Link to="/wishlist" className="grid size-11 place-items-center transition-colors hover:text-cta" aria-label="Wishlist">
              <Heart className="size-6" />
            </Link>
            <CartButton count={count} />
            {user ? <UserMenu user={user} /> : <GuestLinks />}
          </div>
        </div>

        <SearchBox className="pb-3 md:hidden" />
      </div>

      <nav className="bg-nav/60" aria-label="Main">
        <div className="page-container relative">
          <div className="scrollbar-none flex h-[50px] items-center overflow-x-auto">
            {(navLinks ?? []).map((link) => (
              <NavItem key={link.id} link={link} menuOpen={menuOpen} onToggleMenu={() => setMenuOpen((o) => !o)} />
            ))}
          </div>

          {menuOpen && (
            <div className="absolute inset-x-4 top-full z-50 grid gap-6 bg-brand-deep p-6 shadow-2xl shadow-black/50 md:inset-x-5 md:grid-cols-3">
              {CATEGORY_GROUPS.map((group) => (
                <div key={group.title}>
                  <h3 className="mb-3 text-xs font-extrabold tracking-wider text-muted uppercase">{group.title}</h3>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-1">
                    {group.links.map((l) => (
                      <li key={l.label}>
                        <Link to={l.to} className="flex items-center gap-2 py-1.5 text-sm font-semibold hover:text-cta">
                          {'platform' in l && l.platform && <PlatformIcon platform={l.platform} className="size-4" />}
                          {l.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>
    </header>
  )
}

/** Header cart icon: opens the "My shopping cart" dropdown instead of navigating. */
function CartButton({ count }: { count: number }) {
  const { cartOpen, setCartOpen } = useUi()
  const ref = useRef<HTMLDivElement>(null)
  const location = useLocation()

  useEffect(() => setCartOpen(false), [location.pathname, setCartOpen])
  useEffect(() => {
    if (!cartOpen) return
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setCartOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [cartOpen, setCartOpen])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setCartOpen(!cartOpen)}
        aria-expanded={cartOpen}
        aria-haspopup="dialog"
        className="relative grid size-11 place-items-center transition-opacity hover:opacity-75"
        aria-label={`Cart, ${count} items`}
      >
        <ShoppingCart className="size-6" />
        {count > 0 && (
          <span className="absolute top-0.5 right-0 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#c4122f] px-1 text-[11px] font-extrabold text-white">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>
      {cartOpen && <CartDropdown onClose={() => setCartOpen(false)} />}
    </div>
  )
}

function NavItem({ link, menuOpen, onToggleMenu }: { link: NavLink; menuOpen: boolean; onToggleMenu: () => void }) {
  const base = 'flex h-full shrink-0 items-center px-2.5 text-base font-semibold whitespace-nowrap text-soft transition-colors hover:text-white'

  if (link.style === 'menu') {
    return (
      <button type="button" onClick={onToggleMenu} aria-expanded={menuOpen} className={clsx(base, 'gap-2')}>
        {menuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        {link.label}
      </button>
    )
  }

  if (link.style === 'highlight') {
    return (
      <Link
        to={link.link_url}
        className="ml-2 shrink-0 rounded-[3px] border border-white/25 bg-linear-to-r from-[#d32252] to-[#3c1395] px-3 py-[7px] text-sm leading-none font-extrabold whitespace-nowrap transition-[filter] hover:brightness-125"
      >
        {link.label}
      </Link>
    )
  }

  return (
    <Link to={link.link_url} className={base}>
      {link.label}
    </Link>
  )
}

function GuestLinks() {
  const location = useLocation()
  const redirect = encodeURIComponent(location.pathname + location.search)
  return (
    <div className="flex items-center text-sm font-semibold">
      {/* The person icon belongs to "Log in", so both highlight together. */}
      <Link to={`/login?redirect=${redirect}`} className="flex items-center gap-1.5 px-1 py-2 transition-colors hover:text-cta">
        <UserIcon className="hidden size-5 sm:block" />
        Log in
      </Link>
      <span className="text-white/60">|</span>
      <Link to={`/register?redirect=${redirect}`} className="px-1 py-2 transition-colors hover:text-cta">
        Register
      </Link>
    </div>
  )
}

function Avatar({ className }: { className?: string }) {
  return (
    <span className={clsx('grid shrink-0 place-items-center rounded-full border border-white/40 bg-[#2b2f86] text-[#9fd8ff]', className)} aria-hidden="true">
      <Bot className="size-[60%]" strokeWidth={2} />
    </span>
  )
}

/** Eneba's account dropdown: avatar button, profile header, favourites, wallet and account links. */
function UserMenu({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const { logout } = useAuthActions()
  const location = useLocation()
  const { data: me } = useMe(open)
  const wishlistCount = useWishlist().data?.ids.length ?? me?.wishlist_count ?? 0
  const profile = me ?? user

  useEffect(() => setOpen(false), [location.pathname])
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Account menu for ${user.name}`}
        className="grid h-11 place-items-center px-1 transition-opacity hover:opacity-80"
      >
        <Avatar className="size-9" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute top-full -right-2 z-50 mt-3 w-[340px] bg-brand-panel px-6 py-5 shadow-2xl shadow-black/50 before:absolute before:-top-2.5 before:right-[22px] before:border-x-[10px] before:border-b-[10px] before:border-x-transparent before:border-b-brand-panel"
        >
          <div className="flex items-center gap-3 border-b border-white/15 pb-4">
            <Avatar className="size-12" />
            <div className="min-w-0">
              <div className="truncate text-base font-extrabold">{profile.name}</div>
              <div className="truncate text-[15px] text-soft">{profile.email}</div>
            </div>
          </div>

          <div className="border-b border-white/15 py-2">
            <MenuItem to="/wishlist" icon={<Heart />} value={<span>{wishlistCount}</span>}>
              Favorites
            </MenuItem>
          </div>

          <div className="pt-2">
            <MenuItem to="/account" icon={<UserIcon />}>
              My account
            </MenuItem>
            <MenuItem to="/account" icon={<Wallet />} value={<span className="font-extrabold text-green">{formatPrice(profile.cashback_balance ?? 0)}</span>}>
              Balance
            </MenuItem>
            <MenuItem
              to="/account"
              icon={<Gem />}
              value={
                <span className="flex items-center gap-1 font-extrabold text-green">
                  <Gem className="size-4" /> {profile.enebium ?? 0}
                </span>
              }
            >
              Enebium
            </MenuItem>
            <MenuItem to="/account" icon={<CirclePlus />} value={profile.cashback_earned ? <span className="font-extrabold text-green">{formatPrice(profile.cashback_earned)}</span> : undefined}>
              Cashback
            </MenuItem>
            <MenuItem to="/account/orders" icon={<ShoppingCart />}>
              Orders
            </MenuItem>
            <MenuItem to="/account/keys" icon={<Gamepad2 />}>
              Keys library
            </MenuItem>
            <button
              type="button"
              role="menuitem"
              onClick={() => logout.mutate()}
              className="flex w-full items-center gap-3 py-2.5 text-left text-base transition-opacity hover:opacity-75 [&>svg]:size-[22px] [&>svg]:stroke-[1.6]"
            >
              <LogOut />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function MenuItem({ to, icon, value, children }: { to: string; icon: React.ReactNode; value?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Link to={to} role="menuitem" className="flex items-center gap-3 py-2.5 text-base transition-opacity hover:opacity-75 [&>svg]:size-[22px] [&>svg]:stroke-[1.6]">
      {icon}
      <span className="flex-1">{children}</span>
      {value}
    </Link>
  )
}
