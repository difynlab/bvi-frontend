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
  if (!form.fileName?.trim()) {
    return { ok: false, message: 'File name is required' }
  }
  
  if (!form.description?.trim()) {
    return { ok: false, message: 'Description is required' }
  }
  
  if (form.linkUrl && form.linkUrl.trim() && !isValidHttpUrl(form.linkUrl)) {
    return { ok: false, message: 'Please enter a valid URL (http:// or https://)' }
  }
  
  if (form.file && form.file.size > 15 * 1024 * 1024) {
    return { ok: false, message: 'The file must not exceed 15MB' }
  }
  
  return { ok: true, message: '' }
}
