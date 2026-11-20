import { Globe, ShieldCheck, ShoppingCart } from 'lucide-react'
import { Link } from 'react-router'
import { formatPrice } from '../../lib/format'
import { TRUSTPILOT_URL, paymentLogo } from '../../lib/links'
import type { Offer, ProductDetail } from '../../lib/types'
import { Button } from '../ui/Button'
import { StarIcon } from '../ui/Stars'
import { InfoTooltip } from '../ui/Tooltip'
import { TrustpilotStars } from '../ui/TrustpilotStars'
import { Cashback, SellerAvatar } from './OfferList'

const PAYMENT_LOGOS = [
  ['wallet', 'Eneba Wallet'],
  ['payrails_card', 'Visa and Mastercard'],
  ['braintree_paypal', 'PayPal'],
  ['payrails_apple_pay', 'Apple Pay'],
  ['payrails_google_pay', 'Google Pay'],
  ['nuvei_crypto', 'Crypto'],
] as const

/** Right-hand column of the product page: Trustpilot, the featured offer, trust badges. */
export function BuySidebar({
  product,
  featured,
  cheapestOther,
  otherCount,
  pending,
  adding,
  onBuy,
  onAdd,
  onMore,
}: {
  product: ProductDetail
  featured: Offer | null
  /** The cheapest in-stock offer besides the featured one, and how many such offers there are. */
  cheapestOther: Offer | null
  otherCount: number
  pending: boolean
  /** An "Add to cart" request is on its way; a second click would add the key twice. */
  adding: boolean
  onBuy: (o: Offer) => void
  onAdd: (o: Offer) => void
  onMore: () => void
}) {
  return (
    <div className="space-y-2.5">
      <a
        href={TRUSTPILOT_URL}
        target="_blank"
        rel="noreferrer"
        className="flex items-center justify-center gap-3 py-3 text-[19px] font-semibold"
      >
        <span className="underline">Excellent</span>
        <TrustpilotStars />
        <span className="flex items-center gap-1 text-sm font-semibold">
          <StarIcon className="size-5 text-[#00b67a]" />
          Trustpilot
        </span>
      </a>

      {featured ? (
        <div className="bg-brand-panel">
          <div className="px-6 pt-6 pb-6">
            <div className="text-[11px] font-extrabold tracking-wide text-cta uppercase">Featured offer</div>
            <div className="mt-2 flex items-center gap-2 text-sm text-white/80">
              <SellerAvatar seller={featured.seller} size="sm" />
              <span className="min-w-0 truncate">
                Sold by <span className="font-extrabold text-white">{featured.seller.name}</span>
              </span>
            </div>
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

            <div className="mt-5 flex gap-4">
              <Button block size="lg" loading={pending} onClick={() => onBuy(featured)}>
                Buy now
              </Button>
              <Button variant="outline" size="lg" onClick={() => onAdd(featured)} disabled={adding} aria-label="Add to cart" className="px-3.5">
                <ShoppingCart className="size-5" />
                <span className="-ml-1 text-lg leading-none font-extrabold">+</span>
              </Button>
            </div>
          </div>
          {cheapestOther && (
            <button type="button" onClick={onMore} className="w-full border-t border-white/15 py-4 text-center text-[15px] text-mint hover:underline">
              +{otherCount} {otherCount === 1 ? 'offer' : 'offers'} from {formatPrice(cheapestOther.price)}
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
              <img src={paymentLogo(file)} alt={label} className="max-h-5 max-w-full" />
            </span>
          ))}
        </div>

        <div className="mt-6 border-t border-white/15 pt-6">
          <div className="text-[15px] text-white/80">Data Encryption & Protection</div>
          <div className="mt-3 flex items-center gap-2 text-[19px] font-extrabold tracking-tight">
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
            <span className="mr-2 border-r border-white/60 pr-2 text-center text-lg leading-4 font-extrabold tracking-normal">
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
    </div>
  )
}
