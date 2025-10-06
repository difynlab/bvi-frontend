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
  const { notices } = useNoticesState()
  const { newsletters } = useNewslettersState()
  const [, forceUpdate] = useState({})

  const startOfToday = () => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    return d
  }

  const parseEventDate = (ev) => new Date(`${ev.date}T00:00:00`)

  // Bucketed "time ago" helper (no decimals, no live timer)
  const timeAgo = (ms) => {
    const diffMin = Math.max(0, Math.floor((Date.now() - ms) / 60000))
    if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`
    if (diffMin < 120) return '1 hour ago'
    if (diffMin < 1440) return '2 hours ago'
    if (diffMin < 2880) return '1 day ago'
    const days = Math.floor(diffMin / 1440)
    return `${days} ${days === 1 ? 'day' : 'days'} ago`
  }

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'events' && e.storageArea === localStorage) {
        forceUpdate({})
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const displayName = user?.firstName || 'Member'

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
    .slice(0, 3)

  const upcomingEvents = futureEvents

  // Get all notices from all categories and sort by publication time
  const allNotices = notices.flatMap(group => group.items || [])
  
  const latestNotices = allNotices
    .map(notice => {
      // Compute publishedMs with priority: createdAtMs → updatedAtMs → parse createdAt as local midnight
      let publishedMs = null
      
      if (notice.createdAtMs) {
        publishedMs = notice.createdAtMs
      } else if (notice.updatedAtMs) {
        publishedMs = notice.updatedAtMs
      } else if (notice.createdAt) {
        // Parse createdAt as local midnight (YYYY-MM-DDT00:00:00)
        try {
          const date = new Date(`${notice.createdAt}T00:00:00`)
          if (!isNaN(date.getTime())) {
            publishedMs = date.getTime()
          }
        } catch (e) {
          // Invalid date, skip this notice
        }
      }
      
      return { ...notice, publishedMs }
    })
    .filter(notice => notice.publishedMs !== null) // Skip items lacking a valid timestamp
    .sort((a, b) => b.publishedMs - a.publishedMs) // Sort descending by publishedMs
    .slice(0, 2) // Take first 2 items

  const latestNewsletters = newsletters.slice(0, 3)

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-title">
          <h1>Welcome back, {displayName}!</h1>
          <p>Here's what's happening with your membership.</p>
        </div>
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card events-card">
          <h3 className="card-title">Upcoming Events<span className="card-events-icon"><i className="bi bi-calendar"></i></span></h3>
          {futureEvents.length === 0 ? (
            <h3 className="empty-title">No upcoming events yet...</h3>
          ) : (
            <ul className="list">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="list-item">
                  <div className={`event-bullet ${event.eventType?.toLowerCase() || 'webinar'}`}></div>
                  <div className="item-content">
                    <div className="item-title">{event.title || 'Event'}</div>
                    <div className="item-meta">
                      {event.date}{event.startTime ? ` · ${event.startTime}` : ''}{event.timeZone ? ` ${event.timeZone}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <div className="card-footer">
            <NavLink to="/events">View All Events</NavLink>
          </div>
        </div>

        <div className="dashboard-card notices-card">
          <h3 className="card-title">Latest Notices<span className="card-notices-icon"><i className="bi bi-calendar"></i></span></h3>
          <div className="list">
            {latestNotices.length > 0 ? (
              latestNotices.map((notice) => (
                <div key={notice.id} className="list-item">
                  <div className="item-title">{notice.fileName}</div>
                  <div className="item-meta">
                    <span className="time-ago">{timeAgo(notice.publishedMs)}</span>
                  </div>
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

        <div className="dashboard-card">
          <h3 className="card-title">Latest News Letters<span className="card-newsletters-icon"><i className="bi bi-file-earmark-text"></i></span></h3>
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

        <div className="dashboard-card">
          <h3 className="card-title">Quick Actions<span className="card-quickActions-icon"><i className="bi bi-gear"></i></span></h3>
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
