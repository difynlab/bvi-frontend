import { useState, useRef, useCallback } from 'react'
import { isValidUrl } from '../helpers/urlValidation'

// Utility to convert plain text to minimal HTML
const htmlFromPlain = (txt = '') => {
  if (!txt || txt.trim() === '') return ''
  return '<p>' + escapeHtml(txt).replace(/\n/g, '<br/>') + '</p>'
}

// Utility to escape HTML
const escapeHtml = (text) => {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// Utility to strip HTML
const stripHtml = (html = '') => {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || ''
}

// Utility to deep clone an object
const deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (typeof obj === 'object') {
    const clonedObj = {}
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  return obj
}

// Utility to build form state from item
const fromItem = (item) => ({
  fileName: item.fileName || '',
  noticeType: item.noticeType || '',
  description: item.description || '',
  imageFileName: item.imageFileName || '',
  imagePreviewUrl: item.imagePreviewUrl || '',
  file: null,
  linkUrl: item.linkUrl || ''
})

export const useNoticeForm = () => {
  // Reference to store original item data for rollback
  const originalRef = useRef(null)
  
  // Default empty form state
  const emptyForm = {
    fileName: '',
    noticeType: '',
    description: '',
    imageFileName: '',
    imagePreviewUrl: '',
    file: null,
    linkUrl: ''
  }
  
  const [form, setForm] = useState(emptyForm)
  const [editorHtml, setEditorHtml] = useState('')
  const [editorText, setEditorText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')

  // Begin editing - take snapshot and initialize form
  const loadFrom = useCallback((item) => {
    if (item) {
      originalRef.current = deepClone(item)
      const formData = fromItem(originalRef.current)
      
      // Prioritize editorHtml if it exists, otherwise use description
      let initialHtml = ''
      let description = ''
      
      if (originalRef.current.editorHtml) {
        initialHtml = originalRef.current.editorHtml
        description = stripHtml(originalRef.current.editorHtml)
      } else if (originalRef.current.description) {
        description = originalRef.current.description
        initialHtml = htmlFromPlain(originalRef.current.description)
      }
      
      setForm(formData)
      setEditorHtml(initialHtml)
      setEditorText(description)
    } else {
      originalRef.current = null
      setForm(emptyForm)
      setEditorHtml('')
      setEditorText('')
    }
    setErrorMessage('')
  }, [])

  // Rollback to original data
  const rollbackEdit = useCallback(() => {
    if (!originalRef.current) return
    
    const formData = fromItem(originalRef.current)
    
    // Prioritize editorHtml if it exists, otherwise use description
    let initialHtml = ''
    let description = ''
    
    if (originalRef.current.editorHtml) {
      initialHtml = originalRef.current.editorHtml
      description = stripHtml(originalRef.current.editorHtml)
    } else if (originalRef.current.description) {
      description = originalRef.current.description
      initialHtml = htmlFromPlain(originalRef.current.description)
    }
    
    setForm(formData)
    setEditorHtml(initialHtml)
    setEditorText(description)
    setErrorMessage('')
  }, [])

  // Initialize form for create mode
  const initializeCreate = useCallback(() => {
    originalRef.current = null
    setForm(emptyForm)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
  }, [])

  const onChange = useCallback((key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    
    // Clear error when user starts editing
    if (errorMessage) {
      setErrorMessage('')
    }
  }, [errorMessage])

  const setFileFromInput = useCallback((e) => {
    const file = e.target.files[0]
    if (file) {
      setFileFromDrop(file)
    }
  }, [])

  const setFileFromDrop = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      setForm(prev => ({ ...prev, file, imageFileName: file.name, imagePreviewUrl: URL.createObjectURL(file) }))
      
      // Clear error when user selects a file
      if (errorMessage) {
        setErrorMessage('')
      }
    }
  }, [errorMessage])

  const validate = useCallback((categories) => {
    const errors = []
    
    // Check all required fields are not empty
    if (!form.fileName?.trim()) {
      errors.push('Please complete all required fields.')
    } else if (!form.noticeType) {
      errors.push('Please complete all required fields.')
    } else if (!form.description?.trim()) {
      errors.push('Please complete all required fields.')
    } else if (!form.linkUrl?.trim()) {
      errors.push('Please complete all required fields.')
    }
    
    // Check image is required
    if (!form.file && !form.imagePreviewUrl) {
      errors.push('An image is required.')
    }
    
    // Check category exists
    if (form.noticeType && !categories.find(cat => cat.id === form.noticeType)) {
      errors.push('Please select a valid category.')
    }
    
    // Check URL is valid using helper
    if (form.linkUrl && !isValidUrl(form.linkUrl)) {
      errors.push('Please enter a valid URL.')
    }
    
    // Convert array to single error message
    const message = errors.length > 0 ? errors.join(' ') : ''
    setErrorMessage(message)
    return message === ''
  }, [form])

  const toPayload = useCallback((existingId = null) => {
    const id = existingId || (Date.now().toString() + Math.random().toString(36).substring(2, 11))
    
    // Helper function to get local date in YYYY-MM-DD format
    const getLocalDateString = () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    const payload = {
      id,
      fileName: form.fileName,
      noticeType: form.noticeType,
      description: editorText,
      editorHtml: editorHtml,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || '',
      linkUrl: form.linkUrl,
      createdAt: getLocalDateString()
    }

    // Add timestamps based on create vs edit
    if (existingId) {
      // Editing existing notice - preserve creation timestamps and add update timestamps
      // Note: createdAtISO and createdAtMs should be preserved from the original notice
      // They will be handled in the component layer
      payload.updatedAtISO = new Date().toISOString()
      payload.updatedAtMs = Date.now()
    } else {
      // Creating new notice - add creation timestamps
      payload.createdAtISO = new Date().toISOString()
      payload.createdAtMs = Date.now()
    }

    return payload
  }, [form, editorText, editorHtml])

  const reset = useCallback(() => {
    originalRef.current = null
    setForm(emptyForm)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
  }, [])

  return {
    form,
    editorHtml,
    editorText,
    errorMessage,
    onChange,
    setEditorHtml,
    setEditorText,
    setFileFromInput,
    setFileFromDrop,
    validate,
    toPayload,
    loadFrom,
    rollbackEdit,
    initializeCreate,
    reset,
    stripHtml,
    
    // Legacy compatibility
    setForm,
    setErrorMessage,
    buildNoticeObject: toPayload,
    resetForm: reset,
    beginEdit: loadFrom
  }
}
