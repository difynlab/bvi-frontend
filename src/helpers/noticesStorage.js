// Notices storage helper functions for localStorage operations
const CATEGORIES_KEY = 'notices.categories'
const ITEMS_KEY = 'notices.items'

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

export function upsertNotice(noticeObj) {
  const { categories, items } = readNotices()
  const group = items.find(group => group.categoryId === noticeObj.noticeType)
  
  if (!group) {
    console.error('Category group not found for notice')
    return { categories, items }
  }

  // TODO BACKEND: timestamps must be set by server for audit integrity
  // TODO BACKEND: POST /api/notices or PUT /api/notices/:id
  const updatedItems = items.map(group => 
    group.categoryId === noticeObj.noticeType 
      ? { ...group, items: [...group.items, noticeObj] }
      : group
  )
  
  writeNotices(categories, updatedItems)
  return { categories, items: updatedItems }
}

export function updateNotice(noticeObj) {
  const { categories, items } = readNotices()
  const oldGroup = items.find(group => 
    group.items.some(notice => notice.id === noticeObj.id)
  )
  const newGroup = items.find(group => group.categoryId === noticeObj.noticeType)

  if (!oldGroup || !newGroup) {
    console.error('Category groups not found for notice update')
    return { categories, items }
  }

  // TODO BACKEND: timestamps must be set by server for audit integrity
  // TODO BACKEND: PUT /api/notices/:id
  let updatedItems
  if (oldGroup.categoryId === newGroup.categoryId) {
    // Same category - just update the notice
    updatedItems = items.map(group => 
      group.categoryId === oldGroup.categoryId
        ? { ...group, items: group.items.map(notice => 
            notice.id === noticeObj.id ? noticeObj : notice
          )}
        : group
    )
  } else {
    // Different category - move notice between groups
    updatedItems = items.map(group => {
      if (group.categoryId === oldGroup.categoryId) {
        // Remove from old group
        return { ...group, items: group.items.filter(notice => notice.id !== noticeObj.id) }
      } else if (group.categoryId === newGroup.categoryId) {
        // Add to new group
        return { ...group, items: [...group.items, noticeObj] }
      }
      return group
    })
  }
  
  writeNotices(categories, updatedItems)
  return { categories, items: updatedItems }
}

export function deleteNotice(id) {
  const { categories, items } = readNotices()
  
  // TODO BACKEND: DELETE /api/notices/:id
  const updatedItems = items.map(group => ({
    ...group,
    items: group.items.filter(notice => notice.id !== id)
  }))
  
  writeNotices(categories, updatedItems)
  return { categories, items: updatedItems }
}

// Mock notices factory with recent timestamps for Dashboard integration
export function getMockNotices() {
  const now = Date.now()
  const mk = (fileName, offsetMinutes, noticeType = 'general') => {
    const ms = now - offsetMinutes * 60_000
    const d = new Date(ms)
    
    // Helper to get local date string (YYYY-MM-DD)
    const getLocalDateString = () => {
      const year = d.getFullYear()
      const month = String(d.getMonth() + 1).padStart(2, '0')
      const day = String(d.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }
    
    return {
      id: crypto.randomUUID(),
      fileName,
      noticeType,
      description: 'Seed notice description',
      editorHtml: '<p>Seed notice description</p>',
      imageFileName: 'seed-notice.jpg',
      imagePreviewUrl: '',
      linkUrl: 'https://example.com/seed-notice',
      createdAt: getLocalDateString(),
      createdAtISO: d.toISOString(),
      createdAtMs: ms
    }
  }
  
  // Spread within last ~3 days for deterministic ordering
  return [
    mk('Support Notice A', 30, 'general'),     // 30 minutes ago
    mk('Support Notice B', 120, 'general'),    // 2 hours ago  
    mk('Support Notice C', 1500, 'general'),   // ~1 day ago
    mk('Support Notice D', 3000, 'general'),   // ~2 days ago
    mk('Support Notice E', 4500, 'general'),   // ~3 days ago
  ]
}
