import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false) // Track initialization

  // TODO TEMPORARY: storing session in localStorage. REMOVE this before production.
  // Load session from localStorage on provider mount
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem('session')
      if (savedSession) {
        const session = JSON.parse(savedSession)
        setIsAuthenticated(true)
        setUser(session.user)
        setToken(session.token)
      }
    } catch (error) {
      console.error('Error loading session from localStorage:', error)
      // Clear corrupted session
      localStorage.removeItem('session')
    } finally {
      setIsInitialized(true) // Mark as initialized regardless of success/failure
    }
  }, [])

  const resolveRole = (email) => {
    // MOCK RULE: role = "admin" if email endsWith "@admin.com", else "user"
    return email.endsWith('@admin.com') ? 'admin' : 'user'
  }

  const getPermissions = (role) => {
    // MOCK permissions
    if (role === 'admin') {
      return ['events:create', 'events:update', 'events:delete']
    }
    return []
  }

  const login = async ({ username, password }) => {
    setLoading(true)
    setError(null)

    try {
      // TODO BACKEND: POST /api/auth/login
      // MOCK: resolve role by email rule; build user object
      const role = resolveRole(username)
      const permissions = getPermissions(role)
      
      const mockUser = {
        id: Date.now().toString(),
        email: username,
        name: 'Test User',
        role,
        permissions
      }

      const mockToken = 'mock.jwt.token'

      setUser(mockUser)
      setToken(mockToken)
      setIsAuthenticated(true)

      // TODO TEMPORARY: storing session in localStorage. REMOVE this before production.
      localStorage.setItem('session', JSON.stringify({
        user: mockUser,
        token: mockToken
      }))
      
      console.log('Mock login successful:', mockUser)
    } catch (err) {
      setError('Login failed')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async (credential) => {
    setLoading(true)
    setError(null)

    try {
      // TODO BACKEND: POST /api/auth/google { credential }
      // MOCK: email "googleuser@user.com" → resolve role; set session
      const mockEmail = 'googleuser@user.com'
      const role = resolveRole(mockEmail)
      const permissions = getPermissions(role)
      
      const mockUser = {
        id: Date.now().toString(),
        email: mockEmail,
        name: 'Google User',
        role,
        permissions
      }

      const mockToken = 'mock.google.jwt.token'

      setUser(mockUser)
      setToken(mockToken)
      setIsAuthenticated(true)

      // TODO TEMPORARY: storing session in localStorage. REMOVE this before production.
      localStorage.setItem('session', JSON.stringify({
        user: mockUser,
        token: mockToken
      }))
      
      console.log('Mock Google login successful:', mockUser)
    } catch (err) {
      setError('Google login failed')
      console.error('Google login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    setIsAuthenticated(false)
    setError(null)

    // TODO TEMPORARY: storing session in localStorage. REMOVE this before production.
    localStorage.removeItem('session')
    
    console.log('User logged out')
  }

  // TODO TEMPORARY: role toggle function for testing only. REMOVE before production.
  const toggleRole = () => {
    if (user) {
      const newRole = user.role === 'admin' ? 'user' : 'admin'
      const newPermissions = getPermissions(newRole)
      
      const updatedUser = {
        ...user,
        role: newRole,
        permissions: newPermissions
      }
      
      setUser(updatedUser)
      
      // Update localStorage with new role
      try {
        const session = JSON.parse(localStorage.getItem('session') || '{}')
        session.user = updatedUser
        localStorage.setItem('session', JSON.stringify(session))
      } catch (error) {
        console.error('Error updating session in localStorage:', error)
      }
    }
  }

  const refresh = async () => {
    // TODO BACKEND: POST /api/auth/refresh
    console.log('Refresh token - TODO BACKEND')
  }

  const value = {
    isAuthenticated,
    user,
    token,
    loading,
    error,
    isInitialized, // Add initialization state
    login,
    loginWithGoogle,
    logout,
    refresh,
    toggleRole // TODO TEMPORARY: role toggle function for testing only. REMOVE before production.
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
