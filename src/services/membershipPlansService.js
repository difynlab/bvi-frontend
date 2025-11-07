class MembershipPlansService {
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
    const queryParams = new URLSearchParams()

    Object.keys(params).forEach((key) => {
      const value = params[key]
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value)
      }
    })

    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
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
        } else if (data.http_status === 400 || data.http_status === 422) {
          const errorMessage = data.message || 'Error de validación'
          const validationErrors = data.errors ? Object.values(data.errors).flat().join(', ') : ''
          throw new Error(`${errorMessage}${validationErrors ? ': ' + validationErrors : ''}`)
        } else if (data.http_status === 404) {
          return {
            http_status: 404,
            message: data.message || 'No data found',
            data: null
          }
        } else if (data.http_status === 500) {
          const errorMessage = data.message || 'Error del servidor'
          throw new Error(`${errorMessage} (Error 500)`)
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
        throw new Error(`Error del servidor: ${response.status} ${response.statusText}`)
      }
    }

    try {
      return await response.json()
    } catch (_parseError) {
      throw new Error('Error al procesar la respuesta del servidor')
    }
  }

  /**
   * Obtener todos los planes de membresía
   * GET /membership-plans
   *
   * @param {Object} params - Parámetros opcionales de paginación
   * @param {number} [params.pagination=6] - Items por página
   * @param {number} [params.page=1] - Número de página
   *
   * @returns {Promise<Object>} Objeto con datos paginados
   */
  async getMembershipPlans(params = {}) {
    const queryParams = {
      pagination: params.pagination ?? 6,
      page: params.page ?? 1
    }

    const query = this.buildQuery(queryParams)

    try {
      const response = await fetch(`${this.baseURL}/membership-plans${query}`, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      if (!error.message.includes('No data found')) {
        console.error('Error fetching membership plans:', error)
      }
      throw error
    }
  }

  /**
   * Obtener un plan de membresía por ID
   * GET /membership-plans/{id}
   *
   * @param {number|string} id - ID del plan
   *
   * @returns {Promise<Object>} Objeto con los datos del plan
   */
  async getMembershipPlan(id) {
    try {
      const response = await fetch(`${this.baseURL}/membership-plans/${id}`, {
        method: 'GET',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error fetching membership plan:', error)
      throw error
    }
  }

  /**
   * Crear un nuevo plan de membresía
   * POST /membership-plans
   *
   * @param {Object} planData - Datos del plan
   * @param {string} planData.title
   * @param {string} planData.description
   * @param {string} planData.eligibility_criteria
   * @param {string[]} planData.perks
   * @param {number} planData.status
   *
   * @returns {Promise<Object>} Objeto con los datos del plan creado
   */
  async createMembershipPlan(planData) {
    try {
      const response = await fetch(`${this.baseURL}/membership-plans`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(planData)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error creating membership plan:', error)
      throw error
    }
  }

  /**
   * Actualizar un plan de membresía existente
   * POST /membership-plans/{id}
   *
   * @param {number|string} id - ID del plan a actualizar
   * @param {Object} planData - Datos del plan a actualizar
   * @param {string} planData.title
   * @param {string} planData.description
   * @param {string} planData.eligibility_criteria
   * @param {string[]} planData.perks
   * @param {number} planData.status
   *
   * @returns {Promise<Object>} Objeto con los datos del plan actualizado
   */
  async updateMembershipPlan(id, planData) {
    try {
      const response = await fetch(`${this.baseURL}/membership-plans/${id}`, {
        method: 'POST',
        headers: this.getHeaders(true),
        body: JSON.stringify(planData)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error updating membership plan:', error)
      throw error
    }
  }

  /**
   * Eliminar un plan de membresía
   * DELETE /membership-plans/{id}
   *
   * @param {number|string} id - ID del plan a eliminar
   *
   * @returns {Promise<Object>} Objeto con mensaje de éxito
   */
  async deleteMembershipPlan(id) {
    try {
      const response = await fetch(`${this.baseURL}/membership-plans/${id}`, {
        method: 'DELETE',
        headers: this.getHeaders(false)
      })

      return await this.handleResponse(response)
    } catch (error) {
      console.error('Error deleting membership plan:', error)
      throw error
    }
  }
}

export default new MembershipPlansService()

