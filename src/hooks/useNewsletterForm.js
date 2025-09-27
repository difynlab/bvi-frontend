import { useState, useRef, useEffect, useMemo } from 'react'
import { validateNewsletter } from '../helpers/newslettersValidation'

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

export const useNewsletterForm = ({ initial = {}, mode = 'create' }) => {
  // Memoize the initial form data to prevent infinite loops
  const initialFormData = useMemo(() => ({
    fileName: initial.fileName || '',
    description: initial.description || '',
    editorHtml: initial.editorHtml || htmlFromPlain(initial.description || ''),
    imageFileName: initial.imageFileName || '',
    imagePreviewUrl: initial.imagePreviewUrl || '',
    imageUrl: initial.imageUrl || '',
    file: null,
    linkUrl: initial.linkUrl || ''
  }), [initial.fileName, initial.description, initial.editorHtml, initial.imageFileName, initial.imagePreviewUrl, initial.imageUrl, initial.linkUrl])

  const [form, setForm] = useState(initialFormData)
  const [editorHtml, setEditorHtml] = useState(initial.editorHtml || htmlFromPlain(initial.description || ''))
  const [editorText, setEditorText] = useState(initial.description || '')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  // Initialize form with initial data
  useEffect(() => {
    if (initial && Object.keys(initial).length > 0) {
      const initialHtml = initial.editorHtml || htmlFromPlain(initial.description || '')
      const description = initial.description || stripHtml(initial.editorHtml || '')
      setForm(initialFormData)
      setEditorHtml(initialHtml)
      setEditorText(description)
      setErrorMessage('')
    } else if (mode === 'create') {
      // Reset form for create mode
      setForm({
        fileName: '',
        description: '',
        editorHtml: '',
        imageFileName: '',
        imagePreviewUrl: '',
        imageUrl: '',
        file: null,
        linkUrl: ''
      })
      setEditorHtml('')
      setEditorText('')
      setErrorMessage('')
    }
  }, [initialFormData, initial.description, initial.editorHtml, mode])

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    // Clear error when user starts typing
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
      const previewUrl = URL.createObjectURL(file)
      onChange('file', file)
      onChange('imageFileName', file.name)
      onChange('imagePreviewUrl', previewUrl)
    }
  }

  const clearFile = () => {
    if (form.imagePreviewUrl) {
      URL.revokeObjectURL(form.imagePreviewUrl)
    }
    onChange('file', null)
    onChange('imageFileName', '')
    onChange('imagePreviewUrl', '')
    onChange('imageUrl', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const validate = () => {
    const result = validateNewsletter(form)
    if (!result.ok) {
      setErrorMessage(result.message)
      return false
    }
    setErrorMessage('')
    return true
  }

  const buildNewsletterObject = (existingId = null) => {
    const today = new Date().toISOString().slice(0, 10)
    
    return {
      id: existingId || `newsletter-${Date.now()}`,
      fileName: form.fileName.trim(),
      description: form.description.trim(),
      editorHtml: editorHtml,
      imageFileName: form.imageFileName,
      imagePreviewUrl: form.imagePreviewUrl,
      imageUrl: form.imageUrl,
      linkUrl: form.linkUrl.trim(),
      createdAt: existingId ? (initial.createdAt || today) : today
    }
  }

  const resetForm = () => {
    setForm(initialFormData)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
    clearFile()
  }

  return {
    form,
    setForm,
    onChange,
    editorHtml,
    setEditorHtml,
    editorText,
    setEditorText,
    errorMessage,
    setErrorMessage,
    fileInputRef,
    setFileFromInput,
    setFileFromDrop,
    clearFile,
    validate,
    buildNewsletterObject,
    resetForm
  }
}
