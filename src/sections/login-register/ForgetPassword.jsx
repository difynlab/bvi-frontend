import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { forgotPassword } from '../../api/authApi'
import '../../styles/sections/ForgetPassword.scss'

export const ForgetPassword = () => {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isEmailSent, setIsEmailSent] = useState(false)
  const [error, setError] = useState('')

  const isValidEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    return emailPattern.test(value)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!email.trim()) {
      setError('Email is required')
      return
    }
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsLoading(true)
    
    try {
      await sendPasswordResetEmail(email)
      setIsEmailSent(true)
    } catch (error) {
      // Handle specific error messages from backend
      if (error.message.includes('Email not found')) {
        setError('Email not found. Please check your email address.')
      } else if (error.message.includes('Validation failed')) {
        setError('Please enter a valid email address.')
      } else {
        setError('Failed to send reset email. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const sendPasswordResetEmail = async (email) => {
    try {
      const response = await forgotPassword({ email })
      console.log('Password reset email sent successfully:', response)
      return response
    } catch (error) {
      console.error('Failed to send password reset email:', error)
      throw error
    }
  }

  const handleEmailChange = (e) => {
    setEmail(e.target.value)
    if (error) setError('')
  }

  if (isEmailSent) {
    return (
      <div className="forget-password-page">
        <div className="forget-password-container">
          <div className="success-message">
            <h1 className="success-title">Check Your Email</h1>
            <p className="success-text">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="success-instructions">
              Please check your email and click the link to reset your password.
            </p>
            <div className="success-actions">
              <button 
                onClick={() => setIsEmailSent(false)}
                className="resend-button"
              >
                Send Another Email
              </button>
              <NavLink to="/login" className="back-to-login">
                Back to Login
              </NavLink>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="forget-password-page">
      <div className="forget-password-container">
        <div className="forget-password-content">
          <h1 className="forget-password-title">Forgot your password</h1>
          <p className="forget-password-subtitle">
            Don't worry! Resetting your password is easy. Just type in the email<span>you registered to Warehouse Exchange.</span>
          </p>
          
          <form onSubmit={handleSubmit} className="forget-password-form">
            <div className="email-field">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Ex: johnmercury@gmail.com"
                value={email}
                onChange={handleEmailChange}
                disabled={isLoading}
                className="auth-input"
              />
              {error && <span className="error-message">{error}</span>}
            </div>
            
            <button 
              type="submit" 
              className="send-button"
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Now'}
            </button>
          </form>
          
          <p className="remember-password">
            Did you remember your password? <NavLink to="/login" className="login-link">Try logging in</NavLink>
          </p>
        </div>
      </div>
    </div>
  )
}
