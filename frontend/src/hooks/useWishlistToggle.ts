import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWishlist } from '../api/queries'
import { ApiError, api } from '../lib/api'
import type { ProductCard } from '../lib/types'
import { useAuth } from '../stores/auth'
import { useGuestWishlist } from '../stores/guestWishlist'
import { toast } from '../stores/toast'

/** Heart button logic. Guests can save products too; they are merged into the account on sign-in. */
export function useWishlistToggle(productId: number) {
  const signedIn = useAuth((s) => s.token !== null)
  const { data } = useWishlist()
  const toggleGuest = useGuestWishlist((s) => s.toggle)
  const qc = useQueryClient()
  const saved = data?.ids.includes(productId) ?? false

  // The request's own direction drives its message: by the time it succeeds, `saved` may already
  // reflect a later render.
  const mutation = useMutation({
    mutationFn: (remove: boolean) => api<{ data: ProductCard[]; ids: number[] }>(`/wishlist/${productId}`, { method: remove ? 'DELETE' : 'POST' }),
    onSuccess: (res, remove) => {
      qc.setQueryData(['wishlist'], res)
      toast.success(remove ? 'Removed from wishlist' : 'Saved to wishlist', remove ? undefined : { label: 'View', href: '/wishlist' })
    },
    onError: (e) => toast.error(e instanceof ApiError ? e.message : 'Could not update your wishlist'),
  })

  const toggle = () => {
    if (signedIn) {
      // A second click before the first answer would repeat the same request, not undo it.
      if (!mutation.isPending) mutation.mutate(saved)
      return
    }
    const added = toggleGuest(productId)
    toast.success(added ? 'Saved to wishlist' : 'Removed from wishlist', added ? { label: 'View', href: '/wishlist' } : undefined)
  }

  return { saved, toggle, pending: mutation.isPending }
}
