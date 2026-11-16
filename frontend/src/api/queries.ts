import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { api } from '../lib/api'
import type {
  AppConfig,
  CatalogFilters,
  HomepageBlock,
  HomepageBlockMeta,
  LibraryKey,
  NavLink,
  Order,
  Paginated,
  ProductCard,
  ProductDetail,
  ProductListResponse,
  ReviewsResponse,
  SearchSuggestions,
  SettingsOptions,
  User,
} from '../lib/types'
import { useAuth } from '../stores/auth'
import { useGuestWishlist } from '../stores/guestWishlist'

export const useAppConfig = () =>
  useQuery({
    queryKey: ['config'],
    queryFn: () => api<{ data: AppConfig }>('/config').then((r) => r.data),
    staleTime: Infinity,
  })

export const useCatalogFilters = () =>
  useQuery({
    queryKey: ['catalog-filters'],
    queryFn: () => api<{ data: CatalogFilters }>('/catalog/filters').then((r) => r.data),
    staleTime: 5 * 60_000,
  })

export type StoreParams = Record<string, string | undefined>

export const useProducts = (params: StoreParams) =>
  useQuery({
    queryKey: ['products', params],
    queryFn: ({ signal }) => api<ProductListResponse>('/products', { query: params, signal }),
    placeholderData: keepPreviousData,
  })

export const useProduct = (slug: string | undefined) =>
  useQuery({
    queryKey: ['product', slug],
    queryFn: () => api<{ data: ProductDetail }>(`/products/${slug}`).then((r) => r.data),
    enabled: Boolean(slug),
  })

export const useReviews = (slug: string, page: number) =>
  useQuery({
    queryKey: ['reviews', slug, page],
    queryFn: () => api<ReviewsResponse>(`/products/${slug}/reviews`, { query: { page } }),
    placeholderData: keepPreviousData,
  })

export const useSearchSuggestions = (q: string) =>
  useQuery({
    queryKey: ['suggest', q],
    queryFn: ({ signal }) => api<SearchSuggestions>('/search/suggest', { query: { q }, signal }),
    enabled: q.trim().length >= 2,
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  })

export const useHomepageLayout = () =>
  useQuery({
    queryKey: ['homepage'],
    queryFn: () => api<{ data: HomepageBlockMeta[] }>('/homepage').then((r) => r.data),
    staleTime: 60_000,
  })

/** Every block loads independently from its own endpoint. */
export function useHomepageBlock<C>(meta: HomepageBlockMeta) {
  const signedIn = useAuth((s) => s.token !== null)
  return useQuery({
    queryKey: ['homepage-block', meta.key, signedIn],
    queryFn: () => api<{ data: HomepageBlock<C> }>(meta.endpoint).then((r) => r.data),
    staleTime: 60_000,
  })
}

export const useOrders = (page: number) =>
  useQuery({
    queryKey: ['orders', page],
    queryFn: () => api<Paginated<Order>>('/orders', { query: { page } }),
    placeholderData: keepPreviousData,
  })

export const useOrder = (number: string | undefined) =>
  useQuery({
    queryKey: ['order', number],
    queryFn: () => api<{ data: Order }>(`/orders/${number}`).then((r) => r.data),
    enabled: Boolean(number),
  })

/** Signed-in wishlists live on the server; guest wishlists are product ids kept in the browser. */
export const useWishlist = () => {
  const signedIn = useAuth((s) => s.token !== null)
  const guestIds = useGuestWishlist((s) => s.ids)

  const account = useQuery({
    queryKey: ['wishlist'],
    queryFn: () => api<{ data: ProductCard[]; ids: number[] }>('/wishlist'),
    enabled: signedIn,
  })

  const guest = useQuery({
    queryKey: ['wishlist', 'guest', guestIds],
    queryFn: () =>
      guestIds.length === 0
        ? Promise.resolve({ data: [] as ProductCard[], ids: [] as number[] })
        : api<ProductListResponse>('/products', { query: { ids: guestIds.join(','), per_page: 60 } }).then((r) => ({
            // Keep the order in which the guest saved them.
            data: [...r.data].sort((a, b) => guestIds.indexOf(a.id) - guestIds.indexOf(b.id)),
            ids: guestIds,
          })),
    enabled: !signedIn,
    placeholderData: keepPreviousData,
  })

  if (signedIn) return account
  // Guests see their hearts instantly, before product details load.
  return { ...guest, data: guest.data ? { ...guest.data, ids: guestIds } : { data: undefined, ids: guestIds } }
}

/** Fresh profile stats (balance, Enebium, favourites) for the account dropdown. */
export const useMe = (enabled: boolean) => {
  const setUser = useAuth((s) => s.setUser)
  return useQuery({
    queryKey: ['me'],
    queryFn: () =>
      api<{ data: User }>('/auth/me').then((r) => {
        setUser(r.data)
        return r.data
      }),
    enabled,
    staleTime: 15_000,
  })
}

export const useKeysLibrary = (page: number) =>
  useQuery({
    queryKey: ['keys', page],
    queryFn: () => api<Paginated<LibraryKey>>('/keys', { query: { page } }),
    placeholderData: keepPreviousData,
  })

export const useNavigation = () =>
  useQuery({
    queryKey: ['navigation'],
    queryFn: () => api<{ data: NavLink[] }>('/navigation').then((r) => r.data),
    staleTime: 5 * 60_000,
  })

export const useSettingsOptions = (enabled = true) =>
  useQuery({
    queryKey: ['settings-options'],
    queryFn: () => api<{ data: SettingsOptions }>('/settings').then((r) => r.data),
    staleTime: Infinity,
    enabled,
  })
