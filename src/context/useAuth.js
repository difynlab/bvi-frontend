import { useContext } from 'react'
import { AuthContext } from './AuthContext'

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    console.warn('useAuth must be used within an AuthProvider')
    return null
  }
  return context
}
