import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import { useEventsState } from '../../hooks/useEventsState'
import { useEventForm } from '../../hooks/useEventForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useTitleMarquee } from '../../hooks/useTitleMarquee'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useModalRegistration } from '../../hooks/useModalState.jsx'
import RichTextEditor from '../../components/editor/RichTextEditor'
import { CustomRecurrencePopover } from '../../components/events/CustomRecurrencePopover'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock'
import EmptyPage from '../../components/EmptyPage'
import '../../styles/sections/Events.scss'

export const Events = () => {
  const { user, toggleRole, isInitialized } = useAuth()

  const { events, addEvent, updateEvent, deleteEvent, seedIfEmpty } = useEventsState()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingEventId, setEditingEventId] = useState(null)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [registeringEvent, setRegisteringEvent] = useState(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const [useFallback, setUseFallback] = useState(false)
  const [isCustomRecurrenceOpen, setIsCustomRecurrenceOpen] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)

  const eventForm = useEventForm()

  // Register modal states to disable SideNav gestures
  const isAnyModalOpen = isModalOpen || isRegisterModalOpen || isConfirmDeleteOpen
  useModalRegistration('events-modal', isModalOpen)
  useModalRegistration('register-modal', isRegisterModalOpen)
  useModalRegistration('confirm-delete-modal', isConfirmDeleteOpen)

  // Validation logic
  const REQUIRED = [
    { key: 'title', label: 'Event Title', test: () => (eventForm?.form?.title || '').trim().length > 0 },
    { key: 'date', label: 'Date', test: () => !!eventForm?.form?.date },
    {
      key: 'description', label: 'Description', test: () => {
        const html = (eventForm?.editorHtml || eventForm?.form?.description || '');
        const text = html.replace(/<[^>]+>/g, '').trim();
        return text.length > 0;
      }
    },
    { key: 'file', label: 'File Upload', test: () => !!(eventForm?.form?.imagePreviewUrl || eventForm?.form?.imageFileName) }
  ];

  const [missingRequired, setMissingRequired] = useState([]);
  const bannerRef = useRef(null);

  function validateRequired() {
    const missing = REQUIRED.filter(r => !r.test()).map(r => r.label);
    setMissingRequired(missing);
    return missing.length === 0;
  }

  // clear/update banner reactively
  useEffect(() => {
    if (missingRequired.length) validateRequired();
  }, [
    eventForm?.form?.title,
    eventForm?.form?.date,
    eventForm?.editorHtml,
    eventForm?.form?.description,
    eventForm?.form?.imagePreviewUrl,
    eventForm?.form?.imageFileName
  ]);

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

  const modalBackdropClose = useModalBackdropClose(handleCancel)

  useEffect(() => {
    if (isModalOpen && eventForm.form.repeat === 'CUSTOM' && !isCustomRecurrenceOpen) {
    }
  }, [isModalOpen, eventForm.form.repeat, isCustomRecurrenceOpen])
  const registerModalBackdropClose = useModalBackdropClose(() => setIsRegisterModalOpen(false))

  const titleMarquee = useTitleMarquee()

  useBodyScrollLock(isModalOpen || isRegisterModalOpen || isConfirmDeleteOpen)

  useEffect(() => {
    const testElement = document.createElement('div')
    testElement.className = 'line-clamp-test'
    document.body.appendChild(testElement)

    const computedStyle = window.getComputedStyle(testElement)
    const supportsLineClamp = computedStyle.webkitLineClamp === '2'
    setUseFallback(!supportsLineClamp)

    document.body.removeChild(testElement)
  }, [])

  const truncateText = (text, maxLength = 110) => {
    if (!text || text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '…' : truncated + '…'
  }

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

    // Handle custom recurrence popover and clear custom recurrence when changing to non-custom
    if (name === 'repeat' && value === 'CUSTOM') {
      setIsCustomRecurrenceOpen(true)
    } else if (name === 'repeat' && value !== 'CUSTOM') {
      setIsCustomRecurrenceOpen(false)
      // Clear custom recurrence when changing to non-custom repeat option
      eventForm.updateRecurrence({
        kind: value, // Use the selected repeat value as the kind
        interval: 1,
        unit: 'week',
        daysOfWeek: [],
        ends: { mode: 'NEVER', date: '', count: null }
      })
    }
  }

  // Handle click on repeat select to ensure custom popover can open
  const handleRepeatSelectClick = (e) => {
    // If the current value is CUSTOM and popover is closed, open it
    if (eventForm.form.repeat === 'CUSTOM' && !isCustomRecurrenceOpen) {
      setIsCustomRecurrenceOpen(true)
    }
  }

  // Rich Text Editor handler - one-way flow
  const handleEditorChange = (html) => {
    eventForm.setEditorHtml(html)
    const text = eventForm.stripHtml(html)
    eventForm.setEditorText(text)
    eventForm.onChange('description', text)
  }

  const openCreateModal = () => {
    try {
      setModalMode('create')
      setEditingEventId(null)
      eventForm.initializeCreate()
      setIsModalOpen(true)
      // Ensure custom recurrence popover is closed when opening create modal
      setIsCustomRecurrenceOpen(false)
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

        // Check if event has custom recurrence and set popover state accordingly
        // but don't auto-open it - let user click "Custom" to open
        if (event.recurrence && event.recurrence.kind === 'CUSTOM') {
          // Event has custom recurrence, but don't auto-open popover
          setIsCustomRecurrenceOpen(false)
        } else {
          setIsCustomRecurrenceOpen(false)
        }
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
      setIsCustomRecurrenceOpen(false)
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

  // Get today's date in YYYY-MM-DD format for date input min attribute
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const validateForm = () => {
    return eventForm.validate()
  }

  const handleSubmit = (e) => {
    try {
      e.preventDefault()
      if (!validateRequired()) { bannerRef.current?.focus(); return; }

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
      const event = events.find(e => e.id === eventId)
      if (event && can(user, 'events:delete')) {
        setEventToDelete(event)
        setIsConfirmDeleteOpen(true)
      }
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('An error occurred while deleting the event')
    }
  }

  const handleConfirmDelete = () => {
    try {
      if (eventToDelete) {
        deleteEvent(eventToDelete.id)
        setEventToDelete(null)
      }
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error)
      alert('An error occurred while deleting the event')
    }
  }

  // Handle custom recurrence update
  const handleCustomRecurrenceUpdate = (recurrenceData) => {
    const normalizedRecurrence = eventForm.normalizeRecurrence(recurrenceData)

    // Update the recurrence in form state
    eventForm.updateRecurrence(normalizedRecurrence)

    // Update the repeat field based on normalization
    if (normalizedRecurrence.kind === 'WEEKLY') {
      eventForm.onChange('repeat', 'WEEKLY')
    } else {
      eventForm.onChange('repeat', 'CUSTOM')
    }

    setIsCustomRecurrenceOpen(false)
  }

  return (
    <>
      <div className="events-page">
        <div className="events-container">
          <section className="events-section">
            <header className="events-header">
              <div className="events-header-title">
                <h1>Events</h1>
                <p>Manage Events</p>
              </div>
              <div className="events-actions">
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
                    className="add-event-btn events-add-btn"
                    onClick={openCreateModal}
                    aria-label="Add new event"
                  >
                    <i className="bi bi-plus" aria-hidden="true"></i>
                    <span className="btn-label">Add New</span>
                  </button>
                )}
              </div>
            </header>

            {events.length === 0 ? (
              <EmptyPage
                isAdmin={can(user, 'events:create')}
                title={can(user, 'events:create') ? 'Oops nothing to see here yet!' : 'Oops! No data found.'}
                description={
                  can(user, 'events:create')
                    ? <>Looks like you haven't added anything. Go ahead and add<br /> your first item to get started!</>
                    : <>Nothing's been added here yet, or there might be a hiccup.<br />Try again or check back later!</>
                }
              />
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
          </section>
        </div>

        {isModalOpen && (
          <div
            className="events-modal-overlay"
            onPointerDown={modalBackdropClose.onBackdropPointerDown}
            onPointerUp={modalBackdropClose.onBackdropPointerUp}
            onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
          >
            <ModalLifecycleLock />
            <div
              className="events-modal"
              onPointerDown={modalBackdropClose.stopInsidePointer}
              onClick={modalBackdropClose.stopInsidePointer}
            >
              <button
                className="close-btn"
                onClick={handleCancel}
              >
                <i className="bi bi-x"></i>
              </button>
              <div className="events-modal-header">
                <h2>Event details</h2>
                <p>Please fill in the details to create/update new event you'd like to store or manage in your account.</p>
              </div>

              <form onSubmit={handleSubmit} className="events-form">
                <div className="form-group">
                  <label htmlFor="title">Event Title<span className="req-star" aria-hidden="true">*</span></label>
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
                    <label htmlFor="date">Date/Time<span className="req-star" aria-hidden="true">*</span></label>
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={eventForm.form.date}
                      onChange={handleInputChange}
                      min={getTodayDate()}
                      required
                    />
                  </div>
                  <div className="form-time">
                    <div className="form-group">
                      <input
                        type="time"
                        id="startTime"
                        name="startTime"
                        value={eventForm.form.startTime}
                        onChange={handleInputChange}
                        placeholder="09:00"
                      />
                    </div>
                    <i className="bi bi-dash"></i>
                    <div className="form-group">
                      <input
                        type="time"
                        id="endTime"
                        name="endTime"
                        value={eventForm.form.endTime}
                        onChange={handleInputChange}
                        placeholder="17:00"
                      />
                    </div>
                  </div>

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
                  <div className="form-group repeat-field">
                    <label htmlFor="repeat">Repeat</label>
                    <select
                      id="repeat"
                      name="repeat"
                      value={eventForm.form.repeat}
                      onChange={handleInputChange}
                      onClick={handleRepeatSelectClick}
                    >
                      {eventForm.REPEAT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <CustomRecurrencePopover
                      isOpen={isCustomRecurrenceOpen}
                      onClose={() => setIsCustomRecurrenceOpen(false)}
                      onUpdate={handleCustomRecurrenceUpdate}
                      initialRecurrence={eventForm.form.recurrence}
                    />
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
                  <label htmlFor="description">Description<span className="req-star" aria-hidden="true">*</span></label>
                  <RichTextEditor
                    docId={modalMode === 'edit' ? editingEventId : 'new'}
                    initialHTML={eventForm.editorHtml}
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
                  <label>File Upload<span className="req-star" aria-hidden="true">*</span></label>
                  <div
                    className={`dropzone dropzone-surface ${isDragOver ? 'drag-over' : ''}`}
                    data-has-file={Boolean(eventForm.form.imagePreviewUrl)}
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

                <div className="form-actions">
                  {missingRequired.length > 0 && (
                    <div
                      className="app-form__error-banner"
                      role="alert"
                      aria-live="assertive"
                      tabIndex={-1}
                      ref={bannerRef}
                    >
                      <strong>Please fill all required fields:</strong> {missingRequired.join(', ')}
                    </div>
                  )}
                  <button type="submit" className="upload-now-btn">Upload Now</button>
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
            <ModalLifecycleLock />
            <div
              className="register-modal"
              onPointerDown={registerModalBackdropClose.stopInsidePointer}
              onClick={registerModalBackdropClose.stopInsidePointer}
            >

              <div className="register-modal-content">
                <div className="register-event-image">
                  <img src={registeringEvent.imagePreviewUrl} alt={registeringEvent.title} />
                </div>

                <div className="register-event-details">
                  <div className="register-event-content">
                    <div className="register-event-header">
                      <span className={`event-type ${registeringEvent.eventType.toLowerCase()}`}>
                        {registeringEvent.eventType}
                      </span>
                      <h2>{registeringEvent.title}</h2>

                    </div>

                    <div className="register-event-info">
                      <div className="register-event-detail">
                        <span className="icon"><i className="bi bi-calendar"></i></span>
                        {formatDate(registeringEvent.date)}
                      </div>
                      <div className="register-event-detail">
                        <span className="icon"><i className="bi bi-clock"></i></span>
                        {formatTime(registeringEvent.startTime)} - {formatTime(registeringEvent.endTime)} {registeringEvent.timeZone}
                      </div>
                      <div className="register-event-detail">
                        <span className="icon"><i className="bi bi-geo-alt"></i></span>
                        {registeringEvent.location}
                      </div>
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

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false)
          setEventToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
      />
    </>
  )
}
