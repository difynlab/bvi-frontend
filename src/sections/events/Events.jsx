import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import { useEvents } from '../../hooks/useEvents'
import { useEventForm, EVENT_TYPE_OPTIONS } from '../../hooks/useEventForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useTitleMarquee } from '../../hooks/useTitleMarquee'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import { useModalRegistration } from '../../hooks/useModalState.jsx'
import RichTextEditor from '../../components/editor/RichTextEditor'
import { CustomRecurrencePopover } from '../../components/events/CustomRecurrencePopover'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal'
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock'
import EmptyPage from '../../components/EmptyPage'
import CustomDropdown from '../../components/CustomDropdown'
import EventsListSkeleton from '../../components/events/EventsListSkeleton'
import EventsPaginationSkeleton from '../../components/events/EventsPaginationSkeleton'
import '../../styles/sections/Events.scss'
import '../../styles/sections/shimmerLoader.scss'

export const Events = () => {
  const { user, toggleRole, isInitialized } = useAuth()

  const { events, createEvent, updateEvent, deleteEvent, loading, error, pagination, refreshEvents, changePage } = useEvents()

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
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const eventForm = useEventForm()

  // Get event type label for display
  const getEventTypeLabel = (eventType) => {
    const option = EVENT_TYPE_OPTIONS.find(opt => opt.value === eventType?.toLowerCase())
    return option ? option.label : 'Event'
  }

  // Register modal states to disable SideNav gestures
  const isAnyModalOpen = isModalOpen || isRegisterModalOpen || isConfirmDeleteOpen || isSuccessDeleteOpen
  useModalRegistration('events-modal', isModalOpen)
  useModalRegistration('register-modal', isRegisterModalOpen)
  useModalRegistration('confirm-delete-modal', isConfirmDeleteOpen)
  useModalRegistration('success-delete-modal', isSuccessDeleteOpen)

  // Validation logic
  const REQUIRED = [
    { key: 'title', label: 'Event Title', test: () => (eventForm?.form?.title || '').trim().length > 0 },
    { key: 'date', label: 'Date', test: () => !!eventForm?.form?.date },
    { key: 'shortDescription', label: 'Short description', test: () => (eventForm?.form?.shortDescription || '').trim().length > 0 },
    {
      key: 'description', label: 'Content', test: () => {
        const htmlValue = eventForm?.editorHtml || eventForm?.form?.description || '';
        const html = typeof htmlValue === 'string' ? htmlValue : (htmlValue?.html || '');
        const text = html.replace(/<[^>]+>/g, '').trim();
        return text.length > 0;
      }
    },
    { key: 'location', label: 'Location', test: () => (eventForm?.form?.location || '').trim().length > 0 },
    { key: 'register_link', label: 'Registration Link', test: () => (eventForm?.form?.register_link || '').trim().length > 0 },
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
    eventForm?.form?.shortDescription,
    eventForm?.editorHtml,
    eventForm?.form?.description,
    eventForm?.form?.location,
    eventForm?.form?.register_link,
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
    if (isModalOpen && eventForm.form.repeat === 'custom' && !isCustomRecurrenceOpen) {
    }
  }, [isModalOpen, eventForm.form.repeat, isCustomRecurrenceOpen])

  // Auto-resize textarea when modal opens or value changes
  useEffect(() => {
    if (isModalOpen) {
      const textarea = document.getElementById('shortDescription')
      if (textarea) {
        textarea.style.height = 'auto'
        textarea.style.height = textarea.scrollHeight + 'px'
      }
    }
  }, [isModalOpen, eventForm.form.shortDescription])

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

  const getEventDescriptionText = (description) => {
    if (typeof description === 'string') {
      return description.replace(/<[^>]+>/g, '').trim();
    }
    if (typeof description === 'object' && description?.html) {
      return description.html.replace(/<[^>]+>/g, '').trim();
    }
    return '';
  }

  const getEventDescriptionParagraphs = (event) => {
    // Use shortDescription for the event card display
    return event.shortDescription || '';
  }

  const truncateText = (text, maxLength = 110) => {
    if (!text || text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '…' : truncated + '…'
  }

  // Header siempre visible (independiente del estado)
  const renderHeader = () => (
    <header className="events-header">
      <div className="events-header-title">
        <h1>Events</h1>
        <p>Manage Events</p>
      </div>
      <div className="events-actions">
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
  )

  // Renderizar contenido según el estado
  const renderContent = () => {
    if (!isInitialized || loading) {
      return (
        <>
          {renderHeader()}
          <EventsListSkeleton count={6} />
          <EventsPaginationSkeleton />
        </>
      )
    }

    if (error) {
      // Si el error es "No data found" (404), mostrar EmptyPage
      if (error.includes('No data found')) {
        return (
          <>
            {renderHeader()}
            <EmptyPage
              isAdmin={can(user, 'events:create')}
              title={can(user, 'events:create') ? 'Oops nothing to see here yet!' : 'Oops! No data found.'}
              description={
                can(user, 'events:create')
                  ? <>Looks like you haven't added anything. Go ahead and add<br /> your first item to get started!</>
                  : <>Nothing's been added here yet, or there might be a hiccup.<br />Try again or check back later!</>
              }
            />
          </>
        )
      }

      // Para otros errores, mostrar el estado de error normal
      return (
        <div className="events-error">
          <h2>Error loading events</h2>
          <p>{error}</p>
          {error.includes('Sesión expirada') ? (
            <div className="error-actions">
              <button onClick={() => window.location.href = '/login'} className="login-btn">
                Go to Login
              </button>
              <button onClick={refreshEvents} className="retry-btn">
                Try Again
              </button>
            </div>
          ) : (
            <button onClick={refreshEvents} className="retry-btn">
              Try Again
            </button>
          )}
        </div>
      )
    }

    if (!user) {
      return (
        <div className="events-error">
          <h2>Please log in to view events.</h2>
        </div>
      )
    }

    // Estado normal con datos
    return (
      <>
        {renderHeader()}
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
          <>
            <div className="events-list">
              {events.map((event, index) => (
                <div key={event.id || `event-${index}`} className="event-card">
                  <div className="event-image">
                    {/* Imagen borrosa para carga rápida */}
                    <img 
                      src={event.blurred_thumbnail} 
                      alt={event.title}
                      className="event-image-blurred"
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                    {/* Imagen principal de alta calidad */}
                    <img 
                      src={event.original_thumbnail || event.imagePreviewUrl} 
                      alt={event.title}
                      className="event-image-original"
                      onLoad={(e) => {
                        // Agregar clase loaded y ocultar imagen borrosa
                        e.target.classList.add('loaded')
                        const blurredImg = e.target.parentElement.querySelector('.event-image-blurred')
                        if (blurredImg) {
                          blurredImg.style.opacity = '0'
                          setTimeout(() => {
                            blurredImg.style.display = 'none'
                          }, 300)
                        }
                      }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                      }}
                    />
                  </div>
                  <div className="event-content">
                    <div className="event-header">
                      <span className={`event-type ${event.eventType.toLowerCase()}`}>
                        {getEventTypeLabel(event.eventType)}
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
                      {useFallback ? truncateText(getEventDescriptionParagraphs(event)) : getEventDescriptionParagraphs(event)}
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
            <div className="events-pagination">
              <button 
                className="prev-btn"
                onClick={() => changePage(pagination.current_page - 1)}
                disabled={pagination.current_page <= 1}
              >
                <i className="bi bi-chevron-left"></i>
              </button>
              <div className="page-counter">
                <span>{pagination.current_page} / {pagination.last_page}</span>
              </div>
              <button 
                className="next-btn"
                onClick={() => changePage(pagination.current_page + 1)}
                disabled={pagination.current_page >= pagination.last_page}
              >
                <i className="bi bi-chevron-right"></i>
              </button>
            </div>
          </>
        )}
      </>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    eventForm.onChange(name, value)

    // Handle custom recurrence popover and clear custom recurrence when changing to non-custom
    if (name === 'repeat' && value === 'custom') {
      setIsCustomRecurrenceOpen(true)
    } else if (name === 'repeat' && value !== 'custom') {
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
    // If the current value is custom and popover is closed, open it
    if (eventForm.form.repeat === 'custom' && !isCustomRecurrenceOpen) {
      setIsCustomRecurrenceOpen(true)
    }
  }

  // Rich Text Editor handler - one-way flow
  const handleEditorChange = (data) => {
    const html = typeof data === 'string' ? data : (data?.html || '');
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
        if (event.recurrence && event.recurrence.kind === 'custom') {
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

  const formatTimezone = (timezone) => {
    // Extract only the UTC±XX:XX part from the full timezone string
    const match = timezone.match(/UTC[±−+]\d{2}:\d{2}/)
    return match ? match[0] : timezone
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString + 'T12:00:00')
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const validateForm = () => {
    return eventForm.validate(modalMode === 'edit')
  }

  const handleSubmit = async (e) => {
    try {
      e.preventDefault()
      if (!validateRequired()) { bannerRef.current?.focus(); return; }
      
      // Validate form using hook validation (includes image size check)
      const isEditMode = modalMode === 'edit'
      if (!eventForm.validate(isEditMode)) { 
        bannerRef.current?.focus(); 
        return; 
      }

      // Clear any previous error messages
      eventForm.setErrorMessage('')

      let result
      if (modalMode === 'create') {
        const newEvent = eventForm.buildEventObject()
        result = await createEvent(newEvent)
      } else if (modalMode === 'edit' && editingEventId) {
        const updatedEvent = eventForm.buildEventObject(editingEventId)
        result = await updateEvent(updatedEvent)
      }

      // Only close modal if the operation was successful
      if (result && result.success) {
        closeModal()
      } else if (result && result.error) {
        // Show error in banner
        eventForm.setErrorMessage(result.error)
        bannerRef.current?.focus()
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      const errorMessage = error.message || 'An error occurred while saving the event'
      eventForm.setErrorMessage(errorMessage)
      bannerRef.current?.focus()
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
        setIsDeleting(false)
        setIsConfirmDeleteOpen(true)
      }
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('An error occurred while deleting the event')
    }
  }

  const handleConfirmDelete = async () => {
    try {
      if (eventToDelete) {
        setIsDeleting(true)
        
        // Wait for delete to complete successfully
        await deleteEvent(eventToDelete.id)
        
        // Close confirmation modal first
        setIsConfirmDeleteOpen(false)
        setEventToDelete(null)
        setIsDeleting(false)
        
        // Then show success modal
        setIsSuccessDeleteOpen(true)
      }
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error)
      alert('An error occurred while deleting the event')
      // Close confirmation modal even on error
      setIsConfirmDeleteOpen(false)
      setEventToDelete(null)
      setIsDeleting(false)
    }
  }

  const handleCustomRecurrenceUpdate = (recurrenceData) => {
    const normalizedRecurrence = eventForm.normalizeRecurrence(recurrenceData)

    eventForm.updateRecurrence(normalizedRecurrence)

    if (normalizedRecurrence.kind === 'weekly') {
      eventForm.onChange('repeat', 'weekly')
    } else {
      eventForm.onChange('repeat', 'custom')
    }

    setIsCustomRecurrenceOpen(false)
  }

  return (
    <>
      <div className="events-page">
        <div className="events-container">
          <section className="events-section">
            {renderContent()}
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
                    placeholder="Enter event title"
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
                    <CustomDropdown
                      id="timeZone"
                      name="timeZone"
                      value={eventForm.form.timeZone}
                      onChange={handleInputChange}
                      options={eventForm.TIME_ZONES}
                      formatDisplay={(opt) => opt.value}
                      placeholder="Select time zone"
                    />
                  </div>
                  <div className="form-group repeat-field">
                    <label htmlFor="repeat">Repeat</label>
                    <CustomDropdown
                      id="repeat"
                      name="repeat"
                      value={eventForm.form.repeat}
                      onChange={handleInputChange}
                      onClick={handleRepeatSelectClick}
                      options={eventForm.REPEAT_OPTIONS.map(option => ({ value: option.value, label: option.label }))}
                      placeholder="Select repeat option"
                    />
                    <CustomRecurrencePopover
                      isOpen={isCustomRecurrenceOpen}
                      onClose={() => setIsCustomRecurrenceOpen(false)}
                      onUpdate={handleCustomRecurrenceUpdate}
                      initialRecurrence={eventForm.form.recurrence}
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="eventType">Event Type</label>
                    <CustomDropdown
                      id="eventType"
                      name="eventType"
                      value={eventForm.form.eventType}
                      onChange={handleInputChange}
                      options={eventForm.EVENT_TYPE_OPTIONS}
                      placeholder="Select event type"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div className="label-with-counter">
                    <label htmlFor="shortDescription">
                      Short description<span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <span className="character-count">
                      <span className={eventForm.form.shortDescription && eventForm.form.shortDescription.length > 120 ? 'character-count-exceeded' : ''}>
                        {(eventForm.form.shortDescription || '').length}
                      </span>
                      /120
                    </span>
                  </div>
                  <textarea
                    id="shortDescription"
                    name="shortDescription"
                    value={eventForm.form.shortDescription}
                    onChange={(e) => {
                      handleInputChange(e)
                      // Auto-resize textarea
                      e.target.style.height = 'auto'
                      e.target.style.height = e.target.scrollHeight + 'px'
                    }}
                    placeholder="Enter short description"
                    rows={1}
                    required
                    className="short-description-textarea"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Content<span className="req-star" aria-hidden="true">*</span></label>
                  <RichTextEditor
                    docId={modalMode === 'edit' ? editingEventId : 'new'}
                    initialHTML={eventForm.editorHtml}
                    onChange={handleEditorChange}
                    placeholder="Write a description..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="location">Location<span className="req-star" aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={eventForm.form.location}
                    onChange={handleInputChange}
                    placeholder="Enter event location"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="register_link">Registration Link<span className="req-star" aria-hidden="true">*</span></label>
                  <input
                    type="url"
                    id="register_link"
                    name="register_link"
                    value={eventForm.form.register_link}
                    onChange={handleInputChange}
                    placeholder="https://register-event.com"
                    required
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
                  {(missingRequired.length > 0 || eventForm.errorMessage) && (
                    <div
                      className="app-form__error-banner"
                      role="alert"
                      aria-live="assertive"
                      tabIndex={-1}
                      ref={bannerRef}
                    >
                      {missingRequired.length > 0 && (
                        <div>
                          <strong>Please fill all required fields:</strong> {missingRequired.join(', ')}
                        </div>
                      )}
                      {eventForm.errorMessage && (
                        <div>
                          <strong>Error:</strong> {eventForm.errorMessage}
                        </div>
                      )}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    className="upload-now-btn"
                    disabled={eventForm.errorMessage ? true : false}
                  >
                    Submit
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
                    <div
                      className="wysiwyg-content"
                      dangerouslySetInnerHTML={{
                        __html: registeringEvent.editorHtml || registeringEvent.description || ''
                      }}
                    />
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
          setIsDeleting(false)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <SuccessDeleteModal
        isOpen={isSuccessDeleteOpen}
        onClose={() => setIsSuccessDeleteOpen(false)}
      />
    </>
  )
}
