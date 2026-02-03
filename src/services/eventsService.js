class EventsService {
  constructor() {
    // TODO PRODUCTION: CHANGE IMAGES - Use full URL in production
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
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

  async handleResponse(response) {
    if (!response.ok) {
      try {
        const data = await response.json()
        
        if (data.http_status === 401) {
          localStorage.removeItem(this.tokenKey)
          localStorage.removeItem('user')
          throw new Error('Session expired. Please log in again.')
        } else if (data.http_status === 403) {
          throw new Error('Access denied. Administrator role required.')
        } else if (data.http_status === 400) {
          const errorMessage = data.message || 'Validation error'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 422) {
          const errorMessage = data.message || 'Validation errors'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 500) {
          const errorMessage = data.message || data.error || 'Internal server error'
          throw new Error(`${errorMessage} (Error 500)`)
        } else if (data.http_status === 404) {
          return {
            http_status: 404,
            message: 'No events found',
            data: {
              data: [],
              current_page: 1,
              last_page: 1,
              per_page: 6,
              total: 0
            }
          }
        } else {
          const errorMessage = data.message || data.error || `Server error: ${response.status}`
          throw new Error(errorMessage)
        }
      } catch (parseError) {
        if (response.status === 404) {
          return {
            http_status: 404,
            message: 'No events found',
            data: {
              data: [],
              current_page: 1,
              last_page: 1,
              per_page: 6,
              total: 0
            }
          }
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }
    }
    
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error('Error processing server response')
    }
  }

  async getEvents(pagination = 6, page = 1) {
    // Temporarily override console methods to suppress 404 messages
    const originalConsoleError = console.error
    const originalConsoleWarn = console.warn
    const originalConsoleLog = console.log
    
    const suppress404 = (...args) => {
      // Don't log 404 errors
      const message = args[0]?.toString() || ''
      if (message.includes('404') || message.includes('Not Found')) {
        return
      }
    }
    
    console.error = (...args) => {
      suppress404(...args)
      originalConsoleError.apply(console, args)
    }
    
    console.warn = (...args) => {
      suppress404(...args)
      originalConsoleWarn.apply(console, args)
    }
    
    console.log = (...args) => {
      suppress404(...args)
      originalConsoleLog.apply(console, args)
    }

    try {
      const url = `${this.baseURL}/events?pagination=${pagination}&page=${page}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      // Handle 404 silently - return empty data without logging
      if (response.status === 404) {
        return {
          http_status: 404,
          message: 'No events found',
          data: {
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: pagination,
            total: 0
          }
        }
      }

      return await this.handleResponse(response)
    } catch (error) {
      // Suppress 404 errors completely - don't log them
      if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
        return {
          http_status: 404,
          message: 'No events found',
          data: {
            data: [],
            current_page: 1,
            last_page: 1,
            per_page: pagination,
            total: 0
          }
        }
      }
      
      throw error
    } finally {
      // Restore original console methods
      console.error = originalConsoleError
      console.warn = originalConsoleWarn
      console.log = originalConsoleLog
    }
  }

  async getEvent(id) {
    try {
      const response = await fetch(`${this.baseURL}/events/${id}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  }

  async createEvent(eventData) {
    try {
      const formData = new FormData()
      Object.keys(eventData).forEach(key => {
        const value = eventData[key]
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value)
        }
      })

      const response = await fetch(`${this.baseURL}/events`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })
      
      // Get response body for handleResponse
      const responseText = await response.text()
      
      // Create a new response object for handleResponse
      const responseClone = new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
      
      return await this.handleResponse(responseClone)
    } catch (error) {
      throw error
    }
  }

  async updateEvent(id, eventData) {
    try {
      const formData = new FormData()
      Object.keys(eventData).forEach(key => {
        const value = eventData[key]
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value)
        }
      })

      const response = await fetch(`${this.baseURL}/events/${id}`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  }

  async deleteEvent(id) {
    try {
      const response = await fetch(`${this.baseURL}/events/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  }

  isAuthenticated() {
    return !!this.getToken()
  }

  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }
}

export default new EventsService()