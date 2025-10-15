/**
 * Check if user has a specific permission
 * @param {Object} user - Member object with role and permissions
 * @param {string} permission - Permission to check
 * @returns {boolean} True if user has permission
 */
export const can = (user, permission) => {
  if (!user || !permission) return false
  
  // Admin has all permissions
  if (user.role === 'admin') return true
  
  // Check if user has specific permission
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}

/**
 * Check if user can perform CRUD operations
 * @param {Object} user - Member object
 * @param {string} resource - Resource name (e.g., 'events', 'legislation')
 * @param {string} action - Action to check ('create', 'read', 'update', 'delete')
 * @returns {boolean} True if user can perform action
 */
export const canPerform = (user, resource, action) => {
  if (!user || !resource || !action) return false
  
  const permission = `${resource}:${action}`
  return can(user, permission)
}

/**
 * Check if user is admin
 * @param {Object} user - Member object
 * @returns {boolean} True if user is admin
 */
export const isAdmin = (user) => {
  return user && user.role === 'admin'
}

/**
 * Check if user is regular user
 * @param {Object} user - Member object
 * @returns {boolean} True if user is regular user
 */
export const isUser = (user) => {
  return user && user.role === 'member'
}
