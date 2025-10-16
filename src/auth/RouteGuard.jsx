import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'

const RouteGuard = ({ children, requireAuth = true, allowRoles = [] }) => {
  const { isAuthenticated, user, loading, isInitialized } = useAuth()

  if (!isInitialized) {
    return <div className="route-guard-loading">
      Loading...
    </div>
  }

  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (allowRoles.length && (!user || !allowRoles.includes(user.role))) {
    return <Navigate to="/forbidden" replace />
  }

  return children
}

export default RouteGuard
