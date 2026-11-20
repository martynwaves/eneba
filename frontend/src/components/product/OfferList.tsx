import clsx from 'clsx'
import { BadgeCheck, CirclePlus, Star } from 'lucide-react'
import { useState } from 'react'
import { formatPrice } from '../../lib/format'
import type { Offer, Seller } from '../../lib/types'
import { Button } from '../ui/Button'
import { HelpTip, InfoTooltip } from '../ui/Tooltip'

const PRICE_NOTE = 'Price is not final. Taxes and payment fees, if any, are shown at checkout.'
const OTHERS_STEP = 3

export function SellerAvatar({ seller, size = 'md' }: { seller: Seller; size?: 'sm' | 'md' }) {
  return (
    <span
      className={clsx('grid shrink-0 place-items-center rounded-full font-extrabold text-black', size === 'md' ? 'size-12 text-lg' : 'size-7 text-xs')}
      style={{ background: seller.avatar_color }}
      aria-hidden="true"
    >
      {seller.name.slice(0, 1)}
    </span>
  )
}

function SellerLine({ seller }: { seller: Seller }) {
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1.5 text-[17px] font-semibold">
        <span className="truncate">{seller.name}</span>
        {seller.is_verified && <BadgeCheck className="size-5 shrink-0 fill-green text-brand-ink" aria-label="Verified seller" />}
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1 text-[13px] font-extrabold">
        <Star className="size-4 fill-cta text-cta" aria-hidden="true" />
        <span>{seller.rating.toFixed(2)}</span>
        <span className="whitespace-nowrap">{seller.rating_label}</span>
        <span className="font-semibold">rating</span>
        <HelpTip text={`Based on ${seller.rating_count.toLocaleString('en')} buyer ratings of ${seller.name}.`} />
      </div>
    </div>
  )
}

/**
 * "€35.79 ⓘ" with the pills and cashback line Eneba shows under each price. On phones it takes
 * its own full-width line under the seller, so neither has to squeeze next to the other.
 */
function OfferPrice({ offer }: { offer: Offer }) {
  return (
    <div className="w-full md:w-auto md:text-right">
      <div className="flex items-center gap-1.5 text-[22px] leading-7 font-extrabold md:justify-end">
        {formatPrice(offer.price)}
        <InfoTooltip text={PRICE_NOTE} />
      </div>
      {offer.is_lowest && (
        <div className="mt-1">
          <Badge>Lowest price</Badge>
        </div>
      )}
      {offer.cashback_percent > 0 && (
        <div className="flex md:justify-end">
          <Cashback offer={offer} />
        </div>
      )}
      {offer.in_stock && offer.stock <= 3 && <div className="mt-1 text-xs font-extrabold text-danger">Only {offer.stock} left</div>}
    </div>
  )
}

/** "⊕ 14% Cashback [Best cashback]" line. */
export function Cashback({ offer }: { offer: Offer }) {
  return (
    <div className={clsx('mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[15px] font-extrabold', offer.is_best_cashback ? 'text-lime' : 'text-white/70')}>
      <CirclePlus className="size-4" strokeWidth={1.8} />
      {offer.cashback_percent}% Cashback
      {offer.is_best_cashback && <Badge tone="lime">Best cashback</Badge>}
    </div>
  )
}

/**
 * Every seller's offer for the product, so buyers can compare price and reputation:
 * Eneba's "Recommended offers" (featured + best-rated seller) and "N other offers".
 */
