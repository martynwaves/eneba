import { ArrowDownWideNarrow, SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { useCatalogFilters, useProducts, type StoreParams } from '../api/queries'
import { ProductCard, ProductCardSkeleton } from '../components/product/ProductCard'
import { FilterSidebar, type StoreFilterState } from '../components/store/FilterSidebar'
import { Button } from '../components/ui/Button'
import { Pagination } from '../components/ui/Pagination'
import { useDocumentTitle } from '../hooks/useDocumentTitle'
import { formatCount } from '../lib/format'
import type { CatalogFilters } from '../lib/types'

const LIST_KEYS = ['platform', 'region', 'type', 'genre'] as const

/**
 * The catalog. All state (filters, sort, query, page) lives in the URL, so results can be
 * shared and the back button works.
 */
export function StorePage() {
  const [params, setParams] = useSearchParams()
  const [drawer, setDrawer] = useState(false)
  const { data: filters } = useCatalogFilters()

  const q = params.get('q') ?? ''
  const sort = params.get('sort') ?? (q ? 'relevance' : 'popular')

  const state: StoreFilterState = {
    platform: split(params.get('platform')),
    region: split(params.get('region')),
    type: split(params.get('type')),
    genre: split(params.get('genre')),
    price_min: params.get('price_min') ?? '',
    price_max: params.get('price_max') ?? '',
    in_stock: params.get('in_stock') === '1',
  }

  const apiParams: StoreParams = useMemo(() => {
    const out: StoreParams = { per_page: '24' }
    params.forEach((value, key) => {
      out[key] = value
    })
    return out
  }, [params])

  const { data, isLoading, isFetching, isError, error, refetch } = useProducts(apiParams)

  useDocumentTitle(q ? `Search results for “${q}”` : 'Store')

  useEffect(() => {
    document.body.style.overflow = drawer ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [drawer])

  const update = (changes: Record<string, string | null>, keepPage = false) => {
    const next = new URLSearchParams(params)
    for (const [k, v] of Object.entries(changes)) {
      if (v === null || v === '') next.delete(k)
      else next.set(k, v)
    }
    if (!keepPage) next.delete('page')
    setParams(next)
  }

  const toggle = (group: (typeof LIST_KEYS)[number], slug: string, checked: boolean) => {
    const current = state[group]
    const values = checked ? [...new Set([...current, slug])] : current.filter((s) => s !== slug)
    update({ [group]: values.join(',') || null })
  }

  const changePage = (p: number) => {
    update({ page: p > 1 ? String(p) : null }, true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Brand and pre-order filters come from links (shortcuts, brand tiles), not the sidebar, so a
  // chip is the only sign that they are narrowing the results.
  const brands = split(params.get('brand'))
  const chips: ChipData[] = [
    ...LIST_KEYS.flatMap((group) =>
      state[group].map((slug) => ({ key: `${group}-${slug}`, label: optionName(filters, group, slug), remove: () => toggle(group, slug, false) })),
    ),
    ...brands.map((slug) => ({ key: `brand-${slug}`, label: brandName(slug), remove: () => update({ brand: brands.filter((b) => b !== slug).join(',') || null }) })),
  ]
  if (params.get('preorder') === '1') chips.push({ key: 'preorder', label: 'Pre-orders', remove: () => update({ preorder: null }) })
  if (state.price_min || state.price_max) {
    chips.push({ key: 'price', label: `€${state.price_min || '0'} – ${state.price_max ? `€${state.price_max}` : '∞'}`, remove: () => update({ price_min: null, price_max: null }) })
  }
  if (state.in_stock) chips.push({ key: 'stock', label: 'In stock', remove: () => update({ in_stock: null }) })
  const hasFilters = chips.length > 0 || q

  const sidebar = (
    <FilterSidebar
      filters={filters}
      facets={data?.facets}
      state={state}
      onToggle={toggle}
      onPrice={(min, max) => update({ price_min: min || null, price_max: max || null })}
      onInStock={(v) => update({ in_stock: v ? '1' : null })}
    />
  )

  return (
    <div className="page-container pt-6 md:pt-8">
      <h1 className="text-2xl leading-tight font-bold md:text-[30px] md:leading-[37.5px]">
        {q ? (
          <>
            Search results for <span className="text-cta">“{q}”</span>
          </>
        ) : (
          'Games, Gift Cards, Top-Ups & More | Best Deals'
        )}
      </h1>
      {data?.search?.corrected_to && (
        <p className="mt-2 text-sm text-muted">
          No exact matches - showing results for <span className="font-extrabold text-white">{data.search.corrected_to}</span>.{' '}
          <Link to={`/store?q=${encodeURIComponent(data.search.corrected_to)}`} className="font-extrabold text-cta hover:underline">
            Search for “{data.search.corrected_to}” instead
          </Link>
        </p>
      )}

      <div className="mt-6 grid gap-5 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block" aria-label="Filters">
          {sidebar}
        </aside>

        <section aria-label="Products" aria-busy={isFetching}>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Button variant="panel" size="sm" className="lg:hidden" icon={<SlidersHorizontal className="size-4" />} onClick={() => setDrawer(true)}>
              Filters{chips.length > 0 && ` (${chips.length})`}
            </Button>
            <p className="text-sm">
              <span className="font-semibold">Results found: </span>
              <span className="font-extrabold">{data ? formatCount(data.meta.total) : '…'}</span>
            </p>
            <label className="ml-auto flex items-center gap-2 text-sm font-extrabold">
              <ArrowDownWideNarrow className="size-5" aria-hidden="true" />
              <span className="sr-only">Sort by</span>
              <select
                value={sort}
                onChange={(e) => update({ sort: e.target.value })}
                className="cursor-pointer appearance-none bg-transparent pr-1 font-extrabold focus:outline-none [&>option]:bg-brand-deep"
              >
                {q && <option value="relevance">Relevance: Best match</option>}
                {(filters?.sorts ?? [{ value: 'popular', label: 'Popularity: Most popular' }]).map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {hasFilters && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {q && <Chip label={`“${q}”`} onRemove={() => update({ q: null, sort: null })} />}
              {chips.map((c) => (
                <Chip key={c.key} label={c.label} onRemove={c.remove} />
              ))}
              <button type="button" onClick={() => setParams(new URLSearchParams())} className="px-2 text-sm font-extrabold text-cta hover:underline">
                Clear all
              </button>
            </div>
          )}

          {isError ? (
            <div className="border border-white/10 bg-brand-deep p-8 text-center">
              <p className="font-extrabold">Something went wrong loading products.</p>
              <p className="mt-1 text-sm text-muted">{error.message}</p>
              <Button className="mt-4" onClick={() => refetch()}>
                Try again
              </Button>
            </div>
          ) : !isLoading && data?.data.length === 0 ? (
            <EmptyResults query={q} onClear={() => setParams(new URLSearchParams())} />
          ) : (
            <div className={`grid grid-cols-2 gap-3 transition-opacity sm:grid-cols-3 md:gap-5 xl:grid-cols-4 ${isFetching && !isLoading ? 'opacity-60' : ''}`}>
              {isLoading || !data
                ? Array.from({ length: 12 }, (_, i) => <ProductCardSkeleton key={i} />)
                : data.data.map((p, i) => <ProductCard key={p.id} product={p} eager={i < 4} />)}
            </div>
          )}

          {data && <Pagination current={data.meta.current_page} last={data.meta.last_page} onChange={changePage} />}
        </section>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="Filters">
          <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close filters" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-brand">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-lg font-extrabold">Filters</span>
              <button type="button" onClick={() => setDrawer(false)} aria-label="Close filters">
                <X className="size-6" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">{sidebar}</div>
            <div className="border-t border-white/10 p-4">
              <Button block onClick={() => setDrawer(false)}>
                Show {data ? formatCount(data.meta.total) : ''} results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function split(v: string | null): string[] {
  return v ? v.split(',').filter(Boolean) : []
}

type ChipData = { key: string; label: string; remove: () => void }

function optionName(filters: CatalogFilters | undefined, group: (typeof LIST_KEYS)[number], slug: string): string {
  const list = group === 'platform' ? filters?.platforms : group === 'region' ? filters?.regions : group === 'type' ? filters?.types : filters?.genres
  return list?.find((o) => o.slug === slug)?.name ?? slug
}

/** "ea-sports-fc" -> "EA Sports FC". */
function brandName(slug: string): string {
  return slug
    .split('-')
    .map((word) => (word.length <= 2 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex h-8 items-center gap-1.5 bg-brand-panel pr-1.5 pl-3 text-sm font-semibold">
      {label}
      <button type="button" onClick={onRemove} aria-label={`Remove ${label}`} className="grid size-6 place-items-center hover:text-cta">
        <X className="size-3.5" />
      </button>
    </span>
  )
}

function EmptyResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center border border-white/10 bg-brand-deep/60 px-6 py-14 text-center">
      <p className="text-xl font-extrabold">{query ? `No results for “${query}”` : 'No products match these filters'}</p>
      <p className="mt-2 max-w-md text-sm text-muted">Try checking the spelling, using fewer words or removing some filters.</p>
      <Button className="mt-6" onClick={onClear}>
        Clear search and filters
      </Button>
    </div>
  )
}
