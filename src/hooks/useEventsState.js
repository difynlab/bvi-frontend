import { useState, useEffect } from 'react'

const seedEvents = [
  {
    id: '1',
    title: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
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

export const useEventsState = () => {
  const [events, setEvents] = useState([])

  // Load events from localStorage on mount
  useEffect(() => {
    try {
      const savedEvents = localStorage.getItem('events')
      if (savedEvents) {
        const parsedEvents = JSON.parse(savedEvents)
        // Ensure all events have a repeat field, defaulting to 'NO_REPEAT' if missing
        const eventsWithRepeat = parsedEvents.map(event => ({
          ...event,
          repeat: event.repeat || 'NO_REPEAT'
        }))
        setEvents(eventsWithRepeat)
      } else {
        // If no saved events, seed with sample data
        setEvents(seedEvents)
        localStorage.setItem('events', JSON.stringify(seedEvents))
      }
    } catch (error) {
      console.error('Error loading events from localStorage:', error)
      // Fallback to seed events if localStorage fails
      setEvents(seedEvents)
      localStorage.setItem('events', JSON.stringify(seedEvents))
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

  const seedIfEmpty = () => {
    setEvents(seedEvents)
    localStorage.setItem('events', JSON.stringify(seedEvents))
  }

  const addEvent = (eventObj) => {
    // TODO BACKEND: Save new event to backend
    // try {
    //   const response = await fetch('/api/events', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify(eventObj)
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
    setEvents(prev => [...prev, eventObj])
  }

  const updateEvent = (eventObj) => {
    // TODO BACKEND: Update existing event in backend
    // try {
    //   const response = await fetch(`/api/events/${eventObj.id}`, {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify(eventObj)
    //   })
    //   if (!response.ok) throw new Error('Failed to update event')
    //   const updatedEvent = await response.json()
    //   setEvents(prev => prev.map(event => 
    //     event.id === eventObj.id ? updatedEvent : event
    //   ))
    // } catch (error) {
    //   console.error('Error updating event:', error)
    //   alert('Failed to update event. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Update in local state (will be saved to localStorage via useEffect)
    setEvents(prev => prev.map(event =>
      event.id === eventObj.id ? eventObj : event
    ))
  }

  const deleteEvent = (id) => {
    // TODO BACKEND: Delete event from backend
    // try {
    //   const response = await fetch(`/api/events/${id}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`
    //     }
    //   })
    //   if (!response.ok) throw new Error('Failed to delete event')
    //   setEvents(prev => prev.filter(event => event.id !== id))
    // } catch (error) {
    //   console.error('Error deleting event:', error)
    //   alert('Failed to delete event. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Remove from local state (will be saved to localStorage via useEffect)
    setEvents(prev => prev.filter(event => event.id !== id))
  }

  return {
    events,
    setEvents,
    addEvent,
    updateEvent,
    deleteEvent,
    seedIfEmpty
  }
}
