import clsx from 'clsx'
import { Ban, ChevronRight, CircleCheck, Heart, Home, KeyRound, ReceiptEuro } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { useProduct } from '../api/queries'
import { useRegionCheck } from '../components/cart/CartLineItem'
import { BuySidebar } from '../components/product/BuySidebar'
import { Gallery } from '../components/product/Gallery'
import { OfferList } from '../components/product/OfferList'
import { ProductArt } from '../components/product/ProductArt'
import { WishRibbon } from '../components/product/WishRibbon'
import { ProductGrid } from '../components/product/ProductRow'
import { OtherDetails, ProductDetailsSection, SystemRequirements } from '../components/product/ProductSections'
import { Reviews } from '../components/product/Reviews'
import { PlatformIcon } from '../components/ui/BrandIcon'
import { Button } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { useCart } from '../hooks/useCart'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useWishlistToggle } from '../hooks/useWishlistToggle'
import { ApiError } from '../lib/api'
import { TYPE_LABELS, formatCount, formatPrice } from '../lib/format'
import type { Offer, ProductDetail } from '../lib/types'
import { useAuth } from '../stores/auth'
import { NotFoundPage } from './NotFoundPage'

const OS_NAMES: Record<string, string> = { windows: 'Windows', mac: 'Mac', linux: 'Linux' }
const ALSO_VIEWED_STEP = 5

export function ProductPage() {
  const { slug } = useParams()
  const { data: product, isLoading, error } = useProduct(slug)
  useDocumentTitle(product?.title)

  if (isLoading) return <PageSpinner />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
  if (!product) {
    return <div className="page-container py-20 text-center text-muted">{error?.message ?? 'Could not load this product.'}</div>
  }
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }: { product: ProductDetail }) {
  const navigate = useNavigate()
  const signedIn = useAuth((s) => s.token !== null)
  const { add } = useCart()
  const [buyingId, setBuyingId] = useState<number | null>(null)
  const [detailsTab, setDetailsTab] = useState<'description' | 'activation'>('description')
  const [alsoViewed, setAlsoViewed] = useState(ALSO_VIEWED_STEP)

  const featured = product.offers.find((o) => o.id === product.featured_offer_id) ?? null
  const available = product.offers.filter((o) => o.in_stock)
  const cheapest = available.reduce<Offer | null>((min, o) => (!min || o.price < min.price ? o : min), null)

  const addToCart = (offer: Offer) => add.mutate({ offerId: offer.id, title: product.base_title })

  // "Buy now" = add to cart and go straight on: checkout if signed in, cart (then sign-in) if not.
  const buyNow = async (offer: Offer) => {
    setBuyingId(offer.id)
    try {
      await add.mutateAsync({ offerId: offer.id, title: product.base_title, silent: true })
      navigate(signedIn ? '/checkout' : '/cart')
    } finally {
      setBuyingId(null)
    }
  }

  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const openActivationGuide = () => {
    setDetailsTab('activation')
    scrollTo('product-details')
  }

  return (
    <div className="mx-auto w-full max-w-[2000px] px-4 pt-5 md:px-8 md:pt-7 2xl:px-[54px]">
      <Breadcrumbs product={product} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1fr)_410px] xl:gap-9">
        <div className="min-w-0 space-y-12">
          <div className="space-y-9">
            <ProductSummary product={product} featured={featured} onActivationGuide={openActivationGuide} />
            <Gallery screenshots={product.screenshots} title={product.base_title} trailer={product.trailer} steamAppId={product.steam_app_id} />
          </div>

          <div id="offers" className="scroll-mt-4">
            {product.offers.length > 0 ? (
              <OfferList offers={product.offers} featuredId={product.featured_offer_id} coverUrl={product.cover_url ?? product.header_url} onBuy={buyNow} pendingId={buyingId} />
            ) : (
              <p className="bg-black/25 p-6 text-white/70">No sellers are offering this product right now.</p>
            )}
          </div>

          {product.similar.length > 0 && (
            <section aria-label="Gamers also viewed">
              <h2 className="mb-5 text-[21px] font-extrabold">Gamers also viewed</h2>
              <ProductGrid products={product.similar.slice(0, alsoViewed)} />
              {alsoViewed < product.similar.length && (
                <div className="mt-12 flex justify-center">
                  <Button variant="outline" onClick={() => setAlsoViewed((n) => n + ALSO_VIEWED_STEP)}>
                    Load more
                  </Button>
                </div>
              )}
            </section>
          )}

          <Reviews slug={product.slug} />
          <ProductDetailsSection product={product} tab={detailsTab} onTab={setDetailsTab} />
          <SystemRequirements product={product} />
          <OtherDetails product={product} />
        </div>

        <aside>
          <BuySidebar
            product={product}
            featured={featured}
            cheapest={cheapest}
            availableCount={available.length}
            pending={buyingId !== null && buyingId === featured?.id}
            onBuy={buyNow}
            onAdd={addToCart}
            onMore={() => scrollTo('offers')}
          />
        </aside>
      </div>
    </div>
  )
}

