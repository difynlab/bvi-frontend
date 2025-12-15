class NewslettersService {
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
          console.error('500 Server Error details:', data)
          console.error('Full error response:', JSON.stringify(data, null, 2))
          throw new Error(`${errorMessage} (Error 500)`)
        } else if (data.http_status === 404) {
          return {
            http_status: 404,
            message: 'No newsletters found',
            data: []
          }
        } else {
          const errorMessage = data.message || data.error || `Server error: ${response.status}`
          throw new Error(errorMessage)
        }
      } catch (parseError) {
        if (response.status === 404) {
          return {
            http_status: 404,
            message: 'No newsletters found',
            data: []
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

  async getNewsletters(pagination = 6, page = 1) {
    try {
      const url = `${this.baseURL}/newsletters?pagination=${pagination}&page=${page}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      if (!error.message.includes('No data found')) {
        console.error('Error fetching newsletters:', error)
      }
      throw error
    }
  }

  async getNewsletter(id) {
    try {
      const response = await fetch(`${this.baseURL}/newsletters/${id}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching newsletter:', error)
      throw error
    }
  }

  async createNewsletter(newsletterData) {
    try {
      const formData = new FormData()
      
      // Agregar todos los campos del newsletter al FormData
      Object.keys(newsletterData).forEach(key => {
        const value = newsletterData[key]
        
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value)
        }
      })

      const response = await fetch(`${this.baseURL}/newsletters`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })
      
      // Create a new response object for handleResponse
      const responseText = await response.text()
      const responseClone = new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
      
      return await this.handleResponse(responseClone)
    } catch (error) {
      console.error('Error creating newsletter:', error)
      throw error
    }
  }

  async updateNewsletter(id, newsletterData) {
    try {
      const formData = new FormData()
      
      // Agregar todos los campos del newsletter al FormData
      Object.keys(newsletterData).forEach(key => {
        if (newsletterData[key] !== null && newsletterData[key] !== undefined && newsletterData[key] !== '') {
          formData.append(key, newsletterData[key])
        }
      })

      const response = await fetch(`${this.baseURL}/newsletters/${id}`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating newsletter:', error)
      throw error
    }
  }

  async deleteNewsletter(id) {
    try {
      const response = await fetch(`${this.baseURL}/newsletters/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error deleting newsletter:', error)
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

export default new NewslettersService()
