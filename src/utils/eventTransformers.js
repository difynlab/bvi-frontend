const FIELD_MAPPINGS = {
  frontendToBackend: {
    id: 'id',
    title: 'title',
    eventType: 'category',
    date: 'date',
    startTime: 'start_time',
    endTime: 'end_time',
    repeat: 'repeat',
    description: 'content',
    location: 'location',
    register_link: 'register_link',
    status: 'status'
  },
  backendToFrontend: {
    id: 'id',
    title: 'title',
    category: 'eventType',
    date: 'date',
    start_time: 'startTime',
    end_time: 'endTime',
    repeat: 'repeat',
    content: 'description',
    short_description: 'shortDescription',
    location: 'location',
    register_link: 'register_link',
    status: 'status',
    thumbnail: 'imageFileName',
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
}

const VALUE_MAPPINGS = {
  eventType: {
    frontendToBackend: {
      'Workshop': 'workshop',
      'Webinar': 'webinar',
      'Conference': 'conference'
    },
    backendToFrontend: {
      'workshop': 'Workshop',
      'webinar': 'Webinar',
      'conference': 'Conference'
    }
  },
  repeat: {
    frontendToBackend: {
      'na': 'na',
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'annually': 'annually',
      'custom': 'custom'
    },
    backendToFrontend: {
      'na': 'na',
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'annually': 'annually',
      'custom': 'custom'
    }
  }
}

const transformObject = (source, mappings, valueMappings = {}) => {
  const result = {}
  
  Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
    if (source[sourceKey] !== undefined && source[sourceKey] !== null) {
      let value = source[sourceKey]
      
      if (valueMappings[sourceKey]) {
        value = valueMappings[sourceKey][value] || value
      }
      
      result[targetKey] = value
    }
  })
  
  return result
}

// TODO PRODUCTION: CHANGE IMAGES - Uncomment this function and use server URLs
const buildImageUrl = (thumbnail) => {
  if (!thumbnail) return ''
  
  // Si ya es una URL completa, devolverla tal como está
  if (thumbnail.startsWith('http://') || thumbnail.startsWith('https://')) {
    return thumbnail
  }
  
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiBaseURL = baseURL.replace('/api', '')
  return `${apiBaseURL}/storage/events/${thumbnail}`
}

const cleanImageUrl = (url) => {
  if (!url) return ''
  
  // Si la URL contiene duplicación del prefijo, limpiarla
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiBaseURL = baseURL.replace('/api', '')
  const storagePath = `${apiBaseURL}/storage/events/`
  
  // Si la URL contiene el prefijo duplicado, extraer solo la parte final
  if (url.includes(`${storagePath}${storagePath}`)) {
    const cleanUrl = url.replace(`${storagePath}${storagePath}`, storagePath)
    console.log('cleanImageUrl: cleaned duplicated URL:', cleanUrl)
    return cleanUrl
  }
  
  return url
}

// TODO PRODUCTION: CHANGE IMAGES - Uncomment this function and use server URLs
const buildBlurredImageUrl = (blurredThumbnail) => {
  if (!blurredThumbnail) return ''
  
  // Si ya es una URL completa, devolverla tal como está
  if (blurredThumbnail.startsWith('http://') || blurredThumbnail.startsWith('https://')) {
    return blurredThumbnail
  }
  
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiBaseURL = baseURL.replace('/api', '')
  return `${apiBaseURL}/storage/events/${blurredThumbnail}`
}

