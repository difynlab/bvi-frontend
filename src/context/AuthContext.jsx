import React, { useState, useEffect, useMemo } from 'react'
import { deriveRoleFromEmail, getPermissions, hashPassword } from './authHelpers'
import { AuthContext } from './AuthContext'
import { getSession, saveSession, clearSession, getUsers, setUsers, findUserByEmail } from '../helpers/authStorage'
import { setProfile } from '../helpers/profileStorage'

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      const session = getSession()
      if (session?.user) {
        setIsAuthenticated(true)
        setUser(session.user)
      }
    } catch (error) {
      console.error('Error loading session from localStorage:', error)
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
      
      const existingUser = findUserByEmail(email)
      if (existingUser) {
        setError('User with this email already exists')
        return false
      }

      const role = deriveRoleFromEmail(email)
      const permissions = getPermissions(role)
      
      const passwordHash = await hashPassword(password)
      
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
      console.error('Registration error:', err)
      setError('Registration failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const login = async ({ email, password }) => {
    setLoading(true)
    setError(null)

    try {
      const user = findUserByEmail(email)
      if (!user) {
        setError({ type: 'email', message: 'User not found' })
        return false
      }

      const providedPasswordHash = await hashPassword(password)
      if (providedPasswordHash !== user.passwordHash) {
        setError({ type: 'password', message: 'Invalid password' })
        return false
      }

      const sessionUser = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNumber: user.phoneNumber,
        role: user.role,
        permissions: user.permissions
      }

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

  // TEMPORARY: Debug function to clear all registered users (REMOVE before production)
  const clearAllUsers = () => {
    const users = getUsers()
    console.log('Clearing users:', users)
    localStorage.removeItem('bvi.auth.users')
    localStorage.removeItem('bvi.auth.session')
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
    console.log('All users cleared. You can now register with any email.')
  }

  // TEMPORARY: Debug function to show all registered users (REMOVE before production)
  const showRegisteredUsers = () => {
    const users = getUsers()
    console.log('Currently registered users:', users.map(u => ({ email: u.email, role: u.role })))
    return users
  }

  const updateProfile = (partial) => {
    if (!user) return

    // Create new user object by shallow-merging partial into current user
    const updatedUser = {
      ...user,
      ...partial
    }

    // Persist to profile storage for this user id
    setProfile(user.id, partial)
    
    // Persist to session storage
    saveSession(updatedUser)
    
    // Update state with new object
    setUser(updatedUser)
  }

  const value = useMemo(() => ({
    user,
    isInitialized,
    register,
    login,
    logout,
    updateProfile,
    toggleRole, // TODO TEMPORARY: role toggle function for testing only. REMOVE before production.
    clearAllUsers, // TODO TEMPORARY: Debug function. REMOVE before production.
    showRegisteredUsers, // TODO TEMPORARY: Debug function. REMOVE before production.
    isAuthenticated,
    loading,
    error,
    loginWithGoogle
  }), [user, isInitialized, isAuthenticated, loading, error])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
