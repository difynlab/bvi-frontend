import React, { useState, useRef, useEffect } from 'react'
import { useNotifications } from '../context/NotificationContext'
import '../styles/components/NotificationDropdown.scss'

const MAX_BADGE = 99

const NotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification 
  } = useNotifications()
  const displayCount = unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : unreadCount

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
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
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
      if (sideNav && !sideNav.contains(e.target)) {
        // Si se hace click fuera del SideNav, cerrar también el dropdown
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

  return (
    <div className="notification-dropdown" ref={dropdownRef}>
      <button 
        className={`notification-trigger ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
      >
        <i className="bi bi-bell"></i>
        {unreadCount > 0 && (
          <span className="notification-badge">{displayCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Notifications</h3>
            {unreadCount > 0 && (
              <button 
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
              >
                <i className="bi bi-check-all"></i>
              </button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div className="notification-empty">
                <i className="bi bi-bell-slash"></i>
                <p>No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`notification-item ${!notification.read ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="notification-icon">
                    <i className={`bi ${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)}`}></i>
                  </div>
                  
                  <div className="notification-content">
                    <div className="notification-title">
                      {notification.title}
                    </div>
                    {notification.eventDate && (
                      <div className="notification-event-date">
                        <i className="bi bi-calendar3"></i>
                        {formatEventDate(notification.eventDate)}
                      </div>
                    )}
                    {notification.eventTime && (
                      <div className="notification-event-time">
                        <i className="bi bi-clock"></i>
                        {notification.eventTime}
                      </div>
                    )}
                    {notification.eventLocation && (
                      <div className="notification-event-location">
                        <i className="bi bi-geo-alt"></i>
                        {notification.eventLocation}
                      </div>
                    )}
                    <div className="notification-time">
                      {formatTimeAgo(notification.timestamp)}
                    </div>
                  </div>

                  <button
                    className="notification-remove"
                    onClick={(e) => handleRemoveNotification(e, notification.id)}
                    aria-label="Remove notification"
                  >
                    <i className="bi bi-x"></i>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default NotificationDropdown
