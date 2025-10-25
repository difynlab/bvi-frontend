// Notices storage helper functions for localStorage operations
// TODO BACKEND: timestamps, categories, and images will come from API

export const NOTICE_KEYS = {
  items: 'bvi.notices.items',
  categories: 'bvi.notices.categories',
}

const CATEGORIES_KEY = NOTICE_KEYS.categories
const ITEMS_KEY = NOTICE_KEYS.items

const defaultCategories = []

const defaultItems = []

export function readNotices() {
  try {
    const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || defaultCategories
    const items = JSON.parse(localStorage.getItem(ITEMS_KEY)) || defaultItems
    return { categories, items }
  } catch (error) {
    console.error('Error reading notices from localStorage:', error)
    return { categories: defaultCategories, items: defaultItems }
  }
}

export function writeNotices(categories, items) {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories))
    localStorage.setItem(ITEMS_KEY, JSON.stringify(items))
    return true
  } catch (error) {
    console.error('Error writing notices to localStorage:', error)
    return false
  }
}

export function getNoticeCategories() {
  try {
    const categories = JSON.parse(localStorage.getItem(CATEGORIES_KEY)) || []
    return Array.isArray(categories) ? categories : []
  } catch {
    return []
  }
}

export function setNoticeCategories(list) {
  try {
    const safe = Array.isArray(list) ? list : []
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(safe))
    
    // Ensure that items array has corresponding groups for all categories
    ensureCategoryGroups(safe)
  } catch {}
}

// Helper function to ensure all categories have corresponding item groups
function ensureCategoryGroups(categories) {
  try {
    const { items } = readNotices()
    const categoryIds = categories.map(cat => cat.id)
    const existingGroupIds = items.map(group => group.categoryId)
    
    // Find missing groups
    const missingGroupIds = categoryIds.filter(id => !existingGroupIds.includes(id))
    
    if (missingGroupIds.length > 0) {
      // Create missing groups
      const newGroups = missingGroupIds.map(categoryId => ({
        categoryId,
        items: []
      }))
      
      // Update items with new groups
      const updatedItems = [...items, ...newGroups]
      const { categories } = readNotices()
      writeNotices(categories, updatedItems)
    }
  } catch (error) {
    console.error('Error ensuring category groups:', error)
  }
}

export function setNotices(list) {
  try {
    const safe = Array.isArray(list) ? list : []
    localStorage.setItem(ITEMS_KEY, JSON.stringify(safe))
  } catch {}
}

export function addCategory(name) {
  const { categories, items } = readNotices()
  const slug = name.toLowerCase().replace(/\s+/g, '-')
  const newCategory = {
    id: slug,
    name: name.trim(),
    slug: slug
  }
  
  // TODO BACKEND: POST /api/notice-categories
  const updatedCategories = [...categories, newCategory]
  const updatedItems = [...items, { categoryId: slug, items: [] }]
  
  writeNotices(updatedCategories, updatedItems)
  return { categories: updatedCategories, items: updatedItems }
}

export function deleteCategory(id) {
  const { categories, items } = readNotices()
  const group = items.find(group => group.categoryId === id)
  
  if (group && group.items.length > 0) {
    throw new Error('Cannot delete category with existing notices')
  }

  // TODO BACKEND: DELETE /api/notice-categories/:id
  const updatedCategories = categories.filter(cat => cat.id !== id)
  const updatedItems = items.filter(group => group.categoryId !== id)
  
  writeNotices(updatedCategories, updatedItems)
  return { categories: updatedCategories, items: updatedItems }
}

export function deleteCategoryAndNotices(id) {
  const { categories, items } = readNotices()
  
  // TODO BACKEND: DELETE /api/notice-categories/:id (cascade delete notices)
  const updatedCategories = categories.filter(cat => cat.id !== id)
  const updatedItems = items.filter(group => group.categoryId !== id)
  
  writeNotices(updatedCategories, updatedItems)
  return { categories: updatedCategories, items: updatedItems }
}

export function updateCategory(id, newName) {
  const { categories, items } = readNotices()
  const slug = newName.toLowerCase().replace(/\s+/g, '-')
  
  // TODO BACKEND: PUT /api/notice-categories/:id
  const updatedCategories = categories.map(cat => 
    cat.id === id 
      ? { ...cat, name: newName.trim(), slug: slug }
      : cat
  )
  
  // Update the categoryId in items if needed (though it shouldn't change)
  const updatedItems = items.map(group => 
    group.categoryId === id 
      ? { ...group, categoryId: slug }
      : group
  )
  
  writeNotices(updatedCategories, updatedItems)
  return { categories: updatedCategories, items: updatedItems }
}

// DEPRECATED: This function is no longer used as notices are now stored in backend
// Kept for backward compatibility during transition
export function upsertNotice(noticeObj) {
  console.warn('upsertNotice is deprecated. Notices are now stored in backend.')
  return { categories: [], items: [] }
}

// DEPRECATED: This function is no longer used as notices are now stored in backend
// Kept for backward compatibility during transition
export function updateNotice(noticeObj) {
  console.warn('updateNotice is deprecated. Notices are now stored in backend.')
  return { categories: [], items: [] }
}

// DEPRECATED: This function is no longer used as notices are now stored in backend
// Kept for backward compatibility during transition
export function deleteNotice(id) {
  console.warn('deleteNotice is deprecated. Notices are now stored in backend.')
  return { categories: [], items: [] }
}

// Mock notices factory with recent timestamps for Dashboard integration
export function getMockNoticeCategories() {
  return [
    { id: 'cat-1', name: 'Regulatory Updates' },
    { id: 'cat-2', name: 'Industry News' },
    { id: 'cat-3', name: 'Member Notices' },
  ]
}

export function getMockNotices() {
  // TODO BACKEND: images and timestamps will come from API
  const mockImg = '/images/notices-mock.png'
  const now = Date.now()
  const mk = (title, offsetMin, categoryId) => {
    const ms = now - offsetMin * 60_000
    const d = new Date(ms)
    const publishDate = d.toISOString().slice(0,10)
    const id = (globalThis.crypto?.randomUUID?.() || `${ms}-${Math.random()}`)
    return {
      id,
      title,
      categoryId,
      publishDate,
      createdAtISO: d.toISOString(),
      createdAtMs: ms,
      description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      imageUrl: mockImg,
      attachments: [],
      // legacy fields for compatibility with existing UI
      fileName: title,
      noticeType: categoryId,
      createdAt: publishDate,
      imagePreviewUrl: ''
    }
  }

  return [
    mk('Policy Circular 2025-07', 30,   'cat-1'),
    mk('Guidance Update Q3',      120,  'cat-1'),
    mk('Market Snapshot',         300,  'cat-2'),
    mk('FinTech Brief',           720,  'cat-2'),
    mk('Member Bulletin A',       1440, 'cat-3'),
    mk('Member Bulletin B',       2160, 'cat-3'),
  ]
}

// Active tab persistence helpers
const ACTIVE_KEY = 'bvi.notices.activeTab'

export function loadActiveTabId() {
  try {
    return localStorage.getItem(ACTIVE_KEY)
  } catch {
    return null
  }
}

export function saveActiveTabId(id) {
  try {
    if (id) {
      localStorage.setItem(ACTIVE_KEY, id)
    } else {
      localStorage.removeItem(ACTIVE_KEY)
    }
  } catch {
    // Silently fail if localStorage is not available
  }
}