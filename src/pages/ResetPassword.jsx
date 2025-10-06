import React, { useState } from 'react'
import { useParams } from 'react-router-dom'

const ResetPassword = () => {
  const { token } = useParams()
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required'
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Password must be at least 6 characters'
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    setSuccess('')

    try {
      // TODO BACKEND: POST /api/auth/reset-password { token, newPassword }
      console.log('Reset password request:', { token, newPassword: formData.newPassword })
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setSuccess('Your password has been reset successfully!')
      setFormData({ newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Reset password error:', error)
      setErrors({ general: 'An error occurred. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        <h1 className="reset-password-title">
          Reset Password
        </h1>
        
        <p className="reset-password-subtitle">
          Token: {token}
        </p>
        
        <form onSubmit={handleSubmit} className="reset-password-form">
          <div className="form-group">
            <label 
              htmlFor="newPassword"
              className="form-label"
            >
              New Password
            </label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`form-input ${errors.newPassword ? 'error' : ''}`}
              placeholder="Enter new password"
            />
            {errors.newPassword && (
              <p className="form-error">
                {errors.newPassword}
              </p>
            )}
          </div>
          
          <div className="form-group">
            <label 
              htmlFor="confirmPassword"
              className="form-label"
            >
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
              placeholder="Confirm new password"
            />
            {errors.confirmPassword && (
              <p className="form-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>
          
          <button
            type="submit"
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
          
          {success && (
            <p className="success-message">
              {success}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}

export default ResetPassword