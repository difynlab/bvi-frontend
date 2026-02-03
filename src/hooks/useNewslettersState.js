import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { readNewsletters, setNewsletters as persistNewsletters, getMockNewsletters, upsertNewsletter, deleteNewsletter } from '../helpers/newslettersStorage'
import newslettersApi from '../api/newslettersApi'
import { saveNewsletterImageToLocalStorage, transformFromBackend } from '../utils/newsletterTransformers'
import newsletterCategoriesService from '../services/newsletterCategoriesService'

const sortNewslettersByPublishDate = (newsletters) => {
  return [...newsletters].sort((a, b) => {
    const getPublishDate = (newsletter) => {
      const dateValue = newsletter.publishDate || 
                        newsletter.publish_date || 
                        newsletter.data?.publish_date || 
                        newsletter.data?.created_at || 
                        newsletter.createdAt || 
                        newsletter.created_at
      
      if (!dateValue) return null
      
      if (typeof dateValue === 'string' && dateValue.match(/^\d{4}-\d{2}-\d{2}$/)) {
        return new Date(dateValue + 'T00:00:00')
      }
      
      const date = new Date(dateValue)
      return isNaN(date.getTime()) ? null : date
    }
    
    const dateA = getPublishDate(a)
    const dateB = getPublishDate(b)
    
    if (!dateA && !dateB) return 0
    if (!dateA) return 1
    if (!dateB) return -1
    
    return dateB.getTime() - dateA.getTime()
  })
}

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
  const [categories, setCategories] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [categoriesLoaded, setCategoriesLoaded] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [shouldReloadCategories, setShouldReloadCategories] = useState(false)

  const loadNewslettersFromAPI = useCallback(async () => {
    try {
      setLoading(true)
      setInitialLoading(true)
      
      const allNewsletters = []
      let currentPage = 1
      let hasMorePages = true
      const perPage = 100
      
      while (hasMorePages) {
        const response = await newslettersApi.getAll(perPage, currentPage)
        
        let newslettersData = []
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          newslettersData = response.data.data
        } else if (response.data && Array.isArray(response.data)) {
          newslettersData = response.data
        } else if (Array.isArray(response)) {
          newslettersData = response
        } else if (response.newsletters && Array.isArray(response.newsletters)) {
          newslettersData = response.newsletters
        }
        
        const transformedNewsletters = newslettersData.map(newsletter => transformFromBackend(newsletter))
        allNewsletters.push(...transformedNewsletters)
        
        const totalPages = response.data?.last_page || 1
        const total = response.data?.total || 0
        
        if (currentPage >= totalPages || newslettersData.length === 0) {
          hasMorePages = false
        } else {
          currentPage++
        }
      }
      
      const sortedNewsletters = sortNewslettersByPublishDate(allNewsletters)
      setNewsletters(sortedNewsletters)
    } catch (error) {
      if (!error.message.includes('No newsletters found') && !error.message.includes('No data found')) {
        console.error('Error loading newsletters from API:', error)
      }
      setNewsletters([])
    } finally {
      setLoading(false)
      setInitialLoading(false)
    }
  }, [])

  useEffect(() => {
    if (hydratedRef.current) return
    hydratedRef.current = true
    loadNewslettersFromAPI()
  }, [loadNewslettersFromAPI])

  const filteredNewsletters = useMemo(() => {
    if (!activeCategory) {
      return []
    }
    if (!newsletters.length) {
      return []
    }
    return newsletters.filter(newsletter => {
      const newsletterCategoryId = newsletter.newsletter_category_id || newsletter.newsletterType
      return newsletterCategoryId === activeCategory || newsletterCategoryId === Number(activeCategory)
    })
  }, [newsletters, activeCategory])

  const visibleItems = useMemo(() => {
    if (!filteredNewsletters.length) return []
    return sortNewslettersByPublishDate([...filteredNewsletters])
  }, [filteredNewsletters])

  const addNewsletter = useCallback(async (newsletterObj) => {
    try {
      setLoading(true)
      
      // Enviar al backend
      const response = await newslettersApi.create(newsletterObj)
      
      // Actualizar lista local - extraer solo los datos del newsletter y transformar
      const backendNewsletter = response.data || response
      const transformedNewsletter = transformFromBackend(backendNewsletter)
      setNewsletters(prev => sortNewslettersByPublishDate([...prev, transformedNewsletter]))
      
      // Guardar imagen en localStorage con el ID del backend para PDF
      if (newsletterObj.thumbnail && transformedNewsletter.id) {
        try {
          await saveNewsletterImageToLocalStorage(transformedNewsletter.id, newsletterObj.thumbnail)
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
      
      // Extraer los datos del newsletter de la respuesta y transformar
      const backendNewsletter = response.data || response
      const transformedNewsletter = transformFromBackend(backendNewsletter)
      
      // Actualizar lista local
      setNewsletters(prev => sortNewslettersByPublishDate(prev.map(nl => nl.id === id ? transformedNewsletter : nl)))
      
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
      localStorage.removeItem('newsletters.storage.v1')
      setNewsletters([])
    } catch (error) {
      console.error('❌ Error clearing newsletter seeds:', error)
    }
  }, [])

  const loadCategoriesFromAPI = useCallback(async (forceRefresh = false) => {
    if (categoriesLoading) return
    
    if (!forceRefresh) {
      try {
        const cachedCategories = localStorage.getItem('bvi.newsletters.categoriesCache')
        const isLoaded = localStorage.getItem('bvi.newsletters.categoriesLoaded') === 'true'
        
        if (isLoaded && cachedCategories) {
          const parsedCategories = JSON.parse(cachedCategories)
          if (parsedCategories.length > 0) {
            setCategories(parsedCategories)
            setCategoriesLoaded(true)
          }
        }
      } catch (error) {
        console.error('Error reading cache:', error)
      }
    }
    
    setCategoriesLoading(true)
    try {
      const allCategories = []
      let currentPage = 1
      let hasMorePages = true
      const perPage = 100

      while (hasMorePages) {
        const response = await newsletterCategoriesService.getNewsletterCategories(perPage, currentPage)
        
        if (response.http_status === 404) {
          hasMorePages = false
          if (allCategories.length === 0) {
            setCategories([])
          }
        } else if (response.data) {
          let dataArray = []
          
          if (Array.isArray(response.data)) {
            dataArray = response.data
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dataArray = response.data.data
          }
          
          allCategories.push(...dataArray)
          
          const totalPages = response.data?.last_page || 1
          
          if (currentPage >= totalPages || dataArray.length === 0) {
            hasMorePages = false
          } else {
            currentPage++
          }
        } else {
          hasMorePages = false
        }
      }
      
      if (allCategories.length > 0) {
        const apiCategories = allCategories.map(cat => ({
          id: cat.id,
          name: cat.title || cat.name,
          slug: (cat.title || cat.name).toLowerCase().replace(/\s+/g, '-'),
          status: cat.status
        }))
        
        setCategories(apiCategories)
        setCategoriesLoaded(true)
        localStorage.setItem('bvi.newsletters.categoriesLoaded', 'true')
        localStorage.setItem('bvi.newsletters.categoriesCache', JSON.stringify(apiCategories))
      } else {
        setCategories([])
        setCategoriesLoaded(true)
        localStorage.setItem('bvi.newsletters.categoriesLoaded', 'true')
        localStorage.setItem('bvi.newsletters.categoriesCache', JSON.stringify([]))
      }
    } catch (error) {
      console.error('Error loading categories from API:', error)
      const cachedCategories = localStorage.getItem('bvi.newsletters.categoriesCache')
      if (cachedCategories) {
        try {
          const parsedCategories = JSON.parse(cachedCategories)
          setCategories(parsedCategories)
        } catch (e) {
          setCategories([])
        }
      } else {
        setCategories([])
      }
      setCategoriesLoaded(true)
    } finally {
      setCategoriesLoading(false)
    }
  }, [categoriesLoading])

  const refreshCategories = useCallback(async () => {
    setCategoriesLoaded(false)
    localStorage.removeItem('bvi.newsletters.categoriesLoaded')
    localStorage.removeItem('bvi.newsletters.categoriesCache')
    setShouldReloadCategories(true)
  }, [])

  useEffect(() => {
    if (shouldReloadCategories) {
      loadCategoriesFromAPI(true)
      setShouldReloadCategories(false)
    }
  }, [shouldReloadCategories, loadCategoriesFromAPI])

  const handleAddCategory = useCallback(async (name) => {
    try {
      await newsletterCategoriesService.createNewsletterCategory({
        title: name.trim(),
        status: '1'
      })
      
      setCategoriesLoaded(false)
      localStorage.removeItem('bvi.newsletters.categoriesLoaded')
      localStorage.removeItem('bvi.newsletters.categoriesCache')
      
      try {
        const allCategories = []
        let currentPage = 1
        let hasMorePages = true
        const perPage = 100

        while (hasMorePages) {
          const response = await newsletterCategoriesService.getNewsletterCategories(perPage, currentPage)
          
          if (response.http_status === 404) {
            hasMorePages = false
          } else if (response.data) {
            let dataArray = []
            
            if (Array.isArray(response.data)) {
              dataArray = response.data
            } else if (response.data.data && Array.isArray(response.data.data)) {
              dataArray = response.data.data
            }
            
            allCategories.push(...dataArray)
            
            const totalPages = response.data?.last_page || 1
            
            if (currentPage >= totalPages || dataArray.length === 0) {
              hasMorePages = false
            } else {
              currentPage++
            }
          } else {
            hasMorePages = false
          }
        }
        
        if (allCategories.length > 0) {
          const apiCategories = allCategories.map(cat => ({
            id: cat.id,
            name: cat.title || cat.name,
            slug: (cat.title || cat.name).toLowerCase().replace(/\s+/g, '-'),
            status: cat.status
          }))
          
          setCategories(apiCategories)
          setCategoriesLoaded(true)
          localStorage.setItem('bvi.newsletters.categoriesLoaded', 'true')
          localStorage.setItem('bvi.newsletters.categoriesCache', JSON.stringify(apiCategories))
        }
      } catch (reloadError) {
        console.error('Error reloading categories:', reloadError)
      }
      
      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }, [])

  const handleDeleteCategory = useCallback((id) => {
    setCategoryToDelete(id)
    setConfirmModalOpen(true)
  }, [])

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return

    try {
      await newsletterCategoriesService.deleteNewsletterCategory(categoryToDelete)

      const updatedCategories = categories.filter(cat => cat.id !== categoryToDelete)
      setCategories(updatedCategories)

      localStorage.setItem('bvi.newsletters.categoriesCache', JSON.stringify(updatedCategories))
      localStorage.setItem('bvi.newsletters.categoriesLoaded', 'true')

      setConfirmModalOpen(false)
      setCategoryToDelete(null)

      setCategoriesLoaded(false)
      setShouldReloadCategories(true)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }, [categoryToDelete, categories])

  const handleEditCategory = useCallback((id) => {
    const category = categories.find(cat => cat.id === id)
    if (category) {
      setEditingCategory(category)
      setIsCategoryModalOpen(true)
    }
  }, [categories])

  const handleUpdateCategory = useCallback(async (newName) => {
    if (editingCategory && newName.trim().length >= 3) {
      try {
        await newsletterCategoriesService.updateNewsletterCategory(editingCategory.id, {
          title: newName.trim(),
          status: editingCategory.status.toString()
        })
        
        await refreshCategories()
        
        setIsCategoryModalOpen(false)
        setEditingCategory(null)
      } catch (error) {
        console.error('Error updating category:', error)
        throw error
      }
    }
  }, [editingCategory, refreshCategories])

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
  }, [])

  return {
    newsletters,
    setNewsletters,
    loading,
    setLoading,
    initialLoading,
    visibleItems,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter: deleteNewsletterById,
    seedFromMocks,
    clearNewsletterSeeds,
    loadNewslettersFromAPI,
    categories,
    activeCategory,
    setActiveCategory,
    isCategoryModalOpen,
    editingCategory,
    confirmModalOpen,
    categoryToDelete,
    categoriesLoaded,
    categoriesLoading,
    handleAddCategory,
    handleDeleteCategory,
    handleConfirmDeleteCategory,
    handleEditCategory,
    handleUpdateCategory,
    closeCategoryModal,
    setIsCategoryModalOpen,
    setConfirmModalOpen,
    setCategoryToDelete,
    loadCategoriesFromAPI,
    refreshCategories
  }
}