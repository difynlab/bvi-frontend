export const stripHtmlToPlainText = (html) => {
  if (!html) return ''
  const temp = document.createElement('div')
  temp.innerHTML = html
  return temp.textContent || temp.innerText || ''
}

export const isValidHttpUrl = (url) => {
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

export const validateNewsletter = (form) => {
  // Required fields
  if (!form.fileName?.trim()) {
    return { ok: false, message: 'File name is required' }
  }
  
  if (!form.description?.trim()) {
    return { ok: false, message: 'Description is required' }
  }
  
  if (!form.linkUrl?.trim()) {
    return { ok: false, message: 'Link URL is required' }
  }
  
  // Validate URL format
  if (!isValidHttpUrl(form.linkUrl)) {
    return { ok: false, message: 'Please enter a valid URL (http:// or https://)' }
  }
  
  // Image is required (either file or preview/url)
  if (!form.file && !form.imagePreviewUrl && !form.imageUrl) {
    return { ok: false, message: 'Image is required' }
  }
  
  return { ok: true, message: '' }
}
