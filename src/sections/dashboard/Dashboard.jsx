import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useEventsState } from '../../hooks/useEventsState'
import { useNoticesState } from '../../hooks/useNoticesState'
import { useNewslettersState } from '../../hooks/useNewslettersState'
import '../../styles/sections/Dashboard.scss'

const Dashboard = () => {
  const { user } = useAuth()
  const { events } = useEventsState()
  const { visibleItems: notices } = useNoticesState()
  const { newsletters } = useNewslettersState()
  const [, forceUpdate] = useState({})

  // Pure helper functions for date handling
  const startOfToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }

  const parseEventDate = (ev) => new Date(`${ev.date}T00:00:00`)

  // Multi-tab resilience: listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'events' && e.storageArea === localStorage) {
        // Trigger harmless re-render when events storage changes
        forceUpdate({})
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  // Get user's full name
  const fullName = user?.firstName && user?.lastName 
    ? `${user.firstName} ${user.lastName}` 
    : 'Member'

  // Filter and sort future events
  const today = startOfToday()
  const futureEvents = events
    .filter(event => {
      const eventDate = parseEventDate(event)
      return !isNaN(eventDate) && eventDate >= today
    })
    .sort((a, b) => {
      const dateA = parseEventDate(a)
      const dateB = parseEventDate(b)
      return dateA - dateB
    })
    .slice(0, 3) // Take up to 3 events

  // Create placeholders to maintain 3-row layout
  const upcomingEvents = futureEvents.length === 0 
    ? [] // No placeholders for empty state
    : [
        ...futureEvents,
        ...Array(Math.max(0, 3 - futureEvents.length)).fill(null) // Add null placeholders
      ]

  // Get up to 3 notices
  const latestNotices = notices.slice(0, 3)

  // Get up to 3 newsletters
  const latestNewsletters = newsletters.slice(0, 3)

  return (
    <div className="dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-title">
          <h1>Welcome back, {fullName}!</h1>
          <p>Here's what's happening with your membership.</p>
        </div>
      </div>

      {/* Cards */}
      <div className="dashboard-cards">
        {/* Card 1: Upcoming Events */}
        <div className="dashboard-card events-card">
          <h3 className="card-title">Upcoming Events</h3>
          {futureEvents.length === 0 ? (
            <h3 className="empty-title">No upcoming events yet...</h3>
          ) : (
            <ul className="list">
              {upcomingEvents.map((event, index) => 
                event ? (
                  <li key={event.id} className="list-item">
                    <div className={`event-bullet ${event.eventType?.toLowerCase() || 'webinar'}`}></div>
                    <div className="item-content">
                      <div className="item-title">{event.title || 'Event'}</div>
                      <div className="item-meta">
                        {event.date}{event.startTime ? ` · ${event.startTime}` : ''}{event.timeZone ? ` ${event.timeZone}` : ''}
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={`placeholder-${index}`} className="list-item placeholder" aria-hidden="true"></li>
                )
              )}
            </ul>
          )}
          <div className="card-footer">
            <NavLink to="/events">View All Events</NavLink>
          </div>
        </div>

        {/* Card 2: Latest Notices */}
        <div className="dashboard-card">
          <h3 className="card-title">Latest Notices</h3>
          <div className="list">
            {latestNotices.length > 0 ? (
              latestNotices.map((notice) => (
                <div key={notice.id} className="list-item">
                  <div className="item-title">{notice.fileName}</div>
                  <div className="item-meta">{notice.createdAt}</div>
                </div>
              ))
            ) : (
              <div className="list-item">No items yet</div>
            )}
          </div>
          <div className="card-footer">
            <NavLink to="/notices">View All Notices</NavLink>
          </div>
        </div>

        {/* Card 3: Latest News Letters */}
        <div className="dashboard-card">
          <h3 className="card-title">Latest News Letters</h3>
          <div className="list">
            {latestNewsletters.length > 0 ? (
              latestNewsletters.map((newsletter) => (
                <div key={newsletter.id} className="list-item">
                  <div className="item-title">{newsletter.fileName}</div>
                  <div className="item-meta">{newsletter.createdAt}</div>
                </div>
              ))
            ) : (
              <div className="list-item">No items yet</div>
            )}
          </div>
          <div className="card-footer">
            <NavLink to="/newsletter">View All News Letters</NavLink>
          </div>
        </div>

        {/* Card 4: Quick Actions */}
        <div className="dashboard-card">
          <h3 className="card-title">Quick Actions</h3>
          <div className="qa-actions">
            <NavLink to="/membership">Renew Membership</NavLink>
            <NavLink to="/settings">Update Profile</NavLink>
            <NavLink to="/legislation">Contact Support</NavLink>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