function Breadcrumbs({ product }: { product: ProductDetail }) {
  const typeLabel = TYPE_LABELS[product.type] ?? 'Products'
  const crumbs: [string, string][] = [
    ['Store', '/store'],
    ['Categories', '/store'],
    [product.type === 'game' ? 'Games' : typeLabel, `/store?type=${product.type}`],
    [`${product.platform.name} ${product.type === 'game' ? 'Games' : typeLabel}`, `/store?type=${product.type}&platform=${product.platform.slug}`],
  ]
  return (
    <nav aria-label="Breadcrumb" className="flex min-w-0 items-center gap-2 text-[15px] text-white/80">
      <Link to="/" aria-label="Home" className="shrink-0 text-white/50 hover:text-white">
        <Home className="size-[18px]" />
      </Link>
      {crumbs.map(([label, to]) => (
        <span key={label} className="flex shrink-0 items-center gap-2">
          <ChevronRight className="size-4 text-white/50" />
          <Link to={to} className="hover:text-white">
            {label}
          </Link>
        </span>
      ))}
      <ChevronRight className="size-4 shrink-0 text-white/50" />
      <span className="max-w-[180px] truncate">{product.base_title}</span>
    </nav>
  )
}

function ProductSummary({ product, featured, onActivationGuide }: { product: ProductDetail; featured: Offer | null; onActivationGuide: () => void }) {
  const signedIn = useAuth((s) => s.token !== null)
  const wishlist = useWishlistToggle(product.id)
  const [savedAtLoad] = useState(wishlist.saved)
  const region = useRegionCheck()(product.region.slug)
  // Signed-in wishes are counted by the server; a guest's wish lives only in this browser.
  const wishes = signedIn ? product.wishlist_count - Number(savedAtLoad) + Number(wishlist.saved) : product.wishlist_count + Number(wishlist.saved)
  const dealBadge = featured && featured.cashback_percent > 0 ? 'Cashback deal' : product.discount_percent && product.discount_percent >= 40 ? `-${product.discount_percent}% deal` : null

  return (
    <div className="grid gap-6 sm:grid-cols-[200px_minmax(0,1fr)] md:grid-cols-[263px_minmax(0,1fr)] md:gap-9">
      <div className="mx-auto aspect-[263/393] w-48 overflow-hidden sm:w-full">
        <ProductArt title={product.title} coverUrl={product.cover_url} headerUrl={product.header_url} art={product.art} eager />
      </div>

      <div className="min-w-0">
        <div className="flex items-start gap-4">
          <div className="min-w-0 flex-1">
            {dealBadge && <span className="inline-block rounded-full border border-mint px-3.5 text-[17px] leading-7 font-semibold text-mint">{dealBadge}</span>}
            <h1 className="mt-3 text-[24px] leading-tight font-bold md:text-[30px]">{product.title}</h1>
          </div>
          <button
            type="button"
            onClick={wishlist.toggle}
            aria-pressed={wishlist.saved}
            aria-label={`${wishlist.saved ? 'Remove from' : 'Add to'} wishlist (${wishes} ${wishes === 1 ? 'wish' : 'wishes'})`}
            className="group/wish relative flex h-[74px] w-[54px] shrink-0 flex-col items-center gap-1 pt-2.5 outline-none"
          >
            <WishRibbon saved={wishlist.saved} idle="dark" notch={0.82} />
            <Heart className={clsx('relative size-6', wishlist.saved && 'fill-white text-white')} strokeWidth={1.6} />
            <span className="relative text-[13px] font-semibold">{formatCount(wishes)}</span>
          </button>
        </div>

        {product.watching > 0 && (
          <p className="mt-8 flex items-center gap-2 text-[13px]">
            <span className="size-2 rounded-full bg-mint" />
            <span>
              <strong className="font-extrabold">
                {product.watching} {product.watching === 1 ? 'person' : 'people'}
              </strong>{' '}
              watching this product
            </span>
          </p>
        )}

        <ul className="mt-4 grid gap-x-8 gap-y-7 md:grid-cols-2">
          <Feature
            icon={region.ok ? <CircleCheck className="size-10 text-mint" strokeWidth={1.3} /> : <Ban className="size-10 text-danger" strokeWidth={1.3} />}
            title={product.region.name === 'GLOBAL' ? 'Global' : titleCase(product.region.name)}
          >
            {region.country &&
              (region.ok ? (
                <>
                  Can be activated in <span className="text-white">{region.country}</span>
                </>
              ) : (
                <span className="text-danger">Can't be activated in {region.country}</span>
              ))}
            <br />
            Check{' '}
            <a href="#product-details" onClick={(e) => (e.preventDefault(), onActivationGuide())} className="text-cta hover:underline">
              region restrictions
            </a>
          </Feature>
          <Feature
            icon={
              <span className="grid size-10 place-items-center rounded-full bg-white text-brand-deep">
                <PlatformIcon platform={product.platform.slug} className="size-6" />
              </span>
            }
            title={product.platform.name}
          >
            Activate/redeem on <span className="text-cta">{product.activation.platform}</span>
            <br />
            Check{' '}
            <a href="#product-details" onClick={(e) => (e.preventDefault(), onActivationGuide())} className="text-cta hover:underline">
              activation guide
            </a>
          </Feature>
          <Feature icon={<KeyRound className="size-10" strokeWidth={1.3} />} title="Digital key">
            This is a digital edition of the product (CD-KEY)
            <br />
            <span className="text-mint">Instant delivery</span>
          </Feature>
          <Feature icon={<ReceiptEuro className="size-10" strokeWidth={1.3} />} title="Instant refunds">
            Unlike other marketplaces, Eneba allows you to get an instant refund for unviewed keys.
          </Feature>
        </ul>

        {product.operating_systems.length > 0 && (
          <p className="mt-5 border-t border-white/15 pt-4 text-[15px] text-white/70">
            Works on: <span className="text-white">{product.operating_systems.map((o) => OS_NAMES[o] ?? o).join(', ')}</span>
          </p>
        )}

        {product.variants.length > 1 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {product.variants.map((v) => (
              <Link
                key={v.slug}
                to={`/${v.slug}`}
                aria-current={v.is_current ? 'page' : undefined}
                className={clsx(
                  'flex items-center gap-2 border px-3 py-1.5 text-xs font-extrabold transition-colors',
                  v.is_current ? 'border-cta bg-cta/10' : 'border-white/20 hover:border-white',
                )}
              >
                {v.platform} · {v.region}
                <span className={v.in_stock ? 'text-white' : 'text-white/50'}>{v.in_stock ? formatPrice(v.min_price) : 'Sold out'}</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function Feature({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4">
      <span className="shrink-0">{icon}</span>
      <div>
        <div className="text-[19px] font-semibold">{title}</div>
        <div className="mt-1 text-[15px] leading-5 text-white/70">{children}</div>
      </div>
    </li>
  )
}

function titleCase(s: string) {
  return s.charAt(0) + s.slice(1).toLowerCase()
}
