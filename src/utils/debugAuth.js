import { getTokenInfo } from './tokenValidator'

// Debug helper para verificar el estado de autenticación
export const debugAuthState = () => {
  const token = localStorage.getItem('token')
  const user = localStorage.getItem('user')
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api'
  
  console.log('=== DEBUG AUTH STATE ===')
  console.log('Token exists:', !!token)
  console.log('User exists:', !!user)
  
  if (user) {
    try {
      const userData = JSON.parse(user)
      console.log('User:', userData.email || 'No email')
      console.log('Role:', userData.role || 'No role')
    } catch (e) {
      console.log('User: Invalid JSON')
    }
  }
  
  console.log('Token preview:', token ? token.substring(0, 20) + '...' : 'No token')
  console.log('API Base URL:', baseURL)
  
  // Token validation
  if (token) {
    const tokenInfo = getTokenInfo(token)
    if (tokenInfo) {
      console.log('Token Info:')
      console.log('  User ID:', tokenInfo.userId)
      console.log('  Email:', tokenInfo.email)
      console.log('  Role:', tokenInfo.role)
      console.log('  Issued At:', tokenInfo.issuedAt)
      console.log('  Expires At:', tokenInfo.expiresAt)
      console.log('  Is Expired:', tokenInfo.isExpired)
    } else {
      console.log('Token Info: Invalid token format')
    }
  }
  
  // Test URL construction
  const eventsURL = `${baseURL}/events`
  console.log('Events URL will be:', eventsURL)
  console.log('========================')
  return { token, user: user ? JSON.parse(user) : null }
}
