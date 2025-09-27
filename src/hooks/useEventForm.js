import { useState, useEffect, useMemo, useRef } from 'react'

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
  title: item.title || '',
  date: item.date || '',
  startTime: item.startTime || '',
  endTime: item.endTime || '',
  timeZone: item.timeZone || 'UTC',
  eventType: item.eventType || 'Conference',
  description: item.description || '',
  location: item.location || '',
  file: null,
  imageFileName: item.imageFileName || '',
  imagePreviewUrl: item.imagePreviewUrl || ''
})

const TIME_ZONES = [
  'UTC',
  'GMT',
  'GMT-3',
  'GMT+1',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'Europe/Madrid',
  'Europe/London',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney'
]

const EVENT_TYPES = [
  'Conference',
  'Webinar',
  'Workshop'
]

export const useEventForm = ({ initial = {}, mode = 'create' }) => {
  // Reference to store original item data for rollback
  const originalRef = useRef(null)
  
  // Default empty form state
  const emptyForm = {
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    timeZone: 'UTC',
    eventType: 'Conference',
    description: '',
    location: '',
    file: null,
    imageFileName: '',
    imagePreviewUrl: ''
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
    let newValue = value
    
    // Handle time clamping logic
    if (key === 'startTime') {
      // If startTime changes and endTime is set and endTime < startTime, adjust endTime
      if (form.endTime && value && form.endTime < value) {
        newValue = value
        setForm(prev => ({ ...prev, [key]: value, endTime: value }))
      } else {
        setForm(prev => ({ ...prev, [key]: value }))
      }
    } else if (key === 'endTime') {
      // If endTime is set and it's less than startTime, clamp it to startTime
      if (value && form.startTime && value < form.startTime) {
        newValue = form.startTime
        setForm(prev => ({ ...prev, [key]: form.startTime }))
      } else {
        setForm(prev => ({ ...prev, [key]: value }))
      }
    } else {
      setForm(prev => ({ ...prev, [key]: value }))
    }
    
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

  const validate = () => {
    const errors = []
    
    // Check all required fields are not empty
    if (!form.title.trim()) {
      errors.push('Please complete all required fields.')
    } else if (!form.date) {
      errors.push('Please complete all required fields.')
    } else if (!form.startTime) {
      errors.push('Please complete all required fields.')
    } else if (!form.endTime) {
      errors.push('Please complete all required fields.')
    } else if (!form.timeZone) {
      errors.push('Please complete all required fields.')
    } else if (!form.eventType) {
      errors.push('Please complete all required fields.')
    } else if (!form.description.trim()) {
      errors.push('Please complete all required fields.')
    } else if (!form.location.trim()) {
      errors.push('Please complete all required fields.')
    }
    
    // Check image is required
    if (!form.file && !form.imagePreviewUrl) {
      errors.push('An image is required.')
    }
    
    // Check start time is before end time (shouldn't happen due to clamping, but keep as safety check)
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      errors.push('Start time must be earlier than end time.')
    }
    
    // Convert array to single error message
    const errorMsg = errors.length > 0 ? errors.join(' ') : ''
    setErrorMessage(errorMsg)
    return errorMsg === ''
  }

  const buildEventObject = (existingId = null) => {
    const id = existingId || (Date.now().toString() + Math.random().toString(36).substring(2, 11))
    
    return {
      id,
      title: form.title,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      timeZone: form.timeZone,
      eventType: form.eventType,
      description: editorText,
      editorHtml: editorHtml,
      location: form.location,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || ''
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
    buildEventObject,
    resetForm,
    beginEdit,
    rollbackEdit,
    initializeCreate,
    TIME_ZONES,
    EVENT_TYPES
  }
}
