// Events storage helper functions for localStorage operations
const KEY = 'events.storage.v1'
const defaults = { items: [] }

export function readEvents() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY))
    return { ...defaults, ...(o || {}) }
  } catch {
    return defaults
  }
}

export function writeEvents(data) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items: data.items || [] }))
  } catch {}
}

export function seedEventsIfEmpty(seedFn) {
  const d = readEvents()
  if (!Array.isArray(d.items) || d.items.length === 0) {
    const seeded = (typeof seedFn === 'function' ? seedFn() : [])
    writeEvents({ items: Array.isArray(seeded) ? seeded : [] })
  }
}

export function upsertEvent(ev) {
  const d = readEvents()
  const idx = d.items.findIndex(x => x.id === ev.id)
  if (idx >= 0) {
    d.items[idx] = ev
  } else {
    d.items = [...d.items, ev]
  }
  writeEvents(d)
  return d.items
}

export function deleteEvent(id) {
  const d = readEvents()
  d.items = d.items.filter(x => x.id !== id)
  writeEvents(d)
  return d.items
}