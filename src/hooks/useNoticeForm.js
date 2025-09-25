import { useState, useRef, useEffect, useMemo } from 'react'

export const useNoticeForm = ({ initial = {}, mode = 'create' }) => {
  const editorRef = useRef(null)
  
  // Memoize the initial form data to prevent infinite loops
  const initialFormData = useMemo(() => ({
    fileName: initial.fileName || '',
    noticeType: initial.noticeType || '',
    description: initial.description || '',
    imageFileName: initial.imageFileName || '',
    imagePreviewUrl: initial.imagePreviewUrl || '',
    file: null,
    linkUrl: initial.linkUrl || ''
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
        fileName: '',
        noticeType: '',
        description: '',
        imageFileName: '',
        imagePreviewUrl: '',
        file: null,
        linkUrl: ''
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
      description: form.description,
      imageFileName: form.imageFileName || 'no-image.jpg',
      imagePreviewUrl: form.imagePreviewUrl || '',
      linkUrl: form.linkUrl,
      createdAt: existingId ? initial.createdAt : new Date().toISOString().split('T')[0]
    }
  }

  const resetForm = () => {
    setForm({
      fileName: '',
      noticeType: '',
      description: '',
      imageFileName: '',
      imagePreviewUrl: '',
      file: null,
      linkUrl: ''
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
    buildNoticeObject,
    resetForm
  }
}
