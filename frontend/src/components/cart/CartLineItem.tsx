import clsx from 'clsx'
import { AlertTriangle, Ban, CircleHelp, Heart, Trash2 } from 'lucide-react'
import { Link } from 'react-router'
import { useSettingsOptions } from '../../api/queries'
import { useCart } from '../../hooks/useCart'
import { useWishlistToggle } from '../../hooks/useWishlistToggle'
import { formatPrice } from '../../lib/format'
import type { CartLine } from '../../lib/types'
import { useSettings } from '../../stores/settings'
import { SellerAvatar } from '../product/OfferList'
import { ProductArt } from '../product/ProductArt'

/** Whether a key's region can be redeemed in the visitor's chosen country. */
export function useRegionCheck() {
  const region = useSettings((s) => s.region)
  const { data: options } = useSettingsOptions()
  const country = options?.regions.find((r) => r.code === region)
  return (productRegion: string) => ({
    ok: !country || country.product_regions.includes(productRegion),
    country: country?.name ?? '',
  })
}

/** Small "?" tooltip used for "Digital product" and "Service fee". */
export function HelpTip({ text }: { text: string }) {
  return (
    <span className="group/tip relative inline-flex align-middle">
      <CircleHelp className="size-4 text-white/70" aria-label={text} />
      <span className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden w-56 -translate-x-1/2 bg-[#221f2e] px-3 py-2 text-xs leading-5 font-normal text-white shadow-xl group-hover/tip:block">
        {text}
      </span>
    </span>
  )
}

/**
 * One cart line: seller, title, region warning, quantity stepper, price and cashback.
 * `compact` is the header dropdown; `full` is the cart and checkout pages.
 */
export function CartLineItem({ line, variant }: { line: CartLine; variant: 'compact' | 'full' }) {
  const { update, remove } = useCart()
  const wishlist = useWishlistToggle(line.product.id)
  const regionCheck = useRegionCheck()(line.product.region.slug)
  const full = variant === 'full'
  const cashback = Math.floor((line.line_total * (line.cashback_percent ?? 0)) / 100)
  const max = Math.min(10, Math.max(line.available_stock, 1))

  return (
    <div className={clsx('flex gap-4', full ? 'bg-black/25 px-0 pr-6' : '')}>
      <Link to={`/${line.product.slug}`} className={clsx('shrink-0 overflow-hidden', full ? 'aspect-[105/148] w-[105px]' : 'aspect-[76/108] w-[76px]')}>
        <ProductArt title={line.product.title} coverUrl={line.product.cover_url} headerUrl={line.product.header_url} art={line.product.art} />
      </Link>

      <div className={clsx('min-w-0 flex-1', full && 'py-4')}>
        <div className="flex items-center gap-2">
          {full && <span className="text-[13px] font-extrabold">Sold by</span>}
          <SellerAvatar seller={line.seller} size="sm" />
          <span className="truncate text-[13px] font-extrabold">{line.seller.name}</span>
          <div className="ml-auto flex items-center">
            {full && (
              <>
                <button type="button" onClick={wishlist.toggle} aria-label={wishlist.saved ? 'Remove from wishlist' : 'Add to wishlist'} className="p-1 transition-opacity hover:opacity-70">
                  <Heart className={clsx('size-5', wishlist.saved && 'fill-white')} strokeWidth={1.6} />
                </button>
                <span className="mx-1.5 h-5 w-px bg-white/30" />
              </>
            )}
            <button type="button" onClick={() => remove.mutate(line.offer_id)} aria-label={`Remove ${line.product.title}`} className="p-1 transition-opacity hover:opacity-70">
              <Trash2 className="size-5" strokeWidth={1.6} />
            </button>
          </div>
        </div>

        <Link to={`/${line.product.slug}`} className={clsx('mt-2 block font-extrabold hover:underline', full ? 'text-[15px] leading-6' : 'text-base leading-6')}>
          {line.product.title}
        </Link>

        {!regionCheck.ok && (
          <p className="mt-1 text-[13px] leading-5">
            <span className="inline-flex items-center gap-1 text-danger">
              <Ban className="size-3.5" /> Can't be activated in {regionCheck.country}
            </span>{' '}
            <Link to={`/store?q=${encodeURIComponent(line.product.base_title)}`} className="font-semibold text-cta underline">
              Find one for your country
            </Link>
          </p>
        )}

        <div className="mt-1.5 flex items-center gap-1.5 text-[13px] text-soft">
          Digital product <HelpTip text="You'll get a digital key in your account right after payment." />
        </div>

        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-base" role="group" aria-label="Quantity">
            <button type="button" disabled={line.quantity <= 1 || update.isPending} onClick={() => update.mutate({ offerId: line.offer_id, quantity: line.quantity - 1 })} className="px-1 disabled:opacity-40" aria-label="Decrease quantity">
              -
            </button>
            <span className="w-4 text-center font-semibold" aria-live="polite">
              {line.quantity}
            </span>
            <button type="button" disabled={line.quantity >= max || update.isPending} onClick={() => update.mutate({ offerId: line.offer_id, quantity: line.quantity + 1 })} className="px-1 font-bold disabled:opacity-40" aria-label="Increase quantity">
              +
            </button>
          </div>
          <span className="text-base font-extrabold">{formatPrice(line.line_total)}</span>
        </div>

        {cashback > 0 && <p className="mt-2 text-[13px] text-lime">Cashback: {formatPrice(cashback)}</p>}
        {line.problem && (
          <p className="mt-2 flex items-center gap-1.5 text-xs font-extrabold text-danger">
            <AlertTriangle className="size-4" />
            {line.problem === 'out_of_stock' ? 'This offer is sold out. Remove it or pick another seller.' : `Only ${line.available_stock} left from this seller.`}
          </p>
        )}
      </div>
    </div>
  )
}

/** Total cashback across the cart's lines. */
export function cartCashback(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + Math.floor((l.line_total * (l.cashback_percent ?? 0)) / 100), 0)
}
