// Authentication API functions
// Handles all auth-related API calls to backend

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {string} userData.firstName - User's first name
 * @param {string} userData.lastName - User's last name
 * @param {string} userData.email - User's email
 * @param {string} userData.phoneNumber - User's phone number
 * @param {string} userData.password - User's password
 * @param {string} userData.confirmPassword - User's password confirmation
 * @returns {Promise<Object>} Registration response
 */
export async function registerUser(userData) {
  try {
    // Transform frontend data to backend format
    const backendData = {
      first_name: userData.firstName,
      last_name: userData.lastName,
      email: userData.email,
      phone: userData.phoneNumber || '',
      password: userData.password,
      password_confirmation: userData.confirmPassword || userData.password,
      role: 'member' // Always member for new registrations
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Register API error:', error)
    throw error
  }
}

/**
 * Login user
 * @param {Object} credentials - Login credentials
 * @param {string} credentials.email - User's email
 * @param {string} credentials.password - User's password
 * @returns {Promise<Object>} Login response with user data and token
 */
export async function loginUser(credentials) {
  try {
    // Transform frontend data to backend format
    const backendData = {
      email: credentials.email,
      password: credentials.password
    }

    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(backendData)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Login API error:', error)
    throw error
  }
}

/**
 * Logout user
 * @param {string} token - User's authentication token
 * @returns {Promise<Object>} Logout response
 */
export async function logoutUser(token) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Logout API error:', error)
    throw error
  }
}

/**
 * Request password reset
 * @param {Object} data - Password reset request data
 * @param {string} data.email - User's email
 * @returns {Promise<Object>} Password reset response
 */
export async function forgotPassword(data) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/forgot-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Forgot password API error:', error)
    throw error
  }
}

/**
 * Reset password with token
 * @param {Object} data - Password reset data
 * @param {string} data.token - Reset token
 * @param {string} data.password - New password
 * @returns {Promise<Object>} Password reset response
 */
export async function resetPassword(data) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Reset password API error:', error)
    throw error
  }
}

/**
 * Get current user session
 * @param {string} token - User's authentication token
 * @returns {Promise<Object>} User session data
 */
export async function getCurrentSession(token) {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/session`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Get session API error:', error)
    throw error
  }
}
