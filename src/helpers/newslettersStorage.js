// Newsletters storage helper functions for localStorage operations
const KEY = 'newsletters.storage.v1'
const defaults = { items: [] }

export function readNewsletters() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY))
    return { ...defaults, ...(o || {}) }
  } catch {
    return defaults
  }
}

export function writeNewsletters(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items: data.items || [] }))
  } catch {}
}

export function seedNewslettersIfEmpty(seedFn) {
  const d = readNewsletters()
  if (!Array.isArray(d.items) || d.items.length === 0) {
    const seeded = (typeof seedFn === 'function' ? seedFn() : [])
    writeNewsletters({ items: Array.isArray(seeded) ? seeded : [] })
  }
}

export function upsertNewsletter(nl) {
  const d = readNewsletters()
  const idx = d.items.findIndex(x => x.id === nl.id)
  if (idx >= 0) {
    d.items[idx] = nl
  } else {
    d.items = [...d.items, nl]
  }
  writeNewsletters(d)
  return d.items
}

export function deleteNewsletter(id) {
  const d = readNewsletters()
  d.items = d.items.filter(x => x.id !== id)
  writeNewsletters(d)
  return d.items
}

// Legacy compatibility functions (deprecated - use new functions above)
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
