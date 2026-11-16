import clsx from 'clsx'
import { useState } from 'react'
import type { ProductArt as Art } from '../../lib/types'
import { BrandIcon, brandColor } from '../ui/BrandIcon'

interface Props {
  title: string
  coverUrl: string | null
  headerUrl?: string | null
  art?: Art | null
  className?: string
  /** "portrait" crops landscape art to a box cover; "landscape" keeps 460x215 header ratio. */
  shape?: 'portrait' | 'landscape'
  eager?: boolean
}

/**
 * Box art from Steam when available. Gift cards and top-ups have no box art, so they get a
 * brand-coloured card face built from the product's `art` data, like Eneba's card tiles.
 */
export function ProductArt({ title, coverUrl, headerUrl, art, className, shape = 'portrait', eager }: Props) {
  const [failed, setFailed] = useState(false)
  const src = shape === 'portrait' ? (coverUrl ?? headerUrl) : (headerUrl ?? coverUrl)

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={title}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className={clsx('h-full w-full bg-brand-deep object-cover', className)}
      />
    )
  }

  const brand = art?.brand ?? 'steam'
  const color = brandColor(brand)

  return (
    <div
      role="img"
      aria-label={title}
      className={clsx('relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center', className)}
      style={{ background: `radial-gradient(120% 90% at 30% 10%, ${color}cc 0%, #1f0a4d 70%)` }}
    >
      <div className="absolute -right-8 -bottom-8 opacity-15">
        <BrandIcon brand={brand} className="size-40" />
      </div>
      {brand === 'eneba' ? (
        <img src="https://static.eneba.games/branding/v2/logoSymbol.svg" alt="" className={shape === 'portrait' ? 'size-16' : 'size-11'} />
      ) : (
        <BrandIcon brand={brand} className={shape === 'portrait' ? 'size-14' : 'size-10'} />
      )}
      {art ? (
        <>
          <div className={clsx('mt-3 px-3 font-extrabold leading-none', shape === 'portrait' ? 'text-3xl' : 'text-2xl')}>{art.label}</div>
          {art.sublabel && <div className="mt-2 px-3 text-xs font-semibold tracking-wide text-white/80 uppercase">{art.sublabel}</div>}
        </>
      ) : (
        <div className="mt-3 line-clamp-3 px-3 text-sm font-extrabold">{title}</div>
      )}
    </div>
  )
}
