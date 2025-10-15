// Profile storage helper functions for localStorage operations

const PROFILE_KEY_PREFIX = 'bvi.profile.'

// Keying strategy: prefer member.id; fallback to email lowercased
const keyFor = (member) => member?.id ? `bvi.profile.${member.id}` : (member?.email ? `bvi.profile.${member.email.toLowerCase()}` : null);

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
 * Get member profile data by member object (id or email)
 * @param {Object} user - Member object with id or email
 * @returns {Object|null} Profile data or null
 */
export function getProfile(member) {
  return getProfileByKey(keyFor(member));
}

/**
 * Set member profile data by member object
 * @param {Object} user - Member object with id or email
 * @param {Object} partial - Partial profile data to update
 * @returns {boolean} True if successful
 */
export function setProfile(member, partial) {
  const k = keyFor(member); 
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
 * @param {Object} user - Member object with id or email
 * @param {Object} seed - Default profile data
 * @returns {boolean} True if successful
 */
export function ensureProfile(member, seed = {}) {
  const k = keyFor(member); 
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
 * Read member from session storage (legacy compatibility)
 * @returns {Object|null} Member data or null
 */
export function readMemberFromStorage() {
  try { 
    // Try session first (AuthContext stores here), then fallback to member
    const session = localStorage.getItem('bvi.auth.session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed || null; // session is now the user object directly
    }
    return JSON.parse(localStorage.getItem('member')) || null; 
  } catch { 
    return null; 
  }
}

/**
 * Write member to session storage (legacy compatibility)
 * @param {Object} user - Member data to write
 */
export function writeMemberToStorage(user) {
  try { 
    // Update both session and member keys for consistency
    const session = localStorage.getItem('bvi.auth.session');
    if (session) {
      localStorage.setItem('bvi.auth.session', JSON.stringify(user));
    }
      localStorage.setItem('member', JSON.stringify(user));
  } catch (error) {
    console.error('Error writing user to storage:', error);
  }
}

/**
 * Ensure user defaults for backward compatibility
 * @param {Object} u - Member object
 * @returns {Object} Member object with defaults
 */
export function ensureUserDefaults(u = {}) {
  return {
    name: u.name || '',
    email: u.email || '',
    password: u.password || '',
    role: u.role || 'member',
    countryCode: u.countryCode ?? '+54',
    phone: u.phone ?? '',
    profilePicture: u.profilePicture ?? '',
    profilePictureUrl: u.profilePictureUrl ?? '',
    profilePictureSync: u.profilePictureSync ?? '',
    dateFormat: u.dateFormat || 'MM/DD/YYYY',
    timeZone: u.timeZone || 'EST',
    country: u.country || 'Argentina',
    language: u.language || 'English (Default)',
  };
}