const extractShortDescription = (content) => {
  if (!content) return ''
  const plainText = content.replace(/<[^>]+>/g, '').trim()
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

/**
 * Extrae solo el primer párrafo del HTML, ignorando headings
 * @param {string} html - HTML content
 * @returns {string} - Texto plano del primer párrafo
 */
const extractFirstParagraph = (html) => {
  if (!html || typeof html !== 'string') return ''
  
  try {
    // Crear un parser DOM seguro
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Buscar el primer elemento <p>
    const firstParagraph = doc.querySelector('p')
    
    if (firstParagraph) {
      // Extraer solo el texto, sin HTML
      return firstParagraph.textContent?.trim() || ''
    }
    
    // Si no hay párrafos, devolver texto plano de todo el contenido
    const plainText = html.replace(/<[^>]+>/g, '').trim()
    return plainText
  } catch (error) {
    console.warn('Error parsing HTML for first paragraph:', error)
    // Fallback: extraer texto plano
    return html.replace(/<[^>]+>/g, '').trim()
  }
}

// ===== LOCALSTORAGE IMAGE MANAGEMENT =====
// TODO PRODUCTION: CHANGE IMAGES - Remove localStorage strategy and use server URLs

const EVENTS_IMAGES_KEY = 'eventsImages'

const getEventsImagesFromStorage = () => {
  try {
    const stored = localStorage.getItem(EVENTS_IMAGES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('❌ Error getting events images from localStorage:', error)
    return {}
  }
}

const saveEventsImagesToStorage = (eventsImages) => {
  try {
    localStorage.setItem(EVENTS_IMAGES_KEY, JSON.stringify(eventsImages))
    return true
  } catch (error) {
    console.error('❌ Error saving events images to localStorage:', error)
    return false
  }
}

const saveImageToLocalStorage = (eventId, imageFile, imageType = 'original') => {
  return new Promise((resolve, reject) => {
    if (!imageFile || !eventId) {
      reject(new Error('Missing imageFile or eventId'))
      return
    }
    
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        const eventsImages = getEventsImagesFromStorage()
        
        // Inicializar objeto del evento si no existe
        if (!eventsImages[eventId]) {
          eventsImages[eventId] = {}
        }
        
        // Guardar la imagen
        eventsImages[eventId][imageType] = dataUrl
        
        // Guardar en localStorage
        saveEventsImagesToStorage(eventsImages)
        resolve(true)
      }
      reader.onerror = (error) => {
        console.error(`❌ Error saving ${imageType} image to localStorage:`, error)
        reject(error)
      }
      reader.readAsDataURL(imageFile)
    } catch (error) {
      console.error(`❌ Error saving ${imageType} image to localStorage:`, error)
      reject(error)
    }
  })
}

export const getImageFromLocalStorage = (eventId, imageType = 'original') => {
  if (!eventId) return null
  
  try {
    const eventsImages = getEventsImagesFromStorage()
    const eventImages = eventsImages[eventId]
    
    if (!eventImages) return null
    
    return eventImages[imageType] || null
  } catch (error) {
    console.error(`❌ Error getting ${imageType} image from localStorage:`, error)
    return null
  }
}

export const removeImageFromLocalStorage = (eventId, imageType = 'original') => {
  if (!eventId) return false
  
  try {
    const eventsImages = getEventsImagesFromStorage()
    const eventImages = eventsImages[eventId]
    
    if (!eventImages) return true // Ya no existe
    
    if (imageType === 'all') {
      // Eliminar todo el evento
      delete eventsImages[eventId]
    } else {
      // Eliminar solo el tipo específico
      delete eventImages[imageType]
      
      // Si no quedan imágenes para este evento, eliminar el evento completo
      if (Object.keys(eventImages).length === 0) {
        delete eventsImages[eventId]
      }
    }
    
    saveEventsImagesToStorage(eventsImages)
    return true
  } catch (error) {
    console.error(`❌ Error removing ${imageType} image from localStorage:`, error)
    return false
  }
}

export const transformToBackend = (frontendEvent, isUpdate = false, existingThumbnail = null) => {
  const baseData = transformObject(
    frontendEvent,
    FIELD_MAPPINGS.frontendToBackend,
    VALUE_MAPPINGS
  )

  // Remove short_description as it doesn't exist in backend
  delete baseData.short_description

  // Handle thumbnail
  if (isUpdate) {
    if (frontendEvent.file) {
      baseData.thumbnail = frontendEvent.file
    }
  } else {
    baseData.thumbnail = frontendEvent.file
  }

  // Convert status to string as expected by backend
  if (baseData.status !== undefined) {
    baseData.status = baseData.status.toString()
  }

  // Create JSON object with HTML and text content before removing editorHtml
  if (frontendEvent.editorHtml) {
    const descriptionObject = {
      descriptionHtml: frontendEvent.editorHtml,
      descriptionText: extractFirstParagraph(frontendEvent.editorHtml)
    }
    baseData.content = JSON.stringify(descriptionObject)
  }

  // Remove fields that might cause issues
  delete baseData.timeZone
  delete baseData.editorHtml
  delete baseData.imageFileName
  delete baseData.imagePreviewUrl
  delete baseData.recurrence

  // For new events (create mode), don't send ID - let backend generate it
  if (!isUpdate) {
    delete baseData.id
  }

  return baseData
}

