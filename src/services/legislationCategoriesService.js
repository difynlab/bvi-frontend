class LegislationCategoriesService {
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
          throw new Error('Session expired. Please log in again.')
        } else if (data.http_status === 403) {
          throw new Error('Access denied. Administrator role required.')
        } else if (data.http_status === 400) {
          const errorMessage = data.message || 'Validation error'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 404) {
          throw new Error('No data found')
        } else {
          const errorMessage = data.message || data.error || `Server error: ${response.status}`
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
        throw new Error(`Server error: ${response.status} ${response.statusText}`)
      }
    }
    
    try {
      return await response.json()
    } catch (parseError) {
      throw new Error('Error processing server response')
    }
  }

  async getLegislationCategories(pagination = 100, page = 1) {
    try {
      const url = `${this.baseURL}/legislation-categories?pagination=${pagination}&page=${page}`
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(true)
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
      console.error('Error fetching legislation categories:', error)
      throw error
    }
  }

  async getLegislationCategory(id) {
    try {
      const response = await fetch(`${this.baseURL}/legislation-categories/${id}`, {
        method: 'GET',
        headers: this.getHeaders(true)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching legislation category:', error)
      throw error
    }
  }

  async createLegislationCategory(categoryData) {
    try {
      const response = await fetch(`${this.baseURL}/legislation-categories`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({
          title: categoryData.title || categoryData.name,
          status: categoryData.status || 1
        })
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error creating legislation category:', error)
      throw error
    }
  }

  async updateLegislationCategory(id, categoryData) {
    try {
      const response = await fetch(`${this.baseURL}/legislation-categories/${id}`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify({
          title: categoryData.title || categoryData.name,
          status: categoryData.status !== undefined ? categoryData.status : 1
        })
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating legislation category:', error)
      throw error
    }
  }

  async deleteLegislationCategory(id) {
    try {
      const response = await fetch(`${this.baseURL}/legislation-categories/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error deleting legislation category:', error)
      throw error
    }
  }
}

const legislationCategoriesService = new LegislationCategoriesService()
export default legislationCategoriesService
