import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../../context/AuthContext'
import { AuthBootSkeleton } from './AuthBootSkeleton'

export function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <AuthBootSkeleton />
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
