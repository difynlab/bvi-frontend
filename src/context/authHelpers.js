// Helper functions for authentication

/**
 * Derive role from email address
 * @param {string} email - Email address
 * @returns {string} Role: 'admin' or 'member'
 */
export const deriveRoleFromEmail = (email) => {
  if (!email || typeof email !== 'string') return 'member'
  
  const normalizedEmail = email.toLowerCase().trim()
  
  // Check if email contains "@admin" OR domain starts with "admin"
  if (normalizedEmail.includes('@admin') || normalizedEmail.split('@')[1]?.startsWith('admin')) {
    return 'admin'
  }
  
  // Check if email contains "@user" OR domain starts with "user"
  if (normalizedEmail.includes('@user') || normalizedEmail.split('@')[1]?.startsWith('user')) {
    return 'member'
  }
  
  // Default to user
  return 'member'
}

/**
 * Hash password using Web Crypto SHA-256
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hex digest of hashed password
 */
export const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }
  
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return toHex(hashBuffer)
}

/**
 * Convert ArrayBuffer to hex string
 * @param {ArrayBuffer} buffer - Buffer to convert
 * @returns {string} Hex string
 */
export const toHex = (buffer) => {
  const hashArray = Array.from(new Uint8Array(buffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Get permissions for a role
 * @param {string} role - User role
 * @returns {Array} Array of permissions
 */
export const getPermissions = (role) => {
  if (role === 'admin') {
    return [
      'events:create', 'events:read', 'events:update', 'events:delete',
      'legislation:create', 'legislation:read', 'legislation:update', 'legislation:delete',
      'newsletters:create', 'newsletters:read', 'newsletters:update', 'newsletters:delete',
      'notices:create', 'notices:read', 'notices:update', 'notices:delete',
      'reports:create', 'reports:read', 'reports:update', 'reports:delete',
      'membership:read', 'membership:update',
      'subscription:read', 'subscription:update',
      'settings:read', 'settings:update'
    ]
  }
  
  // User permissions - read/download only
  return [
    'events:read',
    'legislation:read',
    'newsletters:read',
    'notices:read',
    'reports:read',
    'membership:read',
    'subscription:read',
    'settings:read', 'settings:update'
  ]
}

// Legacy compatibility
export const resolveRole = deriveRoleFromEmail
