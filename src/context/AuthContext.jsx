import React, { useState, useEffect } from 'react'
import { resolveRole, getPermissions } from './authHelpers'
import { AuthContext } from './AuthContext'
import { seedMissingContactFields } from '../helpers/mockUserSeeder'

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


  const login = async ({ username }) => {
    setLoading(true)
    setError(null)

    try {
      // TODO BACKEND: POST /api/auth/login
      // MOCK: resolve role by email rule; build user object
      const role = resolveRole(username)
      const permissions = getPermissions(role)
      
      const baseUser = {
        id: Date.now().toString(),
        email: username,
        name: 'Test User',
        role,
        permissions,
        countryCode: '+54',
        phoneNumber: '',
        profilePicture: '',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'EST',
        country: 'Argentina',
        language: 'English (Default)',
        password: 'mockPassword123' // TODO: remove in production
      }

      // TODO BACKEND: remove seeding when API includes phone + countryCode
      const enriched = seedMissingContactFields(baseUser)

      const mockToken = 'mock.jwt.token'

      setUser(enriched)
      setToken(mockToken)
      setIsAuthenticated(true)

      // TODO TEMPORARY: storing session in localStorage. REMOVE this before production.
      localStorage.setItem('session', JSON.stringify({
        user: enriched,
        token: mockToken
      }))
      // Also store user separately for Settings compatibility
      localStorage.setItem('user', JSON.stringify(enriched))
      
      console.log('Mock login successful:', enriched)
    } catch (err) {
      setError('Login failed')
      console.error('Login error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loginWithGoogle = async () => {
    setLoading(true)
    setError(null)

    try {
      // TODO BACKEND: POST /api/auth/google { credential }
      // MOCK: email "googleuser@user.com" → resolve role; set session
      const mockEmail = 'googleuser@user.com'
      const role = resolveRole(mockEmail)
      const permissions = getPermissions(role)
      
      const baseUser = {
        id: Date.now().toString(),
        email: mockEmail,
        name: 'Google User',
        role,
        permissions,
        countryCode: '+54',
        phoneNumber: '',
        profilePicture: '',
        dateFormat: 'MM/DD/YYYY',
        timeZone: 'EST',
        country: 'Argentina',
        language: 'English (Default)',
        password: 'mockPassword123' // TODO: remove in production
      }

      // TODO BACKEND: remove seeding when API includes phone + countryCode
      const enriched = seedMissingContactFields(baseUser)

      const mockToken = 'mock.google.jwt.token'

      setUser(enriched)
      setToken(mockToken)
      setIsAuthenticated(true)

      // TODO TEMPORARY: storing session in localStorage. REMOVE this before production.
      localStorage.setItem('session', JSON.stringify({
        user: enriched,
        token: mockToken
      }))
      // Also store user separately for Settings compatibility
      localStorage.setItem('user', JSON.stringify(enriched))
      
      console.log('Mock Google login successful:', enriched)
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

  const updateUserProfile = (updatedUserData) => {
    if (!user) return

    const mergedUser = {
      ...user,
      ...updatedUserData
    }

    setUser(mergedUser)

    // Update localStorage with merged user data
    try {
      const session = JSON.parse(localStorage.getItem('session') || '{}')
      session.user = mergedUser
      localStorage.setItem('session', JSON.stringify(session))
      // Also update user key for Settings compatibility
      localStorage.setItem('user', JSON.stringify(mergedUser))
      console.log('User profile updated:', mergedUser)
    } catch (error) {
      console.error('Error updating user profile in localStorage:', error)
    }
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
    updateUserProfile,
    toggleRole // TODO TEMPORARY: role toggle function for testing only. REMOVE before production.
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
