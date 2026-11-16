import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useWishlist } from '../api/queries'
import { api } from '../lib/api'
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

  const mutation = useMutation({
    mutationFn: () =>
      api<{ data: ProductCard[]; ids: number[] }>(`/wishlist/${productId}`, { method: saved ? 'DELETE' : 'POST' }),
    onSuccess: (res) => {
      qc.setQueryData(['wishlist'], res)
      toast.success(saved ? 'Removed from wishlist' : 'Saved to wishlist', saved ? undefined : { label: 'View', href: '/wishlist' })
    },
  })

  const toggle = () => {
    if (signedIn) {
      mutation.mutate()
      return
    }
    const added = toggleGuest(productId)
    toast.success(added ? 'Saved to wishlist' : 'Removed from wishlist', added ? { label: 'View', href: '/wishlist' } : undefined)
  }

  return { saved, toggle, pending: mutation.isPending }
}
