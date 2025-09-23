export const can = (user, permission) => {
  if (!user) return false
  
  // Admin has all permissions
  if (user.role === 'admin') return true
  
  // Check if user has specific permission
  return Array.isArray(user.permissions) && user.permissions.includes(permission)
}
