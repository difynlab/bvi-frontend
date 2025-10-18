import React, { useState } from 'react'
import { useParams, NavLink } from 'react-router-dom'
import { resetPassword } from '../api/authApi'
import '../styles/pages/ResetPassword.scss'

const ResetPassword = () => {
  const { token } = useParams()
  const [formData, setFormData] = useState({
    email: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordReset, setIsPasswordReset] = useState(false)

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

    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required'
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
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
      const resetData = {
        email: formData.email,
        password: formData.newPassword,
        password_confirmation: formData.confirmPassword,
        token: token
      }

      const response = await resetPassword(resetData)
      console.log('Password reset successful:', response)

      setSuccess('Your password has been reset successfully!')
      setIsPasswordReset(true)
      setFormData({ email: '', newPassword: '', confirmPassword: '' })
    } catch (error) {
      console.error('Reset password error:', error)

      // Handle specific error messages from backend
      if (error.message.includes('Invalid reset request')) {
        setErrors({ general: 'Invalid or expired reset token. Please request a new password reset.' })
      } else if (error.message.includes('Email not found')) {
        setErrors({ email: 'Email not found. Please check your email address.' })
      } else if (error.message.includes('Validation failed')) {
        setErrors({ general: 'Please check your information and try again.' })
      } else {
        setErrors({ general: 'An error occurred. Please try again.' })
      }
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

        <form onSubmit={handleSubmit} className="reset-password-form">

          <div className="form-group">
            <label
              htmlFor="email"
              className="form-label"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="Enter your email address"
            />
            {errors.email && (
              <p className="form-error">
                {errors.email}
              </p>
            )}
          </div>

          <div className="form-group">
            <label
              htmlFor="newPassword"
              className="form-label"
            >
              New Password
            </label>
            <div className="password-field">
              <input
                type={showNewPassword ? 'text' : 'password'}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                className={`form-input ${errors.newPassword ? 'error' : ''}`}
                placeholder="Enter new password"
                aria-invalid={Boolean(errors.newPassword)}
                aria-describedby={errors.newPassword ? 'newPassword-errors' : undefined}
                disabled={isPasswordReset}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowNewPassword(v => !v)}
                disabled={isPasswordReset}
              >
                <i className={showNewPassword ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill'} />
              </button>
            </div>
            {errors.newPassword && (
              <p id="newPassword-errors" className="form-error">
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
            <div className="password-field">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                placeholder="Confirm new password"
                aria-invalid={Boolean(errors.confirmPassword)}
                aria-describedby={errors.confirmPassword ? 'confirmPassword-errors' : undefined}
                disabled={isPasswordReset}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirmPassword(v => !v)}
                disabled={isPasswordReset}
              >
                <i className={showConfirmPassword ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill'} />
              </button>
            </div>
            {errors.confirmPassword && (
              <p id="confirmPassword-errors" className="form-error">
                {errors.confirmPassword}
              </p>
            )}
          </div>

          <button
            type="submit"
            className="submit-button"
            disabled={loading || isPasswordReset}
          >
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>

        </form>
      </div>
      {success && (
        <div className="success-message">
          <div className="success-message-content">
            <i className="bi bi-check-circle-fill"></i>
            <span>{success}</span>
          </div>
          <NavLink to="/login" className="login-link">
            Log in now
          </NavLink>
        </div>
      )}

      {errors.general && (
        <p className="form-error">
          {errors.general}
        </p>
      )}
    </div>
  )
}

export default ResetPassword