// Profile storage helper functions for localStorage operations

import { getSession } from './authStorage'

const PROFILE_KEY_PREFIX = 'bvi.profile.'

/**
 * Get user profile data by user ID with defaults from registration
 * @param {string} userId - User ID
 * @returns {Object} Profile data with registration defaults
 */
export function getProfile(userId) {
  if (!userId) return {}
  
  try {
    const profileKey = `${PROFILE_KEY_PREFIX}${userId}`
    const profile = localStorage.getItem(profileKey)
    const storedProfile = profile ? JSON.parse(profile) : {}
    
    // Get user data from session for defaults
    const session = getSession()
    const userData = session?.user || {}
    
    // Return profile with registration data as defaults
    return {
      name: storedProfile.name || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || '',
      email: storedProfile.email || userData.email || '',
      countryCode: storedProfile.countryCode || '+54',
      phoneNumber: storedProfile.phoneNumber || userData.phoneNumber || '',
      dateFormat: storedProfile.dateFormat || 'MM/DD/YYYY',
      timeZone: storedProfile.timeZone || 'EST',
      country: storedProfile.country || 'Argentina',
      language: storedProfile.language || 'English (Default)',
      profilePicture: storedProfile.profilePicture || ''
    }
  } catch (error) {
    console.error('Error reading profile from storage:', error)
    return {}
  }
}

/**
 * Set user profile data by user ID
 * @param {string} userId - User ID
 * @param {Object} profilePartial - Partial profile data to update
 * @returns {boolean} True if successful
 */
export function setProfile(userId, profilePartial) {
  if (!userId || !profilePartial) return false
  
  try {
    const profileKey = `${PROFILE_KEY_PREFIX}${userId}`
    const existingProfile = getProfile(userId) || {}
    const updatedProfile = { ...existingProfile, ...profilePartial }
    localStorage.setItem(profileKey, JSON.stringify(updatedProfile))
    // TODO BACKEND: sync profile with API
    return true
  } catch (error) {
    console.error('Error writing profile to storage:', error)
    return false
  }
}

/**
 * Read user from session storage (legacy compatibility)
 * @returns {Object|null} User data or null
 */
export function readUserFromStorage() {
  try { 
    // Try session first (AuthContext stores here), then fallback to user
    const session = localStorage.getItem('bvi.auth.session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.user || null;
    }
    return JSON.parse(localStorage.getItem('user')) || null; 
  } catch { 
    return null; 
  }
}

/**
 * Write user to session storage (legacy compatibility)
 * @param {Object} user - User data to write
 */
export function writeUserToStorage(user) {
  try { 
    // Update both session and user keys for consistency
    const session = localStorage.getItem('bvi.auth.session');
    if (session) {
      const parsed = JSON.parse(session);
      parsed.user = user;
      localStorage.setItem('bvi.auth.session', JSON.stringify(parsed));
    }
    localStorage.setItem('user', JSON.stringify(user)); 
  } catch (error) {
    console.error('Error writing user to storage:', error);
  }
}

/**
 * Ensure user defaults for backward compatibility
 * @param {Object} u - User object
 * @returns {Object} User object with defaults
 */
export function ensureUserDefaults(u = {}) {
  return {
    name: u.name || '',
    email: u.email || '',
    password: u.password || '',
    role: u.role || 'user',
    countryCode: u.countryCode ?? '+54',
    phoneNumber: u.phoneNumber ?? '',
    profilePicture: u.profilePicture ?? '',
    dateFormat: u.dateFormat || 'MM/DD/YYYY',
    timeZone: u.timeZone || 'EST',
    country: u.country || 'Argentina',
    language: u.language || 'English (Default)',
  };
}
