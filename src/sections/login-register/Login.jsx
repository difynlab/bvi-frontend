import React, { useMemo, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth } from '../../context/AuthContext'
import '../../styles/sections/Login.scss'

export const Login = () => {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [formValues, setFormValues] = useState({
    username: '',
    password: '',
    rememberPassword: false,
  })

  const [formErrors, setFormErrors] = useState({
    username: '',
    password: '',
  })

  const isValidEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    return emailPattern.test(value)
  }

  const validate = () => {
    const errors = {
      username: '',
      password: '',
    }

    if (!formValues.username.trim()) errors.username = 'Username is required'
    else if (!isValidEmail(formValues.username)) errors.username = 'Enter a valid email'

    if (!formValues.password) errors.password = 'Password is required'

    setFormErrors(errors)
    return Object.values(errors).every((e) => e === '')
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormValues((prev) => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }))
  }

  const loginData = useMemo(() => {
    return {
      username: formValues.username.trim(),
      password: formValues.password,
      rememberPassword: formValues.rememberPassword,
    }
  }, [formValues])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const ok = validate()
    if (!ok) return
    
    await login({ username: formValues.username, password: formValues.password })
    navigate('/events')
  }

  const handleGoogleSuccess = async (credentialResponse) => {
    console.log('Google login success:', credentialResponse)
    await loginWithGoogle(credentialResponse.credential)
    navigate('/events')
  }

  const handleGoogleError = () => {
    console.log('Google login failed')
    alert('Google login failed')
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
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
                value={formValues.username}
                onChange={handleChange}
              />
              {formErrors.username && <span className="error">{formErrors.username}</span>}
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                value={formValues.password}
                onChange={handleChange}
              />
              {formErrors.password && <span className="error">{formErrors.password}</span>}
            </div>

            <div className="login-options">
              <label className="remember-checkbox">
                <input
                  type="checkbox"
                  name="rememberPassword"
                  checked={formValues.rememberPassword}
                  onChange={handleChange}
                />
                <span>Remember password</span>
              </label>
              <NavLink to="/forget-password" className="forget-link">
                Forget Password?
              </NavLink>
            </div>

            <div className="auth-footer">
              <button type="submit" className="auth-footer-cta">Login Now</button>
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
