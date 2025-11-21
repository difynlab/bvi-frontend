class MemberFirmsService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'
  }

  getToken() {
    return localStorage.getItem(this.tokenKey) || sessionStorage.getItem(this.tokenKey)
  }

  getHeaders(includeContentType = false, isFormData = false) {
    const token = this.getToken()
    const headers = {
      'Accept': 'application/json'
    }
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    
    if (includeContentType && !isFormData) {
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
          sessionStorage.removeItem(this.tokenKey)
          localStorage.removeItem('user')
          sessionStorage.removeItem('user')
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

  async getAll(pagination = 6, page = 1) {
    try {
      const url = `${this.baseURL}/member-firms?pagination=${pagination}&page=${page}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      
      if (result.status === 'error' && result.message === 'No data found') {
        return {
          status: 'success',
          message: 'success',
          data: {
            data: [],
            current_page: 1,
            per_page: pagination,
            total: 0
          }
        }
      }

      return {
        status: result.status || 'success',
        message: result.message || 'success',
        data: result.data || {
          data: [],
          current_page: 1,
          per_page: pagination,
          total: 0
        }
      }
    } catch (error) {
      console.error('Error fetching member firms:', error)
      throw error
    }
  }

  async getById(id) {
    try {
      const url = `${this.baseURL}/member-firms/${id}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      
      if (result.status === 'error' && result.message === 'No data found') {
        throw new Error('Member firm no encontrado')
      }

      return {
        status: result.status || 'success',
        message: result.message || 'success',
        data: result.data || null
      }
    } catch (error) {
      console.error('Error fetching member firm:', error)
      throw error
    }
  }

  async create(memberFirmData) {
    try {
      const url = `${this.baseURL}/member-firms`
      
      const formData = new FormData()
      formData.append('name', memberFirmData.name)
      formData.append('description', memberFirmData.description)
      formData.append('image', memberFirmData.image)
      formData.append('website_link', memberFirmData.website_link)
      formData.append('address', memberFirmData.address)
      formData.append('contact_number', memberFirmData.contact_number)
      formData.append('email', memberFirmData.email)
      formData.append('specialization_id', memberFirmData.specialization_id)
      formData.append('status', memberFirmData.status)

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(false, true),
        body: formData
      })

      const result = await this.handleResponse(response)
      
      return {
        status: result.status || 'success',
        message: result.message || 'Create successful',
        data: result.data || null
      }
    } catch (error) {
      console.error('Error creating member firm:', error)
      throw error
    }
  }

  async update(id, memberFirmData) {
    try {
      const url = `${this.baseURL}/member-firms/${id}`
      
      const formData = new FormData()
      formData.append('name', memberFirmData.name)
      formData.append('description', memberFirmData.description)
      if (memberFirmData.image) {
        formData.append('image', memberFirmData.image)
      }
      formData.append('website_link', memberFirmData.website_link)
      formData.append('address', memberFirmData.address)
      formData.append('contact_number', memberFirmData.contact_number)
      formData.append('email', memberFirmData.email)
      formData.append('specialization_id', memberFirmData.specialization_id)
      formData.append('status', memberFirmData.status)

      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(false, true),
        body: formData
      })

      const result = await this.handleResponse(response)
      
      return {
        status: result.status || 'success',
        message: result.message || 'Update successful',
        data: result.data || null
      }
    } catch (error) {
      console.error('Error updating member firm:', error)
      throw error
    }
  }

  async delete(id) {
    try {
      const url = `${this.baseURL}/member-firms/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      const result = await this.handleResponse(response)
      
      return {
        status: result.status || 'success',
        message: result.message || 'Delete successful',
        data: null
      }
    } catch (error) {
      console.error('Error deleting member firm:', error)
      throw error
    }
  }
}

export default new MemberFirmsService()

