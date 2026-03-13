import React from 'react'
import '../styles/components/NotificationDropdown.scss'

const MAX_BADGE = 99

const NotificationTrigger = ({ isOpen, unreadCount, onToggle }) => {
  const displayCount = unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : unreadCount
  return (
    <button 
      className={`notification-trigger ${isOpen ? 'active' : ''}`}
      onClick={onToggle}
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <i className="bi bi-bell"></i>
      {unreadCount > 0 && (
        <span className="notification-badge">{displayCount}</span>
      )}
    </button>
  )
}

export default NotificationTrigger
