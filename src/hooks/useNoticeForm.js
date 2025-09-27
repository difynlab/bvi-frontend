import { useState, useRef, useEffect, useMemo } from 'react'

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
      if (obj.hasOwnProperty(key)) {
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

export const useNoticeForm = ({ initial = {}, mode = 'create' }) => {
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
  const beginEdit = (item) => {
    originalRef.current = deepClone(item)
    const formData = fromItem(originalRef.current)
    const initialHtml = originalRef.current.editorHtml || htmlFromPlain(originalRef.current.description || '')
    const description = originalRef.current.description || stripHtml(originalRef.current.editorHtml || '')
    
    setForm(formData)
    setEditorHtml(initialHtml)
    setEditorText(description)
    setErrorMessage('')
  }

  // Rollback to original data
  const rollbackEdit = () => {
    if (!originalRef.current) return
    
    const formData = fromItem(originalRef.current)
    const initialHtml = originalRef.current.editorHtml || htmlFromPlain(originalRef.current.description || '')
    const description = originalRef.current.description || stripHtml(originalRef.current.editorHtml || '')
    
    setForm(formData)
    setEditorHtml(initialHtml)
    setEditorText(description)
    setErrorMessage('')
  }

  // Initialize form for create mode
  const initializeCreate = () => {
    originalRef.current = null
    setForm(emptyForm)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
  }

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    
    // Clear error when user starts editing
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  const setFileFromInput = (e) => {
    const file = e.target.files[0]
    if (file) {
      setFileFromDrop(file)
    }
  }

  const setFileFromDrop = (file) => {
    if (file && file.type.startsWith('image/')) {
      setForm(prev => ({ ...prev, file }))
      setForm(prev => ({ ...prev, imageFileName: file.name }))
      setForm(prev => ({ ...prev, imagePreviewUrl: URL.createObjectURL(file) }))
      
      // Clear error when user selects a file
      if (errorMessage) {
        setErrorMessage('')
      }
    }
  }

  const validate = (categories) => {
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
    
    // Check URL is valid
    if (form.linkUrl) {
      try {
        new URL(form.linkUrl)
        if (!form.linkUrl.startsWith('http://') && !form.linkUrl.startsWith('https://')) {
          errors.push('Please enter a valid URL (http:// or https://).')
        }
      } catch {
        errors.push('Please enter a valid URL.')
      }
    }
    
    // Convert array to single error message
    const message = errors.length > 0 ? errors.join(' ') : ''
    setErrorMessage(message)
    return message === ''
  }

  const buildNoticeObject = (existingId = null) => {
    const id = existingId || (Date.now().toString() + Math.random().toString(36).substring(2, 11))
    
    return {
      id,
      fileName: form.fileName,
      noticeType: form.noticeType,
      description: editorText,
      editorHtml: editorHtml,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || '',
      linkUrl: form.linkUrl,
      createdAt: existingId ? (initial.createdAt || new Date().toISOString().split('T')[0]) : new Date().toISOString().split('T')[0]
    }
  }

  const resetForm = () => {
    originalRef.current = null
    setForm(emptyForm)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
  }

  return {
    form,
    setForm,
    editorHtml,
    setEditorHtml,
    editorText,
    setEditorText,
    errorMessage,
    setErrorMessage,
    setFileFromInput,
    setFileFromDrop,
    onChange,
    validate,
    buildNoticeObject,
    resetForm,
    beginEdit,
    rollbackEdit,
    initializeCreate
  }
}
