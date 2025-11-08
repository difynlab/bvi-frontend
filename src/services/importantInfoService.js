class ImportantInfoService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || '/api'
    this.tokenKey = 'token'

    this.keyMap = {
      eligibility: {
        title: 'first_title',
        subtitle: 'first_description',
        image: 'first_image',
        original: 'original_first_image',
        blurred: 'blurred_first_image',
        filename: 'first_image'
      },
      benefits: {
        title: 'second_title',
        subtitle: 'second_description',
        image: 'second_image',
        original: 'original_second_image',
        blurred: 'blurred_second_image',
        filename: 'second_image'
      },
      payment: {
        title: 'third_title',
        subtitle: 'third_description',
        image: 'third_image',
        original: 'original_third_image',
        blurred: 'blurred_third_image',
        filename: 'third_image'
      }
    }
  }

  // Auth helpers
  getToken() {
    return localStorage.getItem(this.tokenKey)
  }

  getHeaders(includeJson = false) {
    const token = this.getToken()
    const headers = {
      Accept: 'application/json'
    }

    if (token) {
      headers.Authorization = `Bearer ${token}`
    }

    if (includeJson) {
      headers['Content-Type'] = 'application/json'
    }

    return headers
  }

  // Unified response handler (mimics legislationService)
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
          return {
            http_status: 404,
            message: data.message || 'No data found',
            data: null
          }
        } else if (data.http_status === 500) {
          throw new Error(data.message || data.error || 'Error del servidor. Intenta nuevamente más tarde.')
        } else {
          throw new Error(data.message || data.error || `Error del servidor: ${response.status}`)
        }
      } catch (_error) {
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

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      return await response.json()
    }
    return await response.text()
  }

  normalizeBackendData(payload = {}) {
    const result = {}

    Object.entries(this.keyMap).forEach(([key, mapping]) => {
      const title = this.cleanValue(payload[mapping.title])
      const subtitle = this.cleanValue(payload[mapping.subtitle])
      const originalImage = this.cleanValue(payload[mapping.original])
      const blurredImage = this.cleanValue(payload[mapping.blurred])
      const rawFilename = this.cleanValue(payload[mapping.filename])

      result[key] = {
        title,
        subtitle,
        img: originalImage,
        blurredImg: blurredImage,
        rawFilename
      }
    })

    return result
  }

  normalizeFrontendPayload(payload = {}) {
    const result = {}

    Object.keys(this.keyMap).forEach((key) => {
      const entry = payload[key] || {}
      result[key] = {
        title: this.cleanValue(entry.title),
        subtitle: this.cleanValue(entry.subtitle),
        img: this.cleanValue(entry.image),
        blurredImg: undefined,
        rawFilename: undefined
      }
    })

    return result
  }

  cleanValue(value) {
    if (value === null || value === undefined || value === '') {
      return undefined
    }
    return value
  }

  dataURLToBlob(dataUrl) {
    if (typeof dataUrl !== 'string') return null
    const matches = dataUrl.match(/^data:(.+);base64,(.*)$/)
    if (!matches) return null
    const mimeType = matches[1]
    const base64Data = matches[2]
    const byteCharacters = atob(base64Data)
    const byteNumbers = new Array(byteCharacters.length)

    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i)
    }

    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
  }

  appendField(formData, field, value) {
    if (value !== undefined && value !== null) {
      formData.append(field, String(value))
    }
  }

  appendFile(formData, field, file) {
    if (!file) return

    if (file instanceof File || file instanceof Blob) {
      formData.append(field, file)
      return
    }

    if (typeof file === 'string') {
      const blob = this.dataURLToBlob(file)
      if (blob) {
        const extension = blob.type.split('/')[1] || 'png'
        formData.append(field, blob, `important-info-${field}.${extension}`)
      }
    }
  }

  buildFormData(data = {}) {
    const formData = new FormData()

    Object.entries(this.keyMap).forEach(([frontendKey, mapping]) => {
      const entry = data[frontendKey] || {}
      console.debug('[importantInfoService] buildFormData entry', frontendKey, entry)
      this.appendField(formData, mapping.title, entry.title ?? '')
      this.appendField(formData, mapping.subtitle, entry.subtitle ?? '')
      this.appendFile(formData, mapping.image, entry.file)
    })

    return formData
  }

  // GET /important-info
  async getImportantInfo() {
    const url = `${this.baseURL}/important-info`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(false)
    })
    const result = await this.handleResponse(response)

    if (result && result.http_status === 404) {
      return {
        http_status: 404,
        message: result.message || 'No data found',
        data: this.normalizeBackendData({})
      }
    }

    if (result && result.data) {
      return {
        ...result,
        data: this.normalizeBackendData(result.data)
      }
    }

    return {
      http_status: result?.http_status ?? 200,
      message: result?.message ?? 'success',
      data: this.normalizeBackendData(result?.data || {})
    }
  }

  // POST /important-info
  async updateImportantInfo(payload = {}) {
    console.debug('[importantInfoService] updateImportantInfo payload', payload)
    const formData = this.buildFormData(payload)
    const url = `${this.baseURL}/important-info`
    console.debug('[importantInfoService] POST url', url)
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(false),
      body: formData
    })
    console.debug('[importantInfoService] POST status', response.status)
    const result = await this.handleResponse(response)
    console.debug('[importantInfoService] POST result', result)

    if (result && result.data) {
      return {
        ...result,
        data: this.normalizeBackendData(result.data)
      }
    }

    if ((result?.http_status === 200 || result?.message === 'success') && response.ok) {
      // Backend sometimes omits data payload; fetch fresh copy.
      try {
        const refreshed = await this.getImportantInfo()
        console.debug('[importantInfoService] refresh after POST', refreshed)
        if (refreshed?.data) {
          return {
            http_status: refreshed?.http_status ?? 200,
            message: result?.message || refreshed?.message || 'success',
            data: refreshed.data
          }
        }
        return {
          http_status: refreshed?.http_status ?? result?.http_status ?? 200,
          message: result?.message || refreshed?.message || 'success',
          data: this.normalizeFrontendPayload(payload)
        }
      } catch (refreshError) {
        console.warn('importantInfoService.updateImportantInfo: failed to refresh data', refreshError)
        return {
          http_status: result?.http_status ?? 200,
          message: result?.message || 'success',
          data: this.normalizeFrontendPayload(payload)
        }
      }
    }

    return result
  }
}

export default new ImportantInfoService()

