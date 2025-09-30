import { useState, useEffect, useRef, useCallback } from 'react'
import { makeUpcomingDateRange, fmtDateYMD, fmtTimeHM } from '../helpers/seedUtils'
import { readEvents, seedEventsIfEmpty, upsertEvent, deleteEvent } from '../helpers/eventsStorage'

// Generate Events seeds with upcoming dates (tomorrow to +30 days)
const generateEventSeeds = () => {
  const eventTemplates = [
    {
      id: '1',
      title: 'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur',
      timeZone: 'EST',
      eventType: 'Workshop',
      description: 'Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore.',
      location: 'Conference Room A',
      imageFileName: 'workshop-audience.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=400&h=200&fit=crop',
      durationMinutes: 180 // 3 hours
    },
    {
      id: '2',
      title: 'Advanced Web Development Techniques',
      timeZone: 'UTC',
      eventType: 'Webinar',
      description: 'Learn web development techniques and best practices for modern applications.',
      location: 'Online Event',
      imageFileName: 'webinar-laptop.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=200&fit=crop',
      durationMinutes: 120 // 2 hours
    },
    {
      id: '3',
      title: 'Annual Tech Conference 2025',
      timeZone: 'America/New_York',
      eventType: 'Conference',
      description: 'Join the biggest tech conference featuring industry leaders and innovative technologies.',
      location: 'Convention Center',
      imageFileName: 'conference-hall.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=200&fit=crop',
      durationMinutes: 540 // 9 hours
    },
    {
      id: '4',
      title: 'Data Science Workshop',
      timeZone: 'Europe/London',
      eventType: 'Workshop',
      description: 'Hands-on workshop covering data analysis machine learning and visualization techniques.',
      location: 'Training Room B',
      imageFileName: 'workshop-data.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=400&h=200&fit=crop',
      durationMinutes: 180 // 3 hours
    },
    {
      id: '5',
      title: 'Digital Marketing Masterclass',
      timeZone: 'Asia/Tokyo',
      eventType: 'Webinar',
      description: 'Master digital marketing strategies and learn to create effective campaigns that drive results.',
      location: 'Virtual Event',
      imageFileName: 'webinar-marketing.jpg',
      imagePreviewUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=200&fit=crop',
      durationMinutes: 120 // 2 hours
    }
  ]

  return eventTemplates.map(template => {
    const { start, end } = makeUpcomingDateRange({ 
      minDaysAhead: 1, 
      maxDaysAhead: 30, 
      durationMinutes: template.durationMinutes 
    })
    
    return {
      ...template,
      date: fmtDateYMD(start),
      startTime: fmtTimeHM(start),
      endTime: fmtTimeHM(end)
    }
  })
}

export const useEventsState = () => {
  const hydratedRef = useRef(false)
  const [events, setEvents] = useState([])

  // Load events from storage on mount (only once)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    // Seed ONLY if empty, then hydrate
    seedEventsIfEmpty(() => generateEventSeeds())
    const { items: stored } = readEvents()
    setEvents(Array.isArray(stored) ? stored : [])
  }, [])

  const addEvent = useCallback((eventObj) => {
    // TODO BACKEND: replace seeds with GET /api/events
    const next = upsertEvent(eventObj)
    setEvents(next)
  }, [])

  const updateEvent = useCallback((eventObj) => {
    // TODO BACKEND: replace seeds with GET /api/events
    const next = upsertEvent(eventObj)
    setEvents(next)
  }, [])

  const deleteEventById = useCallback((id) => {
    // TODO BACKEND: replace seeds with GET /api/events
    const next = deleteEvent(id)
    setEvents(next)
  }, [])

  const seedIfEmpty = useCallback(() => {
    seedEventsIfEmpty(() => generateEventSeeds())
    const { items: stored } = readEvents()
    setEvents(Array.isArray(stored) ? stored : [])
  }, [])

  return {
    events,
    setEvents,
    addEvent,
    updateEvent,
    deleteEvent: deleteEventById,
    seedIfEmpty
  }
}
