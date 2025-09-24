import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../auth/acl'
import '../../styles/sections/Events.scss'

const TIME_ZONES = [
  'UTC',
  'GMT',
  'GMT-3',
  'GMT+1',
  'America/Argentina/Buenos_Aires',
  'America/New_York',
  'Europe/Madrid',
  'Europe/London',
  'Asia/Tokyo',
  'Asia/Kolkata',
  'Australia/Sydney'
]

const EVENT_TYPES = [
  'Conference',
  'Webinar',
  'Workshop'
]

export const Events = () => {
  const { user, toggleRole, isInitialized } = useAuth()
  const editorRef = useRef(null)

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
  const [events, setEvents] = useState([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create') // 'create' | 'edit'
  const [editingEventId, setEditingEventId] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    date: '',
    startTime: '',
    endTime: '',
    timeZone: 'UTC',
    eventType: 'Conference',
    description: '',
    location: '',
    file: null
  })
  const [imageFileName, setImageFileName] = useState('')
  const [imagePreviewUrl, setImagePreviewUrl] = useState('')
  const [isDragOver, setIsDragOver] = useState(false)
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false)
  const [registeringEvent, setRegisteringEvent] = useState(null)
  const [validationErrors, setValidationErrors] = useState({})

  // Seed events data
  const seedEvents = [
    {
      id: '1',
      title: 'Duis aute irure dolor in reprehenderit',
      date: '2025-07-15',
      startTime: '14:00',
      endTime: '17:00',
      timeZone: 'EST',
      eventType: 'Workshop',
      description: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.',
      location: 'Conference Room A',
      imageFileName: 'workshop-audience.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=200&fit=crop'
    },
    {
      id: '2',
      title: 'Advanced Web Development Techniques',
      date: '2025-07-20',
      startTime: '10:00',
      endTime: '12:00',
      timeZone: 'UTC',
      eventType: 'Webinar',
      description: 'Learn web development techniques and best practices for modern applications.',
      location: 'Online Event',
      imageFileName: 'webinar-laptop.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop'
    },
    {
      id: '3',
      title: 'Annual Tech Conference 2025',
      date: '2025-08-01',
      startTime: '09:00',
      endTime: '18:00',
      timeZone: 'America/New_York',
      eventType: 'Conference',
      description: 'Join the biggest tech conference featuring industry leaders and innovative technologies.',
      location: 'Convention Center',
      imageFileName: 'conference-hall.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop'
    },
    {
      id: '4',
      title: 'Data Science Workshop',
      date: '2025-07-25',
      startTime: '13:00',
      endTime: '16:00',
      timeZone: 'Europe/London',
      eventType: 'Workshop',
      description: 'Hands-on workshop covering data analysis machine learning and visualization techniques.',
      location: 'Training Room B',
      imageFileName: 'workshop-data.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop'
    },
    {
      id: '5',
      title: 'Digital Marketing Masterclass',
      date: '2025-08-05',
      startTime: '15:00',
      endTime: '17:00',
      timeZone: 'Asia/Tokyo',
      eventType: 'Webinar',
      description: 'Master digital marketing strategies and learn to create effective campaigns that drive results.',
      location: 'Virtual Event',
      imageFileName: 'webinar-marketing.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop'
    }
  ]

  // Load events from localStorage on component mount
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('events')
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents)
        setEvents(parsedEvents)
      } else {
        // If no saved events, seed with sample data
        setEvents(seedEvents)
        localStorage.setItem('events', JSON.stringify(seedEvents))
      }
    } catch (error) {
      console.error('Error loading events from localStorage:', error)
      // Fallback to seed events if localStorage fails
      setEvents(seedEvents)
    }
  }, [])

  // Save events to localStorage whenever events change
  useEffect(() => {
    try {
      localStorage.setItem('events', JSON.stringify(events))
    } catch (error) {
      console.error('Error saving events to localStorage:', error)
    }
  }, [events])

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
    let newValue = value
    
    // Handle time clamping logic
    if (name === 'startTime') {
      // If startTime changes and endTime is set and endTime < startTime, adjust endTime
      if (formData.endTime && value && formData.endTime < value) {
        newValue = value
        setFormData(prev => ({ ...prev, [name]: value, endTime: value }))
      } else {
        setFormData(prev => ({ ...prev, [name]: value }))
      }
    } else if (name === 'endTime') {
      // If endTime is set and it's less than startTime, clamp it to startTime
      if (value && formData.startTime && value < formData.startTime) {
        newValue = formData.startTime
        setFormData(prev => ({ ...prev, [name]: formData.startTime }))
      } else {
        setFormData(prev => ({ ...prev, [name]: value }))
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    
    // Clear validation error when user starts editing any field
    if (Object.keys(validationErrors).length > 0) {
      setValidationErrors({})
    }
  }

  // WYSIWYG Editor Functions
  const execCommand = (command, value = null) => {
    try {
      document.execCommand(command, false, value)
      editorRef.current?.focus()
    } catch (error) {
      console.error('Error in execCommand:', error)
    }
  }

  const handleEditorChange = () => {
    try {
      if (editorRef.current) {
        const plainText = editorRef.current.textContent || editorRef.current.innerText || ''
        setFormData(prev => ({ ...prev, description: plainText }))
        
        // Clear validation error when user starts editing
        if (Object.keys(validationErrors).length > 0) {
          setValidationErrors({})
        }
      }
    } catch (error) {
      console.error('Error in handleEditorChange:', error)
    }
  }

  const clearFormatting = () => {
    execCommand('removeFormat')
    execCommand('formatBlock', 'p')
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const removeLink = () => {
    execCommand('unlink')
  }

  const openCreateModal = () => {
    try {
      setModalMode('create')
      setEditingEventId(null)
      resetForm()
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
        setFormData({
          title: event.title,
          date: event.date,
          startTime: event.startTime,
          endTime: event.endTime,
          timeZone: event.timeZone,
          eventType: event.eventType,
          description: event.description,
          location: event.location,
          file: null
        })
        setImageFileName(event.imageFileName)
        setImagePreviewUrl(event.imagePreviewUrl)
        setIsModalOpen(true)

        // Set editor content after modal opens
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = event.description
          }
        }, 100)
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
      resetForm()
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

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      setFormData(prev => ({ ...prev, file }))
      setImageFileName(file.name)
      setImagePreviewUrl(URL.createObjectURL(file))
      
      // Clear validation error when user selects a file
      if (Object.keys(validationErrors).length > 0) {
        setValidationErrors({})
      }
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      handleFileSelect(file)
    }
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
      handleFileSelect(file)
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
    const errors = []
    
    // Check all required fields are not empty
    if (!formData.title.trim()) {
      errors.push('Please complete all required fields.')
    } else if (!formData.date) {
      errors.push('Please complete all required fields.')
    } else if (!formData.startTime) {
      errors.push('Please complete all required fields.')
    } else if (!formData.endTime) {
      errors.push('Please complete all required fields.')
    } else if (!formData.timeZone) {
      errors.push('Please complete all required fields.')
    } else if (!formData.eventType) {
      errors.push('Please complete all required fields.')
    } else if (!formData.description.trim()) {
      errors.push('Please complete all required fields.')
    } else if (!formData.location.trim()) {
      errors.push('Please complete all required fields.')
    }
    
    // Check image is required
    if (!formData.file && !imagePreviewUrl) {
      errors.push('An image is required.')
    }
    
    // Check start time is before end time (shouldn't happen due to clamping, but keep as safety check)
    if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
      errors.push('Start time must be earlier than end time.')
    }
    
    // Convert array to object for compatibility with existing error display logic
    const errorObj = {}
    if (errors.length > 0) {
      errorObj.general = errors.join(' ')
    }
    
    setValidationErrors(errorObj)
    return Object.keys(errorObj).length === 0
  }

  const handleSubmit = (e) => {
    try {
      e.preventDefault()
      if (!validateForm()) return

      if (modalMode === 'create') {
        const newEvent = {
          id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
          title: formData.title,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          timeZone: formData.timeZone,
          eventType: formData.eventType,
          description: formData.description,
          location: formData.location,
          imageFileName: imageFileName || 'no-image.jpg',
          imagePreviewUrl: imagePreviewUrl || ''
        }

        // TODO BACKEND: Save new event to backend
        // try {
        //   const response = await fetch('/api/events', {
        //     method: 'POST',
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': `Bearer ${token}`
        //     },
        //     body: JSON.stringify(newEvent)
        //   })
        //   if (!response.ok) throw new Error('Failed to create event')
        //   const savedEvent = await response.json()
        //   setEvents(prev => [...prev, savedEvent])
        // } catch (error) {
        //   console.error('Error creating event:', error)
        //   alert('Failed to create event. Please try again.')
        //   return
        // }

        // LOCALSTORAGE: Add to local state (will be saved to localStorage via useEffect)
        setEvents(prev => [...prev, newEvent])
      } else if (modalMode === 'edit' && editingEventId) {
        // TODO BACKEND: Update existing event in backend
        // try {
        //   const response = await fetch(`/api/events/${editingEventId}`, {
        //     method: 'PUT',
        //     headers: {
        //       'Content-Type': 'application/json',
        //       'Authorization': `Bearer ${token}`
        //     },
        //     body: JSON.stringify({ ...formData, imageFileName, imagePreviewUrl })
        //   })
        //   if (!response.ok) throw new Error('Failed to update event')
        //   const updatedEvent = await response.json()
        //   setEvents(prev => prev.map(event => 
        //     event.id === editingEventId ? updatedEvent : event
        //   ))
        // } catch (error) {
        //   console.error('Error updating event:', error)
        //   alert('Failed to update event. Please try again.')
        //   return
        // }

        // LOCALSTORAGE: Update in local state (will be saved to localStorage via useEffect)
        setEvents(prev => prev.map(event =>
          event.id === editingEventId
            ? {
              ...event,
              title: formData.title,
              date: formData.date,
              startTime: formData.startTime,
              endTime: formData.endTime,
              timeZone: formData.timeZone,
              eventType: formData.eventType,
              description: formData.description,
              location: formData.location,
              imageFileName: imageFileName || event.imageFileName,
              imagePreviewUrl: imagePreviewUrl || event.imagePreviewUrl
            }
            : event
        ))
      }

      closeModal()
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('An error occurred while saving the event')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      date: '',
      startTime: '',
      endTime: '',
      timeZone: 'UTC',
      eventType: 'Conference',
      description: '',
      location: '',
      file: null
    })
    setImageFileName('')
    setImagePreviewUrl('')
    setValidationErrors({})
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
      // TODO BACKEND: Delete event from backend
      // try {
      //   const response = await fetch(`/api/events/${eventId}`, {
      //     method: 'DELETE',
      //     headers: {
      //       'Authorization': `Bearer ${token}`
      //     }
      //   })
      //   if (!response.ok) throw new Error('Failed to delete event')
      //   setEvents(prev => prev.filter(event => event.id !== eventId))
      // } catch (error) {
      //   console.error('Error deleting event:', error)
      //   alert('Failed to delete event. Please try again.')
      //   return
      // }

      // LOCALSTORAGE: Remove from local state (will be saved to localStorage via useEffect)
      setEvents(prev => prev.filter(event => event.id !== eventId))
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('An error occurred while deleting the event')
    }
  }

  return (
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
                setEvents(seedEvents)
                localStorage.setItem('events', JSON.stringify(seedEvents))
                alert('Sample events loaded!')
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
            <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
              <path d="M8 8h8" />
              <path d="M8 12h8" />
              <path d="M8 16h5" />
              <path d="M3 3l18 18" />
            </svg>
            <h2>Oops nothing to see here yet!</h2>
            <p>Looks like you haven't added anything. Go ahead and add your first item to get started!</p>
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
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>
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
        <div className="events-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="events-modal">
            <div className="events-modal-header">
              <h2>{modalMode === 'create' ? 'Add New Event' : 'Edit Event'}</h2>
              <button
                className="close-btn"
                onClick={closeModal}
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
                  value={formData.title}
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
                    value={formData.date}
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
                    value={formData.startTime}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="endTime">End Time</label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    min={formData.startTime || '00:00'}
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
                    value={formData.timeZone}
                    onChange={handleInputChange}
                  >
                    {TIME_ZONES.map(tz => (
                      <option key={tz} value={tz}>{tz}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="eventType">Event Type</label>
                  <select
                    id="eventType"
                    name="eventType"
                    value={formData.eventType}
                    onChange={handleInputChange}
                  >
                    {EVENT_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <div className="wysiwyg-editor">
                  <div className="wysiwyg-toolbar">
                    {/* Format Dropdown */}
                    <select
                      onChange={(e) => execCommand('formatBlock', e.target.value)}
                      defaultValue="p"
                    >
                      <option value="p">Paragraph</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                    </select>

                    {/* Text Formatting */}
                    <button type="button" onClick={() => execCommand('bold')} title="Bold">
                      <strong>B</strong>
                    </button>
                    <button type="button" onClick={() => execCommand('italic')} title="Italic">
                      <em>I</em>
                    </button>
                    <button type="button" onClick={() => execCommand('underline')} title="Underline">
                      <u>U</u>
                    </button>
                    <button type="button" onClick={() => execCommand('strikeThrough')} title="Strikethrough">
                      <s>S</s>
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Lists */}
                    <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                      • List
                    </button>
                    <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
                      1. List
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Alignment */}
                    <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left">
                      ←
                    </button>
                    <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center">
                      ↔
                    </button>
                    <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right">
                      →
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Special Formatting */}
                    <button type="button" onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote">
                      " Quote
                    </button>
                    <button type="button" onClick={() => execCommand('insertText', '`code`')} title="Inline Code">
                      `code`
                    </button>
                    <button type="button" onClick={() => execCommand('formatBlock', 'pre')} title="Code Block">
                      { } Code
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Links */}
                    <button type="button" onClick={insertLink} title="Insert Link">
                      🔗 Link
                    </button>
                    <button type="button" onClick={removeLink} title="Remove Link">
                      🔗× Unlink
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* History */}
                    <button type="button" onClick={() => execCommand('undo')} title="Undo">
                      ↶ Undo
                    </button>
                    <button type="button" onClick={() => execCommand('redo')} title="Redo">
                      ↷ Redo
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Clear */}
                    <button type="button" onClick={clearFormatting} title="Clear Formatting">
                      ✕ Clear
                    </button>
                  </div>
                  <div
                    ref={editorRef}
                    className="wysiwyg-content wysiwyg-content-fix"
                    contentEditable
                    onInput={handleEditorChange}
                    suppressContentEditableWarning={true}
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="location">Location</label>
                <input
                  type="text"
                  id="location"
                  name="location"
                  value={formData.location}
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
                    {imageFileName || 'No file chosen'}
                  </p>
                  {imagePreviewUrl && (
                    <div className="image-preview">
                      <img src={imagePreviewUrl} alt="Preview" />
                    </div>
                  )}
                </div>
              </div>

              {Object.keys(validationErrors).length > 0 && (
                <div style={{ color: '#ff0a0a', fontSize: '12px', marginBottom: '10px' }}>
                  {Object.values(validationErrors).join(' ')}
                </div>
              )}

              <div className="form-actions">
                <button type="button" onClick={closeModal}>
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
        <div className="events-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeRegisterModal()}>
          <div className="register-modal">
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
  )
}
