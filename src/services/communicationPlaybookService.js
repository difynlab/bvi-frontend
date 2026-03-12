class CommunicationPlaybookService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'
  }

  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  getHeaders() {
    const token = this.getToken()
    const headers = {
      Accept: 'application/json'
    }
    if (token) {
      headers.Authorization = `Bearer ${token}`
    }
    return headers
  }

  async handleResponse(response) {
    if (!response.ok) {
      try {
        const data = await response.json()

        const code = data.http_status || response.status

        if (code === 401) {
          localStorage.removeItem(this.tokenKey)
          localStorage.removeItem('user')
          throw new Error('Session expired. Please log in again.')
        }

        if (code === 400 || code === 422) {
          const errorMessage = data.message || 'Validation errors'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        }

        if (code === 404) {
          return {
            http_status: 404,
            message: data.message || 'No data found',
            data: null
          }
        }

        if (code === 500) {
          const errorMessage = data.message || data.error || 'Server error. Please try again later.'
          throw new Error(errorMessage)
        }

        const errorMessage = data.message || data.error || `Server error: ${response.status}`
        throw new Error(errorMessage)
      } catch (_) {
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

  async getPlaybook() {
    const url = `${this.baseURL}/communication-playbook`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders()
    })
    return await this.handleResponse(response)
  }

  async updatePlaybook(file) {
    const formData = new FormData()
    if (file) {
      formData.append('file', file)
    }

    const url = `${this.baseURL}/communication-playbook`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(),
      body: formData
    })
    return await this.handleResponse(response)
  }
}

export default new CommunicationPlaybookService()

