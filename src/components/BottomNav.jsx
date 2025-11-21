import React, { useState, useEffect } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import MoreModal from './modals/MoreModal'
import '../styles/components/BottomNav.scss'

const MOBILE_Q = '(max-width: 768px)'

const BottomNav = () => {
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.matchMedia(MOBILE_Q).matches
    } catch {
      return false
    }
  })
  const [isMoreModalOpen, setIsMoreModalOpen] = useState(false)
  const [isModalClosing, setIsModalClosing] = useState(false)
  const location = useLocation()
  const { user } = useAuth()

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

  if (!isMobile) return null

  const openMoreModal = () => setIsMoreModalOpen(true)
  const closeMoreModal = () => setIsMoreModalOpen(false)

  const isActive = (path) => {
    return location.pathname === path
  }

  const isAdmin = user?.role === 'admin'
  
  const moreMenuItems = [
    {
      path: '/newsletters',
      icon: 'bi bi-file-earmark-text',
      label: 'Newsletters'
    },
    {
      path: '/membership',
      icon: 'bi bi-people',
      label: isAdmin ? 'Members' : 'Membership'
    },
    ...(!isAdmin ? [{
      path: '/subscription',
      icon: 'bi bi-person-check',
      label: 'Subscription'
    }] : []),
    {
      path: '/legislation',
      icon: 'bi bi-book',
      label: 'Legislation'
    },
    {
      path: '/reports',
      icon: 'bi bi-file-earmark',
      label: 'Reports'
    },
    {
      path: '/profile',
      icon: 'bi bi-gear',
      label: 'Profile'
    }
  ]

  const activeMoreItem = moreMenuItems.find(item => isActive(item.path))
  const showMoreItem = activeMoreItem || { icon: 'bi bi-list', label: 'More' }

  return (
    <>
      <nav className={`bottom-nav ${isMoreModalOpen && !isModalClosing ? 'bottom-nav--hidden' : ''}`} role="navigation" aria-label="Bottom Navigation">
        <NavLink
          to="/dashboard"
          className={`bottom-nav-item ${isActive('/dashboard') ? 'active' : ''}`}
        >
          <i className="bi bi-grid"></i>
          <span className="bottom-nav-label">Dashboard</span>
        </NavLink>

        <NavLink
          to="/events"
          className={`bottom-nav-item ${isActive('/events') ? 'active' : ''}`}
        >
          <i className="bi bi-calendar4-week"></i>
          <span className="bottom-nav-label">Events</span>
        </NavLink>

        <NavLink
          to="/notices"
          className={`bottom-nav-item ${isActive('/notices') ? 'active' : ''}`}
        >
          <i className="bi bi-pencil-square"></i>
          <span className="bottom-nav-label">Notices</span>
        </NavLink>

        <NavLink
          to="/find-expert"
          className={`bottom-nav-item ${isActive('/find-expert') ? 'active' : ''}`}
        >
          <i className="bi bi-file-person"></i>
          <span className="bottom-nav-label">F.A.E</span>
        </NavLink>

        <button
          type="button"
          className={`bottom-nav-item bottom-nav-item--more ${isMoreModalOpen || activeMoreItem ? 'active' : ''}`}
          onClick={openMoreModal}
          aria-label="More options"
        >
          <i className={showMoreItem.icon}></i>
          <span className="bottom-nav-label">
            {showMoreItem.label}
            {activeMoreItem && <i className="bi bi-chevron-down bottom-nav-chevron"></i>}
          </span>
        </button>
      </nav>

      <MoreModal isOpen={isMoreModalOpen} onClose={closeMoreModal} onClosingChange={setIsModalClosing} />
    </>
  )
}

export default BottomNav

