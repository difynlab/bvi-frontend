import React, { useState, useEffect, useMemo, useRef } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/useAuth'
import ConfirmLogoutModal from './modals/ConfirmLogoutModal'
import '../styles/components/SideNav.scss'

const MOBILE_Q = '(max-width: 768px)';
const OPEN_THRESHOLD = 24;   // px horizontal drag to open
const CLOSE_THRESHOLD = 24;  // px horizontal drag to close
const VERTICAL_TOLERANCE = 14; // px; ignore if vertical scroll dominates

const SideNav = () => {
  const [isLogoutOpen, setLogoutOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => {
    try {
      return window.matchMedia(MOBILE_Q).matches;
    } catch {
      return false; // fallback for older browsers
    }
  });
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const navRef = useRef(null);
  const dragging = useRef({ active: false, startX: 0, startY: 0, moved: false });

  const openLogoutModal = () => setLogoutOpen(true);
  const closeLogoutModal = () => setLogoutOpen(false);

  useEffect(() => {
    try {
      const mql = window.matchMedia(MOBILE_Q);
      const onChange = () => { 
        setIsMobile(mql.matches); 
        if (!mql.matches) setMobileExpanded(false); 
      };
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    } catch (error) {
      console.warn('matchMedia not supported:', error);
    }
  }, []);

  // Collapse after navigation on mobile
  useEffect(() => { 
    if (isMobile) setMobileExpanded(false); 
  }, [location.pathname, isMobile]);

  // Collapse when clicking outside the nav on mobile
  useEffect(() => {
    if (!isMobile || !mobileExpanded) return;

    const handleClickOutside = (e) => {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMobileExpanded(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobile, mobileExpanded]);

  const rootClass = useMemo(() => [
    'side-nav',
    isMobile ? (mobileExpanded ? 'is-expanded' : 'is-collapsed') : 'is-desktop'
  ].join(' '), [isMobile, mobileExpanded]);

  // Touch gesture handlers using native event listeners
  useEffect(() => {
    if (!isMobile) return;

    const handleTouchStart = (e) => {
      const t = e.touches?.[0]; 
      if (!t) return;
      dragging.current = { active: true, startX: t.clientX, startY: t.clientY, moved: false };
    };

    const handleTouchMove = (e) => {
      if (!dragging.current.active) return;
      const t = e.touches?.[0]; 
      if (!t) return;
      const dx = t.clientX - dragging.current.startX;
      const dy = Math.abs(t.clientY - dragging.current.startY);

      // Horizontal intent
      if (Math.abs(dx) > 10 && dy < VERTICAL_TOLERANCE) {
        dragging.current.moved = true;
        // prevent scroll so gesture feels responsive
        e.preventDefault();

        if (!mobileExpanded && dx > OPEN_THRESHOLD) setMobileExpanded(true);
        if (mobileExpanded && dx < -CLOSE_THRESHOLD) setMobileExpanded(false);
      }
    };

    const handleTouchEnd = () => { 
      dragging.current = { active: false, startX: 0, startY: 0, moved: false }; 
    };

    try {
      // Add event listeners with passive: false for touchmove
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd, { passive: true });

      return () => {
        document.removeEventListener('touchstart', handleTouchStart);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    } catch (error) {
      console.warn('Touch events not supported:', error);
    }
  }, [isMobile, mobileExpanded]);

  // Prevent "ghost click" right after a drag
  const onClickCapture = (e) => {
    if (!isMobile) return;
    if (!mobileExpanded) return blockWhenCollapsed(e);
    if (dragging.current.moved) { 
      e.preventDefault(); 
      e.stopPropagation(); 
    }
  };

  // First tap expands; block navigation while collapsed
  const blockWhenCollapsed = (e) => {
    if (isMobile && !mobileExpanded) {
      e.preventDefault();
      e.stopPropagation();
      setMobileExpanded(true);
    }
  };

  // Handle clicks on individual nav items
  const handleNavItemClick = (e) => {
    if (isMobile && !mobileExpanded) {
      e.preventDefault();
      e.stopPropagation();
      setMobileExpanded(true);
    }
  };

  const navItemGuard = isMobile ? { onClick: blockWhenCollapsed } : {};

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
    <>
      {/* Invisible edge zone to start swipe even when collapsed */}
      <div
        className="side-nav-gesture-zone"
        aria-hidden="true"
      />
      <nav 
        ref={navRef} 
        className={rootClass} 
        role="navigation" 
        aria-label="Main" 
        aria-expanded={isMobile ? mobileExpanded : undefined}
        onClickCapture={onClickCapture}
      >
      <div className="nav-header" onClick={blockWhenCollapsed}>
        <div className="logo-section">
          <img src="/logo-sidenav.png" alt="BVI Finance Logo"></img>
        </div>
        <div className="notification-icon">
          <i className="bi bi-bell"></i>
          <span className="notification-badge"></span>
        </div>
      </div>

      <div className="nav-links" onClick={blockWhenCollapsed}>
        <NavLink to="/dashboard" className="nav-item" {...navItemGuard}>
          <i className="bi bi-grid"></i>
          <span className="nav-label">Dashboard</span>
        </NavLink>

        <NavLink to="/events" className="nav-item" {...navItemGuard}>
          <i className="bi bi-calendar4-week"></i>
          <span className="nav-label">Events</span>
        </NavLink>

        <NavLink to="/notices" className="nav-item" {...navItemGuard}>
          <i className="bi bi-pencil-square"></i>
          <span className="nav-label">Notices</span>
        </NavLink>

        <NavLink to="/newsletters" className="nav-item" {...navItemGuard}>
          <i className="bi bi-file-earmark-text"></i>
          <span className="nav-label">Newsletters</span>
        </NavLink>

        <NavLink to="/membership" className="nav-item" {...navItemGuard}>
          <i className="bi bi-people"></i>
          <span className="nav-label">Membership</span>
        </NavLink>

        <NavLink to="/subscription" className="nav-item" {...navItemGuard}>
          <i className="bi bi-person-check"></i>
          <span className="nav-label">Subscription</span>
        </NavLink>

        <NavLink to="/legislation" className="nav-item" {...navItemGuard}>
          <i className="bi bi-book"></i>
          <span className="nav-label">Legislation</span>
        </NavLink>

        <NavLink to="/reports" className="nav-item" {...navItemGuard}>
          <i className="bi bi-file-earmark"></i>
          <span className="nav-label">Reports</span>
        </NavLink>
      </div>

      <div className="nav-footer" onClick={blockWhenCollapsed}>
        <NavLink to="/settings" className="nav-item" {...navItemGuard}>
          <i className="bi bi-gear"></i>
          <span className="nav-label">Settings</span>
        </NavLink>

        <button 
          type="button"
          className="nav-item nav-item--button"
          onClick={(e) => {
            if (isMobile && !mobileExpanded) return blockWhenCollapsed(e);
            openLogoutModal();
          }}
        >
          <i className="bi bi-power"></i>
          <span className="nav-label">Logout</span>
        </button>

        <NavLink to="/settings" className="user-profile" {...navItemGuard}>
          <div className="user-avatar" aria-hidden={false}>
            {(() => {
              const avatarSrc = user?.profilePictureUrl || user?.profilePicture || '';
              return avatarSrc ? (
                <img className="user-avatar-img" src={avatarSrc} alt={`${user?.firstName || 'User'} profile`} />
              ) : (
                <i className="bi bi-person-fill user-avatar-icon" aria-label="profile icon" />
              );
            })()}
          </div>
          <div className="profile-info">
            <h3 className="user-name">{displayName}</h3>
            <p className="user-role">{role === 'admin' ? 'Administrator' : 'User'}</p>
          </div>
        </NavLink>
      </div>

      </nav>

      <ConfirmLogoutModal 
        isOpen={isLogoutOpen} 
        onClose={closeLogoutModal} 
        onConfirm={handleConfirmLogout} 
      />
    </>
  )
}

export default SideNav
