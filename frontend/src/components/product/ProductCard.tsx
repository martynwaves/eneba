import clsx from 'clsx'
import { CirclePlus, Heart, Info } from 'lucide-react'
import { Link } from 'react-router'
import { useCart } from '../../hooks/useCart'
import { useWishlistToggle } from '../../hooks/useWishlistToggle'
import { cashbackCents, formatPrice } from '../../lib/format'
import type { ProductCard as Product } from '../../lib/types'
import { PlatformIcon } from '../ui/BrandIcon'
import { ProductArt } from './ProductArt'
import { WishRibbon } from './WishRibbon'

/**
 * Eneba product card. Cover with a cashback badge and platform strip; below it the title,
 * region, "From" price and cashback. On hover the cover dims and the details slide up to
 * reveal "Add to cart" and "View offers".
 */
export function ProductCard({ product, eager }: { product: Product; eager?: boolean }) {
  const { add } = useCart()
  const wishlist = useWishlistToggle(product.id)
  const href = `/${product.slug}`
  const canBuy = product.best_offer_id !== null

  return (
    <article className="group relative flex h-full flex-col overflow-hidden bg-brand-deep">
      <div className="relative aspect-[223/312] shrink-0 overflow-hidden">
        <Link to={href} tabIndex={-1} aria-hidden="true" className="block h-full">
          <ProductArt title={product.title} coverUrl={product.cover_url} headerUrl={product.header_url} art={product.art} eager={eager} />
        </Link>
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/25" />

        {product.is_preorder && (
          <span className="absolute top-2.5 left-2.5 bg-cta px-2 py-1 text-[11px] font-extrabold text-black uppercase">Pre-order</span>
        )}
        {!product.in_stock && <span className="absolute top-2.5 left-2.5 bg-black/75 px-2 py-1 text-[11px] font-extrabold uppercase">Sold out</span>}

        <button
          type="button"
          onClick={wishlist.toggle}
          aria-label={wishlist.saved ? `Remove ${product.title} from wishlist` : `Add ${product.title} to wishlist`}
          aria-pressed={wishlist.saved}
          className={clsx(
            // Saved: Eneba's green ribbon with a white heart. Hovering outlines the ribbon on a
            // darkened background (and takes the green away from a saved one).
            'group/wish absolute top-0 right-2.5 z-10 flex h-[54px] w-[44px] items-center justify-center pb-2.5 transition-opacity',
            wishlist.saved ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100',
          )}
        >
          <WishRibbon saved={wishlist.saved} />
          <Heart className={clsx('relative size-6', wishlist.saved ? 'fill-white text-white' : 'drop-shadow')} />
        </button>
      </div>

      <div className="relative z-10 flex flex-1 flex-col bg-brand-deep transition-transform duration-300 ease-out md:group-hover:-translate-y-[106px] md:group-has-[:focus-visible]:-translate-y-[106px]">
        {/* Cashback badge and store strip sit on the cover's bottom edge and rise with the details. */}
        {product.cashback_percent > 0 && (
          <span className="pointer-events-none absolute bottom-[calc(100%+32px)] left-0 flex items-center gap-1.5 bg-mint px-[7px] py-[7px] text-xs leading-3 font-extrabold text-brand-deep uppercase">
            <CirclePlus className="size-4" strokeWidth={2.2} />
            Cashback
          </span>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-full flex h-[32px] items-center justify-center gap-1.5 bg-[#1a0840]/85 px-2 text-xs font-extrabold">
          <PlatformIcon platform={product.platform.slug} className="size-4" />
          <span className="truncate">{product.platform.name}</span>
        </div>

        <Link to={href} className="flex flex-1 flex-col px-[15px] pt-[15px] pb-[15px]">
          <h3 className="line-clamp-2 min-h-9 text-xs leading-[18px] font-extrabold">{product.title}</h3>
          <div className="mt-2.5 truncate text-xs leading-3 font-extrabold uppercase" style={{ color: product.region.color }}>
            {product.region.name}
          </div>
          <div className="mt-auto pt-4">
            {product.min_price !== null ? (
              <>
                <div className="flex items-center gap-1 text-xs leading-3 font-extrabold text-muted">
                  <span>From</span>
                  {product.discount_percent && product.discount_percent > 0 ? (
                    <>
                      <span className="line-through">{formatPrice(product.msrp)}</span>
                      <span className="text-lime">-{product.discount_percent}%</span>
                    </>
                  ) : null}
                </div>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className="text-[22px] leading-[22px] font-extrabold">{formatPrice(product.min_price)}</span>
                  <Info className="size-4 text-white/60" aria-label="Price is not final" />
                </div>
                {product.cashback_percent > 0 && <CashbackLine price={product.min_price} percent={product.cashback_percent} />}
              </>
            ) : (
              <div className="text-sm font-extrabold text-muted">Out of stock</div>
            )}
          </div>
        </Link>

        {/* Slides into view on hover; hidden below the card otherwise. */}
        <div className="absolute inset-x-0 top-full hidden flex-col gap-2.5 bg-brand-deep px-[15px] pb-[15px] opacity-0 transition-opacity duration-300 group-has-[:focus-visible]:opacity-100 group-hover:opacity-100 md:flex">
          <button
            type="button"
            disabled={!canBuy || add.isPending}
            onClick={() => canBuy && add.mutate({ offerId: product.best_offer_id! })}
            className="h-10 bg-cta text-[15px] font-extrabold text-black transition-colors hover:bg-cta-hover disabled:opacity-50"
            aria-label={`Add to cart - ${product.title}`}
          >
            Add to cart
          </button>
          <Link
            to={`${href}#offers`}
            className="flex h-10 items-center justify-center border border-white text-[15px] font-extrabold transition-colors hover:bg-white hover:text-brand-deep"
          >
            View offers
          </Link>
        </div>
      </div>
    </article>
  )
}

function CashbackLine({ price, percent }: { price: number; percent: number }) {
  const amount = cashbackCents(price, percent)
  return (
    <div className="mt-2 text-xs leading-3 font-extrabold text-lime">
      {amount >= 100 ? `Cashback: ${formatPrice(amount)}` : `${percent}% Cashback`}
    </div>
  )
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-brand-deep">
      <div className="skeleton aspect-[223/312]" />
      <div className="space-y-2 p-[15px]">
        <div className="skeleton h-3 w-full" />
        <div className="skeleton h-3 w-2/3" />
        <div className="skeleton mt-4 h-3 w-1/3" />
        <div className="skeleton h-5 w-1/2" />
      </div>
    </div>
  )
}
