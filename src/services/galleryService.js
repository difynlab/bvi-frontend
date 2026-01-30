class GalleryService {
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

  async list(pagination = 6, page = 1) {
    try {
      const queryParams = this.buildQuery({ pagination, page })
      const url = `${this.baseURL}/galleries${queryParams}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      if (response.status === 404) {
        return {
          http_status: 404,
          message: 'No data found',
          data: {
            data: []
          }
        }
      }

      return await this.handleResponse(response)
    } catch (error) {
      if (error.message && (error.message.includes('404') || error.message.includes('No data found'))) {
        return {
          http_status: 404,
          message: 'No data found',
          data: {
            data: []
          }
        }
      }
      console.error('Error fetching galleries:', error)
      throw error
    }
  }

  async getById(id) {
    try {
      const url = `${this.baseURL}/galleries/${id}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching gallery item:', error)
      throw error
    }
  }

  async create(type, fileOrUrl, status = 1, onUploadProgress = null) {
    try {
      const apiUrl = `${this.baseURL}/galleries`

      if (type === 'video' && typeof fileOrUrl === 'string') {
        const formData = new FormData()
        formData.append('type', 'video')
        formData.append('url', fileOrUrl)
        formData.append('status', String(status))
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: this.getHeaders(false),
          body: formData
        })
        return await this.handleResponse(response)
      }

      const formData = new FormData()
      formData.append('type', 'image')
      formData.append('image', fileOrUrl)
      formData.append('status', String(status))

      const xhr = new XMLHttpRequest()
      
      return new Promise((resolve, reject) => {
        if (onUploadProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentCompleted = Math.round((e.loaded * 100) / e.total)
              onUploadProgress(percentCompleted)
            }
          })
        }

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve({
                http_status: xhr.status,
                message: data.message || 'Create successful',
                data: data.data
              })
            } catch (parseError) {
              reject(new Error('Error parsing server response'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              const error = new Error(errorData.message || 'Error creating gallery item')
              error.http_status = errorData.http_status || xhr.status
              error.errors = errorData.errors || {}
              reject(error)
            } catch (parseError) {
              reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Request aborted'))
        })

        xhr.open('POST', apiUrl)
        const token = this.getToken()
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.setRequestHeader('Accept', 'application/json')
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Error creating gallery item:', error)
      throw error
    }
  }

  async update(id, type, fileOrUrl, status = 1, onUploadProgress = null) {
    try {
      const apiUrl = `${this.baseURL}/galleries/${id}`

      if (type === 'video' && typeof fileOrUrl === 'string') {
        const formData = new FormData()
        formData.append('type', 'video')
        formData.append('url', fileOrUrl)
        formData.append('status', String(status))
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: this.getHeaders(false),
          body: formData
        })
        return await this.handleResponse(response)
      }

      const formData = new FormData()
      formData.append('type', 'image')
      formData.append('image', fileOrUrl)
      formData.append('status', String(status))

      const xhr = new XMLHttpRequest()

      return new Promise((resolve, reject) => {
        if (onUploadProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const percentCompleted = Math.round((e.loaded * 100) / e.total)
              onUploadProgress(percentCompleted)
            }
          })
        }

        xhr.addEventListener('load', async () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText)
              resolve({
                http_status: xhr.status,
                message: data.message || 'Update successful',
                data: data.data
              })
            } catch (parseError) {
              reject(new Error('Error parsing server response'))
            }
          } else {
            try {
              const errorData = JSON.parse(xhr.responseText)
              const error = new Error(errorData.message || 'Error updating gallery item')
              error.http_status = errorData.http_status || xhr.status
              error.errors = errorData.errors || {}
              reject(error)
            } catch (parseError) {
              reject(new Error(`Server error: ${xhr.status} ${xhr.statusText}`))
            }
          }
        })

        xhr.addEventListener('error', () => {
          reject(new Error('Network error'))
        })

        xhr.addEventListener('abort', () => {
          reject(new Error('Request aborted'))
        })

        xhr.open('POST', apiUrl)
        const token = this.getToken()
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`)
        }
        xhr.setRequestHeader('Accept', 'application/json')
        xhr.send(formData)
      })
    } catch (error) {
      console.error('Error updating gallery item:', error)
      throw error
    }
  }

  async delete(id) {
    try {
      const url = `${this.baseURL}/galleries/${id}`
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error deleting gallery item:', error)
      throw error
    }
  }
}

export default new GalleryService()
