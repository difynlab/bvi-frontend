import React, { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './useAuth'
import notificationsService from '../services/notificationsService'

const NotificationContext = createContext()

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

const normalizeNotification = (item, type, category = '') => {
  const baseNotification = {
    id: `notification-${type}-${item.id || Date.now()}-${Math.random()}`,
    read: false,
    timestamp: item.created_at || item.updated_at || new Date().toISOString(),
    type: type
  }

  switch (type) {
    case 'event':
      return {
        ...baseNotification,
        title: item.title || item.name || 'New Event',
        eventDate: item.date || item.event_date,
        eventTime: item.time || item.event_time,
        eventLocation: item.location || item.event_location,
        data: item
      }
    case 'notice':
      return {
        ...baseNotification,
        title: item.title || item.name || 'New Notice',
        data: item
      }
    case 'newsletter':
      return {
        ...baseNotification,
        title: item.name || item.title || 'New Newsletter',
        data: item
      }
    case 'report':
      return {
        ...baseNotification,
        title: item.title || item.name || 'New Report',
        data: item
      }
    case 'legislation':
      return {
        ...baseNotification,
        title: item.title || 'New Legislation',
        data: item
      }
    case 'user':
      return {
        ...baseNotification,
        title: `New User: ${item.first_name || ''} ${item.last_name || ''}`.trim() || 'New User Registered',
        data: item
      }
    case 'payment':
      return {
        ...baseNotification,
        title: `New Payment: ${item.amount || ''} ${item.currency || 'USD'}`.trim() || 'New Payment',
        data: item
      }
    default:
      return {
        ...baseNotification,
        title: 'New Notification',
        data: item
      }
  }
}

const normalizeApiResponse = (data, isAdmin) => {
  if (!data || !data.data) {
    return { notifications: [], unreadCount: 0 }
  }

  const normalizedNotifications = []
  const apiData = data.data

  if (isAdmin) {
    if (Array.isArray(apiData.users)) {
      apiData.users.forEach(user => {
        normalizedNotifications.push(normalizeNotification(user, 'user'))
      })
    }
    if (Array.isArray(apiData.payments)) {
      apiData.payments.forEach(payment => {
        normalizedNotifications.push(normalizeNotification(payment, 'payment'))
      })
    }
  } else {
    if (Array.isArray(apiData.events)) {
      apiData.events.forEach(event => {
        normalizedNotifications.push(normalizeNotification(event, 'event'))
      })
    }
    if (Array.isArray(apiData.notices)) {
      apiData.notices.forEach(notice => {
        normalizedNotifications.push(normalizeNotification(notice, 'notice'))
      })
    }
    if (Array.isArray(apiData.newsletters)) {
      apiData.newsletters.forEach(newsletter => {
        normalizedNotifications.push(normalizeNotification(newsletter, 'newsletter'))
      })
    }
    if (Array.isArray(apiData.reports)) {
      apiData.reports.forEach(report => {
        normalizedNotifications.push(normalizeNotification(report, 'report'))
      })
    }
    if (Array.isArray(apiData.legislations)) {
      apiData.legislations.forEach(legislation => {
        normalizedNotifications.push(normalizeNotification(legislation, 'legislation'))
      })
    }
  }

  const unreadCount = data.data?.counts?.total || 0

  return {
    notifications: normalizedNotifications,
    unreadCount: unreadCount
  }
}

export const NotificationProvider = ({ children }) => {
  const authContext = useAuth()
  const user = authContext?.user || null
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const pollingIntervalRef = useRef(null)
  const isAdmin = user?.role === 'admin'

  const loadNotifications = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const token = localStorage.getItem('token')
      if (!token) {
        setNotifications([])
        setUnreadCount(0)
        setIsLoading(false)
        return
      }

      const currentUser = authContext?.user || null
      const currentIsAdmin = currentUser?.role === 'admin'

      const response = await notificationsService.getNotifications()
      
      if (response && response.data) {
        const normalized = normalizeApiResponse(response, currentIsAdmin)
        setNotifications(normalized.notifications)
        setUnreadCount(normalized.unreadCount)
      } else {
        setNotifications([])
        setUnreadCount(0)
      }
    } catch (error) {
      console.error('Error loading notifications:', error)
      setError(error.message)
      setNotifications([])
      setUnreadCount(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadNotifications()

      pollingIntervalRef.current = setInterval(() => {
        loadNotifications()
      }, 60000)

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
        }
      }
    } else {
      setNotifications([])
      setUnreadCount(0)
      setIsLoading(false)
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [user?.id, user?.role])

  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now() + Math.random(),
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    }
    
    setNotifications(prev => [newNotification, ...prev])
  }

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      )
    )
  }

  const markAllAsRead = async () => {
    try {
      await notificationsService.markAsSeen()
      await loadNotifications()
    } catch (error) {
      console.error('Error marking notifications as seen:', error)
      setNotifications(prev => 
        prev.map(n => ({ ...n, read: true }))
      )
    }
  }

  const clearNotifications = () => {
    setNotifications([])
    setUnreadCount(0)
  }

  const removeNotification = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId))
  }

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    addNotification,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    removeNotification,
    refreshNotifications: loadNotifications
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}

// TODO: Implementar sistema real con WebSockets
// const useWebSocketNotifications = () => {
//   useEffect(() => {
//     const ws = new WebSocket('ws://localhost:8000/ws/notifications')
//     
//     ws.onmessage = (event) => {
//       const notification = JSON.parse(event.data)
//       addNotification(notification)
//     }
//     
//     return () => ws.close()
//   }, [])
// }
