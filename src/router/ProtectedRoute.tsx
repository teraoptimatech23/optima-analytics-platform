import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'

/**
 * Gate for every dashboard route. Unauthenticated visits are sent to /login
 * carrying the attempted path in location state, so a successful sign-in lands
 * on the page the user actually asked for rather than always on the root.
 */
export default function ProtectedRoute() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const location = useLocation()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  return <Outlet />
}
