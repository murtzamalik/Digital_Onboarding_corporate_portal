import { Navigate, Outlet } from 'react-router-dom'
import { getPortalAccessToken } from '../auth/token'

export function ProtectedLayout() {
  if (!getPortalAccessToken()) {
    return <Navigate to="/login" replace />
  }
  return <Outlet />
}
