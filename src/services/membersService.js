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
            data: []
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
            data: []
          }
        }
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
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

  // POST /members/{id} (FormData or JSON)
  async updateMember(id, data) {
    const hasPayments = data && data.payments && Array.isArray(data.payments);
    const hasMemberFirms = data && data.member_firms && Array.isArray(data.member_firms);
    
    // Use JSON if we have payments or member_firms (arrays need JSON)
    if (hasPayments || hasMemberFirms) {
      const jsonData = { ...data };
      if (jsonData.payments) {
        jsonData.payments = JSON.stringify(jsonData.payments);
      }
      // member_firms should be sent as array of numbers
      if (jsonData.member_firms) {
        // Ensure it's an array of numbers
        jsonData.member_firms = jsonData.member_firms.map(id => Number(id));
      }
      
      const url = `${this.baseURL}/members/${id}`
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(true), // Include Content-Type: application/json
        body: JSON.stringify(jsonData)
      })
      return await this.handleResponse(response)
    } else {
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

  // POST /members/{id}/renew-membership
  async renewMember(id, data) {
    const url = `${this.baseURL}/members/${id}/renew-membership`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true), // Include Content-Type: application/json
      body: JSON.stringify(data)
    })
    return await this.handleResponse(response)
  }

  // POST /members/{member_id}/update-membership/{payment_id}
  async updatePaymentStatus(memberId, paymentId, status) {
    const url = `${this.baseURL}/members/${memberId}/update-membership/${paymentId}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true), // Include Content-Type: application/json
      body: JSON.stringify({ status })
    })
    return await this.handleResponse(response)
  }

  // POST /payments/{id}
  async updatePayment(id, data) {
    const url = `${this.baseURL}/payments/${id}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true), // Include Content-Type: application/json
      body: JSON.stringify(data)
    })
    return await this.handleResponse(response)
  }

  // POST /profile/renew-membership
  async renewOwnMembership(data) {
    const url = `${this.baseURL}/profile/renew-membership`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(true), // Include Content-Type: application/json
      body: JSON.stringify(data)
    })
    return await this.handleResponse(response)
  }
}

export default new MembersService()


