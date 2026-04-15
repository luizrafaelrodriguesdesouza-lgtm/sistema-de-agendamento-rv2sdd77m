import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

export function AdminRoute() {
  const { user, loading } = useAuth()

  if (loading) return null

  if (!user || (user as any).tipo !== 'master') {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
