export const loadEventsLS = (key = 'events') => {
  try {
    const savedEvents = localStorage.getItem(key)
    if (savedEvents) {
      return JSON.parse(savedEvents)
    }
    return []
  } catch (error) {
    console.error('Error loading events from localStorage:', error)
    return []
  }
}

export const saveEventsLS = (events, key = 'events') => {
  try {
    localStorage.setItem(key, JSON.stringify(events))
    return true
  } catch (error) {
    console.error('Error saving events to localStorage:', error)
    return false
  }
}

export const clearEventsLS = (key = 'events') => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error('Error clearing events from localStorage:', error)
    return false
  }
}
