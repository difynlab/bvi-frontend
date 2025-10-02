import { useState, useEffect, useRef, useCallback } from 'react'
import { readNewsletters, setNewsletters, getMockNewsletters, upsertNewsletter, deleteNewsletter } from '../helpers/newslettersStorage'

// Generate Newsletter seeds with recent dates (≤7 days old)
const generateNewsletterSeeds = () => {
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

  return newsletterTemplates.map(template => ({
    ...template,
    createdAt: fmtDateForCreatedAt(makeRecentDate({ maxDaysAgo: 6 }))
  }))
}

export const useNewslettersState = () => {
  const hydratedRef = useRef(false)
  const [newsletters, setNewsletters] = useState([])
  const [loading, setLoading] = useState(false)

  // Load newsletters from storage on mount (only once)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    // Load from storage without auto-seeding
    const { items: stored } = readNewsletters()
    setNewsletters(Array.isArray(stored) ? stored : [])
  }, [])

  const addNewsletter = useCallback((newsletterObj) => {
    // TODO BACKEND: replace seeds with GET /api/newsletters
    const newsletterWithDate = {
      ...newsletterObj,
      createdAt: newsletterObj.createdAt || new Date().toISOString().slice(0, 10)
    }
    const next = upsertNewsletter(newsletterWithDate)
    setNewsletters(next)
  }, [])

  const updateNewsletter = useCallback((newsletterObj) => {
    // TODO BACKEND: replace seeds with GET /api/newsletters
    const newsletterWithDate = {
      ...newsletterObj,
      createdAt: newsletterObj.createdAt || new Date().toISOString().slice(0, 10)
    }
    const next = upsertNewsletter(newsletterWithDate)
    setNewsletters(next)
  }, [])

  const deleteNewsletterById = useCallback((id) => {
    // TODO BACKEND: replace seeds with GET /api/newsletters
    const next = deleteNewsletter(id)
    setNewsletters(next)
  }, [])

  const seedFromMocks = useCallback(() => {
    // Get mock newsletters with recent dates
    const mockNewsletters = getMockNewsletters()
    
    // Overwrite current list with mock data
    setNewsletters(mockNewsletters)
    
    // Persist to storage
    setNewsletters(mockNewsletters)
  }, [])

  return {
    newsletters,
    setNewsletters,
    loading,
    setLoading,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter: deleteNewsletterById,
    seedFromMocks
  }
}