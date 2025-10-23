class NoticeCategoriesService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
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
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 404) {
          throw new Error('No data found')
        } else {
          const errorMessage = data.message || data.error || `Error del servidor: ${response.status}`
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
        const textResponse = await response.text()
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }
    }
    
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error('Error al procesar la respuesta del servidor')
    }
  }

  async getNoticeCategories() {
    try {
      const url = `${this.baseURL}/notice-categories`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      if (!error.message.includes('No data found')) {
        console.error('Error fetching notice categories:', error)
      }
      throw error
    }
  }

  async getNoticeCategory(id) {
    try {
      const response = await fetch(`${this.baseURL}/notice-categories/${id}`, {
        method: 'GET',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching notice category:', error)
      throw error
    }
  }

  async createNoticeCategory(categoryData) {
    try {
      const response = await fetch(`${this.baseURL}/notice-categories`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(categoryData)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error creating notice category:', error)
      throw error
    }
  }

  async updateNoticeCategory(id, categoryData) {
    try {
      const response = await fetch(`${this.baseURL}/notice-categories/${id}`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(categoryData)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating notice category:', error)
      throw error
    }
  }

  async deleteNoticeCategory(id) {
    try {
      const response = await fetch(`${this.baseURL}/notice-categories/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error deleting notice category:', error)
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

export default new NoticeCategoriesService()
