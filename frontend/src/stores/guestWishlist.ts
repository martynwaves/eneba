import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuestWishlistState {
  ids: number[]
  toggle: (id: number) => boolean
  clear: () => void
}

/** How many products a guest wishlist keeps: one page of the store, so the wishlist page can show them all. */
export const GUEST_WISHLIST_LIMIT = 60

/** Wishlist for visitors who are not signed in; merged into the account on sign-in. */
export const useGuestWishlist = create<GuestWishlistState>()(
  persist(
    (set, get) => ({
      ids: [],
      toggle: (id) => {
        const saved = get().ids.includes(id)
        set({ ids: saved ? get().ids.filter((x) => x !== id) : [id, ...get().ids].slice(0, GUEST_WISHLIST_LIMIT) })
        return !saved
      },
      clear: () => set({ ids: [] }),
    }),
    { name: 'eneba-guest-wishlist' },
  ),
)
