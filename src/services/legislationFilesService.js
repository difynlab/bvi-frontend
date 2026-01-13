class LegislationFilesService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'
  }

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
          throw new Error('Access denied. Administrator role required.')
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

  async getAll(pagination = 6, page = 1) {
    const queryParams = this.buildQuery({ pagination, page })
    const url = `${this.baseURL}/legislations${queryParams}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }

  async getAllPages(pagination = 6) {
    const allFiles = []
    let currentPage = 1
    let hasMorePages = true

    while (hasMorePages) {
      const response = await this.getAll(pagination, currentPage)
      
      if (response?.data?.data && Array.isArray(response.data.data)) {
        allFiles.push(...response.data.data)
        
        const lastPage = response.data.last_page || 1
        hasMorePages = currentPage < lastPage
        currentPage++
      } else {
        hasMorePages = false
      }
    }

    return {
      http_status: 200,
      message: 'success',
      data: {
        data: allFiles,
        total: allFiles.length,
        current_page: 1,
        last_page: 1,
        per_page: allFiles.length
      }
    }
  }

  async getById(id) {
    const url = `${this.baseURL}/legislations/${id}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }

  async create(title, file, status) {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)
    formData.append('status', String(status))

    const url = `${this.baseURL}/legislations`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData
    })
    return await this.handleResponse(response)
  }

  async update(id, title, status, file = null) {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('status', String(status))
    
    if (file) {
      formData.append('file', file)
    }

    const url = `${this.baseURL}/legislations/${id}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData
    })
    return await this.handleResponse(response)
  }

  async delete(id) {
    const url = `${this.baseURL}/legislations/${id}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(false)
    })
    return await this.handleResponse(response)
  }
}

export default new LegislationFilesService()

