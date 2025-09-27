import { useState, useEffect } from 'react'
import { loadLS, saveLS } from '../helpers/newslettersStorage'

const demoNewsletters = [
  {
    id: 'newsletter-1',
    fileName: 'Monthly Update — July 2024',
    description: 'Stay informed with our latest company updates, industry insights, and upcoming events. This month we cover new product launches, team achievements, and market trends.',
    editorHtml: '',
    imageFileName: 'newsletter-july.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
    imagePreviewUrl: '',
    linkUrl: 'https://example.com/newsletter-july-2024',
    createdAt: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'newsletter-2',
    fileName: 'Quarterly Report Q2 2024',
    description: 'Our comprehensive quarterly report covering financial performance, strategic initiatives, and key milestones achieved during the second quarter.',
    editorHtml: '',
    imageFileName: 'quarterly-q2.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
    imagePreviewUrl: '',
    linkUrl: 'https://example.com/quarterly-report-q2',
    createdAt: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'newsletter-3',
    fileName: 'Product Launch Announcement',
    description: 'Exciting news! We are thrilled to announce the launch of our latest product line. Discover new features, benefits, and how it can transform your workflow.',
    editorHtml: '',
    imageFileName: 'product-launch.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop',
    imagePreviewUrl: '',
    linkUrl: 'https://example.com/product-launch-announcement',
    createdAt: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'newsletter-4',
    fileName: 'Industry Insights — August 2024',
    description: 'Expert analysis on current market trends, emerging technologies, and strategic recommendations for navigating the evolving business landscape.',
    editorHtml: '',
    imageFileName: 'industry-insights.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    imagePreviewUrl: '',
    linkUrl: 'https://example.com/industry-insights-august',
    createdAt: new Date().toISOString().slice(0, 10)
  },
  {
    id: 'newsletter-5',
    fileName: 'Team Spotlight & Achievements',
    description: 'Celebrating our amazing team members and their outstanding contributions. Learn about recent promotions, project successes, and employee recognition.',
    editorHtml: '',
    imageFileName: 'team-spotlight.jpg',
    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&h=600&fit=crop',
    imagePreviewUrl: '',
    linkUrl: 'https://example.com/team-spotlight-achievements',
    createdAt: new Date().toISOString().slice(0, 10)
  }
]

export const useNewslettersState = () => {
  const [newsletters, setNewsletters] = useState([])
  const [loading, setLoading] = useState(false)

  // Load newsletters from localStorage on mount
  useEffect(() => {
    try {
      const savedNewsletters = loadLS('newsletters')
      if (savedNewsletters && savedNewsletters.length > 0) {
        setNewsletters(savedNewsletters)
      } else {
        // No saved newsletters, start with empty array
        setNewsletters([])
      }
    } catch (error) {
      console.error('Error loading newsletters from localStorage:', error)
      setNewsletters([])
    }
  }, [])

  // Save newsletters to localStorage whenever newsletters change
  useEffect(() => {
    try {
      saveLS(newsletters, 'newsletters')
    } catch (error) {
      console.error('Error saving newsletters to localStorage:', error)
    }
  }, [newsletters])

  const addNewsletter = (newsletterObj) => {
    // TODO BACKEND: POST /api/newsletters
    const newsletterWithDate = {
      ...newsletterObj,
      createdAt: newsletterObj.createdAt || new Date().toISOString().slice(0, 10)
    }
    setNewsletters(prev => [...prev, newsletterWithDate])
  }

  const updateNewsletter = (newsletterObj) => {
    // TODO BACKEND: PUT /api/newsletters/:id
    setNewsletters(prev => prev.map(newsletter => {
      if (newsletter.id === newsletterObj.id) {
        return {
          ...newsletter,
          ...newsletterObj,
          createdAt: newsletter.createdAt || newsletterObj.createdAt || new Date().toISOString().slice(0, 10)
        }
      }
      return newsletter
    }))
  }

  const deleteNewsletter = (id) => {
    // TODO BACKEND: DELETE /api/newsletters/:id
    setNewsletters(prev => prev.filter(newsletter => newsletter.id !== id))
  }

  const seedDemoNewsletters = () => {
    // Check if already seeded to avoid duplicates
    const hasExistingNewsletters = newsletters.length > 0
    
    if (!hasExistingNewsletters) {
      // LOCALSTORAGE: Add to local state (will be saved to localStorage via useEffect)
      setNewsletters(demoNewsletters)
    } else {
      // If newsletters already exist, add only new ones that don't exist
      const existingIds = new Set(newsletters.map(n => n.id))
      const newNewsletters = demoNewsletters.filter(n => !existingIds.has(n.id))
      
      if (newNewsletters.length > 0) {
        setNewsletters(prev => [...prev, ...newNewsletters])
      }
    }
  }

  return {
    newsletters,
    setNewsletters,
    loading,
    setLoading,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter,
    seedDemoNewsletters
  }
}
