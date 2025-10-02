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

const ALLOWED_REPEAT = ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM']

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
  
  // Validate repeat field - coerce to NONE if invalid
  if (form.repeat && !ALLOWED_REPEAT.includes(form.repeat)) {
    form.repeat = 'NONE'
  }
  
  // Convert array to single error message
  const message = errors.length > 0 ? errors.join(' ') : ''
  
  return {
    ok: message === '',
    message
  }
}

// Validate custom recurrence settings
export const validateRecurrence = (recurrence) => {
  const errors = {}
  
  // Validate interval
  if (!recurrence.interval || recurrence.interval < 1) {
    errors.interval = 'Interval must be at least 1'
  }
  
  // Validate days of week for weekly recurrence
  if (recurrence.unit === 'week' && recurrence.kind === 'CUSTOM') {
    if (!recurrence.daysOfWeek || recurrence.daysOfWeek.length === 0) {
      errors.daysOfWeek = 'Select at least one day'
    }
  }
  
  // Validate ends
  if (recurrence.ends) {
    if (recurrence.ends.mode === 'ON_DATE') {
      if (!recurrence.ends.date) {
        errors.endsDate = 'Date is required'
      } else {
        const today = new Date().toISOString().split('T')[0]
        if (recurrence.ends.date < today) {
          errors.endsDate = 'Date must be today or later'
        }
      }
    } else if (recurrence.ends.mode === 'AFTER_OCCURRENCES') {
      if (!recurrence.ends.count || recurrence.ends.count < 1) {
        errors.endsCount = 'Count must be at least 1'
      }
    }
  }
  
  return {
    ok: Object.keys(errors).length === 0,
    errors
  }
}
