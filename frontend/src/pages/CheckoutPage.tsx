import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { AlertTriangle, Ban, Clock } from 'lucide-react'
import { useEffect, useRef, useState, type RefObject } from 'react'
import { Link, useNavigate } from 'react-router'
import { useAppConfig, useMe } from '../api/queries'
import { DiscountRow } from '../components/cart/DiscountBox'
import { SimulatedCardFields } from '../components/checkout/SimulatedCardFields'
import { ProductArt } from '../components/product/ProductArt'
import { ButtonLink } from '../components/ui/Button'
import { PageSpinner, Spinner } from '../components/ui/Spinner'
import { HelpTip } from '../components/ui/Tooltip'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { useRegionCheck } from '../hooks/useRegionCheck'
import { ApiError, api } from '../lib/api'
import { cashbackCents, formatPrice } from '../lib/format'
import { ENEBA_URL, paymentLogo } from '../lib/links'
import { DEFAULT_TEST_CARD, simulatedOutcome, type SimulatedCard } from '../lib/simulatedPayment'
import { cardElementStyle, getStripe } from '../lib/stripe'
import type { Order, OrderItem } from '../lib/types'
import { useDiscount } from '../stores/discount'

type CheckoutResponse = { order: Order; payment: { driver: 'stripe' | 'simulated'; client_secret: string } }
type MethodId = 'wallet' | 'card' | 'paypal' | 'apple_pay' | 'google_pay' | 'crypto'
/** Card step registered by the card panel: resolves to an error, or (for the simulator) the outcome. */
type CardPayer = () => Promise<{ error?: string; simulate?: 'success' | 'decline' }>

/** Stripe can't charge less than this, so the wallet always leaves at least this much for the card. */
const MIN_CARD_CHARGE = 50

/**
 * Starting checkout reserves the cart's keys and opens a payment. The buyer picks a method:
 * the Eneba Wallet (cashback balance) or a card through Stripe test mode; keys are delivered
 * as soon as the backend has verified the payment.
 */
