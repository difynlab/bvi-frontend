// Profile storage helper functions for localStorage operations

const PROFILE_KEY_PREFIX = 'bvi.profile.'

// Keying strategy: prefer user.id; fallback to email lowercased
const keyFor = (user) => user?.id ? `bvi.profile.${user.id}` : (user?.email ? `bvi.profile.${user.email.toLowerCase()}` : null);

/**
 * Get profile data by storage key
 * @param {string} key - Storage key
 * @returns {Object|null} Profile data or null
 */
export function getProfileByKey(key) {
  if (!key) return null;
  try { 
    return JSON.parse(localStorage.getItem(key) || 'null'); 
  } catch { 
    return null; 
  }
}

/**
 * Get user profile data by user object (id or email)
 * @param {Object} user - User object with id or email
 * @returns {Object|null} Profile data or null
 */
export function getProfile(user) {
  return getProfileByKey(keyFor(user));
}

/**
 * Set user profile data by user object
 * @param {Object} user - User object with id or email
 * @param {Object} partial - Partial profile data to update
 * @returns {boolean} True if successful
 */
export function setProfile(user, partial) {
  const k = keyFor(user); 
  if (!k) return false;
  const prev = getProfileByKey(k) || {};
  try {
    localStorage.setItem(k, JSON.stringify({ ...prev, ...partial }));
    return true;
  } catch (error) {
    console.error('Error writing profile to storage:', error);
    return false;
  }
}

/**
 * Ensure a profile record exists on first login
 * @param {Object} user - User object with id or email
 * @param {Object} seed - Default profile data
 * @returns {boolean} True if successful
 */
export function ensureProfile(user, seed = {}) {
  const k = keyFor(user); 
  if (!k) return false;
  if (!getProfileByKey(k)) {
    try {
      localStorage.setItem(k, JSON.stringify(seed));
      return true;
    } catch (error) {
      console.error('Error creating profile:', error);
      return false;
    }
  }
  return true;
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
      return parsed || null; // session is now the user object directly
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
      localStorage.setItem('bvi.auth.session', JSON.stringify(user));
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
