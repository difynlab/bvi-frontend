import { useState, useRef, useEffect, useMemo } from 'react'

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
  const editorRef = useRef(null)
  
  // Memoize the initial form data to prevent infinite loops
  const initialFormData = useMemo(() => ({
    title: initial.title || '',
    date: initial.date || '',
    startTime: initial.startTime || '',
    endTime: initial.endTime || '',
    timeZone: initial.timeZone || 'UTC',
    eventType: initial.eventType || 'Conference',
    description: initial.description || '',
    location: initial.location || '',
    file: null,
    imageFileName: initial.imageFileName || '',
    imagePreviewUrl: initial.imagePreviewUrl || ''
  }), [initial])
  
  const [form, setForm] = useState(initialFormData)
  const [editorHtml, setEditorHtml] = useState(initial.description || '')
  const [errorMessage, setErrorMessage] = useState('')

  // Initialize form with initial data
  useEffect(() => {
    if (initial && Object.keys(initial).length > 0) {
      setForm(initialFormData)
      setEditorHtml(initial.description || '')
    } else if (mode === 'create') {
      // Reset form for create mode
      setForm({
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
      })
      setEditorHtml('')
    }
  }, [initialFormData, initial.description, mode])

  // Set editor content when editing
  useEffect(() => {
    if (mode === 'edit' && editorRef.current && initial.description) {
      editorRef.current.innerHTML = initial.description
    }
  }, [mode, initial.description])

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
      description: form.description,
      location: form.location,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || ''
    }
  }

  const resetForm = () => {
    setForm({
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
    })
    setEditorHtml('')
    setErrorMessage('')
  }

  return {
    form,
    setForm,
    editorHtml,
    setEditorHtml,
    errorMessage,
    setErrorMessage,
    editorRef,
    setFileFromInput,
    setFileFromDrop,
    onChange,
    validate,
    buildEventObject,
    resetForm,
    TIME_ZONES,
    EVENT_TYPES
  }
}
