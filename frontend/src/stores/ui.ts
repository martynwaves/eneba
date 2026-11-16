import { create } from 'zustand'

interface UiState {
  settingsOpen: boolean
  openSettings: () => void
  closeSettings: () => void
  cartOpen: boolean
  setCartOpen: (open: boolean) => void
  /** Shows the "Added to cart" popup. */
  addedToCart: boolean
  showAddedToCart: () => void
  hideAddedToCart: () => void
}

export const useUi = create<UiState>()((set) => ({
  settingsOpen: false,
  openSettings: () => set({ settingsOpen: true }),
  closeSettings: () => set({ settingsOpen: false }),
  cartOpen: false,
  setCartOpen: (cartOpen) => set({ cartOpen }),
  addedToCart: false,
  showAddedToCart: () => set({ addedToCart: true, cartOpen: false }),
  hideAddedToCart: () => set({ addedToCart: false }),
}))
