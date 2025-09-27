export const loadLS = (key = 'newsletters') => {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
    return []
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error)
    return []
  }
}

export const saveLS = (value, key = 'newsletters') => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
    return false
  }
}

export const clearLS = (key = 'newsletters') => {
  try {
    localStorage.removeItem(key)
    return true
  } catch (error) {
    console.error(`Error clearing ${key} from localStorage:`, error)
    return false
  }
}
