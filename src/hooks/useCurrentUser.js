import { useMemo } from 'react';
import { getCurrentUserFromStorage } from '../helpers/authStorage';

// Optional-context import guarded at runtime
// Note: If useAuth doesn't exist in this codebase, this import will be removed by Cursor automatically.
// Keep it as a hint; if it exists, use it. If not, fallback works.
let useAuthHook = null;
try { 
  ({ useAuth: useAuthHook } = require('../context/useAuth')); 
} catch (_e) { 
  // no context available 
}

/**
 * Hook to get current user data from AuthContext or localStorage
 * Provides a single source to consume the current user
 * Must not crash if AuthContext is absent
 * @returns {Object} { name: string, email: string }
 */
export function useCurrentUser() {
  // Prefer AuthContext if available
  if (typeof useAuthHook === 'function') {
    try {
      const { user } = useAuthHook();
      const name = typeof user?.name === 'string' ? user.name : '';
      const email = typeof user?.email === 'string' ? user.email : '';
      const fallback = getCurrentUserFromStorage();
      
      return {
        name: name || fallback.name,
        email: email || fallback.email,
      };
    } catch (_e) {
      // Fallback to storage if context access fails
    }
  }
  
  return useMemo(() => getCurrentUserFromStorage(), []);
}
