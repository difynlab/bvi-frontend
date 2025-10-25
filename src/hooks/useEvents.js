import { useState, useEffect, useCallback } from 'react'
import eventsService from '../services/eventsService'
import { transformFromBackend, transformToBackend, saveEventImageToLocalStorage, removeEventImageFromLocalStorage, getImageFromLocalStorage, removeImageFromLocalStorage } from '../utils/eventTransformers'
import { useNotifications } from '../context/NotificationContext'

const CACHE_KEY = 'events_cache'
const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutos en milisegundos

const sortEventsByDate = (events) => {
  return events.sort((a, b) => {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA - dateB
  })
}

const formatDate = (dateString) => {
  const date = new Date(dateString + 'T12:00:00')
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

const getCachedEvents = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()
    
    if (now - timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(CACHE_KEY)
      return null
    }
    
    return data
  } catch (error) {
    console.error('Error reading events cache:', error)
    localStorage.removeItem(CACHE_KEY)
    return null
  }
}

const setCachedEvents = (eventsData) => {
  try {
    const cacheData = {
      data: eventsData,
      timestamp: Date.now()
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
  } catch (error) {
    if (error.name === 'QuotaExceededError') {
      console.warn('localStorage quota exceeded, clearing cache and retrying...')
      // Clear cache and try again
      clearEventsCache()
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
      } catch (retryError) {
        console.warn('Cache disabled due to storage limitations')
      }
    } else {
      console.error('Error saving events cache:', error)
    }
  }
}

const clearEventsCache = () => {
  localStorage.removeItem(CACHE_KEY)
}

const clearAllEventsData = () => {
  // Clear events cache
  localStorage.removeItem(CACHE_KEY)
  // Clear events images
  localStorage.removeItem('eventsImages')
  console.log('🧹 Cleared all events data from localStorage')
}

const getStorageUsage = () => {
  try {
    const used = JSON.stringify(localStorage).length
    const usedKB = (used / 1024).toFixed(2)
    const usedMB = (used / (1024 * 1024)).toFixed(2)
    console.log(`📊 localStorage usage: ${usedKB} KB (${usedMB} MB)`)
    return { used, usedKB, usedMB }
  } catch (error) {
    console.error('Error checking storage usage:', error)
    return null
  }
}

