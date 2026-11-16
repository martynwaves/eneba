import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'
import type { User } from '../lib/types'
import { useAuth } from '../stores/auth'
import { useGuestCart } from '../stores/guestCart'
import { useGuestWishlist } from '../stores/guestWishlist'

interface Credentials {
  email: string
  password: string
}

interface Registration extends Credentials {
  newsletter?: boolean
}

type AuthResponse = { token: string; user: User }

export function useAuthActions() {
  const qc = useQueryClient()
  const setSession = useAuth((s) => s.setSession)
  const clearSession = useAuth((s) => s.clear)

  // The guest cart and wishlist travel with the sign-in request and are merged server-side.
  const guestState = () => ({ cart: useGuestCart.getState().items, wishlist: useGuestWishlist.getState().ids })

  const onSignedIn = ({ token, user }: AuthResponse) => {
    setSession(token, user)
    useGuestCart.getState().clear()
    useGuestWishlist.getState().clear()
    qc.invalidateQueries({ queryKey: ['cart'] })
    qc.invalidateQueries({ queryKey: ['wishlist'] })
    qc.invalidateQueries({ queryKey: ['homepage-block'] })
  }

  const login = useMutation({
    mutationFn: (body: Credentials) => api<AuthResponse>('/auth/login', { method: 'POST', body: { ...body, ...guestState() } }),
    onSuccess: onSignedIn,
  })

  const register = useMutation({
    mutationFn: (body: Registration) => api<AuthResponse>('/auth/register', { method: 'POST', body: { ...body, ...guestState() } }),
    onSuccess: onSignedIn,
  })

  const logout = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }).catch(() => null),
    onSettled: () => {
      clearSession()
      qc.removeQueries({ queryKey: ['cart', 'account'] })
      qc.removeQueries({ queryKey: ['orders'] })
      qc.removeQueries({ queryKey: ['wishlist'] })
      qc.invalidateQueries({ queryKey: ['homepage-block'] })
    },
  })

  return { login, register, logout }
}