export function CheckoutPage() {
  useDocumentTitle('Checkout')
  const qc = useQueryClient()
  const { data: config } = useAppConfig()
  const started = useRef(false)

  const start = useMutation({
    mutationFn: async () => {
      const { code, clear } = useDiscount.getState()
      try {
        return await api<CheckoutResponse>('/checkout', { method: 'POST', body: { code } })
      } catch (e) {
        // A code that no longer qualifies was never priced into the cart, so carry on without it.
        if (!(code && e instanceof ApiError && e.field('discount'))) throw e
        clear()
        return api<CheckoutResponse>('/checkout', { method: 'POST' })
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  })

  useEffect(() => {
    // Guard against React StrictMode's double effect: one checkout per visit.
    if (started.current) return
    started.current = true
    start.mutate()
  }, [start])

  if (start.isError) {
    const err = start.error instanceof ApiError ? start.error : null
    return (
      <div className="mx-auto mt-10 flex max-w-[1184px] flex-col items-center gap-3 bg-black/25 px-6 py-16 text-center">
        <h1 className="text-2xl font-extrabold">We couldn't start checkout</h1>
        <p className="max-w-md text-muted">{err?.field('cart') ?? err?.field('payment') ?? start.error.message}</p>
        <div className="mt-4 flex gap-3">
          <ButtonLink to="/cart">Back to cart</ButtonLink>
          <ButtonLink to="/store" variant="outline">
            Browse store
          </ButtonLink>
        </div>
      </div>
    )
  }

  if (!start.data || !config) return <PageSpinner label="Reserving your keys…" />

  const { order, payment } = start.data
  const stripeKey = payment.driver === 'stripe' ? config.payment.stripe_publishable_key : null
  // A new order (after re-reserving) gets a fresh page state.
  const content = <CheckoutContent key={order.number} order={order} stripe={Boolean(stripeKey)} clientSecret={payment.client_secret} onRestart={() => start.mutate()} restarting={start.isPending} />

  return stripeKey ? (
    <Elements stripe={getStripe(stripeKey)}>
      {content}
    </Elements>
  ) : (
    content
  )
}

function CheckoutContent({
  order: startedOrder,
  stripe,
  clientSecret,
  onRestart,
  restarting,
}: {
  order: Order
  stripe: boolean
  clientSecret: string
  onRestart: () => void
  restarting: boolean
}) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { data: me } = useMe(true)
  const [method, setMethod] = useState<MethodId | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const payCard = useRef<CardPayer | null>(null)
  // The order changes when wallet money is put towards it (the card then pays less).
  const [order, setOrder] = useState(startedOrder)
  // Once the reservation runs out the server releases the keys, so paying is no longer offered.
  const [expired, setExpired] = useState(() => isPast(startedOrder.expires_at))

  const walletSplit = useMutation({
    mutationFn: (use: boolean) => api<{ order: Order }>(`/orders/${order.number}/wallet`, { method: 'POST', body: { use } }),
    onSuccess: ({ order: updated }) => {
      setOrder(updated)
      setError(null)
      if (updated.wallet_amount > 0 && method !== 'card') setMethod('card')
    },
    onError: (e) => setError(e instanceof ApiError ? (e.field('wallet') ?? e.message) : 'Could not use your wallet balance.'),
  })

  const balance = me?.cashback_balance ?? 0
  // Not enough to cover everything: the balance can still go towards the order, card pays the rest.
  const canSplit = balance > 0 && balance < order.total
  const usingWallet = order.wallet_amount > 0
  const methods: { id: MethodId; file: string; title: string; description?: string; unavailable?: string }[] = [
    {
      id: 'wallet',
      file: 'wallet',
      title: 'Eneba Wallet',
      description: `Total available balance: ${formatPrice(balance)}`,
      unavailable: balance <= 0 ? 'Not enough balance for this order' : undefined,
    },
    { id: 'card', file: 'payrails_card', title: 'Credit or debit card', description: 'Pay via Visa, Mastercard, or Maestro debit or credit card' },
    { id: 'paypal', file: 'braintree_paypal', title: 'PayPal', unavailable: 'Not available' },
    { id: 'apple_pay', file: 'payrails_apple_pay', title: 'Apple Pay', unavailable: 'Not available' },
    { id: 'google_pay', file: 'payrails_google_pay', title: 'Google Pay', unavailable: 'Not available' },
    { id: 'crypto', file: 'nuvei_crypto', title: 'Crypto', unavailable: 'Not available' },
  ]

  const finish = () => {
    useDiscount.getState().clear()
    qc.invalidateQueries({ queryKey: ['cart'] })
    qc.invalidateQueries({ queryKey: ['orders'] })
    qc.invalidateQueries({ queryKey: ['keys'] })
    qc.invalidateQueries({ queryKey: ['me'] })
    qc.invalidateQueries({ queryKey: ['homepage-block'] })
    navigate(`/account/orders/${order.number}?new=1`, { replace: true })
  }

  const pay = async () => {
    if (!method) return
    setBusy(true)
    setError(null)
    try {
      if (method === 'wallet') {
        await api(`/orders/${order.number}/pay-with-wallet`, { method: 'POST' })
      } else {
        const result = await payCard.current?.()
        if (!result) return
        if (result.error) {
          setError(result.error)
          return
        }
        await api(`/orders/${order.number}/confirm`, { method: 'POST', body: result.simulate ? { simulate: result.simulate } : {} })
      }
      finish()
    } catch (e) {
      setError(e instanceof ApiError ? (e.field('wallet') ?? e.message) : 'Could not complete the payment.')
    } finally {
      setBusy(false)
    }
  }

  const cancel = async () => {
    await api(`/orders/${order.number}/cancel`, { method: 'POST' }).catch(() => null)
    navigate('/cart')
  }

  const sellers = [...new Set(order.items.map((i) => i.seller_name))].join(', ')
  const cashback = order.items.reduce((sum, i) => sum + cashbackCents(i.unit_price * i.quantity, i.cashback_percent), 0)

  return (
    <div className="mx-auto max-w-[1184px] px-4 pt-8 md:pt-12">
      <div className="grid gap-6 lg:grid-cols-[1fr_520px] lg:gap-9">
        <section aria-label="Payment method" className="space-y-3">
          {methods.map((m) => {
            if (m.id === 'wallet' && canSplit) {
              return (
                <WalletSplitRow
                  key={m.id}
                  logoUrl={paymentLogo(m.file)}
                  balance={balance}
                  remainder={order.total - Math.min(balance, order.total - MIN_CARD_CHARGE)}
                  checked={usingWallet}
                  pending={walletSplit.isPending}
                  disabled={busy}
                  onChange={(use) => walletSplit.mutate(use)}
                />
              )
            }
            const selected = method === m.id
            return (
              <div key={m.id} className={clsx('bg-black/25 transition-colors', selected && 'outline-2 -outline-offset-2 outline-cta')}>
                <label className={clsx('flex items-center gap-6 px-6 py-4', m.unavailable ? 'cursor-not-allowed opacity-55' : 'cursor-pointer hover:bg-white/5')}>
                  <span className="grid h-[58px] w-[128px] shrink-0 place-items-center bg-white px-3">
                    <img src={paymentLogo(m.file)} alt="" className="max-h-9 max-w-full" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-extrabold">{m.title}</span>
                    {(m.unavailable ?? m.description) && <span className="mt-0.5 block text-[13px] leading-4 text-soft">{m.description ?? ''}{m.description && m.unavailable ? ' · ' : ''}{m.unavailable ?? ''}</span>}
                  </span>
                  <input type="radio" name="payment-method" className="peer sr-only" disabled={Boolean(m.unavailable)} checked={selected} onChange={() => setMethod(m.id)} />
                  <span className="grid size-6 shrink-0 place-items-center rounded-full border-2 border-white peer-focus-visible:outline-2 peer-focus-visible:outline-cta">
                    {selected && <span className="size-3 rounded-full bg-white" />}
                  </span>
                </label>
                {m.id === 'card' && selected && (
                  // Mounted only when visible: Stripe's frame doesn't initialise inside a hidden container.
                  <div className="px-6 pb-6">
                    {stripe ? <StripeCardPanel payRef={payCard} clientSecret={clientSecret} /> : <SimulatedCardPanel payRef={payCard} />}
                  </div>
                )}
              </div>
            )
          })}
          <button type="button" onClick={cancel} className="pt-2 text-sm font-semibold text-muted hover:text-white">
            ← Back to cart
          </button>
        </section>

        <aside className="self-start bg-black/25 lg:sticky lg:top-6" aria-label="Order summary">
          <ul className="space-y-6 px-6 pt-8 pb-6 md:px-9">
            {order.items.map((item) => (
              <li key={item.id}>
                <SummaryItem item={item} />
              </li>
            ))}
          </ul>
          <div className="space-y-1.5 border-t border-white/10 px-6 pt-6 text-[15px] md:px-9">
            <div className="flex justify-between">
              <span>Sub-total</span>
              <span className="font-extrabold">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="flex items-center gap-1.5">
                Service fee <HelpTip text="Eneba doesn't charge a service fee on this order." />
              </span>
              <span>{order.service_fee > 0 ? formatPrice(order.service_fee) : '--'}</span>
            </div>
            <DiscountRow code={order.discount_code} amount={order.discount} />
            {usingWallet && (
              <div className="flex justify-between text-lime">
                <span>Eneba Wallet</span>
                <span className="font-extrabold">−{formatPrice(order.wallet_amount)}</span>
              </div>
            )}
          </div>
          <div className="px-6 pt-8 pb-8 md:px-9">
            <div className="flex items-start justify-between">
              <span className="pt-1 text-lg font-extrabold">Total:</span>
              <div className="text-right">
                <div className="text-[28px] leading-tight font-extrabold">{formatPrice(order.total)}</div>
                {cashback > 0 && <div className="text-[17px] font-extrabold text-lime">Cashback: {formatPrice(cashback)}</div>}
              </div>
            </div>
            {usingWallet && (
              <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3 text-[15px]">
                <span>To pay by card</span>
                <span className="text-xl font-extrabold">{formatPrice(order.card_amount)}</span>
              </div>
            )}
            {order.payment_provider !== 'wallet' && formatPrice(order.card_amount) !== formatPrice(order.card_amount, { charge: true }) && (
              <p className="mt-2 text-right text-xs text-soft">Charged in EUR: {formatPrice(order.card_amount, { charge: true })}</p>
            )}

            <p className="mt-6 text-[15px]">Payment collected on behalf of {sellers}</p>
            <p className="mt-2 flex items-center gap-2 border border-white/70 px-3 py-1.5 text-[13px]">
              <AlertTriangle className="size-4 shrink-0 fill-cta text-brand-deep" />
              Know more about online gift card fraud{' '}
              <a href={`${ENEBA_URL}/support/article/gift-card-scams`} target="_blank" rel="noreferrer" className="text-cta hover:underline">
                here
              </a>
            </p>

            {error && (
              <p className="mt-4 border-l-4 border-danger bg-danger/10 px-4 py-3 text-sm font-semibold" role="alert">
                {error}
              </p>
            )}

            {expired ? (
              <div className="mt-4 border-l-4 border-cta bg-black/20 px-4 py-3" role="status">
                <p className="text-sm font-extrabold">Your reservation has expired</p>
                <p className="mt-1 text-xs text-soft">Your keys are no longer held for you and go back on sale. Reserve them again to continue, if they are still in stock.</p>
                <button
                  type="button"
                  onClick={onRestart}
                  disabled={restarting}
                  className="mt-3 flex h-[42px] w-full items-center justify-center gap-2 bg-cta text-[17px] font-extrabold text-black transition-colors hover:bg-cta-hover disabled:opacity-45"
                >
                  {restarting && <Spinner className="size-4" />}
                  Reserve again
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={pay}
                disabled={!method || busy || walletSplit.isPending}
                className="mt-4 flex h-[42px] w-full items-center justify-center gap-2 bg-cta text-[17px] font-extrabold text-black transition-colors hover:bg-cta-hover disabled:cursor-not-allowed disabled:opacity-45"
              >
                {busy && <Spinner className="size-4" />}
                Continue
              </button>
            )}
            {!expired && !method && <p className="mt-2 text-center text-xs text-soft">Choose a payment method to continue.</p>}
            {!expired && order.expires_at && <Countdown until={order.expires_at} onExpire={() => setExpired(true)} />}

            <p className="mt-5 text-[13px] leading-5 text-soft">
              By clicking "Continue" I acknowledge I have read and accepted the{' '}
              <a href={`${ENEBA_URL}/terms-and-conditions`} target="_blank" rel="noreferrer" className="text-cta hover:underline">
                Terms and Conditions
              </a>{' '}
              including the{' '}
              <a href={`${ENEBA_URL}/privacy-policy`} target="_blank" rel="noreferrer" className="text-cta hover:underline">
                Privacy Notice
              </a>{' '}
              and Cookies. I also have read and accepted the sellers' terms and refund policies.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

/** Stripe's card field (cards only); registers a confirm step for the page's "Continue" button. */
function StripeCardPanel({ payRef, clientSecret }: { payRef: RefObject<CardPayer | null>; clientSecret: string }) {
  const stripe = useStripe()
  const elements = useElements()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const confirmCard: CardPayer = async () => {
      const card = elements?.getElement(CardElement)
      if (!stripe || !card) return { error: 'The card form is still loading.' }
      // 3-D Secure test cards open Stripe's authentication popup here and resolve afterwards.
      const result = await stripe.confirmCardPayment(clientSecret, { payment_method: { card } })
      if (result.error) return { error: result.error.message ?? 'Payment failed. Please try again.' }
      return {}
    }
    payRef.current = confirmCard
  }, [stripe, elements, payRef, clientSecret])

  return (
    <div>
      <p className="mb-4 border-l-4 border-cta bg-black/20 px-4 py-3 text-xs text-soft">
        <strong className="text-white">Stripe test mode.</strong> Use card <span className="font-extrabold text-white">4242 4242 4242 4242</span>, any future date and any CVC.
      </p>
      <div className="border border-white/25 bg-[#2a0d6b] px-3 py-3.5 focus-within:border-cta">
        <CardElement
          onReady={() => setReady(true)}
          options={{ hidePostalCode: true, style: cardElementStyle }}
        />
      </div>
      {!ready && <div className="skeleton mt-2 h-4 w-1/2" />}
    </div>
  )
}

function SimulatedCardPanel({ payRef }: { payRef: RefObject<CardPayer | null> }) {
  const [card, setCard] = useState<SimulatedCard>(DEFAULT_TEST_CARD)
  useEffect(() => {
    const confirmSimulated: CardPayer = async () => {
      const result = simulatedOutcome(card)
      return 'error' in result ? { error: result.error } : { simulate: result.outcome }
    }
    payRef.current = confirmSimulated
  }, [card, payRef])
  return <SimulatedCardFields value={card} onChange={setCard} />
}

function SummaryItem({ item }: { item: OrderItem }) {
  const region = useRegionCheck()(item.region_slug ?? '')
  const cashback = cashbackCents(item.unit_price * item.quantity, item.cashback_percent)
  return (
    <div className="flex gap-3">
      <Link to={`/${item.product_slug}`} className="aspect-[60/84] w-[60px] shrink-0 self-start overflow-hidden">
        <ProductArt title={item.product_title} coverUrl={item.cover_url} art={item.art} />
      </Link>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13px] font-extrabold">
          Sold by
          <span className="grid size-5 place-items-center rounded-full text-[10px] text-black" style={{ background: item.seller_avatar_color ?? '#5825cc' }} aria-hidden="true">
            {item.seller_name.slice(0, 1)}
          </span>
          {item.seller_name}
        </div>
        <div className="mt-1.5 text-[15px] leading-6 font-extrabold">{item.product_title}</div>
        {item.region_slug && !region.ok && (
          <p className="mt-1 text-[13px] leading-5">
            <span className="inline-flex items-center gap-1 text-danger">
              <Ban className="size-3.5" /> Can't be activated in {region.country}
            </span>
          </p>
        )}
        <div className="mt-1 flex items-center gap-1.5 text-[13px] text-soft">
          Digital product <HelpTip text="You'll get a digital key in your account right after payment." />
        </div>
        <div className="mt-1.5 flex items-center justify-between text-sm">
          <span className="text-soft">Qty {item.quantity}</span>
          <span className="text-base font-extrabold">{formatPrice(item.unit_price * item.quantity)}</span>
        </div>
        {cashback > 0 && <p className="mt-1.5 text-[13px] text-lime">Cashback: {formatPrice(cashback)}</p>}
      </div>
    </div>
  )
}

