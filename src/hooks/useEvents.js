import { useState, useEffect, useCallback, useMemo } from 'react'
import eventsService from '../services/eventsService'
import { transformFromBackend, transformToBackend } from '../utils/eventTransformers'
import { useNotifications } from '../context/NotificationContext'

const CACHE_KEY = 'events_cache'
const CACHE_EXPIRY_TIME = 5 * 60 * 1000 // 5 minutos en milisegundos

const sortEventsByDate = (events) => {
  return events.sort((a, b) => {
    let dateA, dateB
    
    if (!a.date) {
      return 1
    }
    if (!b.date) {
      return -1
    }
    
    if (typeof a.date === 'string' && a.date.includes('T')) {
      dateA = new Date(a.date)
    } else if (typeof a.date === 'string') {
      dateA = new Date(a.date + 'T12:00:00')
    } else {
      dateA = new Date(a.date)
    }
    
    if (typeof b.date === 'string' && b.date.includes('T')) {
      dateB = new Date(b.date)
    } else if (typeof b.date === 'string') {
      dateB = new Date(b.date + 'T12:00:00')
    } else {
      dateB = new Date(b.date)
    }
    
    const isValidA = !isNaN(dateA.getTime())
    const isValidB = !isNaN(dateB.getTime())
    
    if (!isValidA && !isValidB) return 0
    if (!isValidA) return 1
    if (!isValidB) return -1
    
    return dateB.getTime() - dateA.getTime()
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
  localStorage.removeItem(CACHE_KEY)
}

const getStorageUsage = () => {
  try {
    const used = JSON.stringify(localStorage).length
    const usedKB = (used / 1024).toFixed(2)
    const usedMB = (used / (1024 * 1024)).toFixed(2)
    return { used, usedKB, usedMB }
  } catch (error) {
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

  const loadEvents = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cachedData = getCachedEvents()
      if (cachedData && Array.isArray(cachedData)) {
        setEvents(cachedData)
        setError(null)
        return
      }
    }

    setLoading(true)
    setError(null)

    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('404')) {
        return
      }
      originalConsoleError.apply(console, args)
    }

    try {
      const allEvents = []
      let currentPage = 1
      let hasMorePages = true
      const perPage = 100

      while (hasMorePages) {
        const response = await eventsService.getEvents(perPage, currentPage)

        if (response.http_status === 200 && response.data) {
          const transformedEvents = response.data.data ? response.data.data.map(transformFromBackend) : []
          allEvents.push(...transformedEvents)

          const totalPages = response.data.last_page || 1

          if (currentPage >= totalPages || transformedEvents.length === 0) {
            hasMorePages = false
          } else {
            currentPage++
          }
        } else if (response.http_status === 404) {
          hasMorePages = false
          if (allEvents.length === 0) {
            setEvents([])
          }
        } else {
          hasMorePages = false
        }
      }

      if (allEvents.length > 0) {
        const sortedEvents = sortEventsByDate(allEvents)
        setEvents(sortedEvents)
        setCachedEvents(sortedEvents)
      } else {
        setEvents([])
      }
      setError(null)
    } catch (err) {
      if (err.message.includes('No data found') || err.message.includes('No events found')) {
        setEvents([])
        setError(null)
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
      console.error = originalConsoleError
    }
  }, [])

  useEffect(() => {
    loadEvents()
  }, [loadEvents])

  useEffect(() => {
    const totalEvents = events.length
    const totalPages = Math.ceil(totalEvents / pagination.per_page) || 1
    const adjustedPage = pagination.current_page > totalPages ? 1 : pagination.current_page

    setPagination(prev => ({
      ...prev,
      current_page: adjustedPage,
      last_page: totalPages,
      total: totalEvents
    }))
  }, [events.length, pagination.per_page])

  const visibleEvents = useMemo(() => {
    if (!events.length) {
      return []
    }

    const currentPage = pagination.current_page > pagination.last_page ? 1 : pagination.current_page
    const startIndex = (currentPage - 1) * pagination.per_page
    const endIndex = startIndex + pagination.per_page

    return events.slice(startIndex, endIndex)
  }, [events, pagination.current_page, pagination.per_page, pagination.last_page])

  const createEvent = useCallback(async (eventData) => {
    setLoading(true)
    setError(null)

    try {
      const backendData = transformToBackend(eventData, false)
      const response = await eventsService.createEvent(backendData)
      
      if (response.http_status === 200) {
        const backendEvent = response.data
        const eventWithImages = transformFromBackend(backendEvent)
        clearEventsCache()
        
        await loadEvents(true)
        
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
      const errorMessage = err.message || 'An error occurred while creating the event'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [loadEvents, addNotification])

  const updateEvent = useCallback(async (eventData) => {
    setLoading(true)
    setError(null)

    try {
      const existingEvent = events.find(e => e.id === eventData.id)
      const existingThumbnail = existingEvent?.imageFileName || existingEvent?.thumbnail || ''
      
      const backendData = transformToBackend(eventData, true, existingThumbnail)
      const response = await eventsService.updateEvent(eventData.id, backendData)
      
      if (response.http_status === 200) {
        clearEventsCache()
        
        await loadEvents(true)
        
        return { success: true, response }
      } else {
        // Error response from server
        const errorMessage = response.message || `Error: HTTP ${response.http_status}`
        setError(errorMessage)
        return { success: false, error: errorMessage, response }
      }
    } catch (err) {
      const errorMessage = err.message || 'An error occurred while updating the event'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [events, pagination, loadEvents])

  const deleteEvent = useCallback(async (id) => {
    setLoading(true)
    setError(null)

    try {
      const eventToDelete = events.find(e => e.id === id)
      
      const response = await eventsService.deleteEvent(id)
      
      if (response?.http_status === 200 || response?.http_status === 204) {
        clearEventsCache()
        await loadEvents(true)
      }
    } catch (err) {
      console.error('Error deleting event:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [events, loadEvents])

  const refreshEvents = useCallback(() => {
    loadEvents(true)
  }, [loadEvents])

  const changePage = useCallback((page) => {
    setPagination(prev => ({
      ...prev,
      current_page: page
    }))
  }, [])

  return {
    events,
    visibleEvents,
    loading,
    error,
    pagination,
    createEvent,
    updateEvent,
    deleteEvent,
    refreshEvents,
    changePage,
    clearCache: clearEventsCache,
    clearAllEventsData,
    getStorageUsage
  }
}
