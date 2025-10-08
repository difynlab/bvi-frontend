import React, { useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/useAuth'
import { useLoginForm } from '../../hooks/useLoginForm'
import '../../styles/sections/Login.scss'

export const Login = () => {
  const { login, loginWithGoogle, error: authError } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberPassword, setRememberPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [successMessage, setSuccessMessage] = useState('')

  const prefilledData = location.state || {}
  const { prefilledEmail, prefilledPassword, message } = prefilledData

  const { 
    email, 
    setEmail, 
    password, 
    setPassword
  } = useLoginForm()

  React.useEffect(() => {
    if (prefilledEmail) {
      setEmail(prefilledEmail)
    }
    if (prefilledPassword) {
      setPassword(prefilledPassword)
    }
    if (message) {
      setSuccessMessage(message)
    }
  }, [prefilledEmail, prefilledPassword, message, setEmail, setPassword])

  const isValidEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    return emailPattern.test(value)
  }

  const validateForm = () => {
    const errors = {
      email: '',
      password: ''
    }

    if (!email.trim()) {
      errors.email = 'Username is required'
    } else if (!isValidEmail(email)) {
      errors.email = 'Enter a valid email'
    }

    if (!password.trim()) {
      errors.password = 'Password is required'
    }

    return errors
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    if (emailError) {
      setEmailError('')
    }
  }

  React.useEffect(() => {
    if (authError) {
      if (authError.type === 'email') {
        setEmailError(authError.message)
        setPasswordError('')
      } else if (authError.type === 'password') {
        setPasswordError(authError.message)
        setEmailError('')
      }
    }
  }, [authError])

  const handleFormSubmit = async () => {
    setEmailError('')
    setPasswordError('')

    const errors = validateForm()

    setEmailError(errors.email)
    setPasswordError(errors.password)

    const allValid = Object.values(errors).every(error => error === '')

    if (allValid) {
      setIsSubmitting(true)
      try {
        const success = await login({ email: email.trim(), password: password.trim() })
        if (success) {
          navigate('/dashboard')
        }
      } catch (error) {
        console.error('Login error:', error)
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    handleFormSubmit()
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    const credential = credentialResponse?.credential || ''
    if (!credential) return handleGoogleError?.()
    console.log('Google login success')
    setIsSubmitting(true)
    try {
      const success = await loginWithGoogle(credential)
      if (success) {
        navigate('/dashboard')
      }
    } catch (error) {
      console.error('Google login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleGoogleError = () => {
    console.log('Google login failed')
    alert('Google login failed')
  }

  return (
    <div className="auth-page">
      <div className="auth-container login-container">
        <div className="auth-left" aria-hidden>
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80"
            alt="Skyscrapers"
          />
        </div>
        <div className="auth-right">
          {successMessage && (
            <div className="login-success-message">
              {successMessage}
            </div>
          )}
          <h1 className="auth-title">Login Your Account</h1>
          <p className="auth-subtitle">
            Log in with your data that you entered during your registration
          </p>
          
          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="field">
              <label htmlFor="username">User Name</label>
              <input
                id="username"
                name="username"
                type="email"
                placeholder="john@gmail.com"
                value={email}
                onChange={handleEmailChange}
                className="auth-input"
              />
              {emailError && <div className="form-error"><span className="error">{emailError}</span></div>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="password-field">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-invalid={Boolean(passwordError)}
                  aria-describedby={passwordError ? 'password-errors' : undefined}
                  className="auth-input"
                />
                <button
                  type="button"
                  className="password-toggle"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword(v => !v)}
                >
                  <i className={showPassword ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill'} />
                </button>
              </div>
              {passwordError && (
                <div id="password-errors" className="form-error">
                  <span className="error">{passwordError}</span>
                </div>
              )}
            </div>

            <div className="login-options">
              <label className="remember-checkbox">
                <input
                  type="checkbox"
                  name="rememberPassword"
                  checked={rememberPassword}
                  onChange={(e) => setRememberPassword(e.target.checked)}
                />
                <span>Remember password</span>
              </label>
              <NavLink to="/forget-password" className="forget-link">
                Forget Password?
              </NavLink>
            </div>

            <div className="auth-footer">
              <button type="submit" className="auth-footer-cta" disabled={isSubmitting}>
                {isSubmitting ? 'Logging in...' : 'Login Now'}
              </button>
              <div className="auth-google google-login-container">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="continue_with"
                />
              </div>
              <p className='auth-footer-already'>
                Don't have an account? <NavLink to={'/register'}>Sign Up here</NavLink>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
