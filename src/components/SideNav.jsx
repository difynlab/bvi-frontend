import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ConfirmLogoutModal from './modals/ConfirmLogoutModal'
import '../styles/components/SideNav.scss'

const SideNav = () => {
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const openLogoutModal = () => setLogoutOpen(true);
  const closeLogoutModal = () => setLogoutOpen(false);

  const handleConfirmLogout = () => {
    try {
      if (logout) {
        logout();
      } else {
        try { localStorage.removeItem('user'); } catch {}
        try { localStorage.removeItem('auth'); } catch {}
        try { localStorage.removeItem('token'); } catch {}
        try { localStorage.removeItem('session'); } catch {}
      }
    } finally {
      closeLogoutModal();
      navigate('/login');
    }
    // TODO BACKEND: Invalidate server session/token before redirect
  };

  const displayName = user?.firstName || 'User'
  const role = user?.role || 'user'

  return (
    <nav className="side-nav">
      <div className="nav-header">
        <div className="logo-section">
          <img src="/logo.png" alt="BVI Finance Logo"></img>
        </div>
        <div className="notification-icon">
          <i className="bi bi-bell"></i>
          <span className="notification-badge"></span>
        </div>
      </div>

      <div className="nav-links">
        <NavLink to="/dashboard" className="nav-item">
          <i className="bi bi-grid"></i>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/events" className="nav-item">
          <i className="bi bi-calendar4-week"></i>
          <span>Events</span>
        </NavLink>

        <NavLink to="/notices" className="nav-item">
          <i className="bi bi-pencil-square"></i>
          <span>Notices</span>
        </NavLink>

        <NavLink to="/newsletters" className="nav-item">
          <i className="bi bi-file-earmark-text"></i>
          <span>Newsletters</span>
        </NavLink>

        <NavLink to="/membership" className="nav-item">
          <i className="bi bi-people"></i>
          <span>Membership</span>
        </NavLink>

        <NavLink to="/subscription" className="nav-item">
          <i className="bi bi-person-check"></i>
          <span>Subscription</span>
        </NavLink>

        <NavLink to="/legislation" className="nav-item">
          <i className="bi bi-book"></i>
          <span>Legislation</span>
        </NavLink>

        <NavLink to="/reports" className="nav-item">
          <i className="bi bi-file-earmark"></i>
          <span>Reports</span>
        </NavLink>
      </div>

      <div className="nav-footer">
        <NavLink to="/settings" className="nav-item">
          <i className="bi bi-gear"></i>
          <span>Settings</span>
        </NavLink>

        <button 
          type="button"
          className="nav-item nav-item--button"
          onClick={openLogoutModal}
        >
          <i className="bi bi-power"></i>
          <span>Logout</span>
        </button>

        <div className="user-profile">
          <div className="profile-picture">
            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="Profile" />
          </div>
          <div className="profile-info">
            <h3 className="user-name">{displayName}</h3>
            <p className="user-role">{role === 'admin' ? 'Administrator' : 'User'}</p>
          </div>
        </div>
      </div>

      <ConfirmLogoutModal 
        isOpen={isLogoutOpen} 
        onClose={closeLogoutModal} 
        onConfirm={handleConfirmLogout} 
      />
    </nav>
  )
}

export default SideNav
