import { useState } from 'react'
import { brandColor } from '../../lib/brands'
import { LOGO_SYMBOL_URL } from '../../lib/links'
import type { ProductArt as Art } from '../../lib/types'
import { BrandIcon } from '../ui/BrandIcon'

interface Props {
  title: string
  coverUrl: string | null
  headerUrl?: string | null
  art?: Art | null
  eager?: boolean
}

/**
 * Box art from Steam when available. Gift cards and top-ups have no box art, so they get a
 * brand-coloured card face built from the product's `art` data, like Eneba's card tiles.
 */
export function ProductArt({ title, coverUrl, headerUrl, art, eager }: Props) {
  const [failed, setFailed] = useState(false)
  const src = coverUrl ?? headerUrl

  if (src && !failed) {
    return (
      <img
        src={src}
        alt={title}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onError={() => setFailed(true)}
        className="h-full w-full bg-brand-deep object-cover"
      />
    )
  }

  const brand = art?.brand ?? 'steam'

  return (
    <div
      role="img"
      aria-label={title}
      className="relative flex h-full w-full flex-col items-center justify-center overflow-hidden text-center"
      style={{ background: `radial-gradient(120% 90% at 30% 10%, ${brandColor(brand)}cc 0%, #1f0a4d 70%)` }}
    >
      <div className="absolute -right-8 -bottom-8 opacity-15">
        <BrandIcon brand={brand} className="size-40" />
      </div>
      {brand === 'eneba' ? <img src={LOGO_SYMBOL_URL} alt="" className="size-16" /> : <BrandIcon brand={brand} className="size-14" />}
      {art ? (
        <>
          <div className="mt-3 px-3 text-3xl leading-none font-extrabold">{art.label}</div>
          {art.sublabel && <div className="mt-2 px-3 text-xs font-semibold tracking-wide text-white/80 uppercase">{art.sublabel}</div>}
        </>
      ) : (
        <div className="mt-3 line-clamp-3 px-3 text-sm font-extrabold">{title}</div>
      )}
    </div>
  )
}
