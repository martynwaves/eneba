import { useState } from 'react'
import { Link } from 'react-router'
import { useHomepageBlock } from '../../api/queries'
import type { BrandTile, GenreTile, HomepageBlockMeta, ProductCard as Product } from '../../lib/types'
import { ProductCard, ProductCardSkeleton } from '../product/ProductCard'
import { ProductRow } from '../product/ProductRow'
import { Carousel } from '../ui/Carousel'
import { BlockError } from './BlockError'
import { Section, SectionButton, SectionTitle } from './Section'

type Tone = 'light' | 'dark'
interface BlockProps {
  meta: HomepageBlockMeta
  tone: Tone
}

function Shell({ meta, tone, children, footer = true }: BlockProps & { children: React.ReactNode; footer?: boolean }) {
  return (
    <Section tone={tone} label={meta.title}>
      <SectionTitle title={meta.title} tooltip={meta.subtitle} />
      {children}
      {footer && meta.link_url && <SectionButton to={meta.link_url}>{meta.link_label}</SectionButton>}
    </Section>
  )
}

/** A fixed row of cards without scrolling ("Recommended for you"). */
export function ProductRowBlock({ meta, tone }: BlockProps) {
  const { data, isLoading, isError, refetch } = useHomepageBlock<{ products: Product[] }>(meta)
  if (isError) return <BlockErrorSection meta={meta} tone={tone} onRetry={refetch} />
  if (!isLoading && !data?.content.products.length) return null

  const items = isLoading ? Array.from({ length: 5 }, () => null) : data!.content.products
  return (
    <Shell meta={meta} tone={tone}>
      <div className="scrollbar-none -mx-4 grid auto-cols-[45%] grid-flow-col gap-3 overflow-x-auto px-4 sm:auto-cols-[30%] md:mx-0 md:grid-flow-row md:grid-cols-4 md:gap-5 md:overflow-visible md:px-0 lg:grid-cols-5">
        {items.map((p, i) => (p ? <ProductCard key={p.id} product={p} /> : <ProductCardSkeleton key={i} />))}
      </div>
    </Shell>
  )
}

/** A scrolling row of cards with side arrows and a scrollbar. */
export function ProductCarouselBlock({ meta, tone }: BlockProps) {
  const { data, isLoading, isError, refetch } = useHomepageBlock<{ products: Product[] }>(meta)
  if (isError) return <BlockErrorSection meta={meta} tone={tone} onRetry={refetch} />
  if (!isLoading && !data?.content.products.length) return null

  return (
    <Shell meta={meta} tone={tone}>
      <ProductRow products={data?.content.products} loading={isLoading} />
    </Shell>
  )
}

/** Brand storefront tiles ("Best selling eGift Cards"). */
export function BrandCarouselBlock({ meta, tone }: BlockProps) {
  const { data, isLoading, isError, refetch } = useHomepageBlock<{ brands: BrandTile[] }>(meta)
  if (isError) return <BlockErrorSection meta={meta} tone={tone} onRetry={refetch} />
  if (!isLoading && !data?.content.brands.length) return null

  return (
    <Shell meta={meta} tone={tone}>
      <Carousel arrowTop="50%">
        {isLoading
          ? Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton aspect-[200/280]" />)
          : data!.content.brands.map((brand) => (
              <Link key={brand.id} to={brand.link_url} className="group block overflow-hidden" aria-label={`${brand.name} gift cards`}>
                <img
                  src={brand.image_url}
                  alt={`${brand.name} gift cards`}
                  loading="lazy"
                  className="aspect-[200/280] w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                />
              </Link>
            ))}
      </Carousel>
    </Shell>
  )
}

/** Game categories with live product counts; each "Load more" reveals `more_rows` more rows. */
export function GenreGridBlock({ meta, tone }: BlockProps) {
  const { data, isLoading, isError, refetch } = useHomepageBlock<{ genres: GenreTile[]; columns: number; initial_rows: number; more_rows: number }>(meta)
  const [loads, setLoads] = useState(0)
  if (isError) return <BlockErrorSection meta={meta} tone={tone} onRetry={refetch} />
  if (!isLoading && !data?.content.genres.length) return null

  const content = data?.content
  const rows = (content?.initial_rows ?? 1) + loads * (content?.more_rows ?? 2)
  const visible = (content?.columns ?? 7) * rows
  const genres = content?.genres.slice(0, visible) ?? []
  const hasMore = (content?.genres.length ?? 0) > visible

  return (
    <Shell meta={meta} tone={tone} footer={false}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-[30px] lg:grid-cols-7">
        {isLoading
          ? Array.from({ length: 7 }, (_, i) => <div key={i} className="skeleton h-[140px]" />)
          : genres.map((genre) => (
              <Link
                key={genre.slug}
                to={genre.link_url}
                className="flex h-[140px] flex-col items-center justify-between bg-brand-panel py-[22px] shadow-[0_7px_15px_rgba(0,0,0,0.2)] transition-colors hover:bg-brand-raised"
              >
                <span className="text-base font-extrabold">{genre.count}</span>
                {genre.icon_url && <img src={genre.icon_url} alt="" className="size-10" loading="lazy" />}
                <span className="text-base font-extrabold">{genre.name}</span>
              </Link>
            ))}
      </div>
      {hasMore && <SectionButton onClick={() => setLoads((n) => n + 1)}>Load more</SectionButton>}
    </Shell>
  )
}

function BlockErrorSection({ meta, tone, onRetry }: BlockProps & { onRetry: () => unknown }) {
  return (
    <Section tone={tone} label={meta.title}>
      <BlockError title={meta.title} onRetry={() => onRetry()} />
    </Section>
  )
}
