class NoticesService {
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
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.')
        } else if (data.http_status === 403) {
          throw new Error('Acceso denegado. Se requiere rol de administrador.')
        } else if (data.http_status === 400) {
          const errorMessage = data.message || 'Error de validación'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          console.log('400 Bad Request details:', data)
          console.log('Validation errors:', data.errors)
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 422) {
          const errorMessage = data.message || 'Errores de validación'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 500) {
          const errorMessage = data.message || data.error || 'Error interno del servidor'
          console.error('500 Server Error details:', data)
          console.error('Full error response:', JSON.stringify(data, null, 2))
          throw new Error(`${errorMessage} (Error 500)`)
        } else {
          const errorMessage = data.message || data.error || `Error del servidor: ${response.status}`
          throw new Error(errorMessage)
        }
      } catch (parseError) {
        if (response.status === 404) {
          throw new Error('No data found')
        }
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }
    }
    
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error('Error al procesar la respuesta del servidor')
    }
  }

  async getNotices(pagination = 6, page = 1) {
    try {
      const url = `${this.baseURL}/notices?pagination=${pagination}&page=${page}`
      console.log('=== FETCHING NOTICES ===')
      console.log('URL:', url)
      console.log('Headers:', this.getHeaders(true))
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      if (!error.message.includes('No data found')) {
        console.error('Error fetching notices:', error)
      }
      throw error
    }
  }

  async getNotice(id) {
    try {
      const response = await fetch(`${this.baseURL}/notices/${id}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching notice:', error)
      throw error
    }
  }

  async createNotice(noticeData) {
    try {
      console.log('=== CREATE NOTICE DEBUG ===')
      console.log('Raw noticeData received:', noticeData)
      console.log('NoticeData type:', typeof noticeData)
      console.log('NoticeData keys:', Object.keys(noticeData))
      
      const formData = new FormData()
      
      // Agregar todos los campos del notice al FormData
      Object.keys(noticeData).forEach(key => {
        const value = noticeData[key]
        console.log(`Processing field: ${key}, type: ${typeof value}, value:`, value)
        
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value)
          console.log(`✅ Added to FormData: ${key} =`, value)
        } else {
          console.log(`❌ Skipped empty field: ${key} =`, value)
        }
      })

      console.log('FormData contents:')
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`${key}: File(${value.name}, ${value.size} bytes, ${value.type})`)
        } else {
          console.log(`${key}:`, value)
        }
      }

      console.log('Headers being sent:', this.getHeaders(false))
      console.log('Token being used:', this.getToken() ? 'Present' : 'Missing')
      console.log('Base URL:', this.baseURL)

      const response = await fetch(`${this.baseURL}/notices`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })

      console.log('Response status:', response.status)
      console.log('Response ok:', response.ok)
      console.log('Response headers:', Object.fromEntries(response.headers.entries()))
      
      // Log response body for debugging
      const responseText = await response.text()
      console.log('Response body:', responseText)
      
      // Create a new response object for handleResponse
      const responseClone = new Response(responseText, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      })
      
      return await this.handleResponse(responseClone)
    } catch (error) {
      console.error('Error creating notice:', error)
      throw error
    }
  }

  async updateNotice(id, noticeData) {
    try {
      const formData = new FormData()
      
      // Agregar todos los campos del notice al FormData
      Object.keys(noticeData).forEach(key => {
        if (noticeData[key] !== null && noticeData[key] !== undefined && noticeData[key] !== '') {
          formData.append(key, noticeData[key])
        }
      })

      const response = await fetch(`${this.baseURL}/notices/${id}`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating notice:', error)
      throw error
    }
  }

  async deleteNotice(id) {
    try {
      const response = await fetch(`${this.baseURL}/notices/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error deleting notice:', error)
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

export default new NoticesService()
