import clsx from 'clsx'
import { Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useSearchSuggestions } from '../../api/queries'
import { useDebounced } from '../../hooks/useDebounced'
import { formatPrice } from '../../lib/format'
import { ProductArt } from '../product/ProductArt'
import { Spinner } from '../ui/Spinner'

/** Header search available on every page: live, typo-tolerant suggestions as you type. */
export function SearchBox({ className }: { className?: string }) {
  const [params] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const listId = useId()
  const wrapper = useRef<HTMLFormElement>(null)
  const input = useRef<HTMLInputElement>(null)

  const [value, setValue] = useState(() => (location.pathname === '/store' ? (params.get('q') ?? '') : ''))
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const debounced = useDebounced(value.trim(), 220)
  const { data, isFetching } = useSearchSuggestions(debounced)

  // Keep the box in sync when the store's query changes (back button, "did you mean" links).
  useEffect(() => {
    if (location.pathname === '/store') setValue(params.get('q') ?? '')
  }, [location.pathname, params])

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const products = debounced.length >= 2 ? (data?.products ?? []) : []
  const showPanel = open && debounced.length >= 2

  const submit = (q: string) => {
    setOpen(false)
    input.current?.blur()
    if (q.trim()) navigate(`/store?q=${encodeURIComponent(q.trim())}`)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!showPanel) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, products.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, -1))
    } else if (e.key === 'Enter' && active >= 0 && products[active]) {
      e.preventDefault()
      setOpen(false)
      navigate(`/${products[active].slug}`)
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  }

  return (
    <form
      ref={wrapper}
      role="search"
      className={clsx('relative', className)}
      onSubmit={(e) => {
        e.preventDefault()
        submit(value)
      }}
    >
      <div className="flex h-12 items-center gap-2.5 border border-white px-2.5 md:h-14">
        <Search className="size-5 shrink-0" aria-hidden="true" />
        <input
          ref={input}
          type="search"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOpen(true)
            setActive(-1)
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search for games, top-ups and more"
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls={listId}
          aria-expanded={showPanel}
          role="combobox"
          className="h-full min-w-0 flex-1 bg-transparent text-base font-extrabold placeholder:text-white/70 focus:outline-none md:text-[18px] [&::-webkit-search-cancel-button]:hidden"
        />
        {isFetching && open && <Spinner className="size-4 text-white/70" />}
        {value && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => {
              setValue('')
              input.current?.focus()
            }}
            className="grid size-7 place-items-center text-white/70 hover:text-white"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-1 border border-white/10 bg-brand-deep shadow-2xl shadow-black/50">
          {data?.corrected_to && (
            <p className="border-b border-white/10 px-4 py-2.5 text-xs text-muted">
              Showing results for <span className="font-extrabold text-white">{data.corrected_to}</span>
            </p>
          )}
          {products.length === 0 && !isFetching && (
            <p className="px-4 py-6 text-center text-sm text-muted">
              No products match <span className="font-extrabold text-white">“{debounced}”</span>
            </p>
          )}
          <ul id={listId} role="listbox" aria-label="Search suggestions">
            {products.map((p, i) => (
              <li key={p.id} role="option" aria-selected={i === active}>
                <Link
                  to={`/${p.slug}`}
                  onClick={() => setOpen(false)}
                  onMouseEnter={() => setActive(i)}
                  className={clsx('flex items-center gap-3 px-4 py-2.5', i === active && 'bg-white/10')}
                >
                  <div className="h-14 w-10 shrink-0 overflow-hidden">
                    <ProductArt title={p.title} coverUrl={p.cover_url} headerUrl={p.header_url} art={p.art} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="line-clamp-2 text-[13px] leading-[18px] font-extrabold">{p.title}</div>
                    <div className="mt-1 text-[11px] font-extrabold text-green uppercase">{p.region.name}</div>
                  </div>
                  <div className="text-right">
                    {p.min_price !== null ? (
                      <>
                        <div className="text-[11px] font-extrabold text-muted">From</div>
                        <div className="text-base font-extrabold">{formatPrice(p.min_price)}</div>
                      </>
                    ) : (
                      <div className="text-xs font-extrabold text-muted">Sold out</div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          {data && data.total > 0 && (
            <button
              type="submit"
              className="flex h-11 w-full items-center justify-center border-t border-white/10 text-sm font-extrabold text-cta hover:bg-white/5"
            >
              See all {data.total} results
            </button>
          )}
        </div>
      )}
    </form>
  )
}
