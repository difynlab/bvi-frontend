// Authentication storage helper functions for localStorage operations

const USERS_KEY = 'bvi.auth.users'
const SESSION_KEY = 'bvi.auth.session'

/**
 * Get all registered members
 * @returns {Array} Array of member objects
 */
export function getUsers() {
  try {
    const users = localStorage.getItem(USERS_KEY)
    return users ? JSON.parse(users) : []
  } catch (error) {
    console.error('Error reading members from storage:', error)
    return []
  }
}

/**
 * Save all users to storage
 * @param {Array} users - Array of member objects
 * @returns {boolean} True if successful
 */
export function setUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users))
    return true
  } catch (error) {
    console.error('Error writing members to storage:', error)
    return false
  }
}

/**
 * Find user by email (case-insensitive)
 * @param {string} email - Email to search for
 * @returns {Object|null} Member object or null
 */
export function findUserByEmail(email) {
  if (!email) return null
  
  const users = getUsers()
  const normalizedEmail = email.toLowerCase().trim()
  
  return users.find(user => user.email === normalizedEmail) || null
}

/**
 * Save member session
 * @param {Object} user - Member object to store in session
 * @returns {boolean} True if successful
 */
export function saveSession(user) {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(user)); // TODO BACKEND
    return true
  } catch (error) {
    console.error('Error saving session:', error)
    return false
  }
}

/**
 * Get current session
 * @returns {Object|null} Session object or null
 */
export function getSession() {
  try { 
    return JSON.parse(localStorage.getItem(SESSION_KEY) || 'null'); 
  } catch { 
    return null; 
  }
}

/**
 * Clear current session
 * @returns {boolean} True if successful
 */
export function clearSession() {
  try {
    localStorage.removeItem(SESSION_KEY)
    return true
  } catch (error) {
    console.error('Error clearing session:', error)
    return false
  }
}

/**
 * Clear all auth-related data from localStorage
 * @returns {boolean} True if successful
 */
export function clearAllAuthData() {
  try {
    localStorage.removeItem(SESSION_KEY)
    localStorage.removeItem(USERS_KEY)
    // Clear any profile data
    const keys = Object.keys(localStorage)
    keys.forEach(key => {
      if (key.startsWith('bvi.profile.')) {
        localStorage.removeItem(key)
      }
    })
    return true
  } catch (error) {
    console.error('Error clearing all auth data:', error)
    return false
  }
}

/**
 * Safely reads current member data from localStorage (legacy compatibility)
 * Tries common keys and shapes used in the app's localStorage
 * Returns null-safe fallbacks without throwing errors
 * @returns {Object} { name: string, email: string }
 */
export function getCurrentUserFromStorage() {
  try {
    // Try session first
    const session = getSession()
    if (session) {
      return {
        name: `${session.firstName || ''} ${session.lastName || ''}`.trim() || '',
        email: session.email || ''
      }
    }
    
    // Try common keys first (adjust if your app uses a specific one)
    const candidates = ['session', 'auth', 'user', 'currentUser'];
    
    for (const key of candidates) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      
      const parsed = JSON.parse(raw);
      // Support shapes: {user:{name,email}}, {name,email}, {profile:{name,email}}
      const u = parsed?.user ?? parsed?.profile ?? parsed;
      const name = typeof u?.name === 'string' ? u.name : '';
      const email = typeof u?.email === 'string' ? u.email : '';
      
      if (name || email) {
        return { name, email };
      }
    }
  } catch (_e) { 
    // Swallow errors and fallback to empty values
  }
  
  return { name: '', email: '' };
}
