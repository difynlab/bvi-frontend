import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/useAuth'
import { useLoginForm } from '../../hooks/useLoginForm'
import '../../styles/sections/Login.scss'

export const Login = () => {
  const { login, loginWithGoogle, error: authError } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [rememberPassword, setRememberPassword] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Use the password policy hook for email and password
  const { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    handleSubmit: handlePasswordSubmit 
  } = useLoginForm(async (data) => {
    // Handle successful password validation
    setIsSubmitting(true)
    setEmailError('')
    setPasswordError('')
    try {
      const success = await login({ email: data.email, password: data.password })
      if (success) {
        navigate('/events')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setIsSubmitting(false)
    }
  })

  const isValidEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    return emailPattern.test(value)
  }

  const validateEmail = (emailValue) => {
    if (!emailValue.trim()) return 'Username is required'
    if (!isValidEmail(emailValue)) return 'Enter a valid email'
    return ''
  }

  const handleEmailChange = (e) => {
    const value = e.target.value
    setEmail(value)
    // Only validate if user has started typing or if there's already an error
    if (emailError || value.length > 0) {
      setEmailError(validateEmail(value))
    }
  }

  // Handle auth errors by type
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    const currentEmailError = validateEmail(email)
    setEmailError(currentEmailError)
    
    if (currentEmailError) return
    handlePasswordSubmit(e)
  }

  const handleGoogleSuccess = async () => {
    console.log('Google login success')
    setIsSubmitting(true)
    try {
      const success = await loginWithGoogle()
      if (success) {
        navigate('/events')
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
              <div className="google-login-container">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={handleGoogleError}
                  theme="outline"
                  size="large"
                  text="continue_with"
                  width="100%"
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
