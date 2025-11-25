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
        const normalizedRole = (user.role || 'member').toString().toLowerCase();
        const firstName = user.firstName || user.first_name || '';
        const lastName = user.lastName || user.last_name || '';
        return {
          name: `${firstName} ${lastName}`.trim() || user.userName || user.name || '',
          email: user.email || '',
          firstName: firstName,
          lastName: lastName,
          role: normalizedRole,
          permissions: user.permissions || [],
          id: user.id || '',
          phone: user.phone || user.phoneNumber || ''
        };
      }
    } catch (_e) {
      // Fallback to storage if context access fails
    }
  }
  
  return useMemo(() => {
    const fallback = getCurrentUserFromStorage();
    const normalizedRole = (fallback.role || 'member').toString().toLowerCase();
    return {
      name: fallback.name,
      email: fallback.email,
      firstName: '',
      lastName: '',
      role: normalizedRole,
      permissions: [],
      id: '',
      phone: fallback.phone || ''
    };
  }, []);
}
