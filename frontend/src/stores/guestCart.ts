import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface GuestCartItem {
  offer_id: number
  quantity: number
}

interface GuestCartState {
  items: GuestCartItem[]
  add: (offerId: number, quantity?: number) => void
  set: (offerId: number, quantity: number) => void
  remove: (offerId: number) => void
  clear: () => void
}

const MAX_QTY = 10

/** Cart for visitors who are not signed in; merged into the account cart on sign-in. */
export const useGuestCart = create<GuestCartState>()(
  persist(
    (set) => ({
      items: [],
      add: (offerId, quantity = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.offer_id === offerId)
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.offer_id === offerId ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + quantity) } : i,
              ),
            }
          }
          return { items: [...s.items, { offer_id: offerId, quantity: Math.min(MAX_QTY, quantity) }] }
        }),
      set: (offerId, quantity) =>
        set((s) => ({
          items:
            quantity <= 0
              ? s.items.filter((i) => i.offer_id !== offerId)
              : s.items.map((i) => (i.offer_id === offerId ? { ...i, quantity: Math.min(MAX_QTY, quantity) } : i)),
        })),
      remove: (offerId) => set((s) => ({ items: s.items.filter((i) => i.offer_id !== offerId) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'eneba-guest-cart' },
  ),
)
