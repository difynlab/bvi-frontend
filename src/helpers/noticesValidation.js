export const stripHtmlToPlainText = (html) => {
  if (!html) return ''
  
  // Create a temporary div element
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Get text content and clean up whitespace
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

export const validateNotice = (form, categories) => {
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
  if (form.linkUrl && !isValidHttpUrl(form.linkUrl)) {
    errors.push('Please enter a valid URL (http:// or https://).')
  }
  
  // Convert array to single error message
  const message = errors.length > 0 ? errors.join(' ') : ''
  
  return {
    ok: message === '',
    message
  }
}
