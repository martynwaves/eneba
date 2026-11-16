import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuth } from '../stores/auth'

/** Sends signed-out visitors to the login page and brings them back afterwards. */
export function RequireAuth() {
  const token = useAuth((s) => s.token)
  const location = useLocation()

  if (!token) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?redirect=${redirect}&reason=auth`} replace />
  }
  return <Outlet />
}
