import type { ComponentType } from 'react'
import type { HomepageBlockMeta } from '../../lib/types'
import { HeroBlock } from './HeroBlock'
import { BrandCarouselBlock, GenreGridBlock, ProductCarouselBlock, ProductRowBlock } from './ProductBlocks'
import { ShortcutsBlock } from './ShortcutsBlock'

type Tone = 'light' | 'dark'

/** Blocks that sit in alternating light/dark bands. */
const SECTIONS: Record<string, ComponentType<{ meta: HomepageBlockMeta; tone: Tone }>> = {
  product_row: ProductRowBlock,
  product_carousel: ProductCarouselBlock,
  product_grid: ProductRowBlock,
  brand_carousel: BrandCarouselBlock,
  genre_grid: GenreGridBlock,
}

/** Blocks with their own full-width layout. */
const STANDALONE: Record<string, ComponentType<{ meta: HomepageBlockMeta }>> = {
  hero: HeroBlock,
  shortcuts: ShortcutsBlock,
}

/**
 * Maps block types from the backend layout to components. The homepage itself holds no
 * content: adding, removing or reordering blocks is a database change, not a deploy.
 * Unknown types are skipped, so an older frontend survives new block types.
 */
export function HomepageBlocks({ blocks }: { blocks: HomepageBlockMeta[] }) {
  // Product sections alternate light/dark, counting only the sections (not hero, shortcuts...).
  const sections = blocks.filter((meta) => !STANDALONE[meta.type] && SECTIONS[meta.type])
  return (
    <>
      {blocks.map((meta) => {
        const Standalone = STANDALONE[meta.type]
        if (Standalone) return <Standalone key={meta.key} meta={meta} />
        const Section = SECTIONS[meta.type]
        if (!Section) return null
        const tone: Tone = sections.indexOf(meta) % 2 === 0 ? 'light' : 'dark'
        return <Section key={meta.key} meta={meta} tone={tone} />
      })}
    </>
  )
}
