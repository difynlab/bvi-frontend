// Helper functions for reading user data from localStorage with safe fallbacks

/**
 * Safely reads current user data from localStorage
 * Tries common keys and shapes used in the app's localStorage
 * Returns null-safe fallbacks without throwing errors
 * @returns {Object} { name: string, email: string }
 */
export function getCurrentUserFromStorage() {
  try {
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
