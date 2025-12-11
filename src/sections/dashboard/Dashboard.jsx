import React, { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'
import { useEvents } from '../../hooks/useEvents'
import { useNotices } from '../../hooks/useNotices'
import { useNewslettersState } from '../../hooks/useNewslettersState'
import { EVENT_TYPE_OPTIONS } from '../../hooks/useEventForm'
import membersService from '../../services/membersService'
import '../../styles/sections/Dashboard.scss'

const Dashboard = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { events, loading: eventsLoading } = useEvents()
  const { notices, loading: noticesLoading } = useNotices()
  const {
    newsletters,
    loading: newslettersLoading,
    initialLoading: newslettersInitialLoading
  } = useNewslettersState()
  const [, forceUpdate] = useState({})
  const [members, setMembers] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)

  // Optional membership data - using fallbacks if no hook exists
  // const { membership } = useMembershipData?.() || {};
  const membership = {
    status: 'ACTIVE',
    validUntil: 'August 15, 2025'
  }

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

  // Format date for display
  const formatNewsletterDate = (dateString) => {
    if (!dateString) return ''
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return dateString // Return original if invalid
      
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch (error) {
      return dateString // Return original if error
    }
  }

  // Format timezone to show only UTC±XX:XX part
  const formatTimezone = (timezone) => {
    const match = timezone.match(/UTC[±−+]\d{2}:\d{2}/)
    return match ? match[0] : timezone
  }

  // Parse newsletter data from backend (description field contains JSON string)
  const parseNewsletterData = (nl) => {
    let parsedData = { ...nl }
    
    // If description is a JSON string, parse it
    if (typeof nl?.description === 'string' && nl.description.startsWith('{')) {
      try {
        const parsedDescription = JSON.parse(nl.description)
        parsedData = {
          ...nl,
          ...parsedDescription, // Spread parsed data
          originalDescription: nl.description // Keep original for reference
        }
      } catch (error) {
        // Silently handle JSON parse errors
      }
    }
    
    return parsedData
  }

  // Safely derive a plain-text description for newsletters
  const getNewsletterDescription = (nl) => {
    const parsed = parseNewsletterData(nl)
    const raw =
      (typeof parsed?.descriptionText === 'string' && parsed.descriptionText) ||
      (typeof parsed?.description === 'string' && parsed.description) ||
      (typeof parsed?.summary === 'string' && parsed.summary) ||
      (typeof parsed?.descriptionHTML === 'string' && parsed.descriptionHTML.replace(/<[^>]+>/g, '')) ||
      ''
    return raw
  }

  // Get event type label for display
  const getEventTypeLabel = (eventType) => {
    const option = EVENT_TYPE_OPTIONS.find(opt => opt.value === eventType?.toLowerCase())
    return option ? option.label : 'Event'
  }

  const displayName = user?.first_name || 'Member'
  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'events' && e.storageArea === localStorage) {
        forceUpdate({})
      }
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  useEffect(() => {
    const loadMembers = async () => {
      if (!isAdmin) return
      setMembersLoading(true)
      try {
        const res = await membersService.getMembers({ pagination: 1000, page: 1 })
        if (res && res.http_status === 404) {
          setMembers([])
          return
        }
        const payload = res?.data || {}
        const list = Array.isArray(payload.data) ? payload.data : []
        const sortedMembers = list.sort((a, b) => {
          const dateA = new Date(a.created_at || a.createdAt || 0)
          const dateB = new Date(b.created_at || b.createdAt || 0)
          return dateB - dateA
        })
        setMembers(sortedMembers.slice(0, 3))
      } catch (error) {
        setMembers([])
      } finally {
        setMembersLoading(false)
      }
    }

    loadMembers()
  }, [isAdmin])

  const handleEditMember = (memberId) => {
    navigate(`/membership?searchId=${memberId}`)
  }

  const getPlanName = (member) => {
    const planName = member?.plan || member?.membership_plan || 'Plan Inactive'
    const normalizedPlan = planName.toString().toLowerCase()
    
    if (normalizedPlan.includes('standard') || normalizedPlan.includes('basic')) {
      return 'Basic'
    } else if (normalizedPlan.includes('silver') || normalizedPlan.includes('intermediate')) {
      return 'Silver'
    } else if (normalizedPlan.includes('gold') || normalizedPlan.includes('premium')) {
      return 'Gold'
    } else {
      return 'Plan Inactive'
    }
  }

  const getStatus = (member) => {
    const status = member?.status
    
    if (!status) return 'Active'
    
    const statusStr = String(status).toLowerCase().trim()
    
    if (statusStr === '1' || statusStr === 'active') {
      return 'Active'
    }
    
    if (statusStr === '0' || statusStr === 'inactive') {
      return 'Inactive'
    }
    
    return statusStr.charAt(0).toUpperCase() + statusStr.slice(1)
  }

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

  // Get latest 2 notices (already sorted by useNotices hook)
  const latestNotices = notices.slice(0, 2)
  const hasNotices = latestNotices.length > 0

  const latestNewsletters = newsletters.slice(0, 2)

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div className="dashboard-header-title">
          <h1>Welcome back, {displayName}!</h1>
          <p>Here's what's happening with your membership.</p>
        </div>
        <div className="dashboard-header-decor" aria-hidden="true">
          <span className="tri tri-1" />
          <span className="tri tri-2" />
          <span className="tri tri-3" />
          <span className="tri tri-4" />
        </div>
        <img src="/images/bvi_speakers.png" alt="Dashboard Header" />
      </div>

      <div className="dashboard-cards">
        <div className="dashboard-card events-card">
          <h3 className="card-title">Upcoming Events<span className="card-events-icon"><i className="bi bi-calendar"></i></span></h3>
          {eventsLoading ? (
            <ul className="list">
              {/* Event shimmer loaders */}
              {[1, 2, 3].map((index) => (
                <li key={`skeleton-${index}`} className="list-item shimmer-item">
                  <div className="event-bullet shimmer-bullet"></div>
                  <div className="item-content">
                    <div className="item-title shimmer-title"></div>
                    <div className="item-meta shimmer-meta"></div>
                  </div>
                </li>
              ))}
            </ul>
          ) : futureEvents.length === 0 ? (
            <h3 className="empty-title">No upcoming events yet...</h3>
          ) : (
            <ul className="list">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="list-item">
                  <div className={`event-bullet ${event.eventType?.toLowerCase() || 'webinar'}`}></div>
                  <div className="item-content">
                    <div className="item-title">{event.title || 'Event'}</div>
                    <div className="item-meta">
                      {getEventTypeLabel(event.eventType)}{event.date ? ` · ${event.date}` : ''}{event.startTime ? ` · ${event.startTime}` : ''}{event.timeZone ? ` ${event.timeZone}` : ''}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!eventsLoading && (
            <div className="card-footer">
              {isAdmin && futureEvents.length === 0 ? (
                <NavLink to="/events" className="add-new-btn">
                  <i className="bi bi-plus"></i>
                  <span>Add New Event</span>
                </NavLink>
              ) : (
                <NavLink to="/events">View All Events</NavLink>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-card notices-card">
          <h3 className="card-title">Latest Notices<span className="card-notices-icon"><i className="bi bi-calendar"></i></span></h3>
          {noticesLoading ? (
            <div className="list">
              {/* Notice shimmer loaders */}
              {[1, 2].map((index) => (
                <div key={`notice-skeleton-${index}`} className="list-item shimmer-notice-item">
                  <div className="item-meta">
                    <span className={`shimmer-badge ${index === 1 ? 'shimmer-urgent' : 'shimmer-new'}`}></span>
                    <span className="shimmer-timestamp"></span>
                  </div>
                  <div className="item-title shimmer-notice-title"></div>
                  <div className="item-description shimmer-notice-description"></div>
                </div>
              ))}
            </div>
          ) : hasNotices ? (
            <div className="list">
              {latestNotices.map((notice, index) => {
                // Calculate publishedMs for timeAgo
                let publishedMs = null
                if (notice.createdAtMs) {
                  publishedMs = notice.createdAtMs
                } else if (notice.updatedAtMs) {
                  publishedMs = notice.updatedAtMs
                } else if (notice.createdAt) {
                  try {
                    const date = new Date(notice.createdAt)
                    if (!isNaN(date.getTime())) {
                      publishedMs = date.getTime()
                    }
                  } catch (e) {
                    // Invalid date
                  }
                }
                
                return (
                  <div key={notice.id} className="list-item">
                    <div className="item-meta">
                      <span className={index === 0 ? 'item-meta-urgent' : 'item-meta-new'}>{index === 0 ? 'Urgent' : 'New'}</span>
                      <span className="time-ago">{publishedMs ? timeAgo(publishedMs) : 'Recently'}</span>
                    </div>
                    <div className="item-title">{notice.fileName}</div>
                    <div className="item-description">{notice.description}</div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="notices-empty">No notices yet...</div>
          )}
          {!noticesLoading && (
            <div className="card-footer">
              {isAdmin && !hasNotices ? (
                <NavLink to="/notices" className="add-new-btn">
                  <i className="bi bi-plus"></i>
                  <span>Add New Notice</span>
                </NavLink>
              ) : (
                <NavLink to="/notices">View All Notices</NavLink>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-card newsletters-card">
          <h3 className="card-title">Latest Newsletters<span className="card-newsletters-icon"><i className="bi bi-file-earmark-text"></i></span></h3>
          <div className="list">
            {newslettersLoading || newslettersInitialLoading ? (
              <>
                {[1, 2].map((index) => (
                  <div key={`newsletter-skeleton-${index}`} className="list-item shimmer-newsletter-item">
                    <div className="item-title shimmer-newsletter-title"></div>
                    <div className="newsletter-item-description shimmer-newsletter-description"></div>
                    <div className="item-meta shimmer-newsletter-date"></div>
                  </div>
                ))}
              </>
            ) : latestNewsletters.length > 0 ? (
              latestNewsletters.map((newsletter) => {
                const parsedNewsletter = parseNewsletterData(newsletter)
                return (
                  <div key={newsletter.id} className="list-item">
                    <div className="item-title">{parsedNewsletter.name || parsedNewsletter.title || parsedNewsletter.fileName || `Newsletter ${newsletter.id}`}</div>
                    <p className="newsletter-item-description">{getNewsletterDescription(newsletter)}</p>
                    <div className="item-meta">{formatNewsletterDate(parsedNewsletter.publishedAt || parsedNewsletter.created_at || newsletter.created_at || parsedNewsletter.createdAt || newsletter.createdAt)}</div>
                  </div>
                )
              })
            ) : (
              <div className="newsletters-empty">No newsletters yet...</div>
            )}
          </div>
          {!newslettersLoading && !newslettersInitialLoading && (
            <div className="card-footer">
              {isAdmin && latestNewsletters.length === 0 ? (
                <NavLink to="/newsletters" className="add-new-btn">
                  <i className="bi bi-plus"></i>
                  <span>Add New Newsletter</span>
                </NavLink>
              ) : (
                <NavLink to="/newsletters">View All News Letters</NavLink>
              )}
            </div>
          )}
        </div>

        <div className="dashboard-card quick-actions-card">
          <h3 className="card-title">Quick Actions<span className="card-quickActions-icon"><i className="bi bi-gear"></i></span></h3>
          {isAdmin ? (
            <>
              <div className="qa-members-table">
                <table>
                  <thead>
                    <tr>
                      <th>Id</th>
                      <th>Status</th>
                      <th>Plan</th>
                      <th>Until</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {membersLoading ? (
                      <>
                        {[1, 2, 3].map((index) => (
                          <tr key={`member-skeleton-${index}`} className="qa-member-skeleton-row">
                            <td><div className="qa-skeleton-cell qa-skeleton-id"></div></td>
                            <td><div className="qa-skeleton-cell qa-skeleton-status"></div></td>
                            <td><div className="qa-skeleton-cell qa-skeleton-plan"></div></td>
                            <td><div className="qa-skeleton-cell qa-skeleton-until"></div></td>
                            <td><div className="qa-skeleton-cell qa-skeleton-icon"></div></td>
                          </tr>
                        ))}
                      </>
                    ) : members.length > 0 ? (
                      members.map((member) => (
                        <tr key={member.id}>
                          <td>{member.id}</td>
                          <td>{getStatus(member)}</td>
                          <td>{getPlanName(member)}</td>
                          <td>—</td>
                          <td>
                            <button
                              type="button"
                              className="qa-edit-btn"
                              onClick={() => handleEditMember(member.id)}
                              aria-label={`Edit member ${member.id}`}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="qa-members-empty">No members yet...</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {!membersLoading && (
                <div className="qa-members-footer">
                  <NavLink to="/membership">View all members...</NavLink>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="qa-box">
                <div className="qa-status-row">
                  <span className="qa-status-title">Membership Status</span>
                  <span className="qa-badge qa-badge-active">
                    {(membership?.status || 'ACTIVE').toUpperCase()}
                  </span>
                </div>
                <p className="qa-valid-until">
                  Valid until: {membership?.validUntil || 'August 15, 2025'}
                </p>
                <NavLink to="/membership" className="qa-primary-btn">Renew Membership</NavLink>
              </div>

              <div className="qa-actions">
                <NavLink to="/profile" className="qa-secondary-btn">Update Profile</NavLink>
                <NavLink to="/legislation" className="qa-secondary-btn">Contact Support</NavLink>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Dashboard
