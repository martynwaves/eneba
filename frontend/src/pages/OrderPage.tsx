import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, Copy, Eye, KeyRound, PartyPopper } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useOrder } from '../api/queries'
import { Totals } from '../components/checkout/OrderSummary'
import { StatusPill } from '../components/orders/StatusPill'
import { ProductArt } from '../components/product/ProductArt'
import { Button, ButtonLink } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ApiError, api } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import type { OrderItem } from '../lib/types'
import { CheckoutSteps as Steps } from '../components/layout/CheckoutLayout'
import { NotFoundPage } from './NotFoundPage'

/** Order confirmation and key delivery. Also the return page for redirect-based payments. */
export function OrderPage() {
  const { number } = useParams()
  const [params, setParams] = useSearchParams()
  const isNew = params.get('new') === '1'
  const qc = useQueryClient()
  const { data: order, isLoading, error, refetch } = useOrder(number)
  useDocumentTitle(number ? `Order ${number}` : 'Order')

  // Returning from a Stripe redirect: ask the backend to verify the payment with Stripe.
  const confirming = useRef(false)
  const [confirmError, setConfirmError] = useState<string | null>(null)
  useEffect(() => {
    if (params.get('confirm') !== '1' || !order || order.status !== 'pending' || confirming.current) return
    confirming.current = true
    api(`/orders/${order.number}/confirm`, { method: 'POST', body: {} })
      .then(() => {
        qc.invalidateQueries({ queryKey: ['cart'] })
        setParams({ new: '1' }, { replace: true })
        refetch()
      })
      .catch((e) => setConfirmError(e instanceof ApiError ? e.message : 'Payment could not be verified.'))
  }, [params, order, qc, refetch, setParams])

  if (isLoading) return <PageSpinner />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
  if (!order) return <div className="page-container py-20 text-center text-muted">{error?.message}</div>

  const paid = order.status === 'paid'

  return (
    <div className="page-container pt-6 md:pt-8">
      {isNew && paid && <Steps current={3} />}

      {isNew && paid && (
        <div className="mt-6 flex items-center gap-4 bg-green/15 p-5">
          <PartyPopper className="size-10 shrink-0 text-green" />
          <div>
            <h1 className="text-xl font-extrabold md:text-2xl">Thank you! Your order is complete.</h1>
            <p className="mt-1 text-sm text-soft">Your keys are ready below. They are also saved in your order history.</p>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <h2 className="text-xl font-extrabold md:text-2xl">Order {order.number}</h2>
        <StatusPill status={order.status} />
        <span className="text-sm text-muted">{formatDate(order.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>

      {order.status === 'pending' && (
        <div className="mt-4 bg-cta/10 p-4 text-sm">
          {confirmError ?? 'This order is waiting for payment.'}{' '}
          <Link to="/cart" className="font-extrabold text-cta hover:underline">
            Return to cart
          </Link>
        </div>
      )}
      {order.status === 'refunded' && (
        <div className="mt-4 bg-white/10 p-4 text-sm">The keys sold out before your payment arrived, so the payment was refunded automatically.</div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <ul className="space-y-2.5">
          {order.items.map((item) => (
            <OrderLine key={item.id} item={item} orderNumber={order.number} paid={paid} />
          ))}
        </ul>
        <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
          <div className="bg-brand-panel p-5">
            <h3 className="mb-4 font-extrabold">Payment summary</h3>
            <Totals subtotal={order.subtotal} fee={order.service_fee} discount={order.discount} total={order.total} />
            <p className="mt-4 text-xs text-soft">
              Paid with {order.payment_provider === 'stripe' ? 'Stripe (test mode)' : 'simulated test payment'}
              {order.paid_at && ` on ${formatDate(order.paid_at, { dateStyle: 'medium', timeStyle: 'short' })}`}.
            </p>
          </div>
          <ButtonLink to="/account/orders" variant="outline" block>
            All orders
          </ButtonLink>
        </aside>
      </div>
    </div>
  )
}

function OrderLine({ item, orderNumber, paid }: { item: OrderItem; orderNumber: string; paid: boolean }) {
  return (
    <li className="bg-brand-deep p-4">
      <div className="flex gap-4">
        <Link to={`/${item.product_slug}`} className="aspect-[224/313] w-16 shrink-0 overflow-hidden md:w-20">
          <ProductArt title={item.product_title} coverUrl={item.cover_url} art={item.art} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link to={`/${item.product_slug}`} className="line-clamp-2 text-sm font-extrabold hover:text-cta">
            {item.product_title}
          </Link>
          <div className="mt-1 text-xs text-muted">
            {item.platform_name} · <span className="text-green">{item.region_name}</span> · sold by {item.seller_name}
          </div>
          <div className="mt-1 text-sm font-extrabold">
            {item.quantity} × {formatPrice(item.unit_price)}
          </div>
        </div>
      </div>
      {paid && (
        <div className="mt-4 space-y-2">
          {item.keys.map((key, i) => (
            <KeyRow key={key.id} keyId={key.id} index={i + 1} revealed={key.revealed} initialCode={key.code} orderNumber={orderNumber} />
          ))}
        </div>
      )}
    </li>
  )
}

/** A purchased key. Once revealed it stays visible on later visits. */
export function KeyRow({ keyId, index, revealed, initialCode = null, orderNumber }: { keyId: number; index: number; revealed: boolean; initialCode?: string | null; orderNumber: string }) {
  const [code, setCode] = useState<string | null>(initialCode)
  const qc = useQueryClient()
  const [copied, setCopied] = useState(false)
  const reveal = useMutation({
    mutationFn: () => api<{ data: { code: string } }>(`/orders/${orderNumber}/keys/${keyId}/reveal`, { method: 'POST' }),
    onSuccess: (r) => {
      setCode(r.data.code)
      // Cached copies would otherwise show the key as hidden on the next visit.
      qc.invalidateQueries({ queryKey: ['order', orderNumber] })
      qc.invalidateQueries({ queryKey: ['orders'] })
      qc.invalidateQueries({ queryKey: ['keys'] })
    },
  })

  const copy = async () => {
    if (!code) return
    await navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="flex flex-wrap items-center gap-3 bg-black/25 px-4 py-3">
      <KeyRound className="size-5 text-cta" />
      <span className="text-xs font-extrabold text-muted">Key {index}</span>
      <code className="flex-1 font-mono text-base font-bold tracking-wider" aria-live="polite">
        {code ?? '•••••-•••••-•••••'}
      </code>
      {code ? (
        <Button variant="outline" size="sm" onClick={copy} icon={copied ? <Check className="size-4" /> : <Copy className="size-4" />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      ) : (
        <Button size="sm" onClick={() => reveal.mutate()} loading={reveal.isPending} icon={<Eye className="size-4" />}>
          {revealed ? 'Show key' : 'Reveal key'}
        </Button>
      )}
      {!revealed && !code && <span className="w-full text-[11px] text-muted">Unrevealed keys can be refunded instantly.</span>}
    </div>
  )
}
