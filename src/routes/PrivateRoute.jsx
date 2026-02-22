import { Navigate } from 'react-router-dom'
import useAuthStore from '@features/auth/useAuthStore'

const PrivateRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user?.rol)) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default PrivateRoute