// TODO PRODUCTION: CHANGE IMAGES - Remove localStorage strategy and use server URLs
export const saveEventImageToLocalStorage = async (eventId, imageFile) => {
  if (!eventId || !imageFile) return false
  
  try {
    // Save original image
    await saveImageToLocalStorage(eventId, imageFile, 'original')
    
    // For now, we'll use the same image for blurred (in production, backend should generate blurred version)
    await saveImageToLocalStorage(eventId, imageFile, 'blurred')
    
    return true
  } catch (error) {
    console.error('❌ Error saving event image to localStorage:', error)
    return false
  }
}

// TODO PRODUCTION: CHANGE IMAGES - Remove localStorage strategy and use server URLs
export const removeEventImageFromLocalStorage = (eventId) => {
  if (!eventId) return false
  
  // Usar 'all' para eliminar todas las imágenes del evento
  return removeImageFromLocalStorage(eventId, 'all')
}

// Función de utilidad para limpiar todo el localStorage de eventos
export const clearAllEventsImagesFromLocalStorage = () => {
  try {
    localStorage.removeItem(EVENTS_IMAGES_KEY)
    return true
  } catch (error) {
    console.error('❌ Error clearing all events images from localStorage:', error)
    return false
  }
}

// Función de utilidad para obtener información del localStorage
export const getEventsImagesInfo = () => {
  try {
    const eventsImages = getEventsImagesFromStorage()
    const eventIds = Object.keys(eventsImages)
    const totalImages = eventIds.reduce((total, eventId) => {
      return total + Object.keys(eventsImages[eventId]).length
    }, 0)
    
    return {
      totalEvents: eventIds.length,
      totalImages: totalImages,
      eventIds: eventIds
    }
  } catch (error) {
    console.error('❌ Error getting events images info:', error)
    return { totalEvents: 0, totalImages: 0, eventIds: [] }
  }
}

export const transformFromBackend = (backendEvent) => {
  const frontendEvent = transformObject(
    backendEvent,
    FIELD_MAPPINGS.backendToFrontend,
    VALUE_MAPPINGS
  )

  // TODO PRODUCTION: CHANGE IMAGES - Use server URLs instead of localStorage
  // Handle new image structure with blurred and original thumbnails
  // PRIORITY: localStorage first, then server URLs
  const eventId = backendEvent.id
  
  // Try to get images from localStorage first (PRIORITY)
  const localStorageOriginal = getImageFromLocalStorage(eventId, 'original')
  const localStorageBlurred = getImageFromLocalStorage(eventId, 'blurred')
  
  // Always prioritize localStorage over server URLs
  if (localStorageOriginal) {
    frontendEvent.original_thumbnail = localStorageOriginal
    frontendEvent.imagePreviewUrl = localStorageOriginal
  } else {
    // Fallback to server URLs only if localStorage doesn't have the image
    frontendEvent.original_thumbnail = cleanImageUrl(buildImageUrl(backendEvent.original_thumbnail || backendEvent.thumbnail))
    frontendEvent.imagePreviewUrl = cleanImageUrl(buildImageUrl(backendEvent.thumbnail))
  }
  
  if (localStorageBlurred) {
    frontendEvent.blurred_thumbnail = localStorageBlurred
  } else {
    // Fallback to server URLs
    frontendEvent.blurred_thumbnail = cleanImageUrl(buildBlurredImageUrl(backendEvent.blurred_thumbnail))
  }
  
  // Parse JSON content if it exists, otherwise use legacy fields
  if (backendEvent.content) {
    try {
      const parsedContent = JSON.parse(backendEvent.content)
      if (parsedContent.descriptionHtml && parsedContent.descriptionText) {
        frontendEvent.editorHtml = parsedContent.descriptionHtml
        frontendEvent.description = parsedContent.descriptionText
      } else {
        // Fallback to plain content
        frontendEvent.description = backendEvent.content
        frontendEvent.editorHtml = ''
      }
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      frontendEvent.description = backendEvent.content
      frontendEvent.editorHtml = ''
    }
  } else {
    // Legacy fallback
    frontendEvent.editorHtml = backendEvent.editorHtml || ''
    frontendEvent.description = backendEvent.content || ''
  }
  
  frontendEvent.timeZone = backendEvent.timeZone || 'UTC'
  frontendEvent.recurrence = backendEvent.recurrence || null

  return frontendEvent
}