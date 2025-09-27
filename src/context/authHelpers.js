// Helper functions for authentication

export const resolveRole = (email) => {
  // MOCK RULE: role = "admin" if email endsWith "@admin.com", else "user"
  return email.endsWith('@admin.com') ? 'admin' : 'user'
}

export const getPermissions = (role) => {
  // MOCK permissions
  if (role === 'admin') {
    return ['events:create', 'events:update', 'events:delete']
  }
  return []
}
