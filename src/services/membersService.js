class MembersService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'
  }

  // Auth helpers
  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  isAuthenticated() {
    return !!this.getToken()
  }

  getCurrentUser() {
    const user = localStorage.getItem('user')
    return user ? JSON.parse(user) : null
  }

  // Headers helper
  getHeaders(includeContentType = false) {
    const token = this.getToken()
    const headers = {
      'Accept': 'application/json'
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    // Do NOT set Content-Type when sending FormData
    if (includeContentType) {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  // Query string builder: include only defined, non-null values
  buildQuery(params = {}) {
    const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    if (entries.length === 0) return ''
    const qs = new URLSearchParams()
    for (const [k, v] of entries) {
      qs.append(k, String(v))
    }
    return `?${qs.toString()}`
  }

  // Unified response handler per backend contract
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
        } else if (data.http_status === 400 || data.http_status === 422) {
          const errorMessage = data.message || 'Errores de validación'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 404) {
          // Pass-through 404 with message so caller can show empty state
          return {
            http_status: 404,
            message: data.message || 'No data found',
            data: []
          }
        } else if (data.http_status === 500) {
          const errorMessage = data.message || data.error || 'Error del servidor. Intenta nuevamente más tarde.'
          throw new Error(errorMessage)
        } else {
          const errorMessage = data.message || data.error || `Error del servidor: ${response.status}`
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
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }
    }

    // Success: try to parse JSON; fallback to text
    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return await response.json()
    }
    return await response.text()
  }

  // GET /members (paginated), excluding current user (handled by backend)
  async getMembers(params = {}) {
    const query = this.buildQuery({ pagination: params.pagination ?? 6, page: params.page ?? 1 })
    const url = `${this.baseURL}/members${query}`

    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }

  // GET /members/{id}
  async getMember(id) {
    const url = `${this.baseURL}/members/${id}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }

  // POST /members (FormData)
  async createMember(data) {
    const formData = new FormData()
    Object.keys(data || {}).forEach((key) => {
      const value = data[key]
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    const url = `${this.baseURL}/members`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(false), // no Content-Type for FormData
      body: formData
    })
    return await this.handleResponse(response)
  }

  // POST /members/{id} (FormData)
  async updateMember(id, data) {
    const formData = new FormData()
    Object.keys(data || {}).forEach((key) => {
      const value = data[key]
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value)
      }
    })

    const url = `${this.baseURL}/members/${id}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(false), // no Content-Type for FormData
      body: formData
    })
    return await this.handleResponse(response)
  }

  // DELETE /members/{id}
  async deleteMember(id) {
    const url = `${this.baseURL}/members/${id}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }
}

export default new MembersService()


