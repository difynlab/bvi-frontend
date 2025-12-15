class MemberSubscriptionDetailsService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'
  }

  getToken() {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey)
  }

  isAuthenticated() {
    return !!this.getToken()
  }

  getCurrentUser() {
    const user = localStorage.getItem('user') || sessionStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  getHeaders(includeContentType = false) {
    const token = this.getToken()
    const headers = {
      'Accept': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  buildQuery(params = {}) {
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      const value = params[key]
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  async handleResponse(response) {
    if (!response.ok) {
      try {
        const data = await response.json()

        if (data.http_status === 401) {
          localStorage.removeItem(this.tokenKey)
          sessionStorage.removeItem(this.tokenKey)
          localStorage.removeItem('user')
          sessionStorage.removeItem('user')
          throw new Error('Session expired. Please log in again.')
        } else if (data.http_status === 403) {
          throw new Error('Access denied. Administrator role required.')
        } else if (data.http_status === 400 || data.http_status === 422) {
          const errorMessage = data.message || 'Validation error'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 404) {
          return {
            http_status: 404,
            message: data.message || 'No data found',
            data: null
          }
        } else if (data.http_status === 500) {
          const errorMessage = data.message || 'Server error'
          throw new Error(`${errorMessage} (Error 500)`)
        } else {
          const errorMessage = data.message || data.error || `Server error: ${response.status}`
          throw new Error(errorMessage)
        }
      } catch (parseError) {
        if (response.status === 404) {
          return {
            http_status: 404,
            message: 'No data found',
            data: null
          }
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }
    }

    try {
      return await response.json()
    } catch (_parseError) {
      throw new Error('Error processing server response')
    }
  }

  async getAll(pagination = 6, page = 1) {
    const queryParams = {
      pagination,
      page
    }

    const query = this.buildQuery(queryParams)

    try {
      const response = await fetch(`${this.baseURL}/member-subscription-details${query}`, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      if (!error.message.includes('No data found')) {
        console.error('Error fetching member subscription details:', error)
      }
      throw error
    }
  }

  async getById(id) {
    try {
      const response = await fetch(`${this.baseURL}/member-subscription-details/${id}`, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching member subscription detail:', error)
      throw error
    }
  }

  async create(formData) {
    try {
      const response = await fetch(`${this.baseURL}/member-subscription-details`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error creating member subscription detail:', error)
      throw error
    }
  }

  async update(id, formData) {
    try {
      const response = await fetch(`${this.baseURL}/member-subscription-details/${id}`, {
        method: 'POST',
        headers: this.getHeaders(false),
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating member subscription detail:', error)
      throw error
    }
  }
}

export default new MemberSubscriptionDetailsService()