/** Wallet balance that can't cover the whole order: a switch that puts it towards the total. */
function WalletSplitRow({
  logoUrl,
  balance,
  remainder,
  checked,
  pending,
  disabled,
  onChange,
}: {
  logoUrl: string
  balance: number
  remainder: number
  checked: boolean
  pending: boolean
  disabled: boolean
  onChange: (use: boolean) => void
}) {
  return (
    <div className={clsx('bg-black/25 transition-colors', checked && 'outline-2 -outline-offset-2 outline-lime')}>
      <label className={clsx('flex items-center gap-6 px-6 py-4', disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:bg-white/5')}>
        <span className="grid h-[58px] w-[128px] shrink-0 place-items-center bg-white px-3">
          <img src={logoUrl} alt="" className="max-h-9 max-w-full" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-extrabold">Use Eneba Wallet balance</span>
          <span className="mt-0.5 block text-[13px] leading-4 text-soft">
            Put your {formatPrice(balance)} balance towards this order and pay the remaining {formatPrice(remainder)} by card
          </span>
        </span>
        <input type="checkbox" className="peer sr-only" checked={checked} disabled={disabled || pending} onChange={(e) => onChange(e.target.checked)} />
        {pending ? (
          <Spinner className="size-6 shrink-0" />
        ) : (
          <span className="relative h-6 w-11 shrink-0 rounded-full bg-white/25 transition-colors peer-checked:bg-lime peer-focus-visible:outline-2 peer-focus-visible:outline-cta after:absolute after:top-0.5 after:left-0.5 after:size-5 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-5" aria-hidden="true" />
        )}
      </label>
    </div>
  )
}

function isPast(iso: string | null) {
  return iso !== null && new Date(iso).getTime() <= Date.now()
}

function Countdown({ until, onExpire }: { until: string; onExpire: () => void }) {
  const [now, setNow] = useState(() => Date.now())
  const expire = useRef(onExpire)
  useEffect(() => {
    expire.current = onExpire
  }, [onExpire])
  useEffect(() => {
    const end = new Date(until).getTime()
    const id = setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= end) expire.current()
    }, 1000)
    return () => clearInterval(id)
  }, [until])
  const left = Math.max(0, new Date(until).getTime() - now)
  const mm = String(Math.floor(left / 60000)).padStart(2, '0')
  const ss = String(Math.floor((left % 60000) / 1000)).padStart(2, '0')
  return (
    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs font-semibold text-soft">
      <Clock className="size-3.5 text-cta" /> Your keys are reserved for {mm}:{ss}
    </p>
  )
}
