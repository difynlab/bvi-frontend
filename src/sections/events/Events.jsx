import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../auth/acl'
import { useEventsState } from '../../hooks/useEventsState'
import { useEventForm } from '../../hooks/useEventForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useTitleMarquee } from '../../hooks/useTitleMarquee'
import RichTextEditor from '../../components/editor/RichTextEditor'
import '../../styles/sections/Events.scss'

export const Events = () => {
  const { user, toggleRole, isInitialized } = useAuth()
  
  // Events state management
  const { events, setEvents, addEvent, updateEvent, deleteEvent, seedIfEmpty } = useEventsState()
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingEventId, setEditingEventId] = useState(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [registeringEvent, setRegisteringEvent] = useState(null)
  
  // Form management
  const eventForm = useEventForm({ 
    initial: {},
    mode: modalMode 
  })

  // Cancel handler for modal close
  const handleCancel = () => {
    try {
      if (modalMode === 'edit') {
        eventForm.rollbackEdit()
      } else {
        eventForm.resetForm()
      }
      setIsModalOpen(false)
      setModalMode('create')
      setEditingEventId(null)
    } catch (error) {
      console.error('Error in handleCancel:', error)
    }
  }
  
  // Modal backdrop close behavior
  const modalBackdropClose = useModalBackdropClose(handleCancel)
  const registerModalBackdropClose = useModalBackdropClose(() => setIsRegisterModalOpen(false))
  
  // Title marquee behavior
  const titleMarquee = useTitleMarquee()
  
  // Utility function to truncate text at word boundary
  const truncateText = (text, maxLength = 110) => {
    if (!text || text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '…' : truncated + '…'
  }


  // Safety check for initialization and user context
  if (!isInitialized) {
    return (
      <div className="events-page">
        <div className="events-container">
          <div className="events-loading">
            <h2>Loading...</h2>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="events-page">
        <div className="events-container">
          <div className="events-error">
            <h2>Please log in to view events.</h2>
          </div>
        </div>
      </div>
    )
  }
  const [isDragOver, setIsDragOver] = useState(false)
  const [useFallback, setUseFallback] = useState(false)

  // Check if CSS line-clamp is supported
  useEffect(() => {
    const testElement = document.createElement('div')
    testElement.style.display = '-webkit-box'
    testElement.style.webkitLineClamp = '2'
    testElement.style.webkitBoxOrient = 'vertical'
    testElement.style.overflow = 'hidden'
    
    // If the browser doesn't support line-clamp, the styles won't be applied
    const supportsLineClamp = testElement.style.webkitLineClamp === '2'
    setUseFallback(!supportsLineClamp)
  }, [])

  // TODO BACKEND: Fetch events from backend on component mount
  // useEffect(() => {
  //   const fetchEvents = async () => {
  //     try {
  //       const response = await fetch('/api/events', {
  //         headers: {
  //           'Authorization': `Bearer ${token}`
  //         }
  //       })
  //       if (!response.ok) throw new Error('Failed to fetch events')
  //       const eventsData = await response.json()
  //       setEvents(eventsData)
  //     } catch (error) {
  //       console.error('Error fetching events:', error)
  //       // Fallback to localStorage or seed data
  //       const savedEvents = localStorage.getItem('events')
  //       if (savedEvents) {
  //         try {
  //           setEvents(JSON.parse(savedEvents))
  //         } catch (parseError) {
  //           console.error('Error parsing saved events:', parseError)
  //           setEvents(seedEvents)
  //         }
  //       } else {
  //         setEvents(seedEvents)
  //       }
  //     }
  //   }
  //   fetchEvents()
  // }, [])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    eventForm.onChange(name, value)
  }

  // Rich Text Editor handler
  const handleEditorChange = ({ html, text }) => {
    eventForm.setEditorHtml(html)
    eventForm.setEditorText(text)
    eventForm.onChange('description', text)
  }

  const openCreateModal = () => {
    try {
      setModalMode('create')
      setEditingEventId(null)
      eventForm.initializeCreate()
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error in openCreateModal:', error)
      alert('An error occurred while opening create modal')
    }
  }

  const openEditModal = (eventId) => {
    try {
      const event = events.find(e => e.id === eventId)
      if (event) {
        setModalMode('edit')
        setEditingEventId(eventId)
        eventForm.beginEdit(event)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Error in openEditModal:', error)
      alert('An error occurred while opening edit modal')
    }
  }

  const openRegisterModal = (event) => {
    try {
      setRegisteringEvent(event)
      setIsRegisterModalOpen(true)
    } catch (error) {
      console.error('Error in openRegisterModal:', error)
      alert('An error occurred while opening register modal')
    }
  }

  const closeModal = () => {
    try {
      setIsModalOpen(false)
      setModalMode('create')
      setEditingEventId(null)
      eventForm.resetForm()
    } catch (error) {
      console.error('Error in closeModal:', error)
    }
  }

  const closeRegisterModal = () => {
    try {
      setIsRegisterModalOpen(false)
      setRegisteringEvent(null)
    } catch (error) {
      console.error('Error in closeRegisterModal:', error)
    }
  }

  const handleRegister = () => {
    try {
      // TODO BACKEND: Implement registration
      console.log('Registering for event:', registeringEvent?.id)
      closeRegisterModal()
    } catch (error) {
      console.error('Error in handleRegister:', error)
      alert('An error occurred while registering')
    }
  }


  const handleFileInputChange = (e) => {
    eventForm.setFileFromInput(e)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setIsDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setIsDragOver(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) {
      eventForm.setFileFromDrop(file)
    }
  }


  const formatTime = (time) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatDate = (dateString) => {
    // Display the date exactly as entered (no timezone conversion)
    const date = new Date(dateString + 'T12:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const validateForm = () => {
    return eventForm.validate()
  }

  const handleSubmit = (e) => {
    try {
      e.preventDefault()
      if (!validateForm()) return

      if (modalMode === 'create') {
        const newEvent = eventForm.buildEventObject()
        addEvent(newEvent)
      } else if (modalMode === 'edit' && editingEventId) {
        const updatedEvent = eventForm.buildEventObject(editingEventId)
        updateEvent(updatedEvent)
      }

      closeModal()
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('An error occurred while saving the event')
    }
  }

  const handleEdit = (eventId) => {
    try {
      openEditModal(eventId)
    } catch (error) {
      console.error('Error in handleEdit:', error)
      alert('An error occurred while opening edit modal')
    }
  }

  const handleDelete = (eventId) => {
    try {
      deleteEvent(eventId)
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('An error occurred while deleting the event')
    }
  }

  return (
    <>
      <div className="events-page">
      <div className="events-container">
        <div className="events-header">
          <div className="events-header-title">
            <h1>Events</h1>
            <p>Manage Events</p>
          </div>
          <div className="events-header-actions">
            {/* TODO TEMPORARY: role toggle button for testing only. REMOVE before production. */}
            <button
              className={`temp-role-toggle-btn ${user?.role === 'admin' ? 'admin' : 'user'}`}
              onClick={toggleRole}
            >
              {user?.role === 'admin' ? 'Switch to User View' : 'Switch to Admin View'}
            </button>
            {/* TODO TEMPORARY: button to show sample events. REMOVE before production. */}
            <button
              className="temp-load-sample-btn"
              onClick={() => {
                localStorage.removeItem('events')
                seedIfEmpty()
              }}
            >
              Load Sample Events
            </button>
            
            {can(user, 'events:create') && (
              <button
                className="add-event-btn"
                onClick={openCreateModal}
              >
                <i className="bi bi-plus"></i> Add New
              </button>
            )}
          </div>
        </div>

        {events.length === 0 ? (
          <div className="empty-state">
            {can(user, 'events:create') ? (
              // Admin empty state
              <>
                <img src="/public/empty-state-admin.png" alt="" />
                <h2>Oops nothing to see here yet!</h2>
                <p>Looks like you haven't added anything. Go ahead and add<br /> your first item to get started!</p>
              </>
            ) : (
              // User empty state
              <>
                <img src="/public/empty-state-user.png" alt="" className="empty-state-user"/>
                <h2>Oops! No data found.</h2>
                <p>Nothing's been added here yet, or there might be a hiccup.<br />Try again or check back later!</p>
              </>
            )}
          </div>
        ) : (
          <div className="events-list">
            {events.map(event => (
              <div key={event.id} className="event-card">
                <div className="event-image">
                  <img src={event.imagePreviewUrl} alt={event.title} />
                </div>
                <div className="event-content">
                  <div className="event-header">
                    <span className={`event-type ${event.eventType.toLowerCase()}`}>
                      {event.eventType}
                    </span>
                    <span className="event-date">{formatDate(event.date)}</span>
                  </div>
                  <div 
                    className="event-title one-line-ellipsis"
                    ref={titleMarquee.titleContainerRef}
                    onMouseEnter={titleMarquee.onMouseEnter}
                    onMouseLeave={titleMarquee.onMouseLeave}
                  >
                    <span className="event-title__inner" title={event.title}>{event.title}</span>
                  </div>
                  <p className="event-description">
                    {useFallback ? truncateText(event.description) : event.description}
                  </p>
                  <div className="event-details">
                    <div className="event-time">
                      <span className="icon"><i className="bi bi-clock"></i></span>
                      {formatTime(event.startTime)} - {formatTime(event.endTime)} {event.timeZone}
                    </div>
                    <div className="event-location">
                      <span className="icon"><i className="bi bi-geo-alt"></i></span>
                      {event.location}
                    </div>
                  </div>
                  <div className="event-actions">
                    {can(user, 'events:update') && (
                      <button
                        className="edit-btn"
                        onClick={() => handleEdit(event.id)}
                      >
                        Edit Details
                      </button>
                    )}
                    {can(user, 'events:delete') && (
                      <button
                        className="delete-btn"
                        onClick={() => handleDelete(event.id)}
                      >
                        Delete
                      </button>
                    )}
                    {!can(user, 'events:create') && (
                      <button
                        className="register-btn"
                        onClick={() => openRegisterModal(event)}
                      >
                        Register Now
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div 
          className="events-modal-overlay" 
          onPointerDown={modalBackdropClose.onBackdropPointerDown}
          onPointerUp={modalBackdropClose.onBackdropPointerUp}
          onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
        >
          <div 
            className="events-modal"
            onPointerDown={modalBackdropClose.stopInsidePointer}
            onClick={modalBackdropClose.stopInsidePointer}
          >
            <div className="events-modal-header">
              <h2>{modalMode === 'create' ? 'Add New Event' : 'Edit Event'}</h2>
              <button
                className="close-btn"
                onClick={handleCancel}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="events-form">
              <div className="form-group">
                <label htmlFor="title">Title</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={eventForm.form.title}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="date">Date</label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    value={eventForm.form.date}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="startTime">Start Time</label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={eventForm.form.startTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={eventForm.form.endTime}
                    min={eventForm.form.startTime || '00:00'}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="timeZone">Time Zone</label>
                  <select
                    id="timeZone"
                    name="timeZone"
                    value={eventForm.form.timeZone}
                    onChange={handleInputChange}
                  >
                    {eventForm.TIME_ZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="eventType">Event Type</label>
                  <select
                    id="eventType"
                    name="eventType"
                    value={eventForm.form.eventType}
                    onChange={handleInputChange}
                  >
                    {eventForm.EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <RichTextEditor
                  key={`rte-${modalMode === 'edit' ? editingEventId : 'new'}`}
                  contentKey={modalMode === 'edit' ? editingEventId : 'new'}
                  initialHtml={eventForm.editorHtml}
                  onChange={handleEditorChange}
                  placeholder="Write a description..."
                />
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={eventForm.form.location}
                  onChange={handleInputChange}
                />
              </div>

              <div className="form-group">
                <label>Image Upload</label>
                <div
                  className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file"
                    accept="image/*"
                    onChange={handleFileInputChange}
                    className="hidden-file-input"
                  />
                  <label htmlFor="file" className="file-input-label">
                    Choose file
                  </label>
                  <p className="file-status">
                    {eventForm.form.imageFileName || 'No file chosen'}
                  </p>
                  {eventForm.form.imagePreviewUrl && (
                    <div className="image-preview">
                      <img src={eventForm.form.imagePreviewUrl} alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              {eventForm.errorMessage && (
                <div className="error-message">
                  {eventForm.errorMessage}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={handleCancel}>
                  Cancel
                </button>
                <button type="submit" className="upload-btn">
                  {modalMode === 'create' ? 'Upload Now' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Modal */}
      {isRegisterModalOpen && registeringEvent && (
        <div 
          className="events-modal-overlay" 
          onPointerDown={registerModalBackdropClose.onBackdropPointerDown}
          onPointerUp={registerModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={registerModalBackdropClose.onBackdropPointerCancel}
        >
          <div 
            className="register-modal"
            onPointerDown={registerModalBackdropClose.stopInsidePointer}
            onClick={registerModalBackdropClose.stopInsidePointer}
          >
            <div className="register-modal-header">
              <h2>{registeringEvent.title}</h2>
              <button
                className="close-btn"
                onClick={closeRegisterModal}
              >
                ×
              </button>
            </div>

            <div className="register-modal-content">
              <div className="register-event-image">
                <img src={registeringEvent.imagePreviewUrl} alt={registeringEvent.title} />
              </div>

              <div className="register-event-details">
                <div className="register-event-header">
                  <span className={`event-type ${registeringEvent.eventType.toLowerCase()}`}>
                    {registeringEvent.eventType}
                  </span>
                  <span className="event-date">{formatDate(registeringEvent.date)}</span>
                </div>

                <div className="register-event-info">
                  <div className="register-event-time">
                    <span className="icon">🕐</span>
                    {formatTime(registeringEvent.startTime)} - {formatTime(registeringEvent.endTime)} {registeringEvent.timeZone}
                  </div>
                  <div className="register-event-location">
                    <span className="icon">📍</span>
                    {registeringEvent.location}
                  </div>
                </div>

                <div className="register-event-description">
                  <h3>About this event</h3>
                  <p>{registeringEvent.description}</p>
                </div>
              </div>
            </div>

            <div className="register-modal-actions">
              <button
                className="register-now-btn"
                onClick={handleRegister}
              >
                Register Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </>
  )
}
