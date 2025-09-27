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

export const useNewsletterForm = () => {
  // Default empty form state
  const emptyForm = {
    fileName: '',
    description: '',
    editorHtml: '',
    imageFileName: '',
    imagePreviewUrl: '',
    imageUrl: '',
    file: null,
    linkUrl: ''
  }

  const [form, setForm] = useState(emptyForm)
  const [editorHtml, setEditorHtml] = useState('')
  const [editorText, setEditorText] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const fileInputRef = useRef(null)

  const onChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }))
    // Clear error when user starts typing
    if (errorMessage) {
      setErrorMessage('')
    }
  }

  // Initialize form for create mode
  const initializeCreate = () => {
    setForm(emptyForm)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
  }

  // Initialize form for edit mode
  const initializeEdit = (newsletter) => {
    const initialHtml = newsletter.editorHtml || htmlFromPlain(newsletter.description || '')
    const description = newsletter.description || stripHtml(newsletter.editorHtml || '')
    
    setForm({
      fileName: newsletter.fileName || '',
      description: description,
      editorHtml: initialHtml,
      imageFileName: newsletter.imageFileName || '',
      imagePreviewUrl: newsletter.imagePreviewUrl || '',
      imageUrl: newsletter.imageUrl || '',
      file: null,
      linkUrl: newsletter.linkUrl || ''
    })
    setEditorHtml(initialHtml)
    setEditorText(description)
    setErrorMessage('')
  }

  // Reset form to empty state
  const resetForm = () => {
    setForm(emptyForm)
    setEditorHtml('')
    setEditorText('')
    setErrorMessage('')
    clearFile()
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
      createdAt: existingId ? today : today
    }
  }

  return {
    form,
    onChange,
    editorHtml,
    setEditorHtml,
    setEditorText,
    errorMessage,
    setErrorMessage,
    fileInputRef,
    setFileFromInput,
    setFileFromDrop,
    validate,
    buildNewsletterObject,
    resetForm,
    initializeCreate,
    initializeEdit
  }
}
