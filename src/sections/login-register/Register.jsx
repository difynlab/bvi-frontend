import React, { useState } from 'react'
import '../../styles/sections/Register.scss'
import { NavLink, useNavigate } from 'react-router-dom'
import { useRegisterForm } from '../../hooks/useRegisterForm'
import { useAuth } from '../../context/useAuth'
import { passwordPolicyMissing } from '../../helpers/passwordPolicy'

export const Register = () => {
  const { register, error: authError, clearAllUsers, showRegisteredUsers } = useAuth()
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    confirmPassword: '',
  })

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  })

  const [isSubmitting, setIsSubmitting] = useState(false)

  const { 
    email, 
    setEmail, 
    password, 
    setPassword
  } = useRegisterForm()

  const isValidEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    return emailPattern.test(value)
  }

  const isValidPhone = (value) => {
    const digitsOnly = value.replace(/[^0-9]/g, '')
    return digitsOnly.length >= 8 && digitsOnly.length <= 15
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const validateForm = () => {
    const errors = {
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    }

    if (!formValues.firstName.trim()) errors.firstName = 'First name is required'
    if (!formValues.lastName.trim()) errors.lastName = 'Last name is required'
    if (!email.trim()) errors.email = 'Email is required'
    else if (!isValidEmail(email)) errors.email = 'Enter a valid email'
    if (!password.trim()) errors.password = 'Password is required'
    else {
      const missing = passwordPolicyMissing(password)
      if (missing.length) {
        errors.password = `Password must contain: ${missing.join(', ')}.`
      }
    }
    if (!formValues.confirmPassword) errors.confirmPassword = 'Please confirm password'
    else if (formValues.confirmPassword !== password) errors.confirmPassword = 'Passwords do not match'
    
    if (formValues.phoneNumber && !isValidPhone(formValues.phoneNumber)) {
      errors.phoneNumber = 'Enter a valid phone number'
    }
    
    return errors
  }

  const handleFormSubmit = async () => {
    setFormErrors({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
    })

    const errors = validateForm()

    setFormErrors(errors)

    const allValid = Object.values(errors).every(error => error === '')

    if (allValid) {
      setIsSubmitting(true)

      try {
        const registrationData = {
          firstName: formValues.firstName.trim(),
          lastName: formValues.lastName.trim(),
          email: email,
          phoneNumber: formValues.phoneNumber.trim() || '',
          password: password
        }

        const success = await register(registrationData)
        
        if (success) {
          navigate('/login', { 
            state: { 
              prefilledEmail: email,
              prefilledPassword: password,
              message: 'Registration successful! Please log in to continue.'
            }
          })
        } else {
          if (authError) {
            setFormErrors(prev => ({ ...prev, email: authError }))
          } else {
            setFormErrors(prev => ({ ...prev, email: 'Registration failed. Please try again.' }))
          }
        }
      } catch (error) {
        console.error('Registration error:', error)
        setFormErrors(prev => ({ ...prev, email: 'An unexpected error occurred. Please try again.' }))
      } finally {
        setIsSubmitting(false)
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handleFormSubmit()
  }

  return (
    <div className="auth-page">
      <div className="auth-container register-container">
        <div className="auth-left" aria-hidden>
          <img
            src="https://images.unsplash.com/photo-1497215842964-222b430dc094?q=80&w=1600&auto=format&fit=crop"
            alt="Skyscrapers"
          />
        </div>
        <div className="auth-right">
          <h1 className="auth-title">Registration Form</h1>
          <p className="auth-subtitle">
            Fill out this quick form and get started with your complete experience
            <span>with us.</span>
          </p>

          <form onSubmit={handleSubmit} noValidate className="auth-form">
            <div className="grid two-cols">
              <div className="field">
                <label htmlFor="firstName">First Name</label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  placeholder="John"
                  value={formValues.firstName}
                  onChange={handleChange}
                />
                {formErrors.firstName && <div className="register-error"><span className="error">{formErrors.firstName}</span></div>}
              </div>
              <div className="field">
                <label htmlFor="lastName">Last Name</label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Peries"
                  value={formValues.lastName}
                  onChange={handleChange}
                />
                {formErrors.lastName && <div className="register-error"><span className="error">{formErrors.lastName}</span></div>}
              </div>
            </div>

            <div className="grid two-cols">
              <div className="field">
                <label htmlFor="email">Email Address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {formErrors.email && <div className="register-error"><span className="error">{formErrors.email}</span></div>}
              </div>
              <div className="field">
                <label htmlFor="phoneNumber">Contact Number</label>
                <input
                  id="phoneNumber"
                  name="phoneNumber"
                  type="tel"
                  placeholder="00 00 000 0000"
                  value={formValues.phoneNumber}
                  onChange={handleChange}
                />
                {formErrors.phoneNumber && <div className="register-error"><span className="error">{formErrors.phoneNumber}</span></div>}
              </div>
            </div>

            <div className="grid two-cols">
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
                    aria-invalid={Boolean(formErrors.password)}
                    aria-describedby={formErrors.password ? 'password-errors' : undefined}
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
                {formErrors.password && (
                  <div 
                    id="password-errors" 
                    className={`register-error ${formErrors.password.includes('Password must contain') ? 'password-error' : ''}`}
                  >
                    <span className="error">{formErrors.password}</span>
                  </div>
                )}
              </div>
              <div className="field">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <div className="password-field">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="********"
                    value={formValues.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowConfirmPassword(v => !v)}
                  >
                    <i className={showConfirmPassword ? 'bi bi-eye-fill' : 'bi bi-eye-slash-fill'} />
                  </button>
                </div>
                {formErrors.confirmPassword && (
                  <div className="register-error">
                    <span className="error">{formErrors.confirmPassword}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="auth-footer">
              <button type="submit" className="auth-footer-cta" disabled={isSubmitting}>
                {isSubmitting ? 'Registering...' : 'Register Now'}
              </button>
              <p className='auth-footer-already'>
                Already have an account? <NavLink to={'/login'}>Sign In</NavLink>
              </p>
              
              {/* TEMPORARY DEBUG AREA - REMOVE BEFORE PRODUCTION */}
              <div className="debug-panel">
                <p className="debug-title"> Debug Panel (temporary)</p>
                <button 
                  type="button" 
                  className="debug-button"
                  onClick={() => {
                    showRegisteredUsers()
                    alert('Check console to see registered users')
                  }}
                >
                  Show Users
                </button>
                <button 
                  type="button" 
                  className="debug-button"
                  onClick={() => {
                    if (confirm('This will clear ALL registered users. Are you sure?')) {
                      clearAllUsers()
                      alert('All users cleared! You can now register with any email.')
                    }
                  }}
                >
                  Clear All Users
                </button>
                <p className="debug-description">
                  Use "Clear All Users" to reset and test with different emails
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
