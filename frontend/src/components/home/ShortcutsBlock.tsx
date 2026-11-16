import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useHomepageBlock } from '../../api/queries'
import type { HomepageBlockMeta, Shortcut } from '../../lib/types'
import { BlockError } from './BlockError'

/**
 * Category quick links under the hero, with Eneba's fading side arrows. Labels, links and
 * icons come from the `shortcuts` table; icons are monochrome SVGs drawn as CSS masks so
 * they follow the text colour (white, yellow on hover).
 */
export function ShortcutsBlock({ meta }: { meta: HomepageBlockMeta }) {
  const { data, isLoading, isError, refetch } = useHomepageBlock<{ items: Shortcut[] }>(meta)
  const track = useRef<HTMLDivElement>(null)
  const [edges, setEdges] = useState({ start: true, end: false })

  const measure = useCallback(() => {
    const el = track.current
    if (el) setEdges({ start: el.scrollLeft <= 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 })
  }, [])

  useEffect(() => {
    measure()
    const el = track.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, data])

  const scroll = (dir: 1 | -1) => track.current?.scrollBy({ left: dir * track.current.clientWidth * 0.7, behavior: 'smooth' })

  if (isError) {
    return (
      <div className="page-container py-4">
        <BlockError onRetry={() => refetch()} />
      </div>
    )
  }

  return (
    <nav aria-label="Shop by category" className="page-container relative py-5">
      <div ref={track} onScroll={measure} className="scrollbar-none flex overflow-x-auto">
        {isLoading
          ? Array.from({ length: 12 }, (_, i) => <div key={i} className="skeleton mx-2 h-[70px] w-[78px] shrink-0" />)
          : data?.content.items.map((item) => (
              <Link
                key={item.id}
                to={item.link_url}
                className="flex w-[94px] shrink-0 flex-col items-center gap-2.5 px-1 py-2 text-center text-[13px] leading-tight font-extrabold transition-colors hover:text-cta"
              >
                <ShortcutIcon item={item} />
                <span>{item.label}</span>
              </Link>
            ))}
      </div>
      <EdgeArrow side="left" hidden={edges.start} onClick={() => scroll(-1)} />
      <EdgeArrow side="right" hidden={edges.end} onClick={() => scroll(1)} />
    </nav>
  )
}

function ShortcutIcon({ item }: { item: Shortcut }) {
  if (!item.icon_svg) return <span className="size-8 rounded-full bg-current opacity-60" aria-hidden="true" />
  const mask = `url("data:image/svg+xml;utf8,${encodeURIComponent(item.icon_svg)}") center / contain no-repeat`
  return <span className="block h-8 w-9 bg-current" style={{ mask, WebkitMask: mask }} aria-hidden="true" />
}

/** Both arrows are always shown; the one pointing past the end is dimmed and disabled. */
function EdgeArrow({ side, hidden, onClick }: { side: 'left' | 'right'; hidden: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={hidden}
      aria-label={side === 'left' ? 'Show previous categories' : 'Show more categories'}
      className={clsx(
        'absolute top-5 bottom-5 z-10 flex w-[44px] items-center transition-colors',
        side === 'left'
          ? 'left-0 justify-start bg-linear-to-r from-brand from-50% to-transparent pl-2 md:left-2'
          : 'right-0 justify-end bg-linear-to-l from-brand from-50% to-transparent pr-2 md:right-2',
        hidden ? 'cursor-default text-muted-2/70' : 'text-white hover:text-cta',
      )}
    >
      {side === 'left' ? <ChevronLeft className="size-6" /> : <ChevronRight className="size-6" />}
    </button>
  )
}
