import { compressImage } from './imageCompression'

// TODO PRODUCTION: CHANGE IMAGES - Remove localStorage strategy and use server URLs
const NOTICES_IMAGES_KEY = 'bvi.notices.images'

// Función para obtener imágenes de notices desde localStorage
const getNoticesImagesFromStorage = () => {
  try {
    const stored = localStorage.getItem(NOTICES_IMAGES_KEY)
    return stored ? JSON.parse(stored) : {}
  } catch (error) {
    console.error('❌ Error reading notices images from localStorage:', error)
    return {}
  }
}

// Función para guardar imágenes de notices en localStorage
const saveNoticesImagesToStorage = (imagesData) => {
  try {
    localStorage.setItem(NOTICES_IMAGES_KEY, JSON.stringify(imagesData))
    return true
  } catch (error) {
    console.error('❌ Error saving notices images to localStorage:', error)
    
    // If quota exceeded, clear old images and try again
    if (error.name === 'QuotaExceededError') {
      console.log('🧹 localStorage quota exceeded, clearing old images...')
      try {
        // Clear all notices images
        localStorage.removeItem(NOTICES_IMAGES_KEY)
        // Try to save again
        localStorage.setItem(NOTICES_IMAGES_KEY, JSON.stringify(imagesData))
        console.log('✅ Successfully saved after clearing old images')
        return true
      } catch (retryError) {
        console.error('❌ Failed to save even after clearing:', retryError)
        // If still failing, save only the current image
        const currentNoticeId = Object.keys(imagesData)[0]
        if (currentNoticeId) {
          const currentNotice = { [currentNoticeId]: imagesData[currentNoticeId] }
          localStorage.setItem(NOTICES_IMAGES_KEY, JSON.stringify(currentNotice))
          console.log('✅ Saved only current notice image')
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
  return `${apiBaseURL}/storage/notices/${thumbnail}`
}

const cleanImageUrl = (url) => {
  if (!url) return ''
  
  // Si la URL contiene duplicación del prefijo, limpiarla
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiBaseURL = baseURL.replace('/api', '')
  const storagePath = `${apiBaseURL}/storage/notices/`
  
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
  return `${apiBaseURL}/storage/notices/${blurredThumbnail}`
}

// Mapeo de campos entre frontend y backend
const FIELD_MAPPINGS = {
  frontendToBackend: {
    id: 'id',
    fileName: 'name',
    noticeType: 'notice_category_id',
    thumbnail: 'thumbnail',  // Use thumbnail field directly (file object)
    linkUrl: 'link',
    file: 'file',
    status: 'status',
    createdAt: 'created_at',
    updatedAt: 'updated_at'
  },
  backendToFrontend: {
    id: 'id',
    name: 'fileName',
    notice_category_id: 'noticeType',
    thumbnail: 'imageFileName',
    link: 'linkUrl',
    file: 'file',
    status: 'status',
    created_at: 'createdAt',
    updated_at: 'updatedAt'
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
export const transformToBackend = (frontendNotice, isEdit = false) => {
  const baseData = transformObject(
    frontendNotice,
    FIELD_MAPPINGS.frontendToBackend,
    VALUE_MAPPINGS.frontendToBackend
  )

  // Build description as JSON string (same pattern as events)
  if (frontendNotice.description && frontendNotice.editorHtml) {
    const descriptionContent = {
      descriptionHtml: frontendNotice.editorHtml,
      descriptionText: frontendNotice.description
    }
    baseData.description = JSON.stringify(descriptionContent)
  }

  return baseData
}

// Transformar datos del backend al frontend
export const transformFromBackend = (backendNotice) => {
  const frontendNotice = transformObject(
    backendNotice,
    FIELD_MAPPINGS.backendToFrontend,
    VALUE_MAPPINGS.backendToFrontend
  )

  // TODO PRODUCTION: CHANGE IMAGES - Use server URLs instead of localStorage
  // Handle new image structure with blurred and original thumbnails
  // PRIORITY: localStorage first, then server URLs
  const noticeId = backendNotice.id

  // Try to get images from localStorage first (PRIORITY)
  const localStorageOriginal = getNoticeImageFromLocalStorage(noticeId, 'original')
  const localStorageBlurred = getNoticeImageFromLocalStorage(noticeId, 'blurred')

  // Always prioritize localStorage over server URLs
  if (localStorageOriginal) {
    frontendNotice.original_thumbnail = localStorageOriginal
    frontendNotice.imagePreviewUrl = localStorageOriginal
  } else {
    // Fallback to server URLs only if localStorage doesn't have the image
    frontendNotice.original_thumbnail = cleanImageUrl(buildImageUrl(backendNotice.original_thumbnail || backendNotice.thumbnail))
    frontendNotice.imagePreviewUrl = cleanImageUrl(buildImageUrl(backendNotice.thumbnail))
  }

  if (localStorageBlurred) {
    frontendNotice.blurred_thumbnail = localStorageBlurred
  } else {
    // Fallback to server URLs
    frontendNotice.blurred_thumbnail = cleanImageUrl(buildBlurredImageUrl(backendNotice.blurred_thumbnail))
  }

  // Parse JSON description if it exists, otherwise use legacy fields
  if (backendNotice.description) {
    try {
      const parsedDescription = JSON.parse(backendNotice.description)
      if (parsedDescription.descriptionHtml && parsedDescription.descriptionText) {
        frontendNotice.editorHtml = parsedDescription.descriptionHtml
        frontendNotice.description = parsedDescription.descriptionText
      } else {
        // Fallback to plain description
        frontendNotice.description = backendNotice.description
        frontendNotice.editorHtml = ''
      }
    } catch (error) {
      // If JSON parsing fails, treat as plain text
      frontendNotice.description = backendNotice.description
      frontendNotice.editorHtml = ''
    }
  } else {
    // Legacy fallback
    frontendNotice.editorHtml = backendNotice.editorHtml || ''
    frontendNotice.description = backendNotice.description || ''
  }

  // Handle file URL from backend - the PDF file URL
  if (backendNotice.file) {
    // If it's already a full URL, use it directly
    if (typeof backendNotice.file === 'string' && (backendNotice.file.startsWith('http://') || backendNotice.file.startsWith('https://'))) {
      frontendNotice.fileUrl = backendNotice.file
    } else {
      // Build the file URL from the base path
      const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
      const apiBaseURL = baseURL.replace('/api', '')
      frontendNotice.fileUrl = `${apiBaseURL}/storage/notices/${backendNotice.file}`
    }
  } else if (backendNotice.file_name) {
    // Alternative field name for file
    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
    const apiBaseURL = baseURL.replace('/api', '')
    frontendNotice.fileUrl = `${apiBaseURL}/storage/notices/${backendNotice.file_name}`
  }

  return frontendNotice
}

// Función para guardar imagen individual en localStorage
const saveImageToLocalStorage = (noticeId, imageFile, imageType = 'original') => {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const dataUrl = e.target.result
        const noticesImages = getNoticesImagesFromStorage()
        
        // Inicializar objeto del notice si no existe
        if (!noticesImages[noticeId]) {
          noticesImages[noticeId] = {}
        }
        
        // Guardar la imagen
        noticesImages[noticeId][imageType] = dataUrl
        
        // Guardar en localStorage
        saveNoticesImagesToStorage(noticesImages)
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

export const getNoticeImageFromLocalStorage = (noticeId, imageType = 'original') => {
  if (!noticeId) return null
  
  try {
    const noticesImages = getNoticesImagesFromStorage()
    const noticeImages = noticesImages[noticeId]
    
    if (!noticeImages) return null
    
    return noticeImages[imageType] || null
  } catch (error) {
    console.error(`❌ Error getting ${imageType} image from localStorage:`, error)
    return null
  }
}

export const removeNoticeImageFromLocalStorage = (noticeId, imageType = 'original') => {
  if (!noticeId) return false
  
  try {
    const noticesImages = getNoticesImagesFromStorage()
    const noticeImages = noticesImages[noticeId]
    
    if (!noticeImages) return false
    
    if (imageType === 'all') {
      // Eliminar todas las imágenes del notice
      delete noticesImages[noticeId]
    } else {
      // Eliminar imagen específica
      delete noticeImages[imageType]
      
      // Si no quedan imágenes, eliminar el notice completo
      if (Object.keys(noticeImages).length === 0) {
        delete noticesImages[noticeId]
      }
    }
    
    // Guardar cambios
    saveNoticesImagesToStorage(noticesImages)
    return true
  } catch (error) {
    console.error(`❌ Error removing ${imageType} image from localStorage:`, error)
    return false
  }
}

// TODO PRODUCTION: CHANGE IMAGES - Remove localStorage strategy and use server URLs
export const saveNoticeImageToLocalStorage = async (noticeId, imageFile) => {
  if (!noticeId || !imageFile) return false
  
  try {
    // Save original image
    await saveImageToLocalStorage(noticeId, imageFile, 'original')
    
    // For now, we'll use the same image for blurred (in production, backend should generate blurred version)
    await saveImageToLocalStorage(noticeId, imageFile, 'blurred')
    
    return true
  } catch (error) {
    console.error('Error saving notice image to localStorage:', error)
    return false
  }
}

// Función de utilidad para limpiar todo el localStorage de notices
export const clearAllNoticesImagesFromLocalStorage = () => {
  try {
    localStorage.removeItem(NOTICES_IMAGES_KEY)
    return true
  } catch (error) {
    console.error('❌ Error clearing all notices images from localStorage:', error)
    return false
  }
}

// Función de utilidad para obtener información del localStorage
export const getNoticesImagesInfo = () => {
  try {
    const noticesImages = getNoticesImagesFromStorage()
    const noticeIds = Object.keys(noticesImages)
    const totalImages = noticeIds.reduce((total, noticeId) => {
      return total + Object.keys(noticesImages[noticeId]).length
    }, 0)
    
    return {
      totalNotices: noticeIds.length,
      totalImages,
      noticeIds,
      storageSize: JSON.stringify(noticesImages).length
    }
  } catch (error) {
    console.error('❌ Error getting notices images info:', error)
    return {
      totalNotices: 0,
      totalImages: 0,
      noticeIds: [],
      storageSize: 0
    }
  }
}
