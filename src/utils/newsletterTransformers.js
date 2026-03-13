import { compressImage } from './imageCompression'

// TODO PRODUCTION: CHANGE IMAGES - Remove localStorage strategy and use server URLs
const NEWSLETTERS_IMAGES_KEY = 'bvi.newsletters.images'

// Función para obtener imágenes de newsletters desde localStorage
const getNewslettersImagesFromStorage = () => {
  try {
    const stored = localStorage.getItem(NEWSLETTERS_IMAGES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('❌ Error reading newsletters images from localStorage:', error)
    return {}
  }
}

// Función para guardar imágenes de newsletters en localStorage
const saveNewslettersImagesToStorage = (imagesData) => {
  try {
    localStorage.setItem(NEWSLETTERS_IMAGES_KEY, JSON.stringify(imagesData))
    return true
  } catch (error) {
    console.error('❌ Error saving newsletters images to localStorage:', error)
    
    if (error.name === 'QuotaExceededError') {
      try {
        localStorage.removeItem(NEWSLETTERS_IMAGES_KEY)
        localStorage.setItem(NEWSLETTERS_IMAGES_KEY, JSON.stringify(imagesData))
        return true
      } catch (retryError) {
        console.error('❌ Failed to save even after clearing:', retryError)
        // If still failing, save only the current image
        const currentNewsletterId = Object.keys(imagesData)[0]
        if (currentNewsletterId) {
          const currentNewsletter = { [currentNewsletterId]: imagesData[currentNewsletterId] }
          localStorage.setItem(NEWSLETTERS_IMAGES_KEY, JSON.stringify(currentNewsletter))
          return true
        }
        return false
      }
    }
    return false
  }
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
  return `${apiBaseURL}/storage/newsletters/${thumbnail}`
}

const cleanImageUrl = (url) => {
  if (!url) return ''
  
  // Si la URL contiene duplicación del prefijo, limpiarla
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiBaseURL = baseURL.replace('/api', '')
  const storagePath = `${apiBaseURL}/storage/newsletters/`
  
  // Si la URL contiene el prefijo duplicado, extraer solo la parte final
  if (url.includes(`${storagePath}${storagePath}`)) {
      const cleanUrl = url.replace(`${storagePath}${storagePath}`, storagePath)
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
  return `${apiBaseURL}/storage/newsletters/${blurredThumbnail}`
}

const FIELD_MAPPINGS = {
  frontendToBackend: {
    id: 'id',
    fileName: 'name',
    thumbnail: 'thumbnail',
    file: 'file',
    linkUrl: 'link',
    newsletterType: 'newsletter_category_id',
    newsletter_category_id: 'newsletter_category_id',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  backendToFrontend: {
    id: 'id',
    name: 'fileName',
    thumbnail: 'imageFileName',
    link: 'linkUrl',
    file: 'file',
    newsletter_category_id: 'newsletter_category_id',
    status: 'status',
    created_at: 'createdAt',
    updated_at: 'updatedAt',
    publish_date: 'publishDate'
  }
}

// Mapeo de valores específicos
const VALUE_MAPPINGS = {
  frontendToBackend: {
    status: (value) => value === 1 ? 1 : 0
  },
  backendToFrontend: {
    status: (value) => value === 1 ? 1 : 0
  }
}

// Función para transformar objeto usando mapeos
const transformObject = (obj, fieldMapping, valueMapping) => {
  const result = {}
  
  for (const [frontendField, backendField] of Object.entries(fieldMapping)) {
    if (obj.hasOwnProperty(frontendField)) {
      let value = obj[frontendField]
      
      // Aplicar transformación de valor si existe
      if (valueMapping && valueMapping[frontendField]) {
        value = valueMapping[frontendField](value)
      }
      
      result[backendField] = value
    }
  }
  
  return result
}

// Transformar datos del frontend al backend
export const transformToBackend = (frontendNewsletter, isEdit = false) => {
  const baseData = transformObject(
    frontendNewsletter,
    FIELD_MAPPINGS.frontendToBackend,
    VALUE_MAPPINGS.frontendToBackend
  )

  if (frontendNewsletter.description && frontendNewsletter.description.descriptionHtml) {
    const descriptionContent = {
      descriptionHtml: frontendNewsletter.description.descriptionHtml,
      descriptionText: frontendNewsletter.description.descriptionText
    }
    baseData.description = JSON.stringify(descriptionContent)
  }

  if (frontendNewsletter.newsletter_category_id || frontendNewsletter.newsletterType) {
    baseData.newsletter_category_id = Number(frontendNewsletter.newsletter_category_id || frontendNewsletter.newsletterType)
  }

  delete baseData.newsletterType

  return baseData
}

// Transformar datos del backend al frontend
export const transformFromBackend = (backendNewsletter) => {
  const frontendNewsletter = transformObject(
    backendNewsletter,
    FIELD_MAPPINGS.backendToFrontend,
    VALUE_MAPPINGS.backendToFrontend
  )

  const newsletterId = backendNewsletter.id

  const localStorageOriginal = getNewsletterImageFromLocalStorage(newsletterId, 'original')
  const localStorageBlurred = getNewsletterImageFromLocalStorage(newsletterId, 'blurred')

  if (localStorageOriginal) {
    frontendNewsletter.original_thumbnail = localStorageOriginal
    frontendNewsletter.imagePreviewUrl = localStorageOriginal
  } else {
    frontendNewsletter.original_thumbnail = cleanImageUrl(buildImageUrl(backendNewsletter.original_thumbnail || backendNewsletter.thumbnail))
    frontendNewsletter.imagePreviewUrl = cleanImageUrl(buildImageUrl(backendNewsletter.thumbnail))
  }

  if (localStorageBlurred) {
    frontendNewsletter.blurred_thumbnail = localStorageBlurred
  } else {
    frontendNewsletter.blurred_thumbnail = cleanImageUrl(buildBlurredImageUrl(backendNewsletter.blurred_thumbnail))
  }

  if (backendNewsletter.description) {
    try {
      const parsedDescription = JSON.parse(backendNewsletter.description)
      if (parsedDescription.descriptionHtml && parsedDescription.descriptionText) {
        frontendNewsletter.editorHtml = parsedDescription.descriptionHtml
        frontendNewsletter.description = backendNewsletter.description
        frontendNewsletter.descriptionText = parsedDescription.descriptionText
        frontendNewsletter.descriptionHTML = parsedDescription.descriptionHtml
      } else {
        frontendNewsletter.description = backendNewsletter.description
        frontendNewsletter.editorHtml = ''
      }
    } catch (error) {
      frontendNewsletter.description = backendNewsletter.description
      frontendNewsletter.editorHtml = ''
    }
  } else {
    frontendNewsletter.editorHtml = backendNewsletter.editorHtml || ''
    frontendNewsletter.description = backendNewsletter.description || ''
  }

  // Handle file URL from backend - the PDF file URL
  if (backendNewsletter.file) {
    // If it's already a full URL, use it directly
    if (typeof backendNewsletter.file === 'string' && (backendNewsletter.file.startsWith('http://') || backendNewsletter.file.startsWith('https://'))) {
      frontendNewsletter.fileUrl = backendNewsletter.file
    } else {
      // Build the file URL from the base path
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const apiBaseURL = baseURL.replace('/api', '')
      frontendNewsletter.fileUrl = `${apiBaseURL}/storage/newsletters/${backendNewsletter.file}`
    }
  } else if (backendNewsletter.file_name) {
    // Alternative field name for file
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    const apiBaseURL = baseURL.replace('/api', '')
      frontendNewsletter.fileUrl = `${apiBaseURL}/storage/newsletters/${backendNewsletter.file_name}`
  }

  if (!frontendNewsletter.publishDate && backendNewsletter.publish_date) {
    frontendNewsletter.publishDate = backendNewsletter.publish_date
  }

  if (backendNewsletter.newsletter_category) {
    frontendNewsletter.newsletter_category = backendNewsletter.newsletter_category
    frontendNewsletter.newsletter_category_id = backendNewsletter.newsletter_category_id || backendNewsletter.newsletter_category?.id
    frontendNewsletter.newsletterType = backendNewsletter.newsletter_category_id || backendNewsletter.newsletter_category?.id
  } else if (backendNewsletter.newsletter_category_id) {
    frontendNewsletter.newsletter_category_id = backendNewsletter.newsletter_category_id
    frontendNewsletter.newsletterType = backendNewsletter.newsletter_category_id
  }

  return frontendNewsletter
}

// Función para guardar imagen individual en localStorage
const saveImageToLocalStorage = (newsletterId, imageFile, imageType = 'original') => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        const newslettersImages = getNewslettersImagesFromStorage()
        
        // Inicializar objeto del newsletter si no existe
        if (!newslettersImages[newsletterId]) {
          newslettersImages[newsletterId] = {}
        }
        
        // Guardar la imagen
        newslettersImages[newsletterId][imageType] = dataUrl
        
        // Guardar en localStorage
        saveNewslettersImagesToStorage(newslettersImages)
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

export const getNewsletterImageFromLocalStorage = (newsletterId, imageType = 'original') => {
  if (!newsletterId) return null
  
  try {
    const newslettersImages = getNewslettersImagesFromStorage()
    const newsletterImages = newslettersImages[newsletterId]
    
    if (!newsletterImages) return null
    
    return newsletterImages[imageType] || null
  } catch (error) {
    console.error(`❌ Error getting ${imageType} image from localStorage:`, error)
    return null
  }
}

export const removeNewsletterImageFromLocalStorage = (newsletterId, imageType = 'original') => {
  if (!newsletterId) return false
  
  try {
    const newslettersImages = getNewslettersImagesFromStorage()
    const newsletterImages = newslettersImages[newsletterId]
    
    if (!newsletterImages) return false
    
    if (imageType === 'all') {
      // Eliminar todas las imágenes del newsletter
      delete newslettersImages[newsletterId]
    } else {
      // Eliminar imagen específica
      delete newsletterImages[imageType]
      
      // Si no quedan imágenes, eliminar el newsletter completo
      if (Object.keys(newsletterImages).length === 0) {
        delete newslettersImages[newsletterId]
      }
    }
    
    // Guardar cambios
    saveNewslettersImagesToStorage(newslettersImages)
    return true
  } catch (error) {
    console.error(`❌ Error removing ${imageType} image from localStorage:`, error)
    return false
  }
}

/**
 * Extrae solo el primer párrafo del HTML, ignorando headings
 * @param {string} html - HTML content
 * @returns {string} - Texto plano del primer párrafo
 */
export const extractFirstParagraph = (html) => {
  if (!html || typeof html !== 'string') {
    return ''
  }
  
  
  try {
    // Crear un parser DOM seguro
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, 'text/html')
    
    // Buscar el primer elemento <p>
    const firstParagraph = doc.querySelector('p')
    if (firstParagraph) {
      // Extraer solo el texto, sin HTML
      const text = firstParagraph.textContent?.trim() || ''
      return text
    }
    
    // Si no hay párrafos, devolver texto plano de todo el contenido
    const plainText = html.replace(/<[^>]+>/g, '').trim()
    return plainText
  } catch (error) {
    console.warn('Error parsing HTML for first paragraph:', error)
    // Fallback: extraer texto plano
    const fallback = html.replace(/<[^>]+>/g, '').trim()
    return fallback
  }
}

// TODO PRODUCTION: CHANGE IMAGES - Remove localStorage strategy and use server URLs
export const saveNewsletterImageToLocalStorage = async (newsletterId, imageFile) => {
  if (!newsletterId || !imageFile) return false
  
  try {
    // Save original image
    await saveImageToLocalStorage(newsletterId, imageFile, 'original')
    
    // For now, we'll use the same image for blurred (in production, backend should generate blurred version)
    await saveImageToLocalStorage(newsletterId, imageFile, 'blurred')
    
    return true
  } catch (error) {
    console.error('Error saving newsletter image to localStorage:', error)
    return false
  }
}

// Función de utilidad para limpiar todo el localStorage de newsletters
export const clearAllNewslettersImagesFromLocalStorage = () => {
  try {
    localStorage.removeItem(NEWSLETTERS_IMAGES_KEY)
    return true
  } catch (error) {
    console.error('❌ Error clearing all newsletters images from localStorage:', error)
    return false
  }
}

// Función de utilidad para obtener información del localStorage
export const getNewslettersImagesInfo = () => {
  try {
    const newslettersImages = getNewslettersImagesFromStorage()
    const newsletterIds = Object.keys(newslettersImages)
    const totalImages = newsletterIds.reduce((total, newsletterId) => {
      return total + Object.keys(newslettersImages[newsletterId]).length
    }, 0)
    
    return {
      totalNewsletters: newsletterIds.length,
      totalImages,
      newsletterIds,
      storageSize: JSON.stringify(newslettersImages).length
    }
  } catch (error) {
    console.error('❌ Error getting newsletters images info:', error)
    return {
      totalNewsletters: 0,
      totalImages: 0,
      newsletterIds: [],
      storageSize: 0
    }
  }
}
