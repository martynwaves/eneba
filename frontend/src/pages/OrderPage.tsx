import { PartyPopper } from 'lucide-react'
import { Link, useParams, useSearchParams } from 'react-router'
import { useOrder } from '../api/queries'
import { Totals } from '../components/checkout/OrderSummary'
import { CheckoutSteps as Steps } from '../components/layout/CheckoutLayout'
import { KeyRow } from '../components/orders/KeyRow'
import { StatusPill } from '../components/orders/StatusPill'
import { ProductArt } from '../components/product/ProductArt'
import { ButtonLink } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { ApiError } from '../lib/api'
import { formatDate, formatPrice } from '../lib/format'
import type { Order, OrderItem } from '../lib/types'
import { NotFoundPage } from './NotFoundPage'

const PROVIDER_NAMES: Record<string, string> = { stripe: 'card (Stripe test mode)', simulated: 'test card', wallet: 'Eneba Wallet' }

/** "Paid with Eneba Wallet (€4.00) and card (€11.00)" for split payments. */
function paidWith(order: Order): string {
  const provider = PROVIDER_NAMES[order.payment_provider] ?? order.payment_provider
  if (order.payment_provider === 'wallet' || order.wallet_amount === 0) return provider
  return `Eneba Wallet (${formatPrice(order.wallet_amount)}) and ${provider} (${formatPrice(order.card_amount)})`
}

/** Order confirmation and key delivery. */
export function OrderPage() {
  const { number } = useParams()
  const [params] = useSearchParams()
  const isNew = params.get('new') === '1'
  const { data: order, isLoading, error } = useOrder(number)
  useDocumentTitle(number ? `Order ${number}` : 'Order')

  if (isLoading) return <PageSpinner />
  if (error instanceof ApiError && error.status === 404) return <NotFoundPage />
  if (!order) return <div className="page-container py-20 text-center text-muted">{error?.message}</div>

  const paid = order.status === 'paid'
  const OrderHeading = isNew && paid ? 'h2' : 'h1'

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
        {/* The page heading, unless the "Thank you" banner above already is. */}
        <OrderHeading className="text-xl font-extrabold md:text-2xl">Order {order.number}</OrderHeading>
        <StatusPill status={order.status} />
        <span className="text-sm text-muted">{formatDate(order.created_at, { dateStyle: 'medium', timeStyle: 'short' })}</span>
      </div>

      {order.status === 'pending' && (
        <div className="mt-4 bg-cta/10 p-4 text-sm">
          This order is waiting for payment; this page updates as soon as it arrives.{' '}
          <Link to="/cart" className="font-extrabold text-cta hover:underline">
            Return to cart
          </Link>
        </div>
      )}
      {order.status === 'refunded' && (
        <div className="mt-4 bg-white/10 p-4 text-sm">
          {order.refunded > 0
            ? `You refunded every key in this order: ${formatPrice(order.refunded)} went back the way you paid.`
            : "We couldn't deliver this order (the keys sold out before the payment arrived), so it was refunded automatically."}
        </div>
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
            <Totals subtotal={order.subtotal} fee={order.service_fee} discount={order.discount} total={order.total} refunded={order.refunded} />
            {order.paid_at && (
              <p className="mt-4 text-xs text-soft">
                Paid with {paidWith(order)} on {formatDate(order.paid_at, { dateStyle: 'medium', timeStyle: 'short' })}.
              </p>
            )}
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
            {item.refunded_quantity > 0 && <span className="ml-2 text-xs font-semibold text-muted">· {item.refunded_quantity} refunded</span>}
          </div>
        </div>
      </div>
      {paid && (
        <div className="mt-4 space-y-2">
          {item.keys.map((key, i) => (
            <KeyRow key={key.id} keyId={key.id} index={i + 1} revealed={key.revealed} initialCode={key.code} refundAmount={key.refund_amount} orderNumber={orderNumber} />
          ))}
        </div>
      )}
    </li>
  )
}
