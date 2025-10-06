// Newsletters storage helper functions for localStorage operations
import { makeRecentDate, fmtDateForCreatedAt } from './seedUtils'
export const NL_KEYS = { items: 'bvi.newsletters.items' }
const KEY = 'newsletters.storage.v1'
const defaults = { items: [] }

export function getNewsletters() {
  try {
    const o = JSON.parse(localStorage.getItem(KEY))
    return { ...defaults, ...(o || {}) }
  } catch {
    return defaults
  }
}

export function readNewsletters() {
  return getNewsletters()
}

export function setNewsletters(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items: Array.isArray(list) ? list : [] }))
  } catch {}
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

// TODO BACKEND: replace localStorage with API calls
export function getMockNewsletters() {
  
  const newsletterTemplates = [
    {
      id: 'newsletter-1',
      fileName: 'Monthly Update — July 2024',
      description: 'Stay informed with our latest company updates, industry insights, and upcoming events. This month we cover new product launches, team achievements, and market trends.',
      editorHtml: '',
      imageFileName: 'newsletter-july.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
      imagePreviewUrl: '',
      linkUrl: 'https://example.com/newsletter-july-2024'
    },
    {
      id: 'newsletter-2',
      fileName: 'Quarterly Report Q2 2024',
      description: 'Our comprehensive quarterly report covering financial performance, strategic initiatives, and key milestones achieved during the second quarter.',
      editorHtml: '',
      imageFileName: 'quarterly-q2.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
      imagePreviewUrl: '',
      linkUrl: 'https://example.com/quarterly-report-q2'
    },
    {
      id: 'newsletter-3',
      fileName: 'Product Launch Announcement',
      description: 'Exciting news! We are thrilled to announce the launch of our latest product line. Discover new features, benefits, and how it can transform your workflow.',
      editorHtml: '',
      imageFileName: 'product-launch.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
      imagePreviewUrl: '',
      linkUrl: 'https://example.com/product-launch-announcement'
    },
    {
      id: 'newsletter-4',
      fileName: 'Industry Insights — August 2024',
      description: 'Expert analysis on current market trends, emerging technologies, and strategic recommendations for navigating the evolving business landscape.',
      editorHtml: '',
      imageFileName: 'industry-insights.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
      imagePreviewUrl: '',
      linkUrl: 'https://example.com/industry-insights-august'
    },
    {
      id: 'newsletter-5',
      fileName: 'Team Spotlight & Achievements',
      description: 'Celebrating our amazing team members and their outstanding contributions. Learn about recent promotions, project successes, and employee recognition.',
      editorHtml: '',
      imageFileName: 'team-spotlight.jpg',
      imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
      imagePreviewUrl: '',
      linkUrl: 'https://example.com/team-spotlight-achievements'
    }
  ]

  return newsletterTemplates.map((template, index) => ({
    ...template,
    createdAt: fmtDateForCreatedAt(makeRecentDate({ maxDaysAgo: 7 - index }))
  }))
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
