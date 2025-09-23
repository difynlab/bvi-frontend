import React from 'react'
import { NavLink } from 'react-router-dom'
import '../styles/components/SideNav.scss'

const SideNav = () => {
  return (
    <nav className="side-nav">
      {/* Header Section */}
      <div className="nav-header">
        <div className="logo-section">
          <div className="logo">
            <div className="logo-triangle red"></div>
            <div className="logo-triangle blue"></div>
          </div>
          <div className="brand-info">
            <h1 className="brand-name">BVI Finance</h1>
            <p className="brand-slogan">your international business partner</p>
          </div>
        </div>
        <div className="notification-icon">
          <i className="bi bi-bell"></i>
          <span className="notification-badge"></span>
        </div>
      </div>

      {/* Navigation Links */}
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

        <NavLink to="/newsletter" className="nav-item">
          <i className="bi bi-file-earmark-text"></i>
          <span>Newsletter</span>
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

        <NavLink to="/settings" className="nav-item">
          <i className="bi bi-gear"></i>
          <span>Settings</span>
        </NavLink>

        <NavLink to="/logout" className="nav-item">
          <i className="bi bi-power"></i>
          <span>Logout</span>
        </NavLink>
      </div>

      <div className="user-profile">
        <div className="profile-picture">
          <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face" alt="Profile" />
        </div>
        <div className="profile-info">
          <h3 className="user-name">Johnston</h3>
          <p className="user-role">Lorem</p>
        </div>
      </div>
    </nav>
  )
}

export default SideNav
