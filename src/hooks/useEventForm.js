import { useState, useRef } from 'react'

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
  const recurrence = item.recurrence || {
    kind: 'NONE',
    interval: 1,
    unit: 'week',
    daysOfWeek: [],
    ends: { mode: 'NEVER', date: '', count: null }
  }
  
  // Derive repeat value from recurrence kind
  let repeat = 'NONE'
  if (recurrence.kind === 'WEEKLY') {
    repeat = 'WEEKLY'
  } else if (recurrence.kind === 'CUSTOM') {
    repeat = 'CUSTOM'
  } else if (item.repeat) {
    // Fallback to stored repeat value if recurrence kind is not set
    repeat = item.repeat
  }
  
  return {
    title: item.title || '',
    date: item.date || '',
    startTime: item.startTime || '',
    endTime: item.endTime || '',
    timeZone: item.timeZone || 'UTC',
    eventType: item.eventType || 'Conference',
    repeat: repeat,
    description: item.description || '',
    location: item.location || '',
    file: null,
    imageFileName: item.imageFileName || '',
    imagePreviewUrl: item.imagePreviewUrl || '',
    recurrence: recurrence
  }
}

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

const REPEAT_OPTIONS = [
  { label: 'None',      value: 'NONE' },
  { label: 'Daily', value: 'DAILY' },
  { label: 'Weekly',                 value: 'WEEKLY'   },
  { label: 'Monthly',                value: 'MONTHLY'  },
  { label: 'Yearly',               value: 'YEARLY' },
  { label: 'Custom...',              value: 'CUSTOM'   }
]

export const useEventForm = () => {
  // Reference to store original item data for rollback
  const originalRef = useRef(null)
  
  // Default empty form state
  const emptyForm = {
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    timeZone: 'UTC',
    eventType: 'Conference',
    repeat: 'NONE',
    description: '',
    location: '',
    file: null,
    imageFileName: '',
    imagePreviewUrl: '',
    recurrence: {
      kind: 'NONE',
      interval: 1,
      unit: 'week',
      daysOfWeek: [],
      ends: { mode: 'NEVER', date: '', count: null }
    }
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
    // Handle time clamping logic
    if (key === 'startTime') {
      // Only update startTime, don't automatically change endTime
      setForm(prev => ({ ...prev, [key]: value }))
    } else if (key === 'endTime') {
      // Only update endTime, validation will happen on submit
      setForm(prev => ({ ...prev, [key]: value }))
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
    } else if (!form.description.trim() && !editorText.trim()) {
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
      repeat: form.repeat,
      description: editorText,
      editorHtml: editorHtml,
      location: form.location,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || '',
      recurrence: form.recurrence
      // TODO BACKEND: send normalized recurrence to API
    }
  }

  const resetForm = () => {
    originalRef.current = null
    setForm(emptyForm)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
  }

  // Update recurrence state
  const updateRecurrence = (recurrenceData) => {
    setForm(prev => ({ ...prev, recurrence: recurrenceData }))
  }

  // Normalize recurrence based on settings
  const normalizeRecurrence = (recurrence) => {
    // If unit is week and all 7 days are selected, treat as Weekly
    if (recurrence.unit === 'week' && recurrence.daysOfWeek.length === 7) {
      return {
        kind: 'WEEKLY',
        interval: 1,
        unit: 'week',
        daysOfWeek: ['MO','TU','WE','TH','FR','SA','SU'],
        ends: recurrence.ends
      }
    }
    
    // Otherwise keep as CUSTOM
    return {
      ...recurrence,
      kind: 'CUSTOM'
    }
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
    updateRecurrence,
    normalizeRecurrence,
    stripHtml,
    TIME_ZONES,
    EVENT_TYPES,
    REPEAT_OPTIONS
  }
}
