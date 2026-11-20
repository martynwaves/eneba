import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { HomepageBlocks } from '../components/home/BlockRenderer'
import { ProductCard } from '../components/product/ProductCard'
import type { ProductCard as Product } from '../lib/types'
import { useGuestWishlist } from '../stores/guestWishlist'

const product: Product = {
  id: 1,
  slug: 'steam-elden-ring-pc-steam-key-global',
  title: 'Elden Ring (PC) Steam Key GLOBAL',
  base_title: 'Elden Ring',
  type: 'game',
  platform: { slug: 'steam', name: 'Steam', family: 'pc' },
  region: { slug: 'global', name: 'GLOBAL', color: '#23c299' },
  cover_url: null,
  header_url: null,
  art: null,
  min_price: 2999,
  msrp: 5999,
  discount_percent: 50,
  best_offer_id: 10,
  cashback_percent: 5,
  in_stock: true,
  rating_avg: 4.6,
  rating_count: 12,
  release_date: '2022-02-24',
  is_preorder: false,
}

function renderWithProviders(ui: React.ReactNode) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

describe('ProductCard', () => {
  beforeEach(() => useGuestWishlist.getState().clear())

  it('shows title, region, discount, price and cashback', () => {
    renderWithProviders(<ProductCard product={product} />)

    expect(screen.getByRole('heading', { name: product.title })).toBeInTheDocument()
    expect(screen.getByText('GLOBAL')).toHaveStyle({ color: '#23c299' })
    expect(screen.getByText('-50%')).toBeInTheDocument()
    expect(screen.getByText('€29.99')).toBeInTheDocument()
    expect(screen.getByText('Cashback: €1.49')).toBeInTheDocument()
    expect(screen.getByText('Cashback')).toBeInTheDocument() // badge on the cover
  })

  it('offers "Add to cart" and "View offers" actions', () => {
    renderWithProviders(<ProductCard product={product} />)

    expect(screen.getByRole('button', { name: `Add to cart - ${product.title}` })).toBeEnabled()
    expect(screen.getByRole('link', { name: 'View offers' })).toHaveAttribute('href', `/${product.slug}#offers`)
  })

  it('lets guests save products to their wishlist without signing in', () => {
    renderWithProviders(<ProductCard product={product} />)

    fireEvent.click(screen.getByRole('button', { name: `Add ${product.title} to wishlist` }))

    expect(useGuestWishlist.getState().ids).toEqual([product.id])
    expect(screen.getByRole('button', { name: `Remove ${product.title} from wishlist` })).toHaveAttribute('aria-pressed', 'true')
  })

  it('marks sold out products and hides the cashback badge without cashback', () => {
    renderWithProviders(<ProductCard product={{ ...product, in_stock: false, min_price: null, best_offer_id: null, cashback_percent: 0 }} />)

    expect(screen.getByText('Sold out')).toBeInTheDocument()
    expect(screen.queryByText('Cashback')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: `Add to cart - ${product.title}` })).toBeDisabled()
  })
})

describe('HomepageBlocks', () => {
  it('ignores block types the frontend does not know', () => {
    const { container } = renderWithProviders(
      <HomepageBlocks blocks={[{ key: 'x', type: 'future_widget', title: null, subtitle: null, link_url: null, link_label: 'Show all', endpoint: '/x' }]} />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})
