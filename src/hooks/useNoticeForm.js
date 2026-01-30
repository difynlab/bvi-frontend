import { useState, useRef, useCallback } from 'react'
import { isValidUrl } from '../helpers/urlValidation'
import { transformToBackend, transformFromBackend } from '../utils/noticeTransformers'

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
const fromItem = (item) => {
  // Extract filename from fileUrl if imageFileName is not available
  let imageFileName = item.imageFileName || '';
  let imagePreviewUrl = item.imagePreviewUrl || '';
  
  // If there's a fileUrl from backend, use it as preview URL
  if (item.fileUrl && !imagePreviewUrl) {
    imagePreviewUrl = item.fileUrl;
    
    // Extract filename from URL if imageFileName is not available
    if (!imageFileName) {
      const urlParts = item.fileUrl.split('/');
      imageFileName = urlParts[urlParts.length - 1] || '';
    }
  }
  
  let publishDate = '';
  
  if (item.publishDate) {
    if (item.publishDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      publishDate = item.publishDate;
    } else {
      const date = new Date(item.publishDate);
      if (!isNaN(date.getTime())) {
        publishDate = date.toISOString().split('T')[0];
      }
    }
  } else if (item.publish_date) {
    if (item.publish_date.match(/^\d{4}-\d{2}-\d{2}$/)) {
      publishDate = item.publish_date;
    } else {
      const date = new Date(item.publish_date);
      if (!isNaN(date.getTime())) {
        publishDate = date.toISOString().split('T')[0];
      }
    }
  }
  // Don't fallback to createdAt - only use publishDate if it exists
  
  return {
    fileName: item.fileName || '',
    publishDate: publishDate,
    noticeType: item.noticeType || '',
    description: item.description || '',
    imageFileName: imageFileName,
    imagePreviewUrl: imagePreviewUrl,
    file: null,
    linkUrl: item.linkUrl || ''
  };
}

export const useNoticeForm = () => {
  // Reference to store original item data for rollback
  const originalRef = useRef(null)
  
  // Default empty form state
  const emptyForm = {
    fileName: '',
    publishDate: '',
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
    const allowedTypes = ['application/pdf']
    const allowedExtensions = ['.pdf']
    
    if (!file) return
    
    const fileType = file.type.toLowerCase()
    const fileName = file.name.toLowerCase()
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    const isValidType = allowedTypes.includes(fileType) || hasValidExtension
    
    if (!isValidType) {
      setErrorMessage('Please upload a PDF file only.')
      setForm(prev => ({ ...prev, file: null, imageFileName: '', imagePreviewUrl: '' }))
      return
    }
    
    const maxSize = 15 * 1024 * 1024
    
    if (file.size > maxSize) {
      setErrorMessage('File size must not exceed 15MB')
      setForm(prev => ({ ...prev, file: null, imageFileName: '', imagePreviewUrl: '' }))
      return
    }
    
    setForm(prev => ({ ...prev, file, imageFileName: file.name, imagePreviewUrl: '' }))
    
    if (errorMessage) {
      setErrorMessage('')
    }
  }, [errorMessage])

  const validate = useCallback((categories) => {
    const errors = []
    
    if (!form.fileName?.trim()) {
      errors.push('Please complete all required fields.')
    } else if (!form.noticeType) {
      errors.push('Please complete all required fields.')
    } else if (!form.description?.trim()) {
      errors.push('Please complete all required fields.')
    }
    
    if (form.file) {
      const allowedTypes = ['application/pdf']
      const fileName = form.file.name.toLowerCase()
      const allowedExtensions = ['.pdf']
      const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
      const isValidType = allowedTypes.includes(form.file.type) || hasValidExtension
      
      if (!isValidType) {
        errors.push('Please upload a PDF file only.')
      }
    }
    
    if (form.file && form.file.size > 15 * 1024 * 1024) {
      errors.push('File size must not exceed 15MB.')
    }
    
    if (form.noticeType && !categories.find(cat => cat.id === form.noticeType)) {
      errors.push('Please select a valid category.')
    }
    
    if (form.linkUrl && form.linkUrl.trim() !== '#' && !isValidUrl(form.linkUrl)) {
      errors.push('Please enter a valid URL or use "#" to indicate no link.')
    }
    
    const message = errors.length > 0 ? errors.join(' ') : ''
    setErrorMessage(message)
    return message === ''
  }, [form])

  const toPayload = useCallback((existingId = null) => {
    const id = existingId || (Date.now().toString() + Math.random().toString(36).substring(2, 11))
    
    const noticeObject = {
      id,
      fileName: form.fileName,
      noticeType: form.noticeType,
      description: editorText,
      editorHtml: editorHtml,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || '',
      linkUrl: form.linkUrl,
      file: form.file,
      status: 1 // Default status: active
    }

    // Add timestamps based on create vs edit
    if (existingId) {
      // Editing existing notice - preserve creation timestamps and add update timestamps
      noticeObject.updatedAtISO = new Date().toISOString()
      noticeObject.updatedAtMs = Date.now()
    } else {
      // Creating new notice - add creation timestamps
      noticeObject.createdAtISO = new Date().toISOString()
      noticeObject.createdAtMs = Date.now()
    }

    return noticeObject
  }, [form, editorText, editorHtml])

  // Build notice object for backend (similar to buildEventObject in useEventForm)
  const buildNoticeObject = useCallback((existingId = null) => {
    const publishDate = form.publishDate || new Date().toISOString().split('T')[0];
    
    const noticeObject = {
      fileName: form.fileName,
      publishDate: publishDate,
      noticeType: form.noticeType,
      description: editorText,
      editorHtml: editorHtml,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || '',
      linkUrl: form.linkUrl,
      file: form.file,
      status: 1
    }
    
    if (existingId) {
      noticeObject.id = existingId
    }
    
    return noticeObject
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
    buildNoticeObject,
    loadFrom,
    rollbackEdit,
    initializeCreate,
    reset,
    stripHtml,
    
    // Legacy compatibility
    setForm,
    setErrorMessage,
    resetForm: reset,
    beginEdit: loadFrom
  }
}
