import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'

function pages(current: number, last: number): (number | '…')[] {
  if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1)
  const set = new Set([1, last, current, current - 1, current + 1])
  const list = [...set].filter((p) => p >= 1 && p <= last).sort((a, b) => a - b)
  const out: (number | '…')[] = []
  list.forEach((p, i) => {
    if (i > 0 && p - list[i - 1] > 1) out.push('…')
    out.push(p)
  })
  return out
}

export function Pagination({ current, last, onChange }: { current: number; last: number; onChange: (page: number) => void }) {
  if (last <= 1) return null
  const btn = 'grid h-10 min-w-10 place-items-center px-2 text-sm font-extrabold transition-colors'
  return (
    <nav className="mt-10 flex items-center justify-center gap-1.5" aria-label="Pagination">
      <button type="button" disabled={current <= 1} onClick={() => onChange(current - 1)} className={clsx(btn, 'bg-brand-panel hover:bg-brand-raised disabled:opacity-40')} aria-label="Previous page">
        <ChevronLeft className="size-5" />
      </button>
      {pages(current, last).map((p, i) =>
        p === '…' ? (
          <span key={`gap-${i}`} className="px-1 text-muted">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === current ? 'page' : undefined}
            className={clsx(btn, p === current ? 'bg-cta text-black' : 'bg-brand-panel hover:bg-brand-raised')}
          >
            {p}
          </button>
        ),
      )}
      <button type="button" disabled={current >= last} onClick={() => onChange(current + 1)} className={clsx(btn, 'bg-brand-panel hover:bg-brand-raised disabled:opacity-40')} aria-label="Next page">
        <ChevronRight className="size-5" />
      </button>
    </nav>
  )
}
