import { Info, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router'
import { useCart } from '../../hooks/useCart'
import { formatPrice } from '../../lib/format'
import { useAuth } from '../../stores/auth'
import { useUi } from '../../stores/ui'
import { CartLineItem, HelpTip, cartCashback } from './CartLineItem'
import { DiscountRow } from './DiscountBox'

/** "My shopping cart" panel that opens from the header cart icon. */
export function CartDropdown({ onClose }: { onClose: () => void }) {
  const { cart } = useCart()
  const navigate = useNavigate()
  const signedIn = useAuth((s) => s.token !== null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const go = (to: string) => {
    onClose()
    navigate(to)
  }

  return (
    <div
      role="dialog"
      aria-label="My shopping cart"
      className="absolute top-full -right-16 z-50 mt-3 w-[min(420px,calc(100vw-24px))] bg-brand-panel shadow-2xl shadow-black/50 before:absolute before:-top-2.5 before:right-[76px] before:border-x-[10px] before:border-b-[10px] before:border-x-transparent before:border-b-brand-panel sm:right-0 sm:before:right-[12px]"
    >
      <div className="flex items-center justify-between border-b border-white/15 px-6 py-4">
        <h2 className="text-[22px] font-extrabold">My shopping cart</h2>
        <button type="button" onClick={onClose} aria-label="Close cart" className="transition-opacity hover:opacity-70">
          <X className="size-7" />
        </button>
      </div>

      {cart.lines.length === 0 ? (
        <div className="flex flex-col items-center px-6 pt-10 pb-12 text-center">
          <span className="grid size-[60px] place-items-center rounded-full bg-white/60 text-brand-panel">
            <Info className="size-9" strokeWidth={2.6} />
          </span>
          <p className="mt-4 text-[22px] font-extrabold">Your shopping cart is empty</p>
          <p className="mt-3 text-[15px] text-soft">It seems you haven't chosen your products yet</p>
        </div>
      ) : (
        <>
          <ul className="max-h-[min(400px,50vh)] divide-y divide-white/15 overflow-y-auto px-6">
            {cart.lines.map((line) => (
              <li key={line.offer_id} className="py-5">
                <CartLineItem line={line} variant="compact" />
              </li>
            ))}
          </ul>
          <div className="border-t border-white/15 px-6 pt-5 pb-7">
            <div className="flex items-center justify-between text-[15px]">
              <span>Service fee:</span>
              <span className="flex items-center gap-1.5">
                {cart.summary.service_fee > 0 ? formatPrice(cart.summary.service_fee) : '--'}
                <HelpTip text="Eneba doesn't charge a service fee on this order." />
              </span>
            </div>
            <div className="text-[15px]">
              <DiscountRow code={cart.summary.discount_code} amount={cart.summary.discount} format={formatPrice} />
            </div>
            <div className="mt-1 flex items-start justify-between">
              <span className="pt-1.5 text-xl font-extrabold">Total</span>
              <div className="text-right">
                <div className="text-[34px] leading-tight font-extrabold">{formatPrice(cart.summary.total)}</div>
                {cartCashback(cart.lines) > 0 && <div className="text-base font-extrabold text-lime">Cashback: {formatPrice(cartCashback(cart.lines))}</div>}
              </div>
            </div>
            <button type="button" onClick={() => go('/cart')} className="mt-5 flex h-[45px] w-full items-center justify-center bg-cta text-lg font-extrabold text-black transition-colors hover:bg-cta-hover">
              View cart
            </button>
            <button
              type="button"
              disabled={cart.summary.has_problems}
              onClick={() => go(signedIn ? '/checkout' : '/login?redirect=%2Fcheckout&reason=checkout')}
              className="mt-4 flex h-[45px] w-full items-center justify-center border border-white text-lg font-extrabold transition-colors hover:bg-white hover:text-brand-deep disabled:opacity-50"
            >
              Checkout now
            </button>
          </div>
        </>
      )}
    </div>
  )
}

/** The "Added to cart" popup shown after adding a product. */
export function AddedToCartModal() {
  const { addedToCart, hideAddedToCart } = useUi()
  const { count } = useCart()

  useEffect(() => {
    if (!addedToCart) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && hideAddedToCart()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [addedToCart, hideAddedToCart])

  if (!addedToCart) return null

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
      <button type="button" aria-label="Close" className="absolute inset-0 bg-black/50" onClick={hideAddedToCart} />
      <div role="dialog" aria-modal="true" aria-labelledby="added-title" className="relative w-full max-w-[560px] bg-[#4a17ae] px-8 pt-12 pb-10 text-center shadow-2xl shadow-black/60 sm:px-14">
        <svg viewBox="0 0 96 96" className="mx-auto size-[88px]" fill="none" aria-hidden="true">
          <path d="M8 10h6c3 0 4.5 1.6 5.2 4.4L30 62h40l9-34" stroke="white" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="36" cy="80" r="6" stroke="white" strokeWidth="5" />
          <circle cx="64" cy="80" r="6" stroke="white" strokeWidth="5" />
          <path d="M42 34l9 9 18-20" stroke="#23c299" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <h2 id="added-title" className="mt-5 text-[26px] font-extrabold">
          Added to cart
        </h2>
        <p className="mt-2 text-lg text-soft">
          You have <strong className="text-white">{count === 1 ? '1 item' : `${count} items`}</strong> in your cart
        </p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6">
          <button type="button" onClick={hideAddedToCart} className="h-[50px] bg-cta text-lg font-extrabold text-black transition-colors hover:bg-cta-hover">
            Continue shopping
          </button>
          <Link
            to="/cart"
            onClick={hideAddedToCart}
            className="flex h-[50px] items-center justify-center border border-white text-lg font-extrabold transition-colors hover:bg-white hover:text-brand-deep"
          >
            View cart
          </Link>
        </div>
      </div>
    </div>
  )
}
