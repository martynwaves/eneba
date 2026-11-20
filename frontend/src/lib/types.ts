export type ProductType = 'game' | 'dlc' | 'gift_card' | 'egift_card' | 'e_money' | 'subscription' | 'game_points' | 'software'

export interface ProductArt {
  brand: string
  label: string
  sublabel?: string
}

export interface ProductCard {
  id: number
  slug: string
  title: string
  base_title: string
  type: ProductType
  platform: { slug: string; name: string; family: string }
  region: { slug: string; name: string; color: string }
  cover_url: string | null
  header_url: string | null
  art: ProductArt | null
  min_price: number | null
  msrp: number | null
  discount_percent: number | null
  best_offer_id: number | null
  cashback_percent: number
  in_stock: boolean
  rating_avg: number
  rating_count: number
  release_date: string | null
  is_preorder: boolean
}

export interface Seller {
  id: number
  slug: string
  name: string
  rating: number
  rating_label: string
  rating_count: number
  is_verified: boolean
  avatar_color: string
}

export interface Offer {
  id: number
  price: number
  stock: number
  in_stock: boolean
  is_lowest: boolean
  is_best_cashback: boolean
  cashback_percent: number
  seller: Seller
}

export interface ProductVariant {
  slug: string
  platform: string
  region: string
  min_price: number | null
  in_stock: boolean
  is_current: boolean
}

export type OperatingSystem = 'windows' | 'mac' | 'linux'

export type ReviewAspect = 'gameplay' | 'story' | 'graphics' | 'soundtrack'

export interface ProductDetail extends ProductCard {
  description: string | null
  developer: string | null
  publisher: string | null
  screenshots: { thumb: string; full: string }[]
  platform_requirements: Partial<Record<OperatingSystem, { minimum?: string | null; recommended?: string | null }>>
  languages: string[]
  trailer: { name: string; thumb: string | null; hls: string | null } | null
  about: { type: 'heading' | 'paragraph'; text: string }[]
  steam_app_id: number | null
  wishlist_count: number
  watching: number
  operating_systems: string[]
  genres: { slug: string; name: string }[]
  activation: {
    platform: string
    key_label: string
    url: string | null
  }
  featured_offer_id: number | null
  offers: Offer[]
  variants: ProductVariant[]
  similar: ProductCard[]
}

export interface Paginated<T> {
  data: T[]
  meta: { current_page: number; last_page: number; total: number }
}

export interface Facets {
  platform: Record<string, number>
  region: Record<string, number>
  genre: Record<string, number>
  type: Record<string, number>
  price: { min: number | null; max: number | null }
}

export interface ProductListResponse extends Paginated<ProductCard> {
  facets: Facets
  search: { corrected_to: string | null } | null
}

export interface FilterOption {
  slug: string
  name: string
  family?: string
  description?: string
}

export interface CatalogFilters {
  platforms: FilterOption[]
  regions: FilterOption[]
  genres: FilterOption[]
  types: FilterOption[]
  sorts: { value: string; label: string }[]
}

export interface SearchSuggestions {
  products: ProductCard[]
  total: number
  corrected_to: string | null
}

export interface Review {
  id: number
  author_name: string
  rating: number
  aspects: Partial<Record<ReviewAspect, number>> | null
  body: string
  is_verified_purchase: boolean
  created_at: string
}

export interface ReviewsResponse extends Paginated<Review> {
  summary: { count: number; aspects: Record<ReviewAspect, number | null> }
}

export interface HomepageBlockMeta {
  key: string
  type: 'hero' | 'shortcuts' | 'product_row' | 'product_carousel' | 'product_grid' | 'brand_carousel' | 'genre_grid' | string
  title: string | null
  /** Shown in the info tooltip next to the title. */
  subtitle: string | null
  link_url: string | null
  link_label: string
  endpoint: string
}

export interface Banner {
  id: number
  title: string
  subtitle: string | null
  image_url: string
  image_narrow_url: string
  link_url: string
}

export interface Shortcut {
  id: number
  label: string
  icon_svg: string | null
  link_url: string
}

export interface BrandTile {
  id: number
  slug: string
  name: string
  image_url: string
  link_url: string
}

export interface GenreTile {
  slug: string
  name: string
  icon_url: string | null
  count: number
  link_url: string
}

export interface NavLink {
  id: number
  label: string
  link_url: string
  style: 'default' | 'menu' | 'highlight'
}

export interface LocaleRegion {
  code: string
  name: string
  flag: string
  product_regions: string[]
}

export interface Currency {
  code: string
  name: string
  symbol: string
  rate: number
}

export interface SettingsOptions {
  regions: LocaleRegion[]
  languages: { code: string; name: string }[]
  currencies: Currency[]
  charge_currency: string
}

export interface HomepageBlock<C = Record<string, unknown>> extends Omit<HomepageBlockMeta, 'endpoint'> {
  content: C
}

export interface User {
  id: number
  name: string
  email: string
  /** The Eneba Wallet balance: seller cashback and refunded keys land here; checkout can spend it. */
  cashback_balance: number
  wishlist_count: number
  created_at: string
}

export interface LibraryKey {
  id: number
  revealed: boolean
  code: string | null
  order_number: string
  purchased_at: string | null
  product_title: string
  product_slug: string
  cover_url: string | null
  art: ProductArt | null
  platform_name: string
  region_name: string
  /** What refunding this key returns; null once it has been revealed. */
  refund_amount: number | null
}

export interface CartLine {
  offer_id: number
  quantity: number
  unit_price: number
  /** Cashback of the chosen seller offer (what checkout will credit). */
  cashback_percent: number
  line_total: number
  available_stock: number
  problem: 'out_of_stock' | 'insufficient_stock' | null
  product: ProductCard
  seller: Seller
}

export interface CartSummary {
  items_count: number
  subtotal: number
  service_fee: number
  discount: number
  discount_code: string | null
  discount_error: string | null
  total: number
  has_problems: boolean
}

export interface Cart {
  lines: CartLine[]
  summary: CartSummary
}

export type OrderStatus = 'pending' | 'paid' | 'failed' | 'expired' | 'refunded' | 'cancelled'

export interface OrderItem {
  id: number
  product_title: string
  product_slug: string
  cover_url: string | null
  art: ProductArt | null
  platform_name: string
  region_name: string
  seller_name: string
  seller_avatar_color: string | null
  region_slug: string | null
  cashback_percent: number
  unit_price: number
  quantity: number
  refunded_quantity: number
  keys: { id: number; revealed: boolean; code: string | null; refund_amount: number | null }[]
}

/** Where a key refund went: the card share is refunded first, the rest goes back to the wallet. */
export interface KeyRefund {
  amount: number
  to_card: number
  to_wallet: number
}

export interface Order {
  number: string
  status: OrderStatus
  subtotal: number
  service_fee: number
  discount: number
  discount_code: string | null
  total: number
  wallet_amount: number
  card_amount: number
  refunded: number
  payment_provider: 'stripe' | 'simulated' | 'wallet'
  created_at: string
  paid_at: string | null
  expires_at: string | null
  items_count: number
  items: OrderItem[]
}

export interface AppConfig {
  payment: { driver: 'stripe' | 'simulated'; stripe_publishable_key: string | null }
  demo_discount_codes: { code: string; summary: string }[]
}
