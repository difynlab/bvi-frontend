import { useState, useRef, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useNotifications } from '../context/NotificationContext'

export const useNotificationDropdown = () => {
  const location = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification,
    refreshNotifications
  } = useNotifications()

  const prevPathRef = useRef(location.pathname)
  useEffect(() => {
    if (prevPathRef.current !== location.pathname) {
      prevPathRef.current = location.pathname
      refreshNotifications()
    }
  }, [location.pathname])

  useEffect(() => {
    if (isOpen) refreshNotifications()
  }, [isOpen])

  // Detectar si es mobile
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.matchMedia('(max-width: 768px)').matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    const mql = window.matchMedia('(max-width: 768px)')
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      const notificationPanel = document.querySelector('.notification-panel')
      const notificationTriggers = document.querySelectorAll('.notification-trigger')
      const mobileHeaderWrapper = document.querySelector('.mobile-header-notification-wrapper')
      
      let clickedOnTrigger = false
      notificationTriggers.forEach(trigger => {
        if (trigger.contains(event.target)) {
          clickedOnTrigger = true
        }
      })
      
      if (isOpen && 
          notificationPanel && 
          !notificationPanel.contains(event.target) &&
          !clickedOnTrigger &&
          (!mobileHeaderWrapper || !mobileHeaderWrapper.contains(event.target))) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
    }
  }, [isOpen])

  // Cerrar dropdown cuando se hace swipe para cerrar el SideNav o click fuera
  useEffect(() => {
    if (!isMobile || !isOpen) return

    let startX = 0
    let startY = 0
    let isDragging = false

    const handleTouchStart = (e) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
      isDragging = false
    }

    const handleTouchMove = (e) => {
      if (!isDragging) {
        const deltaX = Math.abs(e.touches[0].clientX - startX)
        const deltaY = Math.abs(e.touches[0].clientY - startY)
        
        // Determinar si es un swipe horizontal
        if (deltaX > deltaY && deltaX > 10) {
          isDragging = true
        }
      }
    }

    const handleTouchEnd = (e) => {
      if (isDragging) {
        const deltaX = e.changedTouches[0].clientX - startX
        
        // Si el swipe es hacia la izquierda (cerrar SideNav), cerrar también el dropdown
        if (deltaX < -50) {
          setIsOpen(false)
        }
      }
    }

    // Detectar clicks fuera del SideNav (que cierran el SideNav)
    const handleClickOutsideSideNav = (e) => {
      const sideNav = document.querySelector('.side-nav')
      const mobileHeader = document.querySelector('.mobile-header')
      const notificationPanel = document.querySelector('.notification-panel')
      const notificationTriggers = document.querySelectorAll('.notification-trigger')
      
      let clickedOnTrigger = false
      notificationTriggers.forEach(trigger => {
        if (trigger.contains(e.target)) {
          clickedOnTrigger = true
        }
      })
      
      if (sideNav && 
          !sideNav.contains(e.target) && 
          (!mobileHeader || !mobileHeader.contains(e.target)) &&
          (!notificationPanel || !notificationPanel.contains(e.target)) &&
          !clickedOnTrigger) {
        setIsOpen(false)
      }
    }

    // Agregar listeners al documento para capturar todos los swipes y clicks
    document.addEventListener('touchstart', handleTouchStart, { passive: true })
    document.addEventListener('touchmove', handleTouchMove, { passive: true })
    document.addEventListener('touchend', handleTouchEnd, { passive: true })
    document.addEventListener('click', handleClickOutsideSideNav)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('click', handleClickOutsideSideNav)
    }
  }, [isMobile, isOpen])

  const handleToggle = () => {
    if (!isOpen) refreshNotifications()
    setIsOpen(!isOpen)
  }

  const handleNotificationClick = (notification) => {
    if (!notification.read) {
      markAsRead(notification.id)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllAsRead()
  }

  const handleRemoveNotification = (e, notificationId) => {
    e.stopPropagation()
    removeNotification(notificationId)
  }

  const formatTimeAgo = (timestamp) => {
    const now = new Date()
    const notificationTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now - notificationTime) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours}h ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  const formatEventDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString + 'T12:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'event_created':
        return 'bi-calendar-plus'
      case 'event_updated':
        return 'bi-calendar-check'
      case 'event_deleted':
        return 'bi-calendar-x'
      default:
        return 'bi-bell'
    }
  }

  const getNotificationColor = (type) => {
    switch (type) {
      case 'event_created':
        return 'success'
      case 'event_updated':
        return 'warning'
      case 'event_deleted':
        return 'danger'
      default:
        return 'info'
    }
  }

  return {
    isOpen,
    setIsOpen,
    dropdownRef,
    notifications,
    unreadCount,
    isMobile,
    handleToggle,
    handleNotificationClick,
    handleMarkAllAsRead,
    handleRemoveNotification,
    formatTimeAgo,
    formatEventDate,
    getNotificationIcon,
    getNotificationColor
  }
}
