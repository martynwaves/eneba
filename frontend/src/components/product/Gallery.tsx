import clsx from 'clsx'
import { ChevronLeft, ChevronRight, ExternalLink, Play, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

type Trailer = { name: string; thumb: string | null; hls: string | null }

// Steam only serves trailers as HLS: Safari (and newer Chromium) play it natively; elsewhere the
// trailer opens on Steam rather than pulling in a streaming library.
const canPlayHls = () => typeof document !== 'undefined' && document.createElement('video').canPlayType('application/vnd.apple.mpegurl') !== ''

export function Gallery({
  screenshots,
  title,
  trailer = null,
  steamAppId = null,
}: {
  screenshots: { thumb: string; full: string }[]
  title: string
  trailer?: Trailer | null
  steamAppId?: number | null
}) {
  const [open, setOpen] = useState<number | null>(null)
  const [playing, setPlaying] = useState(false)

  if (screenshots.length === 0 && !trailer) return null

  const thumbClass = 'relative aspect-video w-44 shrink-0 overflow-hidden bg-brand-deep outline-white/50 hover:outline-2 md:w-auto md:min-w-0 md:flex-1 md:max-w-[206px]'

  return (
    <>
      <div className="scrollbar-none -mx-4 flex gap-3 overflow-x-auto px-4 md:mx-0 md:px-0">
        {trailer?.thumb && (
          <button type="button" onClick={() => setPlaying(true)} className={thumbClass} aria-label={`Play trailer: ${trailer.name}`}>
            <img src={trailer.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid h-9 w-12 place-items-center rounded-lg bg-[#e8212b]">
                <Play className="size-5 fill-white text-white" />
              </span>
            </span>
            <span className="absolute bottom-1.5 left-1.5 border border-white/80 bg-black/50 px-1 text-[9px] font-extrabold tracking-wide uppercase">Official trailer</span>
          </button>
        )}
        {screenshots.slice(0, trailer?.thumb ? 5 : 6).map((s, i) => (
          <button
            key={s.full}
            type="button"
            onClick={() => setOpen(i)}
            className={thumbClass}
            aria-label={`Open screenshot ${i + 1}`}
          >
            <img src={s.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
          </button>
        ))}
      </div>

      {playing && trailer && (
        <TrailerDialog trailer={trailer} title={title} steamAppId={steamAppId} onClose={() => setPlaying(false)} />
      )}

      {open !== null && <ScreenshotLightbox screenshots={screenshots} title={title} start={open} onClose={() => setOpen(null)} />}
    </>
  )
}

function TrailerDialog({ trailer, title, steamAppId, onClose }: { trailer: Trailer; title: string; steamAppId: number | null; onClose: () => void }) {
  const [native] = useState(canPlayHls)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/90 p-4" role="dialog" aria-modal="true" aria-label={`${title} trailer`}>
      <button type="button" className="absolute inset-0" aria-label="Close" onClick={onClose} />
      <div className="relative w-full max-w-5xl">
        {native && trailer.hls ? (
          <video src={trailer.hls} poster={trailer.thumb ?? undefined} controls autoPlay className="aspect-video w-full bg-black" />
        ) : (
          <div className="relative aspect-video w-full overflow-hidden bg-black">
            {trailer.thumb && <img src={trailer.thumb} alt="" className="h-full w-full object-cover opacity-60" />}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              <p className="text-lg font-extrabold">{trailer.name}</p>
              {steamAppId && (
                <a
                  href={`https://store.steampowered.com/app/${steamAppId}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 bg-cta px-5 py-2.5 font-extrabold text-black hover:bg-cta-hover"
                >
                  Watch the trailer on Steam <ExternalLink className="size-4" />
                </a>
              )}
            </div>
          </div>
        )}
      </div>
      <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-white transition-colors hover:text-[#ff3b3b]" aria-label="Close">
        <X className="size-7" />
      </button>
    </div>
  )
}

/**
 * Full-screen screenshots on a sliding track, so moving between images glides instead of jumping.
 * Both arrows stay on screen: hovering dims one, and the one with nowhere to go fades out further.
 */
function ScreenshotLightbox({ screenshots, title, start, onClose }: { screenshots: { full: string }[]; title: string; start: number; onClose: () => void }) {
  const [index, setIndex] = useState(start)
  const touchX = useRef<number | null>(null)
  const last = screenshots.length - 1
  const step = useCallback((by: number) => setIndex((i) => Math.max(0, Math.min(last, i + by))), [last])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') step(1)
      if (e.key === 'ArrowLeft') step(-1)
    }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [step, onClose])

  return (
    <div
      className="fixed inset-0 z-[120] bg-black/85"
      role="dialog"
      aria-modal="true"
      aria-label={`${title} screenshots`}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1)
        touchX.current = null
      }}
    >
      <div className="h-full overflow-hidden">
        <div className="flex h-full transition-transform duration-500 ease-[cubic-bezier(0.22,0.61,0.36,1)]" style={{ transform: `translateX(-${index * 100}%)` }}>
          {screenshots.map((s, i) => (
            <div key={s.full} className="flex h-full w-full shrink-0 items-center justify-center px-4 md:px-[120px]" onClick={(e) => e.target === e.currentTarget && onClose()}>
              <img
                src={s.full}
                alt={`${title} screenshot ${i + 1}`}
                loading={Math.abs(i - index) <= 1 ? 'eager' : 'lazy'}
                aria-hidden={i !== index}
                className="max-h-[88vh] max-w-full object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      <LightboxArrow side="left" disabled={index === 0} onClick={() => step(-1)} />
      <LightboxArrow side="right" disabled={index === last} onClick={() => step(1)} />

      <button type="button" onClick={onClose} className="absolute top-4 right-4 p-2 text-white transition-colors hover:text-[#ff3b3b]" aria-label="Close">
        <X className="size-8" strokeWidth={1.8} />
      </button>
      <div className="absolute inset-x-0 bottom-4 text-center text-sm font-semibold text-white/70">
        {index + 1} / {screenshots.length}
      </div>
    </div>
  )
}

function LightboxArrow({ side, disabled, onClick }: { side: 'left' | 'right'; disabled: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={side === 'left' ? 'Previous screenshot' : 'Next screenshot'}
      className={clsx(
        'absolute top-1/2 grid h-[96px] w-[54px] -translate-y-1/2 place-items-center bg-white/45 text-white transition-opacity duration-150 md:h-[130px] md:w-[82px]',
        side === 'left' ? 'left-2 md:left-3' : 'right-2 md:right-3',
        disabled ? 'cursor-default opacity-30' : 'opacity-100 hover:opacity-60',
      )}
    >
      {side === 'left' ? <ChevronLeft className="size-10 md:size-12" strokeWidth={1.2} /> : <ChevronRight className="size-10 md:size-12" strokeWidth={1.2} />}
    </button>
  )
}
