import { useMutation } from '@tanstack/react-query'
import { BadgePercent, Globe, ShieldCheck, ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { ApiError, api } from '../../lib/api'
import { formatPrice } from '../../lib/format'
import type { Offer, ProductDetail } from '../../lib/types'
import { useAuth } from '../../stores/auth'
import { toast } from '../../stores/toast'
import { InfoTooltip } from '../home/Section'
import { Button } from '../ui/Button'
import { Cashback } from './OfferList'

const PAYMENT_LOGOS = [
  ['wallet', 'Eneba Wallet'],
  ['payrails_card', 'Visa and Mastercard'],
  ['braintree_paypal', 'PayPal'],
  ['payrails_apple_pay', 'Apple Pay'],
  ['payrails_google_pay', 'Google Pay'],
  ['nuvei_crypto', 'Crypto'],
] as const

/** Right-hand column of the product page: Trustpilot, the featured offer, trust badges, newsletter. */
export function BuySidebar({
  product,
  featured,
  cheapest,
  availableCount,
  pending,
  onBuy,
  onAdd,
  onMore,
}: {
  product: ProductDetail
  featured: Offer | null
  cheapest: Offer | null
  availableCount: number
  pending: boolean
  onBuy: (o: Offer) => void
  onAdd: (o: Offer) => void
  onMore: () => void
}) {
  return (
    <div className="space-y-2.5">
      <a
        href="https://www.trustpilot.com/review/eneba.com"
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-3 py-3 text-[19px] font-semibold"
      >
        <span className="underline">Excellent</span>
        <TrustpilotStars />
        <span className="flex items-center gap-1 text-sm font-semibold">
          <svg viewBox="0 0 24 24" className="size-5 text-[#00b67a]" fill="currentColor" aria-hidden="true">
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
          </svg>
          Trustpilot
        </span>
      </a>

      {featured ? (
        <div className="bg-brand-panel">
          <div className="px-6 pt-6 pb-6">
            <div className="text-[11px] font-extrabold tracking-wide text-cta uppercase">Featured offer</div>
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[38px] leading-10 font-extrabold">{formatPrice(featured.price)}</span>
              <span className="flex items-center gap-1.5 text-sm text-white/80">
                Price is not final <InfoTooltip text="Taxes and payment fees, if any, are shown at checkout." />
              </span>
            </div>
            {product.msrp && product.msrp > featured.price && (
              <div className="mt-1 text-sm font-extrabold">
                <span className="text-white/60 line-through">{formatPrice(product.msrp)}</span>{' '}
                <span className="text-lime">-{Math.round(100 - (featured.price / product.msrp) * 100)}%</span>
              </div>
            )}
            {featured.cashback_percent > 0 && <Cashback offer={featured} />}

            <button
              type="button"
              onClick={() => onBuy(featured)}
              aria-label="Pay with PayPal"
              className="mt-5 flex h-[42px] w-full items-center justify-center bg-white transition-opacity hover:opacity-90"
            >
              <img src="https://assets.eneba.games/payments/v1/color/braintree_paypal.svg" alt="PayPal" className="h-6" />
            </button>
            <div className="mt-4 flex gap-4">
              <Button block size="lg" loading={pending} onClick={() => onBuy(featured)}>
                Buy now
              </Button>
              <Button variant="outline" size="lg" onClick={() => onAdd(featured)} aria-label="Add to cart" className="px-3.5">
                <ShoppingCart className="size-5" />
                <span className="-ml-1 text-lg leading-none font-extrabold">+</span>
              </Button>
            </div>
          </div>
          {availableCount > 1 && cheapest && (
            <button type="button" onClick={onMore} className="w-full border-t border-white/15 py-4 text-center text-[15px] text-mint hover:underline">
              +{availableCount - 1} offers from {formatPrice(cheapest.price)}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-brand-panel p-6 text-center">
          <p className="text-lg font-extrabold">Sorry, sold out :(</p>
          <p className="mt-2 text-sm text-soft">This product is out of stock. Check the other versions or similar games below.</p>
          <Link to={`/store?q=${encodeURIComponent(product.base_title)}`} className="mt-4 inline-block text-sm font-extrabold text-cta hover:underline">
            Find other versions
          </Link>
        </div>
      )}

      <div className="bg-brand-panel px-6 py-6">
        <div className="text-[15px] font-extrabold">Safe Checkout Guaranteed</div>
        <div className="mt-3 text-[15px] text-white/80">Trusted Payment Methods</div>
        <div className="mt-3 grid grid-cols-[repeat(auto-fill,minmax(52px,1fr))] gap-1.5">
          {PAYMENT_LOGOS.map(([file, label]) => (
            <span key={file} className="grid h-8 place-items-center rounded-sm bg-white px-1.5" title={label}>
              <img src={`https://assets.eneba.games/payments/v1/color/${file}.svg`} alt={label} className="max-h-5 max-w-full" />
            </span>
          ))}
        </div>

        <div className="mt-6 border-t border-white/15 pt-6">
          <div className="text-[15px] text-white/80">Data Encryption & Protection</div>
          <div className="mt-3 flex items-center gap-2 text-[19px] font-black tracking-tight">
            <ShieldCheck className="size-7 fill-[#e8212b] text-white" />
            SCAMADVISER
          </div>
          <div className="mt-1 text-[15px] text-white/80">Trust score 100/100</div>
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-white/15 pt-6">
          <div className="flex items-center gap-2 text-[13px] leading-4 tracking-wide uppercase">
            <Globe className="size-8 shrink-0" strokeWidth={1.3} />
            <span>
              Safe checkout
              <br />
              <span className="text-mint">Guaranteed</span>
            </span>
          </div>
          <div className="flex items-center bg-[#e8212b] py-1.5 pr-4 pl-2 text-[11px] leading-3 font-extrabold tracking-[0.15em] uppercase [clip-path:polygon(0_0,92%_0,100%_50%,92%_100%,0_100%)]">
            <span className="mr-2 border-r border-white/60 pr-2 text-center text-lg leading-4 font-black tracking-normal">
              PC
              <br />
              <span className="text-[8px]">MAG</span>
            </span>
            Editor&apos;s
            <br />
            choice
          </div>
        </div>
      </div>

      <NewsletterBox />
    </div>
  )
}

function TrustpilotStars() {
  return (
    <span className="flex gap-[2px]" aria-label="Rated 4.4 out of 5 on Trustpilot">
      {[1, 1, 1, 1, 0.5].map((fill, i) => (
        <span key={i} className="relative grid size-[22px] place-items-center bg-[#dcdce6]">
          <span className="absolute inset-y-0 left-0 bg-[#00b67a]" style={{ width: `${fill * 100}%` }} />
          <svg viewBox="0 0 24 24" className="relative size-4" fill="white" aria-hidden="true">
            <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
          </svg>
        </span>
      ))}
    </span>
  )
}

/** "Looking for good deals?": signed-in buyers subscribe in one click, guests type an email. */
function NewsletterBox() {
  const user = useAuth((s) => s.user)
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)
  const subscribe = useMutation({
    mutationFn: (address: string) => api('/newsletter', { method: 'POST', body: { email: address } }),
    onSuccess: () => {
      setDone(true)
      toast.success('You are subscribed to the best deals!')
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not subscribe right now.'),
  })

  return (
    <div className="bg-brand-panel px-6 py-6">
      <div className="flex gap-3">
        <BadgePercent className="size-7 shrink-0 text-mint" strokeWidth={1.4} />
        <div className="min-w-0 flex-1">
          <div className="text-[15px] font-extrabold">Looking for good deals?</div>
          <div className="mt-1 text-[15px] text-white/80">Get them delivered to your inbox</div>
          {done ? (
            <p className="mt-4 text-sm font-extrabold text-mint">Subscribed. Watch your inbox!</p>
          ) : (
            <form
              className="mt-4 flex flex-col gap-2"
              onSubmit={(e) => {
                e.preventDefault()
                subscribe.mutate(user?.email ?? email)
              }}
            >
              {!user && (
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email"
                  aria-label="Email for deals newsletter"
                  className="h-10 bg-black/30 px-3 text-sm placeholder:text-white/50 focus:outline-2 focus:outline-cta"
                />
              )}
              <Button type="submit" loading={subscribe.isPending} className="self-start px-8">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
