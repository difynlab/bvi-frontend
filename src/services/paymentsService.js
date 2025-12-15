class PaymentsService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'
  }

  getToken() {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey)
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
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    if (entries.length === 0) return ''
    const qs = new URLSearchParams()
    for (const [k, v] of entries) {
      qs.append(k, String(v))
    }
    return `?${qs.toString()}`
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
            data: []
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
            data: []
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

  async getUserPayments(userId = null) {
    try {
      let url = `${this.baseURL}/payments`
      
      if (userId) {
        url = `${this.baseURL}/payments${this.buildQuery({ user_id: userId })}`
      } else {
        url = `${this.baseURL}/payments`
      }

      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching user payments:', error)
      throw error
    }
  }

  async getPayment(id) {
    try {
      const response = await fetch(`${this.baseURL}/payments/${id}`, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching payment:', error)
      throw error
    }
  }

  async updatePayment(id, data) {
    try {
      const url = `${this.baseURL}/payments/${id}`
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(data)
      })
      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating payment:', error)
      throw error
    }
  }
}

export default new PaymentsService()

