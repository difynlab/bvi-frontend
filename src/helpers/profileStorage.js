// Profile storage helper functions for localStorage operations

export function readUserFromStorage() {
  try { 
    // Try session first (AuthContext stores here), then fallback to user
    const session = localStorage.getItem('session');
    if (session) {
      const parsed = JSON.parse(session);
      return parsed.user || null;
    }
    return JSON.parse(localStorage.getItem('user')) || null; 
  } catch { 
    return null; 
  }
}

export function writeUserToStorage(user) {
  try { 
    // Update both session and user keys for consistency
    const session = localStorage.getItem('session');
    if (session) {
      const parsed = JSON.parse(session);
      parsed.user = user;
      localStorage.setItem('session', JSON.stringify(parsed));
    }
    localStorage.setItem('user', JSON.stringify(user)); 
  } catch (error) {
    console.error('Error writing user to storage:', error);
  }
}

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
