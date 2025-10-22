import React from 'react'
import '../styles/components/NotificationDropdown.scss'

const NotificationTrigger = ({ isOpen, unreadCount, onToggle }) => {
  return (
    <button 
      className={`notification-trigger ${isOpen ? 'active' : ''}`}
      onClick={onToggle}
      aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
    >
      <i className="bi bi-bell"></i>
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </button>
  )
}

export default NotificationTrigger
