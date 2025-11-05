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
    kind: 'na',
    interval: 1,
    unit: 'week',
    daysOfWeek: [],
    ends: { mode: 'NEVER', date: '', count: null }
  }
  
  // Derive repeat value from recurrence kind
  let repeat = 'na'
  if (recurrence.kind === 'weekly') {
    repeat = 'weekly'
  } else if (recurrence.kind === 'custom') {
    repeat = 'custom'
  } else if (item.repeat) {
    // Fallback to stored repeat value if recurrence kind is not set
    repeat = item.repeat
  }
  
  return {
    title: item.title || '',
    date: item.date || '',
    startTime: item.startTime || '',
    endTime: item.endTime || '',
    timeZone: item.timeZone || 'UTC±00:00 — Greenwich',
    eventType: item.eventType || 'conference',
    repeat: repeat,
    shortDescription: item.shortDescription || item.short_description || '',
    description: item.description || '',
    location: item.location || '',
    register_link: item.register_link || '',
    file: null,
    imageFileName: item.imageFileName || '',
    imagePreviewUrl: item.imagePreviewUrl || '',
    recurrence: recurrence
  }
}

const TIME_ZONES = [
  'UTC−08:00 — Pacific',
  'UTC−06:00 — Central',
  'UTC−03:00 — South America',
  'UTC±00:00 — Greenwich',
  'UTC+01:00 — Central Europe',
  'UTC+03:00 — Moscow',
  'UTC+05:30 — India',
  'UTC+08:00 — East Asia',
  'UTC+09:00 — Japan',
  'UTC+12:00 — Oceania'
]

const EVENT_TYPE_OPTIONS = [
  { label: 'Conference', value: 'conference' },
  { label: 'Webinar', value: 'webinar' },
  { label: 'Workshop', value: 'workshop' }
]

const REPEAT_OPTIONS = [
  { label: 'None',      value: 'na' },
  { label: 'Daily',     value: 'daily' },
  { label: 'Weekly',    value: 'weekly' },
  { label: 'Monthly',   value: 'monthly' },
  { label: 'Yearly',    value: 'annually' }
  // TO DO backend: { label: 'Custom...', value: 'custom' }
]

export { EVENT_TYPE_OPTIONS }

