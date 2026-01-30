import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { validateNewsletter } from '../helpers/newslettersValidation'
import { extractFirstParagraph } from '../utils/newsletterTransformers'

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
    descriptionHtml: '',
    descriptionText: '',
    editorHtml: '',
    imageFileName: '',
    imagePreviewUrl: '',
    imageUrl: '',
    file: null,
    linkUrl: '',
    publishDate: '',
    newsletterType: ''
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
    
    let publishDate = ''
    const publishDateValue = newsletter.publishDate || newsletter.publish_date || newsletter.data?.publish_date || newsletter.data?.publishDate || newsletter.publishDateISO || newsletter.data?.publishDateISO
    
    if (publishDateValue) {
      if (typeof publishDateValue === 'string' && publishDateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        publishDate = publishDateValue
      } else {
        const date = new Date(publishDateValue)
        if (!isNaN(date.getTime())) {
          publishDate = date.toISOString().split('T')[0]
        }
      }
    }
    
    const fileName = newsletter.fileName || newsletter.data?.name || newsletter.name || ''
    const linkUrl = newsletter.linkUrl || newsletter.data?.link || newsletter.link || ''
    
    setForm({
      fileName: fileName,
      description: description,
      editorHtml: initialHtml,
      imageFileName: newsletter.imageFileName || '',
      imagePreviewUrl: newsletter.imagePreviewUrl || '',
      imageUrl: newsletter.imageUrl || '',
      file: null,
      linkUrl: linkUrl,
      publishDate: publishDate,
      newsletterType: newsletter.newsletterType || newsletter.data?.newsletter_category_id || ''
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
    if (file && file.type === 'application/pdf') {
      const maxSize = 15 * 1024 * 1024; // 15MB in bytes
      
      if (file.size > maxSize) {
        setErrorMessage('PDF size must not exceed 15MB')
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
    } else if (file) {
      setErrorMessage('Please upload a PDF file only.')
      onChange('file', null)
      onChange('imageFileName', '')
      onChange('imagePreviewUrl', '')
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
      
      // Extract filename and preview URL
      let imageFileName = item.imageFileName || '';
      let imagePreviewUrl = item.imagePreviewUrl || item.original_thumbnail || '';
      
      // If there's a fileUrl from backend, use it as preview URL
      if (item.fileUrl && !imagePreviewUrl) {
        imagePreviewUrl = item.fileUrl;
        
        // Extract filename from URL if imageFileName is not available
        if (!imageFileName) {
          const urlParts = item.fileUrl.split('/');
          imageFileName = urlParts[urlParts.length - 1] || '';
        }
      } else if (item.fileUrl) {
        // If fileUrl exists but imageFileName is not set, extract it
        if (!imageFileName) {
          const urlParts = item.fileUrl.split('/');
          imageFileName = urlParts[urlParts.length - 1] || '';
        }
      }
      
      let publishDate = ''
      const publishDateValue = item.publishDate || item.publish_date || item.data?.publish_date || item.data?.publishDate || item.publishDateISO || item.data?.publishDateISO
      
      if (publishDateValue) {
        if (typeof publishDateValue === 'string' && publishDateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
          publishDate = publishDateValue
        } else {
          const date = new Date(publishDateValue)
          if (!isNaN(date.getTime())) {
            publishDate = date.toISOString().split('T')[0]
          }
        }
      }
      
      const fileName = item.fileName || item.data?.name || item.name || ''
      const linkUrl = item.linkUrl || item.data?.link || item.link || ''
      
      const formData = {
        fileName: fileName,
        description: descriptionText,
        descriptionHtml: descriptionHtml,
        descriptionText: descriptionText,
        editorHtml: descriptionHtml,
        imageFileName: imageFileName,
        imagePreviewUrl: imagePreviewUrl,
        imageUrl: item.imageUrl || item.original_thumbnail || '',
        file: null,
        linkUrl: linkUrl,
        publishDate: publishDate,
        newsletterType: item.newsletterType || item.data?.newsletter_category_id || ''
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
    const htmlString = editorHtml?.html || editorHtml || ''
    
    const firstParagraph = extractFirstParagraph(htmlString)
    
    let descriptionText = firstParagraph
    if (!descriptionText && editorText) {
      const textString = typeof editorText === 'string' ? editorText : editorText?.text || editorText?.html || ''
      descriptionText = textString.trim()
    }
    if (!descriptionText && form.description) {
      descriptionText = form.description.trim()
    }
    if (!descriptionText) {
      descriptionText = 'Sin descripción'
    }
    
    const publishDate = form.publishDate || new Date().toISOString().split('T')[0]
    
    const payload = {
      name: form.fileName.trim(),
      description: JSON.stringify({
        descriptionHtml: htmlString,
        descriptionText: descriptionText
      }),
      publish_date: publishDate,
      newsletter_category_id: Number(form.newsletterType),
      status: 1
    }
    
    if (form.linkUrl && form.linkUrl.trim()) {
      payload.link = form.linkUrl.trim()
    }
    
    if (form.file) {
      payload.file = form.file
    }
    
    return payload
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
