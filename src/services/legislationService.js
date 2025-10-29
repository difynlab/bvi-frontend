class LegislationService {
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
          throw new Error(`${errorMessage} (Error 500)`)
        } else if (data.http_status === 404) {
          throw new Error('Registro de legislación no encontrado. Debe crearse primero.')
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

  async getLegislation() {
    try {
      const url = `${this.baseURL}/legislation/`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching legislation index:', error)
      throw error
    }
  }

  async updateLegislation(legislationData) {
    try {
      const formData = new FormData()
      
      // ✅ ENVIAR: description (desde descriptionHTML)
      if (legislationData.description) {
        formData.append('description', legislationData.description)
      }
      
      // ✅ ENVIAR: link (desde linkUrl)
      if (legislationData.link) {
        formData.append('link', legislationData.link)
      }
      
      // ✅ ENVIAR: files[] (array de File objects)
      if (legislationData.files && Array.isArray(legislationData.files) && legislationData.files.length > 0) {
        legislationData.files.forEach((file) => {
          if (file instanceof File) {
            formData.append('files[]', file)
          }
        })
      } else if (legislationData.files && legislationData.files instanceof File) {
        // Si solo hay un archivo, no array
        formData.append('files[]', legislationData.files)
      }

      const response = await fetch(`${this.baseURL}/legislation/`, {
        method: 'POST',
        headers: this.getHeaders(false), // false = no incluir Content-Type para FormData
        body: formData
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating legislation:', error)
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

export default new LegislationService()

