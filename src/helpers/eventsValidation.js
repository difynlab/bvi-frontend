export const stripHtmlToPlainText = (html) => {
  if (!html) return ''
  
  // Create a temporary div element
  const temp = document.createElement('div')
  temp.innerHTML = html
  
  // Get text content and clean up whitespace
  return temp.textContent || temp.innerText || ''
}

export const isTimeOrderValid = (start, end) => {
  if (!start || !end) return false
  
  const [startHour, startMin] = start.split(':').map(Number)
  const [endHour, endMin] = end.split(':').map(Number)
  
  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin
  
  return startMinutes < endMinutes
}

export const validateEvent = (form) => {
  const errors = []
  
  // Check all required fields are not empty
  if (!form.title?.trim()) {
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
  } else if (!form.description?.trim()) {
    errors.push('Please complete all required fields.')
  } else if (!form.location?.trim()) {
    errors.push('Please complete all required fields.')
  }
  
  // Check image is required
  if (!form.file && !form.imagePreviewUrl) {
    errors.push('An image is required.')
  }
  
  // Check start time is before end time
  if (form.startTime && form.endTime && !isTimeOrderValid(form.startTime, form.endTime)) {
    errors.push('Start time must be earlier than end time.')
  }
  
  // Convert array to single error message
  const message = errors.length > 0 ? errors.join(' ') : ''
  
  return {
    ok: message === '',
    message
  }
}
