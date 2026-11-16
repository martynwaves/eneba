import { KeyRound } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useKeysLibrary } from '../api/queries'
import { AccountNav } from '../components/orders/AccountNav'
import { ProductArt } from '../components/product/ProductArt'
import { ButtonLink } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { PageSpinner } from '../components/ui/Spinner'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatDate } from '../lib/format'
import { KeyRow } from './OrderPage'

/** Every key the user has bought, across all orders. */
export function KeysLibraryPage() {
  useDocumentTitle('Keys library')
  const [page, setPage] = useState(1)
  const { data, isLoading } = useKeysLibrary(page)

  return (
    <div className="page-container pt-6 md:pt-8">
      <AccountNav />
      <h1 className="mt-6 text-2xl font-bold md:text-[30px]">Keys library</h1>

      {isLoading ? (
        <PageSpinner />
      ) : !data || data.data.length === 0 ? (
        <div className="mt-6 flex flex-col items-center bg-brand-deep/60 px-6 py-14 text-center">
          <KeyRound className="size-14 text-white/30" strokeWidth={1.2} />
          <p className="mt-3 text-lg font-extrabold">No keys yet</p>
          <p className="mt-1 text-sm text-muted">Keys you buy are kept here so you can find them any time.</p>
          <ButtonLink to="/store" className="mt-5">
            Start shopping
          </ButtonLink>
        </div>
      ) : (
        <>
          <ul className="mt-6 space-y-2.5">
            {data.data.map((key) => (
              <li key={key.id} className="flex gap-4 bg-brand-deep p-4">
                <Link to={`/${key.product_slug}`} className="aspect-[224/313] w-14 shrink-0 overflow-hidden">
                  <ProductArt title={key.product_title} coverUrl={key.cover_url} art={key.art} />
                </Link>
                <div className="min-w-0 flex-1">
                  <Link to={`/${key.product_slug}`} className="line-clamp-1 text-sm font-extrabold hover:text-cta">
                    {key.product_title}
                  </Link>
                  <div className="mt-1 text-xs text-muted">
                    {key.platform_name} · <span className="text-green">{key.region_name}</span> · bought {formatDate(key.purchased_at)} ·{' '}
                    <Link to={`/account/orders/${key.order_number}`} className="hover:text-white hover:underline">
                      {key.order_number}
                    </Link>
                  </div>
                  <div className="mt-3">
                    <KeyRow keyId={key.id} index={1} revealed={key.revealed} initialCode={key.code} orderNumber={key.order_number} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
          <Pagination current={data.meta.current_page} last={data.meta.last_page} onChange={setPage} />
        </>
      )}
    </div>
  )
}
