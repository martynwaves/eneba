import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DiscountState {
  /** The code the shopper typed; the server decides whether it applies (cart summary). */
  code: string | null
  apply: (code: string) => void
  clear: () => void
}

export const useDiscount = create<DiscountState>()(
  persist(
    (set) => ({
      code: null,
      apply: (code) => set({ code: code.trim().toUpperCase() || null }),
      clear: () => set({ code: null }),
    }),
    { name: 'eneba-discount' },
  ),
)
