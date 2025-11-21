class SpecializationsService {
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
          throw new Error('Sesión expirada. Por favor inicia sesión nuevamente.')
        } else if (data.http_status === 403) {
          throw new Error('Acceso denegado. Se requiere rol de administrador.')
        } else if (data.http_status === 400) {
          const errorMessage = data.message || 'Error de validación'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 422) {
          const errorMessage = data.message || 'Errores de validación'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 500) {
          const errorMessage = data.message || data.error || 'Error interno del servidor'
          throw new Error(`${errorMessage} (Error 500)`)
        } else {
          const errorMessage = data.message || data.error || `Error del servidor: ${response.status}`
          throw new Error(errorMessage)
        }
      } catch (parseError) {
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }
    }
    
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error('Error al procesar la respuesta del servidor')
    }
  }

  async getSpecializations(pagination = 6, page = 1) {
    try {
      const url = `${this.baseURL}/specializations?pagination=${pagination}&page=${page}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      
      if (result.status === 'error' && result.message === 'No data found') {
        return {
          data: [],
          current_page: 1,
          per_page: pagination,
          total: 0
        }
      }

      return result.data || {
        data: [],
        current_page: 1,
        per_page: pagination,
        total: 0
      }
    } catch (error) {
      console.error('Error fetching specializations:', error)
      throw error
    }
  }

  async getSpecializationById(id) {
    try {
      const url = `${this.baseURL}/specializations/${id}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      
      if (result.status === 'error' && result.message === 'No data found') {
        return null
      }

      return result.data || null
    } catch (error) {
      console.error('Error fetching specialization:', error)
      throw error
    }
  }

  async createSpecialization(name, status = 1) {
    try {
      const url = `${this.baseURL}/specializations`
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ name, status })
      })

      const result = await this.handleResponse(response)
      return result.data
    } catch (error) {
      console.error('Error creating specialization:', error)
      throw error
    }
  }

  async updateSpecialization(id, name, status) {
    try {
      const url = `${this.baseURL}/specializations/${id}`
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({ name, status })
      })

      const result = await this.handleResponse(response)
      return result.data
    } catch (error) {
      console.error('Error updating specialization:', error)
      throw error
    }
  }

  async deleteSpecialization(id) {
    try {
      const url = `${this.baseURL}/specializations/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      await this.handleResponse(response)
      return true
    } catch (error) {
      console.error('Error deleting specialization:', error)
      throw error
    }
  }
}

export default new SpecializationsService()