export const useEvents = () => {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 6,
    total: 0
  })
  const { addNotification } = useNotifications()

  const loadEvents = useCallback(async (page = 1, forceRefresh = false) => {
    if (!forceRefresh && page === 1) {
      const cachedData = getCachedEvents()
      if (cachedData) {
        setEvents(cachedData.events)
        setPagination(cachedData.pagination)
        setError(null)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const response = await eventsService.getEvents(pagination.per_page, page)
      
      if (response.http_status === 200 && response.data) {
        const transformedEvents = response.data.data.map(transformFromBackend)
        const sortedEvents = sortEventsByDate(transformedEvents)
        
        const eventsData = {
          events: sortedEvents,
          pagination: {
            current_page: response.data.current_page,
            last_page: response.data.last_page,
            per_page: response.data.per_page,
            total: response.data.total
          }
        }
        
        setEvents(sortedEvents)
        setPagination(eventsData.pagination)
        
        if (page === 1) {
          setCachedEvents(eventsData)
        }
      }
    } catch (err) {
      if (err.message.includes('No data found')) {
        setEvents([])
        setError('No data found')
      } else {
        console.error('Error loading events:', err)
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }, [pagination.per_page])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  const createEvent = useCallback(async (eventData) => {
    setLoading(true)
    setError(null)

    try {
      // TODO PRODUCTION: CHANGE IMAGES - Save image to localStorage before sending to backend
      // Generate temporary ID for localStorage storage
      const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`
      if (eventData.file) {
        await saveEventImageToLocalStorage(tempId, eventData.file)
      }
      
      const backendData = transformToBackend(eventData, false)
      const response = await eventsService.createEvent(backendData)
      
      if (response.http_status === 200) {
        const backendEvent = response.data
        
        // TODO PRODUCTION: CHANGE IMAGES - Move image from temp ID to real backend ID FIRST
        if (eventData.file && backendEvent.id) {
          // Get image from temp storage
          const tempImage = getImageFromLocalStorage(tempId, 'original')
          const tempBlurred = getImageFromLocalStorage(tempId, 'blurred')
          
          if (tempImage) {
            // Save with real backend ID - WAIT for it to complete
            await saveEventImageToLocalStorage(backendEvent.id, eventData.file)
            // Clean up temp storage
            removeImageFromLocalStorage(tempId, 'all')
          }
        }
        
        // NOW apply localStorage image logic to the new event (after moving the image)
        const eventWithImages = transformFromBackend(backendEvent)
        setEvents(prev => sortEventsByDate([...prev, eventWithImages]))
        clearEventsCache()
        
        // Agregar notificación de evento creado
        addNotification({
          type: 'event_created',
          title: eventWithImages.title,
          message: `Check the new scheduled event on ${formatDate(eventWithImages.date)}`,
          eventDate: eventWithImages.date,
          eventTime: `${eventWithImages.startTime} - ${eventWithImages.endTime}`,
          eventLocation: eventWithImages.location
        })
      }
    } catch (err) {
      console.error('Error creating event:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const updateEvent = useCallback(async (eventData) => {
    setLoading(true)
    setError(null)

    try {
      const existingEvent = events.find(e => e.id === eventData.id)
      const existingThumbnail = existingEvent?.imageFileName || existingEvent?.thumbnail || ''
      
      // TODO PRODUCTION: CHANGE IMAGES - Save image to localStorage before sending to backend
      // Handle image storage for updates
      if (eventData.file) {
        // Save new image to localStorage for the existing event ID
        await saveEventImageToLocalStorage(eventData.id, eventData.file)
      }
      
      const backendData = transformToBackend(eventData, true, existingThumbnail)
      const response = await eventsService.updateEvent(eventData.id, backendData)
      
      if (response.http_status === 200) {
        const updatedEvent = transformFromBackend(response.data)
        setEvents(prev => {
          const updatedEvents = prev.map(e => e.id === eventData.id ? updatedEvent : e)
          return sortEventsByDate(updatedEvents)
        })
        clearEventsCache()
        
        // Notificación de evento actualizado deshabilitada
        // addNotification({
        //   type: 'event_updated',
        //   title: 'Event Updated',
        //   message: `"${updatedEvent.title}" has been updated successfully`
        // })
      }
    } catch (err) {
      console.error('Error updating event:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [events])

  const deleteEvent = useCallback(async (id) => {
    setLoading(true)
    setError(null)

    try {
      // TODO PRODUCTION: CHANGE IMAGES - Remove image from localStorage when deleting event
      console.log('🗑️ Removing event image from localStorage')
      removeEventImageFromLocalStorage(id)
      
      // Obtener el evento antes de eliminarlo para la notificación
      const eventToDelete = events.find(e => e.id === id)
      
      const response = await eventsService.deleteEvent(id)
      
      if (response.http_status === 200) {
        setEvents(prev => prev.filter(e => e.id !== id))
        clearEventsCache()
        
        // Notificación de evento eliminado deshabilitada
        // if (eventToDelete) {
        //   addNotification({
        //     type: 'event_deleted',
        //     title: 'Event Deleted',
        //     message: `"${eventToDelete.title}" has been deleted successfully`
        //   })
        // }
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [events, addNotification])

  const refreshEvents = useCallback(() => {
    loadEvents(pagination.current_page, true)
  }, [loadEvents, pagination.current_page])

  const changePage = useCallback((page) => {
    loadEvents(page)
  }, [loadEvents])

  return {
    events,
    loading,
    error,
    pagination,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    changePage,
    clearCache: clearEventsCache,
    // Utility functions for debugging
    clearAllEventsData,
    getStorageUsage
  }
}
