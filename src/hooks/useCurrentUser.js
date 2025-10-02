import { useMemo } from 'react';
import { getCurrentUserFromStorage } from '../helpers/authStorage';

// Optional-context import guarded at runtime
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
 * @returns {Object} { name: string, email: string, firstName: string, lastName: string, role: string, permissions: Array }
 */
export function useCurrentUser() {
  // Prefer AuthContext if available
  if (typeof useAuthHook === 'function') {
    try {
      const { user } = useAuthHook();
      if (user) {
        return {
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || '',
          email: user.email || '',
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          role: user.role || 'user',
          permissions: user.permissions || [],
          id: user.id || '',
          phoneNumber: user.phoneNumber || ''
        };
      }
    } catch (_e) {
      // Fallback to storage if context access fails
    }
  }
  
  return useMemo(() => {
    const fallback = getCurrentUserFromStorage();
    return {
      name: fallback.name,
      email: fallback.email,
      firstName: '',
      lastName: '',
      role: 'user',
      permissions: [],
      id: '',
      phoneNumber: ''
    };
  }, []);
}
