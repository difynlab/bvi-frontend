import { useState, useEffect, useCallback } from 'react'
import eventsService from '../services/eventsService'
import { transformFromBackend, transformToBackend } from '../utils/eventTransformers'
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
      
      if ((response.http_status === 200 || response.http_status === 404) && response.data) {
        const transformedEvents = response.data.data ? response.data.data.map(transformFromBackend) : []
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
        setError(null) // Clear any previous errors
        
        if (page === 1) {
          setCachedEvents(eventsData)
        }
      }
    } catch (err) {
      if (err.message.includes('No data found')) {
        setEvents([])
        setError(null) // Don't set error for no data found
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
      const backendData = transformToBackend(eventData, false)
      const response = await eventsService.createEvent(backendData)
      
      if (response.http_status === 200) {
        const backendEvent = response.data
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
        
        return { success: true, response }
      } else {
        // Error response from server
        const errorMessage = response.message || `Error: HTTP ${response.http_status}`
        setError(errorMessage)
        return { success: false, error: errorMessage, response }
      }
    } catch (err) {
      console.error('Error creating event:', err)
      const errorMessage = err.message || 'An error occurred while creating the event'
      setError(errorMessage)
      return { success: false, error: errorMessage }
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
        
        return { success: true, response }
      } else {
        // Error response from server
        const errorMessage = response.message || `Error: HTTP ${response.http_status}`
        setError(errorMessage)
        return { success: false, error: errorMessage, response }
      }
    } catch (err) {
      console.error('Error updating event:', err)
      const errorMessage = err.message || 'An error occurred while updating the event'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [events])

  const deleteEvent = useCallback(async (id) => {
    setLoading(true)
    setError(null)

    try {
      // Obtener el evento antes de eliminarlo para la notificación
      const eventToDelete = events.find(e => e.id === id)
      
      const response = await eventsService.deleteEvent(id)
      
      if (response.http_status === 200) {
        clearEventsCache()
        
        // Calculate what page we should be on after deletion
        const remainingItems = pagination.total - 1
        const totalPages = Math.ceil(remainingItems / pagination.per_page)
        
        // If current page would be empty, go to previous page
        let pageToLoad = pagination.current_page
        if (pagination.current_page > totalPages && totalPages > 0) {
          pageToLoad = totalPages
        }
        
        // Reload events from the appropriate page to maintain 6 items per page
        loadEvents(pageToLoad, true)
        
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
  }, [events, addNotification, pagination, loadEvents])

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
