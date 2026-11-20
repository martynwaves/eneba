import type { ProductCard as Product } from '../../lib/types'
import { Carousel } from '../ui/Carousel'
import { ProductCard, ProductCardSkeleton } from './ProductCard'

/** Scrolling card row with arrows and scrollbar (homepage carousels, the cart page's "Inspired by your picks"). */
export function ProductRow({ products, loading }: { products?: Product[]; loading?: boolean }) {
  return (
    <Carousel>
      {loading || !products
        ? Array.from({ length: 6 }, (_, i) => <ProductCardSkeleton key={i} />)
        : products.map((p) => <ProductCard key={p.id} product={p} />)}
    </Carousel>
  )
}

/** A plain grid of cards, with skeletons while loading (wishlist, "Gamers also viewed"). */
export function ProductGrid({ products, loading, count = 10 }: { products?: Product[]; loading?: boolean; count?: number }) {
  const items = loading || !products ? Array.from({ length: count }, () => null) : products
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-5">
      {items.map((p, i) => (p ? <ProductCard key={p.id} product={p} /> : <ProductCardSkeleton key={i} />))}
    </div>
  )
}
