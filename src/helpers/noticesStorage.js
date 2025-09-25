export const loadLS = (key, fallback = []) => {
  try {
    const saved = localStorage.getItem(key)
    if (saved) {
      return JSON.parse(saved)
    }
    return fallback
  } catch (error) {
    console.error(`Error loading ${key} from localStorage:`, error)
    return fallback
  }
}

export const saveLS = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (error) {
    console.error(`Error saving ${key} to localStorage:`, error)
    return false
  }
}
