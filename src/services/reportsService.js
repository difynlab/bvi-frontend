class ReportsService {
  constructor() {
    // TODO PRODUCTION: CHANGE URL - Use full URL in production
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
            message: 'No reports found',
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
            message: 'No reports found',
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

  async getReports(pagination = 100, page = 1) {
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('404')) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    try {
      const url = `${this.baseURL}/reports?pagination=${pagination}&page=${page}`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      if (response.status === 404) {
        return {
          http_status: 404,
          message: 'No reports found',
          data: []
        }
      }

      return await this.handleResponse(response)
    } catch (error) {
      if (error.message && (error.message.includes('404') || error.message.includes('Not Found'))) {
        return {
          http_status: 404,
          message: 'No reports found',
          data: []
        }
      }
      
      throw error
    } finally {
      console.error = originalConsoleError
    }
  }

  async getReport(id) {
    try {
      const response = await fetch(`${this.baseURL}/reports/${id}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  }

  async createReport(reportData) {
    try {
      
      const formData = new FormData()
      
      // Agregar todos los campos del report al FormData
      Object.keys(reportData).forEach(key => {
        const value = reportData[key]
        
        if (value !== null && value !== undefined && value !== '') {
          // Convertir report_category_id y status a string si son números
          const finalValue = (key === 'report_category_id' || key === 'status') ? String(value) : value
          formData.append(key, finalValue)
        } else {
        }
      })


      const response = await fetch(`${this.baseURL}/reports`, {
        method: 'POST',
        headers: this.getHeaders(false), 
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  }

  async updateReport(id, reportData) {
    try {
      const formData = new FormData()
      
      // Agregar todos los campos del report al FormData
      Object.keys(reportData).forEach(key => {
        const value = reportData[key]
        
        if (value !== null && value !== undefined && value !== '') {
          // Convertir report_category_id y status a string si son números
          const finalValue = (key === 'report_category_id' || key === 'status') ? String(value) : value
          formData.append(key, finalValue)
        }
      })

      const response = await fetch(`${this.baseURL}/reports/${id}`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      throw error
    }
  }

  async deleteReport(id) {
    try {
      const response = await fetch(`${this.baseURL}/reports/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response);
      return result;
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

export default new ReportsService()
