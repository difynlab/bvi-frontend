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
    console.error('Error saving events cache:', error)
  }
}

const clearEventsCache = () => {
  localStorage.removeItem(CACHE_KEY)
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
      const backendData = transformToBackend(eventData, false)
      const response = await eventsService.createEvent(backendData)
      
      if (response.http_status === 200) {
        const newEvent = transformFromBackend(response.data)
        setEvents(prev => sortEventsByDate([...prev, newEvent]))
        clearEventsCache()
        
        // Agregar notificación de evento creado
        addNotification({
          type: 'event_created',
          title: newEvent.title,
          message: `Check the new scheduled event on ${formatDate(newEvent.date)}`,
          eventDate: newEvent.date,
          eventTime: `${newEvent.startTime} - ${newEvent.endTime}`,
          eventLocation: newEvent.location
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
    clearCache: clearEventsCache
  }
}
