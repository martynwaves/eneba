import { ChevronDown, ChevronUp, Search } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import type { CatalogFilters, Facets, FilterOption } from '../../lib/types'
import { PlatformIcon } from '../ui/BrandIcon'
import { Checkbox } from '../ui/Checkbox'

export interface StoreFilterState {
  platform: string[]
  region: string[]
  type: string[]
  genre: string[]
  price_min: string
  price_max: string
  in_stock: boolean
}

interface Props {
  filters: CatalogFilters | undefined
  facets: Facets | undefined
  state: StoreFilterState
  onToggle: (group: 'platform' | 'region' | 'type' | 'genre', slug: string, checked: boolean) => void
  onPrice: (min: string, max: string) => void
  onInStock: (value: boolean) => void
}

export function FilterSidebar({ filters, facets, state, onToggle, onPrice, onInStock }: Props) {
  return (
    <div className="space-y-2.5">
      <Panel title="Price range (EUR)">
        <PriceRange min={state.price_min} max={state.price_max} onApply={onPrice} />
        <label className="mt-4 flex cursor-pointer items-center justify-between text-sm font-semibold">
          In stock only
          <input type="checkbox" checked={state.in_stock} onChange={(e) => onInStock(e.target.checked)} className="peer sr-only" />
          <span className="relative h-5 w-9 rounded-full bg-black/30 transition-colors peer-checked:bg-cta after:absolute after:top-0.5 after:left-0.5 after:size-4 after:rounded-full after:bg-white after:transition-transform peer-checked:after:translate-x-4 peer-focus-visible:outline-2 peer-focus-visible:outline-cta" />
        </label>
      </Panel>

      <OptionGroup
        title="Product type"
        options={filters?.types}
        counts={facets?.type}
        selected={state.type}
        onToggle={(slug, c) => onToggle('type', slug, c)}
      />
      <OptionGroup
        title="Platform"
        searchable
        options={filters?.platforms}
        counts={facets?.platform}
        selected={state.platform}
        onToggle={(slug, c) => onToggle('platform', slug, c)}
        icon={(o) => <PlatformIcon platform={o.slug} className="size-4 shrink-0" />}
      />
      <OptionGroup
        title="Region"
        options={filters?.regions}
        counts={facets?.region}
        selected={state.region}
        onToggle={(slug, c) => onToggle('region', slug, c)}
      />
      <OptionGroup
        title="Genre"
        searchable
        options={filters?.genres}
        counts={facets?.genre}
        selected={state.genre}
        onToggle={(slug, c) => onToggle('genre', slug, c)}
      />
    </div>
  )
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="bg-brand-panel pb-5">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-5 pt-[15px] pb-2.5 text-base leading-[22px] font-extrabold"
      >
        {title}
        {open ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
      </button>
      {open && <div className="px-5">{children}</div>}
    </div>
  )
}

const COLLAPSED_COUNT = 7

function OptionGroup({
  title,
  options,
  counts,
  selected,
  onToggle,
  searchable,
  icon,
}: {
  title: string
  options: FilterOption[] | undefined
  counts: Record<string, number> | undefined
  selected: string[]
  onToggle: (slug: string, checked: boolean) => void
  searchable?: boolean
  icon?: (o: FilterOption) => ReactNode
}) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState(false)

  if (!options) {
    return (
      <Panel title={title}>
        <div className="space-y-3 py-1">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-4" />
          ))}
        </div>
      </Panel>
    )
  }

  // Only options that have results, plus selected ones that currently have none.
  const visible = options
    .filter((o) => (counts?.[o.slug] ?? 0) > 0 || selected.includes(o.slug))
    .filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
  const shown = expanded || query ? visible : visible.slice(0, COLLAPSED_COUNT)
  const hidden = visible.length - shown.length

  return (
    <Panel title={title}>
      {searchable && options.length > COLLAPSED_COUNT && (
        <div className="relative mb-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label={`Search ${title.toLowerCase()}`}
            className="h-10 w-full bg-black/20 pr-9 pl-3 text-sm font-semibold text-white placeholder:text-muted focus:outline-none"
          />
          <Search className="absolute top-1/2 right-3 size-4 -translate-y-1/2 text-white/70" />
        </div>
      )}
      {visible.length === 0 && <p className="py-2 text-sm text-muted">No options</p>}
      {shown.map((o) => (
        <Checkbox
          key={o.slug}
          checked={selected.includes(o.slug)}
          onChange={(c) => onToggle(o.slug, c)}
          count={counts?.[o.slug] ?? 0}
          label={
            <span className="flex items-center gap-2">
              {icon?.(o)}
              <span className="truncate">{o.name}</span>
            </span>
          }
        />
      ))}
      {(hidden > 0 || expanded) && !query && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 flex items-center gap-1 text-sm font-extrabold text-cta"
        >
          {expanded ? 'Show less' : `${hidden} more`}
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
      )}
    </Panel>
  )
}

function PriceRange({ min, max, onApply }: { min: string; max: string; onApply: (min: string, max: string) => void }) {
  const [lo, setLo] = useState(min)
  const [hi, setHi] = useState(max)

  // Follow the URL when it changes elsewhere (chip removed, "Clear all", back button).
  const [synced, setSynced] = useState({ min, max })
  if (synced.min !== min || synced.max !== max) {
    setSynced({ min, max })
    setLo(min)
    setHi(max)
  }

  // Apply shortly after typing stops, so the list does not jump on every keystroke.
  useEffect(() => {
    if (lo === min && hi === max) return
    const id = setTimeout(() => onApply(lo, hi), 700)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lo, hi])

  const input = 'h-10 w-full min-w-0 bg-black/20 px-3 text-base font-semibold text-white placeholder:text-muted focus:outline-none'
  return (
    <div className="flex items-center gap-2">
      <input type="number" min={0} inputMode="decimal" placeholder="Min" aria-label="Minimum price" value={lo} onChange={(e) => setLo(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onApply(lo, hi)} className={input} />
      <span className="font-bold">-</span>
      <input type="number" min={0} inputMode="decimal" placeholder="Max" aria-label="Maximum price" value={hi} onChange={(e) => setHi(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onApply(lo, hi)} className={input} />
    </div>
  )
}
