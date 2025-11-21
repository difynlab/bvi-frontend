import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import NotificationTrigger from './NotificationTrigger'
import NotificationPanel from './NotificationPanel'
import { useNotificationDropdown } from '../hooks/useNotificationDropdown'
import '../styles/components/MobileHeader.scss'

const MOBILE_Q = '(max-width: 768px)'

const MobileHeader = () => {
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.matchMedia(MOBILE_Q).matches
    } catch {
      return false
    }
  })
  const location = useLocation()
  const { user } = useAuth()
  const notificationHook = useNotificationDropdown()

  useEffect(() => {
    try {
      const mql = window.matchMedia(MOBILE_Q)
      const onChange = () => {
        setIsMobile(mql.matches)
      }
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    } catch (error) {
      console.warn('matchMedia not supported:', error)
    }
  }, [])

  const shouldHide = ['/login', '/register', '/forgot-password'].includes(location.pathname) || 
                     location.pathname.startsWith('/reset-password')

  if (!isMobile || shouldHide) return null

  const firstName = user?.first_name || ''
  const lastName = user?.last_name || ''
  const displayName = `${firstName} ${lastName}`.trim() || 'Member'

  return (
    <>
      <header className="mobile-header">
        <div className="mobile-header-content">
          <div className="mobile-header-logo">
            <img src="/BVI-logo.png" alt="BVI Finance Logo" />
          </div>

          <div className="mobile-header-actions">
            <NotificationTrigger 
              isOpen={notificationHook.isOpen}
              unreadCount={notificationHook.unreadCount}
              onToggle={notificationHook.handleToggle}
            />

            <NavLink to="/profile" className="mobile-header-profile">
              <div className="mobile-header-avatar">
                {(() => {
                  const avatarSrc = user?.original_image || user?.profilePictureUrl || user?.profile_picture_url || ''
                  return avatarSrc ? (
                    <img className="mobile-header-avatar-img" src={avatarSrc} alt={`${user?.first_name || 'Member'} profile`} />
                  ) : (
                    <i className="bi bi-person-fill mobile-header-avatar-icon" aria-label="profile icon" />
                  )
                })()}
              </div>
            </NavLink>
          </div>
        </div>
      </header>

      {notificationHook.isOpen && (
        <div className="mobile-header-notification-wrapper">
          <NotificationPanel
            notifications={notificationHook.notifications}
            unreadCount={notificationHook.unreadCount}
            onNotificationClick={notificationHook.handleNotificationClick}
            onMarkAllAsRead={notificationHook.handleMarkAllAsRead}
            onRemoveNotification={notificationHook.handleRemoveNotification}
            formatTimeAgo={notificationHook.formatTimeAgo}
            formatEventDate={notificationHook.formatEventDate}
            getNotificationIcon={notificationHook.getNotificationIcon}
            getNotificationColor={notificationHook.getNotificationColor}
          />
        </div>
      )}
    </>
  )
}

export default MobileHeader

