import React, { useState } from 'react'
import '../../styles/sections/Register.scss'
import { NavLink } from 'react-router-dom'
import { useRegisterForm } from '../../hooks/useRegisterForm'

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [formValues, setFormValues] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    confirmPassword: '',
  })

  const [formErrors, setFormErrors] = useState({
    firstName: '',
    lastName: '',
    contactNumber: '',
    confirmPassword: '',
  })

  // Use the password policy hook for email and password
  const { 
    email, 
    setEmail, 
    password, 
    setPassword, 
    error: passwordError, 
    handleSubmit: handlePasswordSubmit 
  } = useRegisterForm((data) => {
    // Handle successful password validation
    handleFormSubmit(data)
  })

  const isValidEmail = (value) => {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i
    return emailPattern.test(value)
  }

  const isValidPhone = (value) => {
    const digitsOnly = value.replace(/[^0-9]/g, '')
    return digitsOnly.length >= 8 && digitsOnly.length <= 15
  }

  const validateOtherFields = () => {
    const errors = {
      firstName: '',
      lastName: '',
      contactNumber: '',
      confirmPassword: '',
    }

    if (!formValues.firstName.trim()) errors.firstName = 'First name is required'
    if (!formValues.lastName.trim()) errors.lastName = 'Last name is required'

    if (!formValues.contactNumber.trim()) errors.contactNumber = 'Contact number is required'
    else if (!isValidPhone(formValues.contactNumber)) errors.contactNumber = 'Enter a valid phone number'

    if (!formValues.confirmPassword) errors.confirmPassword = 'Please confirm password'
    else if (formValues.confirmPassword !== password) errors.confirmPassword = 'Passwords do not match'

    setFormErrors(errors)
    return Object.values(errors).every((e) => e === '')
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  const handleFormSubmit = (passwordData) => {
    const otherFieldsValid = validateOtherFields()
    if (!otherFieldsValid) return

    const collectedData = {
      firstName: formValues.firstName.trim(),
      lastName: formValues.lastName.trim(),
      email: passwordData.email,
      contactNumber: formValues.contactNumber.trim(),
      password: passwordData.password,
      countryCode: '+54',
      phoneNumber: formValues.contactNumber.trim(),
      profilePicture: '',
      dateFormat: 'MM/DD/YYYY',
      timeZone: 'EST',
      country: 'Argentina',
      language: 'English (Default)'
    }

    // TODO BACKEND: Replace this with your API call
    console.log('Collected data:', collectedData)
    alert('Datos recopilados:\n' + JSON.stringify(collectedData, null, 2))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    handlePasswordSubmit(e)
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
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
                {formErrors.firstName && <span className="error">{formErrors.firstName}</span>}
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
                {formErrors.lastName && <span className="error">{formErrors.lastName}</span>}
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
              </div>
              <div className="field">
                <label htmlFor="contactNumber">Contact Number</label>
                <input
                  id="contactNumber"
                  name="contactNumber"
                  type="tel"
                  placeholder="00 00 000 0000"
                  value={formValues.contactNumber}
                  onChange={handleChange}
                />
                {formErrors.contactNumber && <span className="error">{formErrors.contactNumber}</span>}
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
                  <span className="error">{formErrors.confirmPassword}</span>
                )}
              </div>
            </div>
            <div className="auth-footer">
              <button type="submit" className="auth-footer-cta">Register Now</button>
              <p className='auth-footer-already'>
                Already have an account? <NavLink to={'/login'}>Sign In</NavLink>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
