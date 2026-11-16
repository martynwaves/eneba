import { ChevronRight, Package } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useOrders } from '../api/queries'
import { AccountNav } from '../components/orders/AccountNav'
import { StatusPill } from '../components/orders/StatusPill'
import { ProductArt } from '../components/product/ProductArt'
import { ButtonLink } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { PageSpinner } from '../components/ui/Spinner'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDate, formatPrice, pluralize } from '../lib/format'

export function OrdersPage() {
  useDocumentTitle('My orders')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useOrders(page)

  return (
    <div className="page-container pt-6 md:pt-8">
      <AccountNav />
      <h1 className="mt-6 text-2xl font-bold md:text-[30px]">My orders</h1>

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.data.length === 0 ? (
        <div className="mt-6 flex flex-col items-center bg-brand-deep/60 px-6 py-14 text-center">
          <Package className="size-14 text-white/30" strokeWidth={1.2} />
          <p className="mt-3 text-lg font-extrabold">No orders yet</p>
          <p className="mt-1 text-sm text-muted">Keys you buy will show up here.</p>
          <ButtonLink to="/store" className="mt-5">
            Start shopping
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-2.5">
            {data.data.map((order) => (
              <li key={order.number}>
                <Link to={`/account/orders/${order.number}`} className="flex flex-wrap items-center gap-4 bg-brand-deep p-4 transition-colors hover:bg-brand-ink md:flex-nowrap">
                  <div className="flex -space-x-3">
                    {order.items.slice(0, 3).map((item) => (
                      <div key={item.id} className="aspect-[224/313] w-11 overflow-hidden ring-2 ring-brand-deep">
                        <ProductArt title={item.product_title} coverUrl={item.cover_url} art={item.art} />
                      </div>
                    ))}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-extrabold">{order.number}</span>
                      <StatusPill status={order.status} />
                    </div>
                    <div className="mt-1 truncate text-xs text-muted">
                      {formatDate(order.created_at, { dateStyle: 'medium', timeStyle: 'short' })} · {pluralize(order.items_count, 'item')} · {order.items.map((i) => i.product_title).join(', ')}
                    </div>
                  </div>
                  <div className="text-lg font-extrabold">{formatPrice(order.total)}</div>
                  <ChevronRight className="hidden size-5 text-muted md:block" />
                </Link>
              </li>
            ))}
          </ul>
          <Pagination current={data.meta.current_page} last={data.meta.last_page} onChange={setPage} />
        </>
      )}
    </div>
  )
}
