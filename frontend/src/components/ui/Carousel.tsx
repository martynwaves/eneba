import clsx from 'clsx'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Horizontally scrolling row with Eneba's side arrows and a slim scrollbar underneath.
 * Arrows and scrollbar appear while the row is hovered; an arrow pointing past the end is
 * dimmed rather than removed. Dragging or clicking the scrollbar slides the row smoothly.
 * Touch screens keep native swipe scrolling with card snapping.
 */
export function Carousel({ children, arrowTop = '40%' }: { children: ReactNode[]; arrowTop?: string }) {
  const track = useRef<HTMLDivElement>(null)
  const bar = useRef<HTMLDivElement>(null)
  const [state, setState] = useState({ start: true, end: false, thumb: 1, offset: 0 })
  const [dragging, setDragging] = useState(false)

  const measure = useCallback(() => {
    const el = track.current
    if (!el) return
    const max = el.scrollWidth - el.clientWidth
    const thumb = el.scrollWidth > 0 ? el.clientWidth / el.scrollWidth : 1
    setState({
      start: el.scrollLeft <= 4,
      end: el.scrollLeft >= max - 4,
      thumb,
      offset: max > 0 ? (el.scrollLeft / max) * (1 - thumb) : 0,
    })
  }, [])

  useEffect(() => {
    measure()
    const el = track.current
    if (!el) return
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [measure, children.length])

  const page = (dir: 1 | -1) => {
    const el = track.current
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' })
  }

  // Thumb dragging: map pointer movement onto the scroll range, one frame at a time.
  const drag = useRef<{ x: number; scroll: number; target: number; frame: number } | null>(null)
  const onThumbDown = (e: React.PointerEvent) => {
    e.preventDefault()
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    const scroll = track.current?.scrollLeft ?? 0
    drag.current = { x: e.clientX, scroll, target: scroll, frame: 0 }
    setDragging(true)
  }
  const onThumbMove = (e: React.PointerEvent) => {
    const el = track.current
    const barEl = bar.current
    const d = drag.current
    if (!d || !el || !barEl) return
    d.target = d.scroll + (e.clientX - d.x) * (el.scrollWidth / barEl.clientWidth)
    if (!d.frame) {
      d.frame = requestAnimationFrame(() => {
        if (drag.current) {
          el.scrollLeft = drag.current.target
          drag.current.frame = 0
        }
      })
    }
  }
  const onThumbUp = () => {
    if (drag.current?.frame) cancelAnimationFrame(drag.current.frame)
    drag.current = null
    setDragging(false)
  }
  const onTrackClick = (e: React.MouseEvent) => {
    const el = track.current
    const barEl = bar.current
    if (!el || !barEl || e.target !== barEl) return
    const rect = barEl.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    el.scrollTo({ left: ratio * el.scrollWidth - el.clientWidth / 2, behavior: 'smooth' })
  }

  const scrollable = state.thumb < 0.999
  const controls = clsx('transition-opacity duration-200', dragging ? 'opacity-100' : 'opacity-0 group-hover/carousel:opacity-100 group-focus-within/carousel:opacity-100')

  return (
    <div className="group/carousel">
      <div className="relative">
        <div
          ref={track}
          onScroll={measure}
          className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 md:mx-0 md:snap-none md:gap-5 md:px-0"
        >
          {children.map((child, i) => (
            <div key={i} className="w-[45%] shrink-0 snap-start sm:w-[30%] md:w-[calc((100%-60px)/4)] lg:w-[calc((100%-80px)/5)] xl:w-[calc((100%-100px)/6)]">
              {child}
            </div>
          ))}
        </div>
        {scrollable && (
          // Own stacking layer above the cards: while fading in, the opacity would otherwise put the
          // arrows underneath a hovered card's raised details. It spans the row so the arrows'
          // `top` is measured against the cards; clicks pass through to the cards beneath.
          <div className={clsx('pointer-events-none absolute inset-0 z-30 hidden md:block [&>button]:pointer-events-auto', controls)}>
            <ArrowButton side="left" disabled={state.start} top={arrowTop} onClick={() => page(-1)} />
            <ArrowButton side="right" disabled={state.end} top={arrowTop} onClick={() => page(1)} />
          </div>
        )}
      </div>

      {/* Space is always reserved so the section doesn't jump when the bar appears. */}
      <div className="mt-[30px] h-1">
        {scrollable && (
          <div ref={bar} onClick={onTrackClick} className={clsx('relative hidden h-1 cursor-pointer bg-brand-panel md:block', controls)} aria-hidden="true">
            <div
              onPointerDown={onThumbDown}
              onPointerMove={onThumbMove}
              onPointerUp={onThumbUp}
              onPointerCancel={onThumbUp}
              className="absolute inset-y-0 cursor-grab bg-white active:cursor-grabbing"
              style={{ width: `${state.thumb * 100}%`, left: `${state.offset * 100}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

function ArrowButton({ side, disabled, top, onClick }: { side: 'left' | 'right'; disabled: boolean; top: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Scroll left' : 'Scroll right'}
      style={{ top }}
      className={clsx(
        // No backdrop blur: it renders a beat after the fade-in and makes the background "jump".
        'absolute z-20 flex h-[72px] w-[40px] -translate-y-1/2 items-center justify-center',
        side === 'left' ? 'left-0' : 'right-0',
        disabled ? 'cursor-default bg-white/25 text-brand-deep/40' : 'bg-white/50 text-brand-deep hover:bg-white/75',
      )}
    >
      {side === 'left' ? <ChevronLeft className="size-7" strokeWidth={1.6} /> : <ChevronRight className="size-7" strokeWidth={1.6} />}
    </button>
  )
}
