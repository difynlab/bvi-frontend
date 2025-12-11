import React, { useState, useEffect, useMemo } from 'react'
import { deriveRoleFromEmail, getPermissions } from './authHelpers'
import { AuthContext } from './AuthContext'
import { getSession, saveSession, clearSession } from '../helpers/authStorage'
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

  const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

  const composeSessionUser = (authUser) => {
    const stored = getProfile(authUser) || {}
    const composed = { ...authUser, ...stored }
    
    if (!composed.userName && (composed.first_name || composed.last_name)) {
      composed.userName = `${composed.first_name || ''} ${composed.last_name || ''}`.trim()
    }
    
    return composed
  }

  const mergeBackendProfile = async (baseUser) => {
    try {
      const backend = await fetchBackendProfile()
      const data = backend || {}

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
        profilePicture: profilePictureUrl,
        original_image: profilePictureUrl || baseUser.original_image || '',
        blurred_image: blurredImageUrl || baseUser.blurred_image || '',
      }

      setProfile(mapped, {
        profilePicture: profilePictureUrl,
        profilePictureUrl: profilePictureUrl,
        original_image: mapped.original_image || '',
        blurred_image: mapped.blurred_image || '',
        first_name: mapped.first_name || '',
        last_name: mapped.last_name || '',
        userName: mapped.userName || `${mapped.first_name || ''} ${mapped.last_name || ''}`.trim(),
        phone: mapped.phone || '',
      })

      saveSession(mapped)
      setUser(mapped)
    } catch (e) {
    }
  }

  const trySyncAvatarToBackend = async (userLike, dataUrl) => {
    if (!API_BASE || !dataUrl) return { synced: false, url: '' };
    const { ok, url } = await uploadAvatar({ apiBase: API_BASE, user: userLike, dataUrl });
    return { synced: ok, url };
  }

  useEffect(() => {
    try {
      const session = getSession()
      if (session) {
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
        mergeBackendProfile(session)
      }
    } catch (error) {
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

      ensureProfile(authUser, {})

      const sessionUser = composeSessionUser(authUser)

      if (response.data?.token) {
        sessionUser.token = response.data.token
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      mergeBackendProfile(sessionUser)
      setIsAuthenticated(true)

      return true
    } catch (apiError) {
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
      if (!API_BASE) {
        setError({ type: 'general', message: 'API not configured. Login unavailable.' })
        return false
      }

      const response = await loginUser({ email, password })
      
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
      
      const sessionUser = composeSessionUser(authUser)

      if (response.data?.token) {
        sessionUser.token = response.data.token
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data.user))
      }

      saveSession(sessionUser)
      setUser(sessionUser)
      mergeBackendProfile(sessionUser)
      setIsAuthenticated(true)

      return true
    } catch (apiError) {
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
      const payload = parseJwt(credential)
      if (!payload?.email) throw new Error('Invalid Google token')

      const role = 'member'
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
      }

      ensureProfile(authUser, {})

      const sessionUser = composeSessionUser(authUser)

      saveSession(sessionUser)
      setUser(sessionUser)
      setIsAuthenticated(true)

      return true
    } catch (err) {
      setError('Google login failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    if (API_BASE && user?.token) {
      logoutUser(user.token).catch(error => {
      })
    }

    clearSession()
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
    setIsAuthenticated(false)
    setError(null)
  }

  const updateProfile = async (partial) => {
    if (!user) return false;

    setLoading(true);
    try {
      const prev = user || {};
      let next = { ...prev, ...partial };

      if (partial?.firstName || partial?.lastName) {
        const firstName = partial.firstName || next.first_name || '';
        const lastName = partial.lastName || next.last_name || '';
        next.userName = `${firstName} ${lastName}`.trim();
        next.first_name = firstName;
        next.last_name = lastName;
      }

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
        profilePicture: profilePictureToSave,
        profilePictureUrl: profilePictureToSave,
        original_image: next.original_image || '',
        blurred_image: next.blurred_image || '',
        profilePictureSync: next.profilePictureSync || '',
        first_name: next.first_name || '',
        last_name: next.last_name || '',
        userName: next.userName || '',
        email: next.email || '',
        phone: next.phone || '',
      });

      try {
        saveSession(next);
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          if (next.profilePicture && next.profilePicture.startsWith('data:')) {
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
              saveSession(nextWithoutImage)
              setUser(nextWithoutImage)
              return true
            }
          }

          const { profilePicture, ...nextWithoutImage } = next
          saveSession(nextWithoutImage)
          setUser(nextWithoutImage)
          return true
        }
        throw error
      }

      setUser(next);
      return true;
    } catch (e) {
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
