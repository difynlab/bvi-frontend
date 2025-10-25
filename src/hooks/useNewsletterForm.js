import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { validateNewsletter } from '../helpers/newslettersValidation'
import { pdf } from '@react-pdf/renderer'
import NewsletterPDFDocument from '../components/pdf/NewsletterPDFDocument'
import { saveNewsletterImageToLocalStorage, extractFirstParagraph } from '../utils/newsletterTransformers'

// Utility to convert plain text to minimal HTML
const htmlFromPlain = (txt = '') => {
  if (!txt || txt.trim() === '') return ''
  return '<p>' + escapeHtml(txt).replace(/\n/g, '<br/>') + '</p>'
}

// Utility to strip HTML tags and get plain text
const stripHtml = (html) => {
  if (!html) return ''
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || el.innerText || ''
}

// Utility to escape HTML
const escapeHtml = (text) => {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}


export const useNewsletterForm = () => {
  // Default empty form state
  const emptyForm = {
    fileName: '',
    description: '',
    descriptionHtml: '', // NUEVO: Para backend
    descriptionText: '', // NUEVO: Para backend
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

  // Función para generar PDF automáticamente
  const generateNewsletterPDF = async (newsletterData) => {
    try {
      const newsletter = {
        id: newsletterData.id,
        name: newsletterData.name,
        descriptionHtml: newsletterData.descriptionHtml?.html || newsletterData.descriptionHtml,
        description: newsletterData.description,
        thumbnail: newsletterData.thumbnail,
        link: newsletterData.link,
        createdAt: newsletterData.createdAt,
        // Agregar campos que espera NewsletterPDFDocument
        fileName: newsletterData.name,
        imagePreviewUrl: newsletterData.thumbnail,
        imageUrl: newsletterData.thumbnail,
        imageFileName: newsletterData.thumbnail?.name || 'newsletter-image'
      }
      
      
      const blob = await pdf(React.createElement(NewsletterPDFDocument, { newsletter })).toBlob()
      return blob
    } catch (error) {
      console.error('Error generating newsletter PDF:', error)
      throw error
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
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      
      if (file.size > maxSize) {
        setErrorMessage('Image size must not exceed 5MB')
        // Clear any existing file data when size exceeds limit
        onChange('file', null)
        onChange('imageFileName', '')
        onChange('imagePreviewUrl', '')
        return;
      }
      
      const previewUrl = URL.createObjectURL(file)
      onChange('file', file)
      onChange('imageFileName', file.name)
      onChange('imagePreviewUrl', previewUrl)
      
      // Clear error when user selects a valid file
      if (errorMessage) {
        setErrorMessage('')
      }
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

  // Begin editing - take snapshot and initialize form (similar to notices)
  const loadFrom = useCallback((item) => {
    if (item) {
      // Parse description from backend if it's a JSON string
      let descriptionHtml = ''
      let descriptionText = ''
      
      if (item.description && typeof item.description === 'string') {
        try {
          const parsed = JSON.parse(item.description)
          // Handle nested object structure
          descriptionHtml = parsed.descriptionHtml?.html || parsed.descriptionHtml || ''
          descriptionText = parsed.descriptionText || ''
        } catch (error) {
          console.warn('Error parsing description JSON:', error)
          descriptionHtml = item.description
          descriptionText = item.description
        }
      } else if (item.descriptionHtml) {
        descriptionHtml = item.descriptionHtml
        descriptionText = item.descriptionText || ''
      }
      
      // Set form data
      const formData = {
        fileName: item.name || item.fileName || '',
        description: descriptionText,
        descriptionHtml: descriptionHtml,
        descriptionText: descriptionText,
        editorHtml: descriptionHtml,
        imageFileName: item.imageFileName || '',
        imagePreviewUrl: item.imagePreviewUrl || item.original_thumbnail || '',
        imageUrl: item.imageUrl || item.original_thumbnail || '',
        file: null, // Don't load file for editing
        linkUrl: item.link || item.linkUrl || ''
      }
      setForm(formData)
      
      // Ensure editorHtml is a string, not an object
      const htmlString = typeof descriptionHtml === 'string' ? descriptionHtml : descriptionHtml?.html || ''
      
      setEditorHtml(htmlString)
      setEditorText(descriptionText)
    } else {
      setForm(emptyForm)
      setEditorHtml('')
      setEditorText('')
    }
    setErrorMessage('')
  }, [])

  const validate = () => {
    const result = validateNewsletter(form)
    if (!result.ok) {
      setErrorMessage(result.message)
      return false
    }
    setErrorMessage('')
    return true
  }

  const buildNewsletterObject = async (existingId = null) => {
    const today = new Date().toISOString().slice(0, 10)
    const newsletterId = existingId || `newsletter-${Date.now()}`
    
    
    // Generar PDF automáticamente
    let pdfBlob = null
    try {
      const newsletterData = {
        id: newsletterId,
        name: form.fileName.trim(),
        descriptionHtml: editorHtml?.html || editorHtml,
        description: form.description.trim(),
        thumbnail: form.file,
        link: form.linkUrl.trim(),
        createdAt: today
      }
      
      // STEP 1: Save image to localStorage for PDF generation (BEFORE PDF generation)
      if (form.file && form.file.type.startsWith('image/')) {
        // Generate the same temp ID that useNewslettersState will use
        const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        await saveNewsletterImageToLocalStorage(tempId, form.file)
        
        // Store the temp ID in newsletterData for PDF generation
        newsletterData.tempId = tempId
      }
      
      pdfBlob = await generateNewsletterPDF(newsletterData)
    } catch (error) {
      console.error('Error generating PDF:', error)
      throw new Error('Error generating PDF for newsletter')
    }
    
    // No guardar imagen aquí, se guardará después de crear el newsletter con el ID del backend
    
    // Extract HTML string from editorHtml object
    const htmlString = editorHtml?.html || editorHtml || ''
    
    const firstParagraph = extractFirstParagraph(htmlString)
    
    // Fallback más robusto para descriptionText
    let descriptionText = firstParagraph
    if (!descriptionText && editorText) {
      // Handle editorText if it's an object
      const textString = typeof editorText === 'string' ? editorText : editorText?.text || editorText?.html || ''
      descriptionText = textString.trim()
    }
    if (!descriptionText && form.description) {
      descriptionText = form.description.trim()
    }
    if (!descriptionText) {
      descriptionText = 'Sin descripción'
    }
    
    
    return {
      name: form.fileName.trim(), // Cambio: fileName -> name para backend
      description: JSON.stringify({
        descriptionHtml: htmlString,
        descriptionText: descriptionText
      }), // JSON string para backend
      thumbnail: form.file, // Cambio: file -> thumbnail para backend
      file: pdfBlob, // NUEVO: PDF generado automáticamente
      link: form.linkUrl.trim(), // Cambio: linkUrl -> link para backend
      status: 1 // NUEVO: Status por defecto
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
    initializeEdit,
    loadFrom,
    stripHtml
  }
}
