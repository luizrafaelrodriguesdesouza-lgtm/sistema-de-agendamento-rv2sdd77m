import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '@/stores/useAuthStore'

export function AdminRoute() {
  const { user } = useAuthStore()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  const role = (user as any).tipo || (user as any).role

  if (role !== 'master') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
