import { getSession } from '../helpers/authStorage'

// Helper para verificar si el token es válido
export const isTokenValid = (token) => {
  if (!token) return false
  
  try {
    // Decodificar JWT para verificar expiración
    const base64Url = token.split('.')[1]
    if (!base64Url) return false
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))
    
    const payload = JSON.parse(jsonPayload)
    const currentTime = Math.floor(Date.now() / 1000)
    
    // Verificar si el token ha expirado
    if (payload.exp && payload.exp < currentTime) {
      console.log('Token expired:', new Date(payload.exp * 1000))
      return false
    }
    
    console.log('Token is valid, expires:', new Date(payload.exp * 1000))
    return true
  } catch (error) {
    console.error('Error validating token:', error)
    return false
  }
}

// Helper para obtener información del token
export const getTokenInfo = (token) => {
  if (!token) return null
  
  try {
    const base64Url = token.split('.')[1]
    if (!base64Url) return null
    
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => 
      '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    ).join(''))
    
    const payload = JSON.parse(jsonPayload)
    return {
      userId: payload.sub || payload.user_id,
      email: payload.email,
      role: payload.role,
      issuedAt: new Date(payload.iat * 1000),
      expiresAt: new Date(payload.exp * 1000),
      isExpired: payload.exp < Math.floor(Date.now() / 1000)
    }
  } catch (error) {
    console.error('Error parsing token:', error)
    return null
  }
}