export function OfferList({
  offers,
  featuredId,
  coverUrl,
  onBuy,
  pendingId,
}: {
  offers: Offer[]
  featuredId: number | null
  coverUrl: string | null
  onBuy: (offer: Offer) => void
  pendingId: number | null
}) {
  const [shown, setShown] = useState(OTHERS_STEP)
  const available = offers.filter((o) => o.in_stock)
  const featured = available.find((o) => o.id === featuredId)
  const bestRated = available.filter((o) => o !== featured).sort((a, b) => b.seller.rating - a.seller.rating)[0]
  const recommended = [featured, bestRated].filter((o): o is Offer => Boolean(o))
  const others = available.filter((o) => !recommended.includes(o)).sort((a, b) => a.price - b.price)
  const soldOut = offers.filter((o) => !o.in_stock)
  const more = others.length - shown

  return (
    <div className="space-y-10">
      {recommended.length > 0 && (
        <OfferGroup title="Recommended offers" info="The featured offer balances price and seller rating; next to it is the best-rated other seller.">
          {recommended.map((o) => (
            <OfferRow key={o.id} offer={o} featured={o === featured} coverUrl={coverUrl} onBuy={onBuy} pending={pendingId === o.id} />
          ))}
        </OfferGroup>
      )}
      {others.length > 0 && (
        <OfferGroup
          title={
            <>
              <span className="text-mint">{others.length}</span> other {others.length === 1 ? 'offer' : 'offers'}
            </>
          }
          info="All other sellers offering this product, cheapest first."
        >
          {others.slice(0, shown).map((o) => (
            <OfferRow key={o.id} offer={o} onBuy={onBuy} pending={pendingId === o.id} />
          ))}
        </OfferGroup>
      )}
      {more > 0 && (
        <div className="-mt-4 flex justify-center">
          <Button variant="outline" onClick={() => setShown(others.length)}>
            Load {more} more {more === 1 ? 'offer' : 'offers'}
          </Button>
        </div>
      )}
      {soldOut.length > 0 && (
        <OfferGroup title={<span className="text-white/60">Sold out</span>}>
          {soldOut.map((o) => (
            <OfferRow key={o.id} offer={o} onBuy={onBuy} pending={false} />
          ))}
        </OfferGroup>
      )}
    </div>
  )
}

function OfferGroup({ title, info, children }: { title: React.ReactNode; info?: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-4 flex items-center gap-2 text-[21px] font-extrabold">
        {title}
        {info && <InfoTooltip text={info} />}
      </h2>
      <ul className="space-y-2.5">{children}</ul>
    </section>
  )
}

function OfferRow({
  offer,
  featured = false,
  coverUrl = null,
  onBuy,
  pending,
}: {
  offer: Offer
  featured?: boolean
  coverUrl?: string | null
  onBuy: (o: Offer) => void
  pending: boolean
}) {
  return (
    <li className={clsx('flex flex-wrap items-center gap-x-5 gap-y-4 bg-black/25 px-5 py-6 md:flex-nowrap md:px-6', !offer.in_stock && 'opacity-55')}>
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {featured ? (
          <>
            <span className="size-12 shrink-0 overflow-hidden rounded-full bg-brand-deep">
              {coverUrl && <img src={coverUrl} alt="" className="h-full w-full object-cover" />}
            </span>
            <div>
              <div className="text-[17px] font-semibold">Featured offer</div>
              <div className="mt-0.5 text-[15px] text-white/80">
                {/* The featured offer isn't always from a verified seller, so only claim it when true. */}
                {offer.seller.is_verified && (
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <BadgeCheck className="size-4 shrink-0 text-mint" /> Verified by Eneba
                  </div>
                )}
                <div>
                  Sold by <span className="font-semibold text-white">{offer.seller.name}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <>
            <SellerAvatar seller={offer.seller} />
            <SellerLine seller={offer.seller} />
          </>
        )}
      </div>

      <OfferPrice offer={offer} />

      <Button variant="outline" className="w-full md:w-auto md:px-3" disabled={!offer.in_stock} loading={pending} onClick={() => onBuy(offer)}>
        Buy now
      </Button>
    </li>
  )
}

function Badge({ children, tone = 'white' }: { children: React.ReactNode; tone?: 'white' | 'lime' }) {
  return (
    <span
      className={clsx(
        'inline-block rounded-[10px] border px-[7px] py-[3px] text-[11px] leading-[11px] font-extrabold whitespace-nowrap',
        tone === 'lime' ? 'border-lime text-lime' : 'border-white text-white',
      )}
    >
      {children}
    </span>
  )
}
