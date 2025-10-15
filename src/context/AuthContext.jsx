import React, { useState, useEffect, useMemo } from 'react'
import { deriveRoleFromEmail, getPermissions, hashPassword } from './authHelpers'
import { AuthContext } from './AuthContext'
import { getSession, saveSession, clearSession, clearAllAuthData, getUsers, setUsers, findUserByEmail } from '../helpers/authStorage'
import { setProfile, getProfile, ensureProfile } from '../helpers/profileStorage'
import { uploadAvatar } from '../api/avatarApi'
import { registerUser, loginUser, logoutUser, getCurrentSession } from '../api/authApi'

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)

  // API base URL from environment
  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  // Compose session user by merging auth user with stored profile
  const composeSessionUser = (authUser) => {
    const stored = getProfile(authUser) || {}
    return { ...authUser, ...stored } // profile overrides base defaults
  }

  // Try to sync avatar to backend
  const trySyncAvatarToBackend = async (userLike, dataUrl) => {
    // Skip if no API base or no dataURL
    if (!API_BASE || !dataUrl) return { synced: false, url: '' };
    const { ok, url } = await uploadAvatar({ apiBase: API_BASE, user: userLike, dataUrl });
    return { synced: ok, url };
  }

  useEffect(() => {
    try {
      const session = getSession()
      if (session) {
        setIsAuthenticated(true)
        setUser(session)
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

      // Try API first if available
      if (API_BASE) {
        try {
          const response = await registerUser(payload)

          // API registration successful
          const authUser = {
            id: response.data?.user?.id || Date.now().toString(),
            first_name: response.data?.user?.first_name || firstName.trim(),
            last_name: response.data?.user?.last_name || lastName.trim(),
            email: response.data?.user?.email || email.toLowerCase().trim(),
            phone: response.data?.user?.phone || phoneNumber || '',
            role: response.data?.user?.role || 'member',
            permissions: response.data?.user?.permissions || getPermissions('member')
          }

          // Ensure profile exists for new user
          ensureProfile(authUser, {})

          // Compose session user with stored profile
          const sessionUser = composeSessionUser(authUser)

          // Store token if provided by API
          if (response.data?.token) {
            sessionUser.token = response.data.token
          }

          saveSession(sessionUser)
          setUser(sessionUser)
          setIsAuthenticated(true)

          console.log('API Registration successful:', sessionUser)
          return true
        } catch (apiError) {
          console.warn('API registration failed, falling back to localStorage:', apiError.message)
          // Fall through to localStorage fallback
        }
      }

      // Fallback to localStorage (development mode)
      const existingUser = findUserByEmail(email)
      if (existingUser) {
        setError('User with this email already exists')
        return false
      }

      const role = 'member' // Always assign member role for new registrations
      const permissions = getPermissions(role)

      const passwordHash = await hashPassword(password)

      const newUser = {
        id: Date.now().toString(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.toLowerCase().trim(),
        phone: phoneNumber || '',
        role,
        permissions,
        passwordHash
      }

      const users = getUsers()
      users.push(newUser)
      setUsers(users)

      // Create session
      const authUser = {
        id: newUser.id,
        first_name: newUser.first_name,
        last_name: newUser.last_name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role,
        permissions: newUser.permissions
      }

      // Ensure profile exists for new user
      ensureProfile(authUser, {})

      // Compose session user with stored profile
      const sessionUser = composeSessionUser(authUser)

      saveSession(sessionUser)
      setUser(sessionUser)
      setIsAuthenticated(true)

      console.log('localStorage Registration successful:', sessionUser)
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
      // Try API first if available
      if (API_BASE) {
        try {
          const response = await loginUser({ email, password })
          
          // API login successful
          const authUser = {
            id: response.data?.user?.id || Date.now().toString(),
            first_name: response.data?.user?.first_name || '',
            last_name: response.data?.user?.last_name || '',
            email: response.data?.user?.email || email.toLowerCase().trim(),
            phone: response.data?.user?.phone || '',
            role: response.data?.user?.role || 'member',
            permissions: response.data?.user?.permissions || getPermissions('member')
          }
          
          // Compose session user with stored profile
          const sessionUser = composeSessionUser(authUser)

          // Store token if provided by API
          if (response.data?.token) {
            sessionUser.token = response.data.token
          }

          saveSession(sessionUser)
          setUser(sessionUser)
          setIsAuthenticated(true)

          console.log('API Login successful:', sessionUser)
          return true
        } catch (apiError) {
          console.warn('API login failed:', apiError.message)
          
          // Handle specific API errors
          if (apiError.message.includes('credentials do not match')) {
            setError({ type: 'general', message: apiError.message })
            return false
          }
          
          // For other API errors, fall back to localStorage
          console.warn('Falling back to localStorage due to API error')
        }
      }

      // Fallback to localStorage (development mode)
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

      const authUser = {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        permissions: user.permissions
      }

      // Compose session user with stored profile
      const sessionUser = composeSessionUser(authUser)

      saveSession(sessionUser)
      setUser(sessionUser)
      setIsAuthenticated(true)

      console.log('localStorage Login successful:', sessionUser)
      return true
    } catch (err) {
      setError({ type: 'general', message: 'Login failed' })
      console.error('Login error:', err)
      return false
    } finally {
      setLoading(false)
    }
  }

  // helper: decode JWT payload without extra deps
  const parseJwt = (jwt) => {
    try {
      const base64 = jwt.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/')
      const json = decodeURIComponent(atob(base64).split('').map(c =>
        '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      ).join(''))
      return JSON.parse(json)
    } catch { return null }
  }

  const loginWithGoogle = async (credential) => {
    setLoading(true)
    setError(null)

    try {
      // TODO BACKEND: POST /api/auth/google { credential } and verify on server
      const payload = parseJwt(credential)
      if (!payload?.email) throw new Error('Invalid Google token')

      const role = 'member' // Always assign member role for Google login
      const permissions = getPermissions(role)

      const authUser = {
        id: payload.sub || Date.now().toString(),
        first_name: payload.given_name || 'Google',
        last_name: payload.family_name || 'Member',
        email: payload.email,
        phone: '',
        role,
        permissions,
        oauthProvider: 'google'
        // do NOT persist raw credential in production
      }

      // Ensure profile exists for Google user
      ensureProfile(authUser, {})

      // Compose session user with stored profile
      const sessionUser = composeSessionUser(authUser)

      saveSession(sessionUser)     // localStorage mock // TODO BACKEND
      setUser(sessionUser)
      setIsAuthenticated(true)

      console.log('Google login successful:', sessionUser)
      return true
    } catch (err) {
      console.error('Google login failed', err)
      setError('Google login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    // Try API logout first if available and user has token
    if (API_BASE && user?.token) {
      logoutUser(user.token).catch(error => {
        console.warn('API logout failed:', error.message)
        // Continue with local logout even if API fails
      })
    }

    clearSession()          // remove only session key
    setUser(null)
    setIsAuthenticated(false)
    setError(null)

    console.log('User logged out')
  }

  // TODO TEMPORARY: role toggle function for testing only. REMOVE before production.
  const toggleRole = () => {
    if (user) {
      const newRole = user.role === 'admin' ? 'member' : 'admin'
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

  // TEMPORARY: Debug function to clear all registered members (REMOVE before production)
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

  // TEMPORARY: Debug function to show all registered members (REMOVE before production)
  const showRegisteredUsers = () => {
    const users = getUsers()
    console.log('Currently registered members:', users.map(u => ({ email: u.email, role: u.role })))
    return users
  }

  const updateProfile = async (partial) => {
    if (!user) return false;

    setLoading(true);
    try {
      const prev = user || {};
      let next = { ...prev, ...partial };

      // If avatar dataURL present, try backend upload
      if (partial?.profilePicture) {
        const { synced, url } = await trySyncAvatarToBackend(next, partial.profilePicture);
        if (synced && url) {
          next = {
            ...next,
            profilePictureUrl: url,
            profilePictureSync: 'synced',
            // keep dataURL as backup or clear it to save space:
            // profilePicture: '', // optional optimization
          };
        } else {
          next = { ...next, profilePictureSync: API_BASE ? 'pending' : 'pending' };
        }
      }

      // Persist per-user profile and session
      setProfile(next, {
        profilePicture: next.profilePicture || '',
        profilePictureUrl: next.profilePictureUrl || '',
        profilePictureSync: next.profilePictureSync || '',
        first_name: next.first_name || '',
        last_name: next.last_name || '',
        phone: next.phone || '',
      }); // TODO BACKEND: move to server profile

      // Persist to session storage with error handling
      try {
        saveSession(next); // existing helper // TODO BACKEND
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          console.warn('localStorage quota exceeded, trying to compress image')

          // Try to compress the image if it exists
          if (next.profilePicture && next.profilePicture.startsWith('data:image')) {
            try {
              // Create a compressed version of the image
              const canvas = document.createElement('canvas')
              const ctx = canvas.getContext('2d')
              const img = new Image()

              img.onload = () => {
                try {
                  // Set canvas size to a smaller dimension (max 200x200)
                  const maxSize = 200
                  let { width, height } = img

                  if (width > height) {
                    if (width > maxSize) {
                      height = (height * maxSize) / width
                      width = maxSize
                    }
                  } else {
                    if (height > maxSize) {
                      width = (width * maxSize) / height
                      height = maxSize
                    }
                  }

                  canvas.width = width
                  canvas.height = height

                  // Draw and compress with lower quality
                  ctx.drawImage(img, 0, 0, width, height)
                  const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6) // 60% quality

                  // Try to save the compressed version
                  const compressedNext = { ...next, profilePicture: compressedDataUrl }

                  try {
                    saveSession(compressedNext)
                    setUser(compressedNext)
                    console.log('Successfully saved compressed image')
                  } catch (compressedError) {
                    console.warn('Even compressed image too large, removing image')
                    const { profilePicture, ...nextWithoutImage } = next
                    saveSession(nextWithoutImage)
                    setUser(nextWithoutImage)
                  }
                } catch (compressionError) {
                  console.warn('Image compression failed, removing image')
                  const { profilePicture, ...nextWithoutImage } = next
                  saveSession(nextWithoutImage)
                  setUser(nextWithoutImage)
                }
              }

              img.onerror = () => {
                console.warn('Image loading failed, removing image')
                const { profilePicture, ...nextWithoutImage } = next
                saveSession(nextWithoutImage)
                setUser(nextWithoutImage)
              }

              img.src = next.profilePicture
              return
            } catch (compressionError) {
              console.warn('Image compression failed, removing image')
            }
          }

          // Fallback: remove image and try again
          const { profilePicture, ...nextWithoutImage } = next
          saveSession(nextWithoutImage)
          setUser(nextWithoutImage)
          return true
        }
        throw error
      }

      // Update state with new object
      setUser(next);
      return true;
    } catch (e) {
      console.error('updateProfile error', e);
      setError('Failed to update profile');
      return false;
    } finally {
      setLoading(false);
    }
  };

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
