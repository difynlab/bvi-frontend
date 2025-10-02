import React, { useState, useEffect } from 'react'
import { deriveRoleFromEmail, getPermissions, hashPassword } from './authHelpers'
import { AuthContext } from './AuthContext'
import { getSession, saveSession, clearSession, getUsers, setUsers, findUserByEmail } from '../helpers/authStorage'

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // Load session from localStorage on provider mount
  useEffect(() => {
    try {
      const session = getSession()
      if (session?.user) {
        setIsAuthenticated(true)
        setUser(session.user)
      }
    } catch (error) {
      console.error('Error loading session from localStorage:', error)
      // Clear corrupted session
      clearSession()
    } finally {
      setIsInitialized(true)
    }
  }, [])


  const register = async (payload) => {
    setLoading(true)
    setError(null)

    try {
      const { firstName, lastName, email, phoneNumber, password } = payload
      
      // Check if user already exists
      const existingUser = findUserByEmail(email)
      if (existingUser) {
        setError('User with this email already exists')
        return false
      }

      // Derive role from email
      const role = deriveRoleFromEmail(email)
      const permissions = getPermissions(role)
      
      // Hash password
      const passwordHash = await hashPassword(password)
      
      // Create new user
      const newUser = {
        id: Date.now().toString(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.toLowerCase().trim(),
        phoneNumber: phoneNumber || '',
        role,
        permissions,
        passwordHash,
        createdAt: new Date().toISOString()
      }

      // Save user to storage
      const users = getUsers()
      users.push(newUser)
      setUsers(users)

      // Create session
      const sessionUser = {
        id: newUser.id,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        email: newUser.email,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        permissions: newUser.permissions
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      setIsAuthenticated(true)

      console.log('Registration successful:', sessionUser)
      return true
    } catch (err) {
      setError('Registration failed')
      console.error('Registration error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const login = async ({ email, password }) => {
    setLoading(true)
    setError(null)

    try {
      // Find user by email
      const user = findUserByEmail(email)
      if (!user) {
        setError({ type: 'email', message: 'User not found' })
        return false
      }

      // Hash provided password and compare
      const providedPasswordHash = await hashPassword(password)
      if (providedPasswordHash !== user.passwordHash) {
        setError({ type: 'password', message: 'Invalid password' })
        return false
      }

      // Create session user object (without password hash)
      const sessionUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        permissions: user.permissions
      }

      // Save session
      saveSession(sessionUser)
      setUser(sessionUser)
      setIsAuthenticated(true)

      console.log('Login successful:', sessionUser)
      return true
    } catch (err) {
      setError({ type: 'general', message: 'Login failed' })
      console.error('Login error:', err)
      return false
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
      const role = deriveRoleFromEmail(mockEmail)
      const permissions = getPermissions(role)
      
      const sessionUser = {
        id: Date.now().toString(),
        firstName: 'Google',
        lastName: 'User',
        email: mockEmail,
        phoneNumber: '',
        role,
        permissions
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      setIsAuthenticated(true)
      
      console.log('Mock Google login successful:', sessionUser)
      return true
    } catch (err) {
      setError('Google login failed')
      console.error('Google login error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
    clearSession()
    
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
      saveSession(updatedUser)
    }
  }

  const updateProfile = (partial) => {
    if (!user) return

    const updatedUser = {
      ...user,
      ...partial
    }

    setUser(updatedUser)
    saveSession(updatedUser)
    console.log('User profile updated:', updatedUser)
  }

  const value = {
    user,
    isInitialized,
    register,
    login,
    logout,
    updateProfile,
    toggleRole, // TODO TEMPORARY: role toggle function for testing only. REMOVE before production.
    // Legacy compatibility
    isAuthenticated,
    loading,
    error,
    loginWithGoogle
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
