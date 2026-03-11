import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import ModalLifecycleLock from './ModalLifecycleLock'
import ConfirmLogoutModal from './ConfirmLogoutModal'
import '../../styles/components/MoreModal.scss'

const MOBILE_Q = '(max-width: 768px)'

const MoreModal = ({ isOpen, onClose, onClosingChange }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, logout } = useAuth()
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.matchMedia(MOBILE_Q).matches
    } catch {
      return false
    }
  })

  useEffect(() => {
    try {
      const mql = window.matchMedia(MOBILE_Q)
      const onChange = () => setIsMobile(mql.matches)
      mql.addEventListener('change', onChange)
      return () => mql.removeEventListener('change', onChange)
    } catch {
      return undefined
    }
  }, [])

  useBodyScrollLock(isOpen)

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen && !isClosing) {
        handleClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, isClosing])

  const handleClose = () => {
    if (isClosing) return
    setIsClosing(true)
    if (onClosingChange) onClosingChange(true)
    setTimeout(() => {
      onClose()
      setIsClosing(false)
      if (onClosingChange) onClosingChange(false)
    }, 250)
  }

  useEffect(() => {
    if (onClosingChange) {
      onClosingChange(isClosing)
    }
  }, [isClosing, onClosingChange])

  const modalBackdropClose = useModalBackdropClose(handleClose)

  if (!isOpen && !isClosing) return null

  const isAdmin = user?.role === 'admin'

  const handleNavClick = (path) => {
    navigate(path)
    handleClose()
  }

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true)
  }

  const handleConfirmLogout = () => {
    try {
      if (logout) {
        logout()
      } else {
        try { localStorage.removeItem('user') } catch {}
        try { localStorage.removeItem('auth') } catch {}
        try { localStorage.removeItem('token') } catch {}
        try { localStorage.removeItem('session') } catch {}
      }
    } finally {
      setIsLogoutModalOpen(false)
      onClose()
      navigate('/login')
    }
  }

  const isActive = (path) => {
    return location.pathname === path
  }

  const menuItems = [
    {
      path: '/newsletters',
      icon: 'bi bi-file-earmark-text',
      label: 'Newsletters'
    },
    {
      path: '/communications-playbook',
      icon: 'bi bi-journal-text',
      label: isMobile ? 'Playbook' : 'Communications Playbook'
    },
    {
      path: '/membership',
      icon: 'bi bi-people',
      label: isAdmin ? 'Memberships' : 'Membership'
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
      path: '/gallery',
      icon: 'bi bi-images',
      label: 'Gallery'
    },
    {
      path: '/reports',
      icon: 'bi bi-file-earmark',
      label: 'Publications'
    },
    {
      path: '/profile',
      icon: 'bi bi-gear',
      label: 'Profile'
    }
  ]

  return (
    <div
      className={`more-modal-overlay ${isClosing ? 'closing' : ''}`}
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className={`more-modal ${isClosing ? 'closing' : ''}`}
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
      >

        <div className="more-modal-content">
          <div className="more-modal-grid">
            {menuItems.map((item) => (
              <button
                key={item.path}
                type="button"
                className={`more-modal-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => handleNavClick(item.path)}
              >
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </button>
            ))}
            <button
              type="button"
              className="more-modal-item more-modal-item--logout"
              onClick={handleLogoutClick}
            >
              <i className="bi bi-power"></i>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleConfirmLogout}
      />
    </div>
  )
}

export default MoreModal

