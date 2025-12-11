export const deriveRoleFromEmail = (email) => {
  if (!email || typeof email !== 'string') return 'member'
  
  const normalizedEmail = email.toLowerCase().trim()
  
  if (normalizedEmail.includes('@admin') || normalizedEmail.split('@')[1]?.startsWith('admin')) {
    return 'admin'
  }
  
  if (normalizedEmail.includes('@user') || normalizedEmail.split('@')[1]?.startsWith('user')) {
    return 'member'
  }
  
  return 'member'
}

export const hashPassword = async (password) => {
  if (!password || typeof password !== 'string') {
    throw new Error('Password must be a non-empty string')
  }
  
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  return toHex(hashBuffer)
}

export const toHex = (buffer) => {
  const hashArray = Array.from(new Uint8Array(buffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

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

export const resolveRole = deriveRoleFromEmail
