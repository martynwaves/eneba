import { ShoppingCart } from 'lucide-react'
import { useNavigate } from 'react-router'
import { useProducts } from '../api/queries'
import { CartLineItem } from '../components/cart/CartLineItem'
import { DiscountBox, DiscountRow } from '../components/cart/DiscountBox'
import { ProductRow } from '../components/product/ProductRow'
import { ButtonLink } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { HelpTip, InfoTooltip } from '../components/ui/Tooltip'
import { TrustpilotStars } from '../components/ui/TrustpilotStars'
import { useCart } from '../hooks/useCart'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { cartCashback, formatPrice, pluralize } from '../lib/format'
import { TRUSTPILOT_URL } from '../lib/links'
import { useAuth } from '../stores/auth'

export function CartPage() {
  useDocumentTitle('Cart')
  const { cart, isLoading, isFetching } = useCart()
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()

  const inCart = new Set(cart.lines.map((l) => l.product.id))
  const firstType = cart.lines[0]?.product.type ?? 'game'
  const { data: picks } = useProducts({ type: firstType, sort: 'popular', in_stock: '1', per_page: '16' }, cart.lines.length > 0)

  if (isLoading) return <PageSpinner />

  if (cart.lines.length === 0) {
    return (
      <div className="mx-auto mt-10 flex max-w-[1184px] flex-col items-center bg-black/25 px-6 py-16 text-center">
        <ShoppingCart className="size-16 text-white/30" strokeWidth={1.2} />
        <h1 className="mt-4 text-2xl font-extrabold">Your shopping cart is empty</h1>
        <p className="mt-2 text-muted">It seems you haven't chosen your products yet</p>
        <ButtonLink to="/store" className="mt-6" size="lg">
          Browse the store
        </ButtonLink>
      </div>
    )
  }

  const cashback = cartCashback(cart.lines)

  const checkout = () => navigate(user ? '/checkout' : '/login?redirect=%2Fcheckout&reason=checkout')

  return (
    <div className="mx-auto max-w-[1184px] px-4 pt-8 md:pt-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_416px]">
        <section className="self-start bg-black/25 p-4 md:p-6" aria-label="My cart">
          <h1 className="mb-5 text-xl font-extrabold">My cart</h1>
          <ul className="space-y-3">
            {cart.lines.map((line) => (
              <li key={line.offer_id}>
                <CartLineItem line={line} variant="full" />
              </li>
            ))}
          </ul>
        </section>

        <aside className="self-start bg-black/25 lg:sticky lg:top-6" aria-label="Summary">
          <div className="px-6 pt-7 pb-5 md:px-9">
            <h2 className="text-xl font-extrabold">Summary</h2>
            <button
              type="button"
              disabled={cart.summary.has_problems}
              onClick={checkout}
              className="mt-4 flex h-[42px] w-full items-center justify-center bg-cta text-[17px] font-extrabold text-black transition-colors hover:bg-cta-hover disabled:opacity-50"
            >
              Proceed to checkout
            </button>
            {cart.summary.has_problems && <p className="mt-2 text-xs text-danger">Fix the highlighted items to continue.</p>}
            <div className="mt-4 space-y-1.5 text-[15px]">
              <div className="flex justify-between">
                <span>{pluralize(cart.summary.items_count, 'product')}</span>
                <span className="font-extrabold">{formatPrice(cart.summary.subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-1.5">
                  Service fee <HelpTip text="Eneba doesn't charge a service fee on this order." />
                </span>
                <span>{cart.summary.service_fee > 0 ? formatPrice(cart.summary.service_fee) : '--'}</span>
              </div>
              <DiscountRow code={cart.summary.discount_code} amount={cart.summary.discount} />
            </div>
          </div>

          <DiscountBox summary={cart.summary} settled={!isFetching} />

          <div className="border-t border-white/10 px-6 pt-5 pb-6 md:px-9">
            <div className="flex items-start justify-between">
              <span className="pt-1.5 text-lg font-extrabold">Total:</span>
              <div className="text-right">
                <div className="text-[32px] leading-tight font-extrabold">{formatPrice(cart.summary.total)}</div>
                {cashback > 0 && <div className="text-[17px] font-extrabold text-lime">Cashback: {formatPrice(cashback)}</div>}
              </div>
            </div>
          </div>

          <a
            href={TRUSTPILOT_URL}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-3 border-t border-white/10 px-6 py-6 text-[17px] font-semibold hover:underline"
          >
            <TrustpilotStars size="lg" />
            See our reviews
          </a>
        </aside>
      </div>

      {picks && picks.data.some((p) => !inCart.has(p.id)) && (
        <section className="mt-16 bg-black/25 px-4 pt-6 pb-2 md:px-6" aria-label="Inspired by your picks">
          <h2 className="mb-6 flex items-center gap-2.5 text-xl font-extrabold">
            Inspired by your picks
            <InfoTooltip text="Popular products similar to what's in your cart." />
          </h2>
          <ProductRow products={picks.data.filter((p) => !inCart.has(p.id)).slice(0, 12)} />
        </section>
      )}
    </div>
  )
}
