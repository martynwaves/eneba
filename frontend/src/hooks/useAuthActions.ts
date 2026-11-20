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

type AuthResponse = { token: string; user: User }

/** Queries holding one account's data; they must never be shown to the next person who signs in. */
const ACCOUNT_QUERIES = ['cart', 'wishlist', 'orders', 'order', 'keys', 'me']

export function useAuthActions() {
  const qc = useQueryClient()
  const setSession = useAuth((s) => s.setSession)
  const clearSession = useAuth((s) => s.clear)

  // The guest cart and wishlist travel with the sign-in request and are merged server-side.
  const guestState = () => ({ cart: useGuestCart.getState().items, wishlist: useGuestWishlist.getState().ids })

  // Runs on sign-in as well as sign-out: a session that expired by itself (a 401 clears the
  // token) leaves the previous account's data in the cache.
  const resetAccountData = () => {
    qc.removeQueries({ predicate: (q) => ACCOUNT_QUERIES.includes(String(q.queryKey[0])) })
    qc.invalidateQueries({ queryKey: ['homepage-block'] })
    // Product pages leave the viewer's own wish out of the count, so they depend on who is signed in.
    qc.invalidateQueries({ queryKey: ['product'] })
  }

  const onSignedIn = ({ token, user }: AuthResponse) => {
    setSession(token, user)
    useGuestCart.getState().clear()
    useGuestWishlist.getState().clear()
    resetAccountData()
  }

  const login = useMutation({
    mutationFn: (body: Credentials) => api<AuthResponse>('/auth/login', { method: 'POST', body: { ...body, ...guestState() } }),
    onSuccess: onSignedIn,
  })

  const register = useMutation({
    mutationFn: (body: Credentials) => api<AuthResponse>('/auth/register', { method: 'POST', body: { ...body, ...guestState() } }),
    onSuccess: onSignedIn,
  })

  const logout = useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST' }).catch(() => null),
    onSettled: () => {
      clearSession()
      resetAccountData()
    },
  })

  return { login, register, logout }
}
