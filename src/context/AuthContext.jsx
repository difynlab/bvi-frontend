import React, { useState, useEffect, useMemo } from 'react'
import { deriveRoleFromEmail, getPermissions, hashPassword } from './authHelpers'
import { AuthContext } from './AuthContext'
import { getSession, saveSession, clearSession, clearAllAuthData, getUsers, setUsers, findUserByEmail } from '../helpers/authStorage'
import { setProfile, getProfile, ensureProfile } from '../helpers/profileStorage'
import { uploadAvatar } from '../api/avatarApi'
import { registerUser, loginUser, logoutUser, getCurrentSession } from '../api/authApi'
import { getProfile as fetchBackendProfile } from '../services/profileService'
import { resolveProfileImageUrl } from '../utils/profileImage'

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
    const composed = { ...authUser, ...stored } // profile overrides base defaults
    
    // Ensure userName is set if not present
    if (!composed.userName && (composed.first_name || composed.last_name)) {
      composed.userName = `${composed.first_name || ''} ${composed.last_name || ''}`.trim()
    }
    
    return composed
  }

  // Merge backend profile into current user
  const mergeBackendProfile = async (baseUser) => {
    try {
      // Fetch profile using token in storage
      const backend = await fetchBackendProfile()
      const data = backend || {}

      // Map fields from backend response
      // Get profile picture URL from server (only server URLs, never base64)
      const originalImageRaw = data.original_image ||
                               data.profile_picture_url ||
                               data.image_url ||
                               data.image ||
                               data.profile_picture ||
                               data.profilePicture ||
                               '';
      const blurredImageRaw = data.blurred_image || '';

      const profilePictureUrl = resolveProfileImageUrl(originalImageRaw);
      const blurredImageUrl = resolveProfileImageUrl(blurredImageRaw);
      
      const mapped = {
        ...baseUser,
        id: data.id ?? baseUser.id,
        first_name: data.first_name ?? baseUser.first_name,
        last_name: data.last_name ?? baseUser.last_name,
        email: data.email ?? baseUser.email,
        phone: data.phone ?? baseUser.phone,
        role: data.role ?? baseUser.role,
        profilePictureUrl: profilePictureUrl,
        profilePicture: profilePictureUrl, // Only server URL, never base64
        original_image: profilePictureUrl || baseUser.original_image || '',
        blurred_image: blurredImageUrl || baseUser.blurred_image || '',
      }

      // Persist mapped pieces needed across reloads
      // Only save server URLs, never save base64 to localStorage
      setProfile(mapped, {
        profilePicture: profilePictureUrl, // Only server URL
        profilePictureUrl: profilePictureUrl,
        original_image: mapped.original_image || '',
        blurred_image: mapped.blurred_image || '',
        first_name: mapped.first_name || '',
        last_name: mapped.last_name || '',
        userName: mapped.userName || `${mapped.first_name || ''} ${mapped.last_name || ''}`.trim(),
        phone: mapped.phone || '',
      })

      // Update session
      saveSession(mapped)
      setUser(mapped)
    } catch (e) {
      // Swallow errors to avoid breaking UI if backend unreachable
    }
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
        // Sync API-compatible tokens if session has token
        if (session.token) {
          localStorage.setItem('token', session.token)
          if (session.email) {
            localStorage.setItem('user', JSON.stringify({
              email: session.email,
              role: session.role,
              first_name: session.first_name,
              last_name: session.last_name
            }))
          }
        }
        
        setIsAuthenticated(true)
        setUser(session)
        // Fetch backend profile to get server image URLs and latest data
        mergeBackendProfile(session)
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

      if (!API_BASE) {
        setError('API not configured. Registration unavailable.')
        return false
      }

      const response = await registerUser(payload)

      // API registration successful
      const authUser = {
        id: response.data?.user?.id || Date.now().toString(),
        first_name: response.data?.user?.first_name || firstName.trim(),
        last_name: response.data?.user?.last_name || lastName.trim(),
        userName: `${response.data?.user?.first_name || firstName.trim()} ${response.data?.user?.last_name || lastName.trim()}`.trim(),
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
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      // Fetch backend profile to update picture URL and latest fields
      mergeBackendProfile(sessionUser)
      setIsAuthenticated(true)

      
      return true
    } catch (apiError) {
      console.error('API registration failed:', apiError.message)
      // Handle network errors with user-friendly message
      let errorMessage = apiError.message || 'Registration failed'
      if (errorMessage === 'Failed to fetch' || errorMessage.includes('fetch')) {
        errorMessage = 'Communication with server failed, please try again'
      }
      setError(errorMessage)
      return false
    } finally {
      setLoading(false)
    }
  }

  const login = async ({ email, password }) => {
    setLoading(true)
    setError(null)

    try {
      // Require API for login
      if (!API_BASE) {
        setError({ type: 'general', message: 'API not configured. Login unavailable.' })
        return false
      }

      const response = await loginUser({ email, password })
      
      // API login successful
      const authUser = {
        id: response.data?.user?.id || Date.now().toString(),
        first_name: response.data?.user?.first_name || '',
        last_name: response.data?.user?.last_name || '',
        userName: `${response.data?.user?.first_name || ''} ${response.data?.user?.last_name || ''}`.trim(),
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
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      // Fetch backend profile to update picture URL and latest fields
      mergeBackendProfile(sessionUser)
      setIsAuthenticated(true)

      
      return true
    } catch (apiError) {
      console.error('API login failed:', apiError.message)
      // Handle network errors with user-friendly message
      let errorMessage = apiError.message || 'Login failed'
      if (errorMessage === 'Failed to fetch' || errorMessage.includes('fetch')) {
        errorMessage = 'Communication with server failed, please try again'
      }
      setError({ type: 'general', message: errorMessage })
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
        userName: `${payload.given_name || 'Google'} ${payload.family_name || 'Member'}`.trim(),
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
        // This is expected if token is expired/invalid
        if (error.message.includes('Unauthenticated')) {
          
        } else {
          
        }
        // Continue with local logout even if API fails
      })
    }

    clearSession()          // remove only session key
    // Also clear API-compatible tokens
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    setError(null)

    
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
    
    localStorage.removeItem('bvi.auth.users')
    localStorage.removeItem('bvi.auth.session')
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
    
  }

  // TEMPORARY: Debug function to show all registered members (REMOVE before production)
  const showRegisteredUsers = () => {
    const users = getUsers()
    
    return users
  }

  const updateProfile = async (partial) => {
    if (!user) return false;

    setLoading(true);
    try {
      const prev = user || {};
      let next = { ...prev, ...partial };

      // If firstName or lastName are being updated, also update userName
      if (partial?.firstName || partial?.lastName) {
        const firstName = partial.firstName || next.first_name || '';
        const lastName = partial.lastName || next.last_name || '';
        next.userName = `${firstName} ${lastName}`.trim();
        next.first_name = firstName;
        next.last_name = lastName;
      }

      // Avatar sync disabled: profile image updates are handled only from profile page/backend

      // Persist per-user profile and session using server URLs only
      const incomingOriginal = partial?.original_image || partial?.profilePictureUrl || next.original_image || '';
      const resolvedProfilePicture = resolveProfileImageUrl(incomingOriginal);
      next.original_image = resolvedProfilePicture || next.original_image || '';
      next.profilePicture = resolvedProfilePicture || next.profilePicture || '';
      next.profilePictureUrl = resolvedProfilePicture || next.profilePictureUrl || '';
      const profilePictureToSave = next.profilePicture;

      if (partial?.blurred_image !== undefined) {
        next.blurred_image = resolveProfileImageUrl(partial.blurred_image) || '';
      }
      
      setProfile(next, {
        profilePicture: profilePictureToSave, // Only server URL, never base64
        profilePictureUrl: profilePictureToSave,
        original_image: next.original_image || '',
        blurred_image: next.blurred_image || '',
        profilePictureSync: next.profilePictureSync || '',
        first_name: next.first_name || '',
        last_name: next.last_name || '',
        userName: next.userName || '',
        phone: next.phone || '',
      }); // TODO BACKEND: move to server profile

      // Persist to session storage with error handling
      try {
        saveSession(next); // existing helper // TODO BACKEND
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          // Don't try to compress base64 images - they should not be saved to localStorage
          // If quota exceeded, remove image data and only keep URL
          if (next.profilePicture && next.profilePicture.startsWith('data:')) {
            // Remove base64 image, only keep URL if available
            const { profilePicture, ...nextWithoutImage } = next
            const nextWithUrlOnly = {
              ...nextWithoutImage,
              profilePicture: profilePictureToSave,
              profilePictureUrl: profilePictureToSave
            }
            
            try {
              saveSession(nextWithUrlOnly)
              setUser(nextWithUrlOnly)
              return true
            } catch (compressionError) {
              // If still fails, remove image completely
              saveSession(nextWithoutImage)
              setUser(nextWithoutImage)
              return true
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
