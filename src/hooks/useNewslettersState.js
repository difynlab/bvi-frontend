import { useState, useEffect, useRef, useCallback } from 'react'
import { readNewsletters, setNewsletters as persistNewsletters, getMockNewsletters, upsertNewsletter, deleteNewsletter } from '../helpers/newslettersStorage'
import newslettersApi from '../api/newslettersApi'
import { saveNewsletterImageToLocalStorage } from '../utils/newsletterTransformers'

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
  const [initialLoading, setInitialLoading] = useState(true)

  // Load newsletters from API on mount (only once)
  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true

    // Load newsletters from API
    const loadNewsletters = async () => {
      try {
        setLoading(true)
        setInitialLoading(true)
        const response = await newslettersApi.getAll()
      // Handle different response structures
      let newslettersData = []
      if (response.data && response.data.data && Array.isArray(response.data.data)) {
        // Paginated response: response.data.data
        newslettersData = response.data.data
      } else if (response.data && Array.isArray(response.data)) {
        // Direct array in data
        newslettersData = response.data
      } else if (Array.isArray(response)) {
        // Direct array response
        newslettersData = response
      } else if (response.newsletters && Array.isArray(response.newsletters)) {
        // Alternative structure
        newslettersData = response.newsletters
      }
      
      
        setNewsletters(newslettersData)
      } catch (error) {
        // Only log non-404 errors
        if (!error.message.includes('No newsletters found') && !error.message.includes('No data found')) {
          console.error('Error loading newsletters from API:', error)
        }
        // Fallback to empty array if API fails
        setNewsletters([])
      } finally {
        setLoading(false)
        setInitialLoading(false)
      }
    }

    loadNewsletters()
  }, [])

  const addNewsletter = useCallback(async (newsletterObj) => {
    try {
      setLoading(true)
      
      // Enviar al backend
      const response = await newslettersApi.create(newsletterObj)
      
      // Actualizar lista local - extraer solo los datos del newsletter
      const newsletterData = response.data || response
      setNewsletters(prev => [...prev, newsletterData])
      
      // Guardar imagen en localStorage con el ID del backend para PDF
      if (newsletterObj.thumbnail && newsletterData.id) {
        try {
          await saveNewsletterImageToLocalStorage(newsletterData.id, newsletterObj.thumbnail)
        } catch (error) {
          console.warn('⚠️ Could not save image to localStorage (quota exceeded), PDF will work without image:', error)
        }
      }
      
      // TODO: Remover localStorage cuando esté en producción
      const newsletterWithDate = {
        ...newsletterObj,
        createdAt: newsletterObj.createdAt || new Date().toISOString().slice(0, 10)
      }
      upsertNewsletter(newsletterWithDate)
    } catch (error) {
      console.error('Error creating newsletter:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const updateNewsletter = useCallback(async (id, newsletterObj) => {
    try {
      setLoading(true)
      
      // Enviar al backend
      const response = await newslettersApi.update(id, newsletterObj)
      
      // Extraer los datos del newsletter de la respuesta
      const updatedNewsletter = response.data || response
      
      // Actualizar lista local
      setNewsletters(prev => prev.map(nl => nl.id === id ? updatedNewsletter : nl))
      
      // Guardar nueva imagen en localStorage con el ID del backend para PDF
      if (newsletterObj.thumbnail && id) {
        try {
          await saveNewsletterImageToLocalStorage(id, newsletterObj.thumbnail)
        } catch (error) {
          console.warn('⚠️ Could not save updated image to localStorage (quota exceeded), PDF will work without image:', error)
        }
      }
      
      // TODO: Remover localStorage cuando esté en producción
      const newsletterWithDate = {
        ...newsletterObj,
        createdAt: newsletterObj.createdAt || new Date().toISOString().slice(0, 10)
      }
      upsertNewsletter(newsletterWithDate)
    } catch (error) {
      console.error('Error updating newsletter:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const deleteNewsletterById = useCallback(async (id) => {
    try {
      setLoading(true)
      
      // Enviar al backend
      await newslettersApi.delete(id)
      
      // Actualizar lista local
      setNewsletters(prev => prev.filter(nl => nl.id !== id))
      
      // TODO: Remover localStorage cuando esté en producción
      deleteNewsletter(id)
    } catch (error) {
      console.error('Error deleting newsletter:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  const seedFromMocks = useCallback(() => {
    // Get mock newsletters with recent dates
    const mockNewsletters = getMockNewsletters()
    
    // Overwrite current list with mock data
    setNewsletters(mockNewsletters)
    
    // Persist to storage
    persistNewsletters(mockNewsletters)
  }, [])

  // Función para limpiar seeds del localStorage pero mantener imágenes
  const clearNewsletterSeeds = useCallback(() => {
    try {
      // Limpiar solo los datos de newsletters, no las imágenes
      localStorage.removeItem('newsletters.storage.v1')
      setNewsletters([])
      console.log('✅ Cleared newsletter seeds from localStorage')
    } catch (error) {
      console.error('❌ Error clearing newsletter seeds:', error)
    }
  }, [])

  return {
    newsletters,
    setNewsletters,
    loading,
    setLoading,
    initialLoading,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter: deleteNewsletterById,
    seedFromMocks,
    clearNewsletterSeeds
  }
}