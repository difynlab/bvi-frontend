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
  } catch {}
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
