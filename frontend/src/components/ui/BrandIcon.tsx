import { PLATFORM_BRAND, brandData } from '../../lib/brands'

/** A single-path icon filled with the current text colour (simple-icons marks and our own). */
export function PathIcon({ path, className = 'size-5' }: { path: string; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d={path} />
    </svg>
  )
}

export function BrandIcon({ brand, className = 'size-4' }: { brand: string; className?: string }) {
  const data = brandData(brand)
  return data ? <PathIcon path={data.path} className={className} /> : null
}

export function PlatformIcon({ platform, className }: { platform: string; className?: string }) {
  const brand = PLATFORM_BRAND[platform]
  if (!brand) {
    return (
      <svg viewBox="0 0 24 24" className={className ?? 'size-4'} fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M21 2l-2 2m-7.6 7.6a5.5 5.5 0 1 1-7.8 7.8 5.5 5.5 0 0 1 7.8-7.8Zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4" />
      </svg>
    )
  }
  return <BrandIcon brand={brand} className={className} />
}
