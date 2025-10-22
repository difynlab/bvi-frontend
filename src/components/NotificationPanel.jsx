import React from 'react'
import '../styles/components/NotificationDropdown.scss'

const NotificationPanel = ({
  notifications,
  unreadCount,
  onNotificationClick,
  onMarkAllAsRead,
  onRemoveNotification,
  formatTimeAgo,
  formatEventDate,
  getNotificationIcon,
  getNotificationColor
}) => {
  return (
    <div className="notification-panel">
      <div className="notification-header">
        <h3>Notifications</h3>
        {unreadCount > 0 && (
          <button 
            className="mark-all-read-btn"
            onClick={onMarkAllAsRead}
          >
            Mark all as read
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
              onClick={() => onNotificationClick(notification)}
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
                onClick={(e) => onRemoveNotification(e, notification.id)}
                aria-label="Remove notification"
              >
                <i className="bi bi-x"></i>
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default NotificationPanel
