class NotificationsService {
  constructor() {
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
          throw new Error('Access denied.')
        } else if (data.http_status === 400 || data.http_status === 422) {
          const errorMessage = data.message || 'Validation errors'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 404) {
          return {
            http_status: 404,
            message: data.message || 'No data found',
            data: null
          }
        } else if (data.http_status === 500) {
          const errorMessage = data.message || data.error || 'Server error. Please try again later.'
          throw new Error(errorMessage)
        } else {
          const errorMessage = data.message || data.error || `Server error: ${response.status}`
          throw new Error(errorMessage)
        }
      } catch (_parseError) {
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

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return await response.json()
    }
    return await response.text()
  }

  async getNotifications() {
    const url = `${this.baseURL}/notifications`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }

  async markAsSeen() {
    const url = `${this.baseURL}/notifications/mark-seen`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }
}

export default new NotificationsService()
