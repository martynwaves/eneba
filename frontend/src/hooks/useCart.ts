import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError, api } from '../lib/api'
import type { Cart } from '../lib/types'
import { useAuth } from '../stores/auth'
import { useDiscount } from '../stores/discount'
import { useGuestCart } from '../stores/guestCart'
import { toast } from '../stores/toast'
import { useUi } from '../stores/ui'

const EMPTY_CART: Cart = {
  lines: [],
  summary: { items_count: 0, subtotal: 0, service_fee: 0, discount: 0, discount_code: null, discount_error: null, total: 0, has_problems: false },
}

/**
 * One cart API for the whole app. Signed-in users use the server cart; guests keep items in
 * localStorage and the server prices them, so totals and stock are always authoritative.
 */
export function useCart() {
  const signedIn = useAuth((s) => s.token !== null)
  const guestItems = useGuestCart((s) => s.items)
  const guest = useGuestCart.getState()
  const qc = useQueryClient()
  // A discount code is priced into every cart response, so mutations send it too.
  const code = useDiscount((s) => s.code)
  const codeQuery = code ? { code } : undefined

  const query = useQuery({
    queryKey: signedIn ? ['cart', 'account', code] : ['cart', 'guest', guestItems, code],
    queryFn: () =>
      signedIn
        ? api<{ data: Cart }>('/cart', { query: codeQuery }).then((r) => r.data)
        : guestItems.length === 0
          ? Promise.resolve(EMPTY_CART)
          : api<{ data: Cart }>('/cart/preview', { method: 'POST', body: { items: guestItems, code } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })

  const setServerCart = (cart: Cart) => qc.setQueryData(['cart', 'account', code], cart)
  const failed = (fallback: string) => (e: Error) => toast.error(e instanceof ApiError ? e.message : fallback)

  const add = useMutation({
    mutationFn: async ({ offerId, quantity = 1 }: { offerId: number; quantity?: number; silent?: boolean }) => {
      if (!signedIn) {
        guest.add(offerId, quantity)
        return
      }
      const { data } = await api<{ data: Cart }>('/cart/items', { method: 'POST', body: { offer_id: offerId, quantity }, query: codeQuery })
      setServerCart(data)
    },
    // "Buy now" moves straight on, so it skips the popup.
    onSuccess: (_d, vars) => {
      if (!vars.silent) useUi.getState().showAddedToCart()
    },
    onError: failed('Could not add to cart'),
  })

  const update = useMutation({
    mutationFn: async ({ offerId, quantity }: { offerId: number; quantity: number }) => {
      if (!signedIn) {
        guest.set(offerId, quantity)
        return
      }
      const { data } = await api<{ data: Cart }>(`/cart/items/${offerId}`, { method: 'PATCH', body: { quantity }, query: codeQuery })
      setServerCart(data)
    },
    onError: failed('Could not change the quantity'),
  })

  const remove = useMutation({
    mutationFn: async (offerId: number) => {
      if (!signedIn) {
        guest.remove(offerId)
        return
      }
      const { data } = await api<{ data: Cart }>(`/cart/items/${offerId}`, { method: 'DELETE', query: codeQuery })
      setServerCart(data)
    },
    onError: failed('Could not remove the item'),
  })

  const cart = query.data ?? EMPTY_CART
  // Guests see their badge instantly, before the preview request returns.
  const count = signedIn ? cart.summary.items_count : guestItems.reduce((n, i) => n + i.quantity, 0)

  return { cart, count, isLoading: query.isLoading, isFetching: query.isFetching, add, update, remove }
}
