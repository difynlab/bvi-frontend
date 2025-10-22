const FIELD_MAPPINGS = {
  frontendToBackend: {
    id: 'id',
    title: 'title',
    eventType: 'category',
    date: 'date',
    startTime: 'start_time',
    endTime: 'end_time',
    repeat: 'repeat',
    description: 'content',
    shortDescription: 'short_description',
    location: 'location',
    register_link: 'register_link',
    status: 'status'
  },
  backendToFrontend: {
    id: 'id',
    title: 'title',
    category: 'eventType',
    date: 'date',
    start_time: 'startTime',
    end_time: 'endTime',
    repeat: 'repeat',
    content: 'description',
    short_description: 'shortDescription',
    location: 'location',
    register_link: 'register_link',
    status: 'status',
    thumbnail: 'imageFileName',
    created_at: 'created_at',
    updated_at: 'updated_at'
  }
}

const VALUE_MAPPINGS = {
  eventType: {
    frontendToBackend: {
      'Workshop': 'workshop',
      'Webinar': 'webinar',
      'Conference': 'conference'
    },
    backendToFrontend: {
      'workshop': 'Workshop',
      'webinar': 'Webinar',
      'conference': 'Conference'
    }
  },
  repeat: {
    frontendToBackend: {
      'na': 'na',
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'annually': 'annually',
      'custom': 'custom'
    },
    backendToFrontend: {
      'na': 'na',
      'daily': 'daily',
      'weekly': 'weekly',
      'monthly': 'monthly',
      'annually': 'annually',
      'custom': 'custom'
    }
  }
}

const transformObject = (source, mappings, valueMappings = {}) => {
  const result = {}
  
  Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
    if (source[sourceKey] !== undefined && source[sourceKey] !== null) {
      let value = source[sourceKey]
      
      if (valueMappings[sourceKey]) {
        value = valueMappings[sourceKey][value] || value
      }
      
      result[targetKey] = value
    }
  })
  
  return result
}

const buildImageUrl = (thumbnail) => {
  if (!thumbnail) return ''
  
  const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'
  const apiBaseURL = baseURL.replace('/api', '')
  return `${apiBaseURL}/storage/events/${thumbnail}`
}

const extractShortDescription = (content) => {
  if (!content) return ''
  const plainText = content.replace(/<[^>]+>/g, '').trim()
  return plainText.length > 100 ? plainText.substring(0, 100) + '...' : plainText
}

export const transformToBackend = (frontendEvent, isUpdate = false, existingThumbnail = null) => {
  const baseData = transformObject(
    frontendEvent,
    FIELD_MAPPINGS.frontendToBackend,
    VALUE_MAPPINGS
  )

  baseData.short_description = baseData.short_description || extractShortDescription(baseData.content)

  if (isUpdate) {
    if (frontendEvent.file) {
      baseData.thumbnail = frontendEvent.file
    }
  } else {
    baseData.thumbnail = frontendEvent.file
  }

  return baseData
}

export const transformFromBackend = (backendEvent) => {
  const frontendEvent = transformObject(
    backendEvent,
    FIELD_MAPPINGS.backendToFrontend,
    VALUE_MAPPINGS
  )

  frontendEvent.imagePreviewUrl = buildImageUrl(backendEvent.thumbnail)
  frontendEvent.editorHtml = backendEvent.editorHtml || ''
  frontendEvent.timeZone = backendEvent.timeZone || 'UTC'
  frontendEvent.recurrence = backendEvent.recurrence || null

  return frontendEvent
}