export const useEventForm = () => {
  // Reference to store original item data for rollback
  const originalRef = useRef(null)
  
  // Default empty form state
  const emptyForm = {
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '17:00',
    timeZone: 'UTC±00:00 — Greenwich',
    eventType: 'conference',
    repeat: 'na',
    shortDescription: '',
    description: '',
    location: '',
    register_link: '',
    file: null,
    imageFileName: '',
    imagePreviewUrl: '',
    recurrence: {
      kind: 'na',
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
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      
      if (file.size > maxSize) {
        setErrorMessage('Image size must not exceed 5MB')
        // Clear any existing file data when size exceeds limit
        setForm(prev => ({ ...prev, file: null, imageFileName: '', imagePreviewUrl: '' }))
        return;
      }
      
      setForm(prev => ({ ...prev, file }))
      setForm(prev => ({ ...prev, imageFileName: file.name }))
      setForm(prev => ({ ...prev, imagePreviewUrl: URL.createObjectURL(file) }))
      
      // Clear error when user selects a valid file
      if (errorMessage) {
        setErrorMessage('')
      }
    }
  }

  const validate = (isEditMode = false) => {
    const errors = []
    
    // 📝 Campos de Texto (Mínimo 3 caracteres)
    if (!form.title.trim()) {
      errors.push('Title is required.')
    } else if (form.title.trim().length < 3) {
      errors.push('Title must be at least 3 characters long.')
    }
    
    // Short Description validation
    if (!form.shortDescription.trim()) {
      errors.push('Short description is required.')
    } else if (form.shortDescription.trim().length < 3) {
      errors.push('Short description must be at least 3 characters long.')
    } else if (form.shortDescription.trim().length > 120) {
      errors.push('Short description must not exceed 120 characters.')
    }
    
    // Content/Description validation
    const contentText = editorText.trim()
    if (!contentText) {
      errors.push('Description is required.')
    } else if (contentText.length < 3) {
      errors.push('Description must be at least 3 characters long.')
    }
    
    if (!form.location.trim()) {
      errors.push('Location is required.')
    } else if (form.location.trim().length < 3) {
      errors.push('Location must be at least 3 characters long.')
    }
    
    if (!form.register_link.trim()) {
      errors.push('Registration link is required.')
    } else if (form.register_link.trim().length < 3) {
      errors.push('Registration link must be at least 3 characters long.')
    }
    
    // 📅 Campos de Fecha y Hora
    if (!form.date) {
      errors.push('Date is required.')
    } else {
      const selectedDate = new Date(form.date)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (selectedDate < today) {
        errors.push('Date must be today or later.')
      }
    }
    
    if (!form.startTime) {
      errors.push('Start time is required.')
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
      if (!timeRegex.test(form.startTime)) {
        errors.push('Start time must be in HH:MM format.')
      }
    }
    
    if (!form.endTime) {
      errors.push('End time is required.')
    } else {
      const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/
      if (!timeRegex.test(form.endTime)) {
        errors.push('End time must be in HH:MM format.')
      }
    }
    
    // Check start time is before end time
    if (form.startTime && form.endTime && form.startTime >= form.endTime) {
      errors.push('Start time must be earlier than end time.')
    }
    
    // 📂 Campos de Selección (Enum)
    if (!form.eventType) {
      errors.push('Event type is required.')
    } else if (!['workshop', 'webinar', 'conference'].includes(form.eventType)) {
      errors.push('Event type must be workshop, webinar, or conference.')
    }
    
    if (!form.repeat) {
      errors.push('Repeat option is required.')
    } else if (!['na', 'daily', 'weekly', 'monthly', 'annually', 'custom'].includes(form.repeat)) {
      errors.push('Repeat option must be na, daily, weekly, monthly, annually, or custom.')
    }
    
    // 🖼️ Archivo de Imagen
    if (!isEditMode && !form.file && !form.imagePreviewUrl) {
      errors.push('An image is required.')
    }
    
    // Check image size if file is present (max 5MB = 5120 KB)
    if (form.file && form.file.size > 5 * 1024 * 1024) {
      errors.push('Image size must not exceed 5MB.')
    }
    
    // Check image format if file is present
    if (form.file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!allowedTypes.includes(form.file.type)) {
        errors.push('Image must be JPG, PNG, GIF, or WebP format.')
      }
    }
    
    // Convert array to single error message
    const errorMsg = errors.length > 0 ? errors.join(' ') : ''
    setErrorMessage(errorMsg)
    return errorMsg === ''
  }

  const buildEventObject = (existingId = null) => {
    const eventObject = {
      title: form.title,
      date: form.date,
      startTime: form.startTime,
      endTime: form.endTime,
      timeZone: form.timeZone,
      eventType: form.eventType,
      repeat: form.repeat,
      shortDescription: form.shortDescription,
      description: editorText,
      editorHtml: editorHtml,
      location: form.location,
      register_link: form.register_link,
      file: form.file,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || '',
      recurrence: form.recurrence,
      status: 1 // Default status: active (as number, not string)
      // TODO BACKEND: send normalized recurrence to API
    }
    
    // Only include ID for edit mode (existing events)
    if (existingId) {
      eventObject.id = existingId
    }
    
    return eventObject
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
        kind: 'weekly',
        interval: 1,
        unit: 'week',
        daysOfWeek: ['MO','TU','WE','TH','FR','SA','SU'],
        ends: recurrence.ends
      }
    }
    
    // Otherwise keep as custom
    return {
      ...recurrence,
      kind: 'custom'
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
    EVENT_TYPE_OPTIONS,
    REPEAT_OPTIONS
  }
}
