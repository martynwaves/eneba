import { useMutation } from '@tanstack/react-query'
import { ShoppingCart } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useProducts } from '../api/queries'
import { CartLineItem, HelpTip, cartCashback } from '../components/cart/CartLineItem'
import { DiscountBox, DiscountRow } from '../components/cart/DiscountBox'
import { InfoTooltip } from '../components/home/Section'
import { ProductRow } from '../components/product/ProductRow'
import { ButtonLink } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { useCart } from '../hooks/useCart'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { api } from '../lib/api'
import { formatPrice, pluralize } from '../lib/format'
import { useAuth } from '../stores/auth'

export function CartPage() {
  useDocumentTitle('Cart')
  const { cart, isLoading, isFetching } = useCart()
  const user = useAuth((s) => s.user)
  const navigate = useNavigate()
  const [reviewInvite, setReviewInvite] = useState(() => readPref('eneba-review-invite'))
  const [offers, setOffers] = useState(true)

  const subscribe = useMutation({ mutationFn: (email: string) => api('/newsletter', { method: 'POST', body: { email } }) })

  const inCart = new Set(cart.lines.map((l) => l.product.id))
  const firstType = cart.lines[0]?.product.type ?? 'game'
  const { data: picks } = useProducts({ type: firstType, sort: 'bestselling', in_stock: '1', per_page: '16' })

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

  const checkout = () => {
    writePref('eneba-review-invite', reviewInvite)
    if (offers && user) subscribe.mutate(user.email)
    navigate(user ? '/checkout' : '/login?redirect=%2Fcheckout&reason=checkout')
  }

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
                <span className="flex items-center gap-1.5">
                  {cart.summary.service_fee > 0 ? formatPrice(cart.summary.service_fee) : '--'} <HelpTip text="No extra fees are added at checkout." />
                </span>
              </div>
              <DiscountRow code={cart.summary.discount_code} amount={cart.summary.discount} format={formatPrice} />
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
            <div className="mt-4 space-y-3 text-[14px] leading-[18px] text-soft">
              <Check checked={reviewInvite} onChange={setReviewInvite}>
                I agree to receive an email invitation to review the service on Trustpilot
              </Check>
              <Check checked={offers} onChange={setOffers}>
                I want to receive personalized offers for the best game deals
              </Check>
              <p>
                You can unsubscribe whenever you want. Visit{' '}
                <a href="https://www.eneba.com/privacy-policy" target="_blank" rel="noreferrer" className="text-cta hover:underline">
                  Eneba Privacy Notice
                </a>{' '}
                for more information.
              </p>
            </div>
          </div>

          <a
            href="https://www.trustpilot.com/review/eneba.com"
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center gap-3 border-t border-white/10 px-6 py-6 text-[17px] font-semibold hover:underline"
          >
            <span className="flex gap-[3px]" aria-label="Rated 4.4 out of 5 on Trustpilot">
              {[1, 1, 1, 1, 0.4].map((fill, i) => (
                <span key={i} className="relative grid size-6 place-items-center bg-[#dcdce6]">
                  <span className="absolute inset-y-0 left-0 bg-[#00b67a]" style={{ width: `${fill * 100}%` }} />
                  <svg viewBox="0 0 24 24" className="relative size-4" fill="white" aria-hidden="true">
                    <path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6-4.9-4.6 6.6-.8z" />
                  </svg>
                </span>
              ))}
            </span>
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

function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-start gap-4">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span className="mt-0.5 grid size-6 shrink-0 place-items-center bg-black/25 peer-checked:bg-cta peer-focus-visible:outline-2 peer-focus-visible:outline-cta [&>svg]:hidden peer-checked:[&>svg]:block">
        <svg viewBox="0 0 24 24" className="size-4 text-black" fill="none" stroke="currentColor" strokeWidth="3.5" aria-hidden="true">
          <path d="M5 12l5 5L20 7" />
        </svg>
      </span>
      <span>{children}</span>
    </label>
  )
}

function readPref(key: string): boolean {
  try {
    return localStorage.getItem(key) !== '0'
  } catch {
    return true
  }
}

function writePref(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? '1' : '0')
  } catch {
    /* storage unavailable */
  }
}
