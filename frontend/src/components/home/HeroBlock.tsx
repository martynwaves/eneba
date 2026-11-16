import clsx from 'clsx'
import { useState } from 'react'
import { Link } from 'react-router'
import { useHomepageBlock } from '../../api/queries'
import type { Banner, HomepageBlockMeta } from '../../lib/types'
import { BlockError } from './BlockError'

type HeroContent = { slides: Banner[] }

/**
 * Edge-to-edge promo strip. The first promo starts expanded; pressing a narrow promo expands
 * it (and collapses the previous one), pressing the expanded promo opens its page.
 * Artwork and links come from the `banners` table through the block's provider.
 */
export function HeroBlock({ meta }: { meta: HomepageBlockMeta }) {
  const { data, isLoading, isError, refetch } = useHomepageBlock<HeroContent>(meta)
  const [expanded, setExpanded] = useState(0)
  const slides = data?.content.slides ?? []

  if (isError) {
    return (
      <div className="page-container pt-4">
        <BlockError onRetry={() => refetch()} />
      </div>
    )
  }

  if (isLoading) return <div className="skeleton h-[200px] md:h-[285px]" />
  if (slides.length === 0) return null

  return (
    <section aria-label="Featured promotions" className="flex h-[200px] w-full overflow-hidden md:h-[285px]">
      {slides.map((slide, i) => {
        const isOpen = i === expanded
        return (
          <div
            key={slide.id}
            className="relative h-full min-w-0 overflow-hidden transition-[flex-grow,flex-basis] duration-500 ease-out"
            style={{ flexGrow: isOpen ? 1 : 0, flexShrink: 0, flexBasis: isOpen ? '0px' : 'var(--hero-narrow)' }}
          >
            {/* Wide artwork */}
            <div
              className={clsx('absolute inset-0 bg-cover bg-center transition-opacity duration-500', isOpen ? 'opacity-100' : 'opacity-0')}
              style={{ backgroundImage: `url("${slide.image_url}")` }}
            />
            {/* Narrow artwork */}
            <div
              className={clsx('absolute inset-0 bg-cover bg-center transition-opacity duration-300', isOpen ? 'opacity-0' : 'opacity-100')}
              style={{ backgroundImage: `url("${slide.image_narrow_url}")` }}
            />
            {isOpen ? (
              <Link to={slide.link_url} className="absolute inset-0" aria-label={`${slide.title} – ${slide.subtitle ?? 'open'}`} />
            ) : (
              <button
                type="button"
                onClick={() => setExpanded(i)}
                className="absolute inset-0 transition-colors hover:bg-white/10 focus-visible:-outline-offset-4"
                aria-label={`Show ${slide.title} promotion`}
                aria-expanded={false}
              />
            )}
          </div>
        )
      })}
    </section>
  )
}
