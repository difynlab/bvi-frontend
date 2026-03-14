import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  readNotices, 
  writeNotices, 
  addCategory, 
  deleteCategory, 
  deleteCategoryAndNotices, 
  updateCategory,
  upsertNotice, 
  updateNotice, 
  deleteNotice,
  getMockNotices,
  getMockNoticeCategories,
  setNoticeCategories,
  setNotices,
  saveActiveTabId
} from '../helpers/noticesStorage'
import { transformFromBackend, transformToBackend, saveNoticeImageToLocalStorage, removeNoticeImageFromLocalStorage, getNoticeImageFromLocalStorage } from '../utils/noticeTransformers'
import noticesService from '../services/noticesService'
import noticeCategoriesService from '../services/noticeCategoriesService'

export const useNoticesState = () => {
  const [categories, setCategories] = useState([])
  const [notices, setNotices] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoriesLoaded, setCategoriesLoaded] = useState(() => {
    try {
      return localStorage.getItem('bvi.notices.categoriesLoaded') === 'true'
    } catch {
      return false
    }
  })
  const [categoriesLoading, setCategoriesLoading] = useState(false)
  const [noticesLoading, setNoticesLoading] = useState(false)
  const [shouldReloadCategories, setShouldReloadCategories] = useState(false)

  useEffect(() => {
    loadNoticesFromAPI()
    
    try {
      const cachedCategories = localStorage.getItem('bvi.notices.categoriesCache')
      const isFromAPI = localStorage.getItem('bvi.notices.categoriesFromAPI') === 'true'
      
      if (cachedCategories && isFromAPI) {
        const parsedCategories = JSON.parse(cachedCategories)
        setCategories(parsedCategories)
        setCategoriesLoaded(true)
        
        setNoticeCategories(parsedCategories)
        
        if (parsedCategories.length > 0 && !activeCategory) {
          setActiveCategory(parsedCategories[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading cached categories:', error)
    }
  }, [])

  const loadNoticesFromAPI = useCallback(async () => {
    setNoticesLoading(true)
    
    const originalConsoleError = console.error
    console.error = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].includes('404')) {
        return
      }
      originalConsoleError.apply(console, args)
    }
    
    try {
      const allNotices = []
      let currentPage = 1
      let hasMorePages = true
      const perPage = 100
      
      while (hasMorePages) {
        const response = await noticesService.getNotices(perPage, currentPage)
        
        if (response.http_status === 200 && response.data) {
          const apiNotices = response.data.data.map(notice => transformFromBackend(notice))
          allNotices.push(...apiNotices)
          
          const totalPages = response.data.last_page || 1
          const total = response.data.total || 0
          
          if (currentPage >= totalPages || apiNotices.length === 0) {
            hasMorePages = false
          } else {
            currentPage++
          }
        } else if (response.http_status === 404) {
          hasMorePages = false
          if (allNotices.length === 0) {
            setNotices([])
          }
        } else {
          hasMorePages = false
        }
      }
      
      if (allNotices.length > 0) {
        setNotices(allNotices)
      } else if (allNotices.length === 0) {
        setNotices([])
      }
    } catch (error) {
      if (!error.message.includes('No notices found') && !error.message.includes('No data found')) {
        console.error('Error loading notices from API:', error)
      }
      setNotices([])
    } finally {
      setNoticesLoading(false)
      console.error = originalConsoleError
    }
  }, [])

  // Function to load categories from API
  const loadCategoriesFromAPI = useCallback(async () => {
    // Check if categories are already loaded and available
    if (categoriesLoaded) return
    if (categoriesLoading) return
    
    // Check localStorage cache first
    try {
      const cachedCategories = localStorage.getItem('bvi.notices.categoriesCache')
      const isLoaded = localStorage.getItem('bvi.notices.categoriesLoaded') === 'true'
      
      if (isLoaded && cachedCategories) {
        const parsedCategories = JSON.parse(cachedCategories)
        if (parsedCategories.length > 0) {
          setCategories(parsedCategories)
          setCategoriesLoaded(true)
          
          setNoticeCategories(parsedCategories)
          
          if (!activeCategory) {
            setActiveCategory(parsedCategories[0].id)
            if (notices.length === 0 && !noticesLoading) {
              await loadNoticesFromAPI()
            }
          }
          return
        }
      }
    } catch (error) {
      console.error('Error reading cache:', error)
    }
    
    setCategoriesLoading(true)
    try {
      const response = await noticeCategoriesService.getNoticeCategories() // Get all categories
      
      if (response.http_status === 200 && response.data) {
        // Transform API data to match local format
        const apiCategories = response.data.data.map(cat => ({
          id: cat.id,
          name: cat.title,
          slug: cat.title.toLowerCase().replace(/\s+/g, '-'),
          status: cat.status
        }))
        
        setCategories(apiCategories)
        setCategoriesLoaded(true)
        localStorage.setItem('bvi.notices.categoriesLoaded', 'true')
        localStorage.setItem('bvi.notices.categoriesCache', JSON.stringify(apiCategories))
        localStorage.setItem('bvi.notices.categoriesFromAPI', 'true')
        
        setNoticeCategories(apiCategories)
        
        if (apiCategories.length > 0 && !activeCategory) {
          setActiveCategory(apiCategories[0].id)
          if (notices.length === 0 && !noticesLoading) {
            await loadNoticesFromAPI()
          }
        }
      } else if (response.http_status === 404) {
        // No categories found - show empty state
        setCategories([])
        setCategoriesLoaded(true)
        localStorage.setItem('bvi.notices.categoriesLoaded', 'true')
        localStorage.setItem('bvi.notices.categoriesCache', JSON.stringify([]))
        localStorage.setItem('bvi.notices.categoriesFromAPI', 'true')
      }
    } catch (error) {
      console.error('Error loading categories from API:', error)
      // Don't fallback to localStorage - let empty state show
      setCategories([])
      setCategoriesLoaded(true)
      localStorage.setItem('bvi.notices.categoriesLoaded', 'true')
      localStorage.setItem('bvi.notices.categoriesCache', JSON.stringify([]))
      localStorage.removeItem('bvi.notices.categoriesFromAPI')
    } finally {
      setCategoriesLoading(false)
    }
  }, [categoriesLoaded, categoriesLoading, activeCategory, notices.length, noticesLoading, loadNoticesFromAPI])

  // Effect to reload categories when needed
  useEffect(() => {
    if (shouldReloadCategories) {
      loadCategoriesFromAPI()
      setShouldReloadCategories(false)
    }
  }, [shouldReloadCategories, loadCategoriesFromAPI])

  // Function to load notices for a specific category (commented for future use)
  // 
  // USAGE EXAMPLE:
  // 1. Uncomment this function and the export line below
  // 2. Call it when clicking on a category tab: loadNoticesForCategory(categoryId)
  // 3. This will:
  //    - Fetch category details from API (GET /notice-categories/{id})
  //    - Mark the category as active
  //    - Load notices specific to that category
  //    - Update the UI with filtered notices
  //
  // const loadNoticesForCategory = useCallback(async (categoryId) => {
  //   try {
  //     // Get category details to mark as active
  //     const categoryResponse = await noticeCategoriesService.getNoticeCategory(categoryId)
  //     
  //     if (categoryResponse.http_status === 200 && categoryResponse.data) {
  //       // Mark this category as active
  //       setActiveCategory(categoryId)
  //       
  //       // Here you would load notices for this specific category
  //       // Example: const noticesResponse = await noticesService.getNoticesByCategory(categoryId)
  //       // Then update the notices state with the filtered notices
  //       
  //       console.log('Category loaded:', categoryResponse.data)
  //       return categoryResponse.data
  //     }
  //   } catch (error) {
  //     console.error('Error loading category details:', error)
  //     throw error
  //   }
  // }, [])

  // Function to refresh categories (called after create/update/delete)
  const refreshCategories = useCallback(async () => {
    setCategoriesLoaded(false)
    localStorage.removeItem('bvi.notices.categoriesLoaded')
    localStorage.removeItem('bvi.notices.categoriesCache')
    localStorage.removeItem('bvi.notices.categoriesFromAPI')
    setShouldReloadCategories(true)
  }, [])

  const filteredNotices = useMemo(() => {
    if (!activeCategory || !notices.length) {
      return []
    }
    const filtered = notices.filter(notice => notice.noticeType === activeCategory)
    const getDate = (n) => n.publishDate ?? n.publish_date ?? n.createdAt ?? n.createdAtISO ?? n.created_at
    const toTime = (n) => {
      const t = new Date(getDate(n) || 0).getTime()
      return Number.isNaN(t) ? 0 : t
    }
    return filtered.slice().sort((a, b) => toTime(b) - toTime(a))
  }, [notices, activeCategory])

  const visibleItems = useMemo(() => filteredNotices, [filteredNotices])

  const getGroup = useCallback((categoryId) => {
    return notices.find(group => group.categoryId === categoryId)
  }, [notices])

  // Category actions using API
  const handleAddCategory = useCallback(async (name) => {
    const wasEmpty = categories.length === 0
    
    try {
      await noticeCategoriesService.createNoticeCategory({
        title: name.trim(),
        status: '1'
      })
      
      setCategoriesLoaded(false)
      localStorage.removeItem('bvi.notices.categoriesLoaded')
      localStorage.removeItem('bvi.notices.categoriesCache')
      localStorage.removeItem('bvi.notices.categoriesFromAPI')
      
      try {
        const response = await noticeCategoriesService.getNoticeCategories()
        
        if (response.http_status === 200 && response.data) {
          const apiCategories = response.data.data.map(cat => ({
            id: cat.id,
            name: cat.title,
            slug: cat.title.toLowerCase().replace(/\s+/g, '-'),
            status: cat.status
          }))
          
          setCategories(apiCategories)
          setCategoriesLoaded(true)
          localStorage.setItem('bvi.notices.categoriesLoaded', 'true')
          localStorage.setItem('bvi.notices.categoriesCache', JSON.stringify(apiCategories))
          localStorage.setItem('bvi.notices.categoriesFromAPI', 'true')
          setNoticeCategories(apiCategories)
          
          if (wasEmpty && apiCategories.length > 0) {
            setActiveCategory(apiCategories[0].id)
            saveActiveTabId(apiCategories[0].id)
          }
        }
      } catch (reloadError) {
        console.error('Error reloading categories:', reloadError)
      }
      
      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }, [categories.length])

  const handleDeleteCategory = useCallback((id) => {
    setCategoryToDelete(id)
    setConfirmModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (!categoryToDelete) return

    try {
      await noticeCategoriesService.deleteNoticeCategory(categoryToDelete)

      const updatedCategories = categories.filter(cat => cat.id !== categoryToDelete)
      setCategories(updatedCategories)

      // Persist updated cache immediately so UI stays in sync on reload
      localStorage.setItem('bvi.notices.categoriesCache', JSON.stringify(updatedCategories))
      localStorage.setItem('bvi.notices.categoriesLoaded', 'true')
      localStorage.setItem('bvi.notices.categoriesFromAPI', 'true')

      // Remove notices that belonged to the deleted category
      setNotices(prevNotices => prevNotices.filter(notice => notice.noticeType !== categoryToDelete))

      if (activeCategory === categoryToDelete) {
        setActiveCategory(updatedCategories[0]?.id || '')
      }

      setConfirmModalOpen(false)
      setCategoryToDelete(null)

      // Trigger a background reload to stay aligned with backend
      setCategoriesLoaded(false)
      setShouldReloadCategories(true)
    } catch (error) {
      console.error('Error deleting category:', error)
    }
  }, [
    categoryToDelete,
    categories,
    activeCategory
  ])

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
        await noticeCategoriesService.updateNoticeCategory(editingCategory.id, {
          title: newName.trim(),
          status: editingCategory.status.toString()
        })
        
        // Refresh categories from API
        await refreshCategories()
        
        setIsCategoryModalOpen(false)
        setEditingCategory(null)
      } catch (error) {
        console.error('Error updating category:', error)
        throw error // Re-throw to be handled by the component
      }
    }
  }, [editingCategory, refreshCategories])

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false)
    setEditingCategory(null)
  }, [])

  // Notice actions
  const openCreateNotice = useCallback(() => {
    setEditingNotice(null)
    setIsNoticeModalOpen(true)
  }, [])

  const openEditNotice = useCallback((notice) => {
    setEditingNotice(notice)
    setIsNoticeModalOpen(true)
  }, [])

  const closeNoticeModal = useCallback(() => {
    setIsNoticeModalOpen(false)
    setEditingNotice(null)
  }, [])

  const handleUpsertNotice = useCallback(async (payload) => {
    try {
      if (editingNotice) {
        // Update existing notice
        // Save image to localStorage for update (same as create)
        // Check if there's a tempId (image was saved in handleSubmit)
        if (payload.tempId) {
          // Get the image from temp storage
          const tempImage = getNoticeImageFromLocalStorage(payload.tempId, 'original')
          if (tempImage) {
            try {
              // Create a file from the data URL
              const response = await fetch(tempImage)
              const blob = await response.blob()
              const imageFile = new File([blob], 'image.png', { type: 'image/png' })
              
              // Save with real ID
              await saveNoticeImageToLocalStorage(editingNotice.id, imageFile)
              
              // Clean up temp storage
              removeNoticeImageFromLocalStorage(payload.tempId, 'all')
            } catch (error) {
              // Continue with update without image if localStorage fails
            }
          }
        } else if (payload.file && payload.file.type.startsWith('image/')) {
          try {
            await saveNoticeImageToLocalStorage(editingNotice.id, payload.file)
          } catch (error) {
            // Continue with update without image if localStorage fails
          }
        }
        
        const backendData = transformToBackend(payload, true)
        const response = await noticesService.updateNotice(editingNotice.id, backendData)
        
        if (response.http_status === 200) {
          const backendNotice = response.data
          const noticeWithImages = transformFromBackend(backendNotice)
          
          setNotices(prev => prev.map(notice => 
            notice.id === editingNotice.id ? noticeWithImages : notice
          ))
          
          // Refresh the list from API to ensure consistency
          setTimeout(() => {
            loadNoticesFromAPI()
          }, 1000)
        }
      } else {
        // Create new notice
        // TODO PRODUCTION: CHANGE IMAGES - Save image to localStorage before sending to backend
        // Use the tempId from payload if it exists, otherwise generate one
        const tempId = payload.tempId || `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`
        
        // Only save if it's an image file, not PDF
        if (payload.file && payload.file.type.startsWith('image/')) {
          await saveNoticeImageToLocalStorage(tempId, payload.file)
        }
        
        const backendData = transformToBackend(payload, false)
        const response = await noticesService.createNotice(backendData)
        
        if (response.http_status === 200) {
          const backendNotice = response.data
          
          // TODO PRODUCTION: CHANGE IMAGES - Move image from temp ID to real backend ID FIRST
          if (payload.file && backendNotice.id) {
            // Get image from temp storage
            const tempImage = getNoticeImageFromLocalStorage(tempId, 'original')
            
            if (tempImage) {
              // Move image from temp to real ID - use the original image file, not PDF
              if (payload.thumbnail && payload.thumbnail.type.startsWith('image/')) {
                await saveNoticeImageToLocalStorage(backendNotice.id, payload.thumbnail)
              } else {
                // Fallback: use the temp image data
                const tempImageData = getNoticeImageFromLocalStorage(tempId, 'original')
                if (tempImageData) {
                  // Create a temporary file from the data URL
                  const response = await fetch(tempImageData)
                  const blob = await response.blob()
                  const imageFile = new File([blob], 'image.png', { type: 'image/png' })
                  await saveNoticeImageToLocalStorage(backendNotice.id, imageFile)
                }
              }
              
              // Clean up temp storage
              removeNoticeImageFromLocalStorage(tempId, 'all')
            }
          }
          
          // NOW apply localStorage image logic to the new notice (after moving the image)
          const noticeWithImages = transformFromBackend(backendNotice)
          setNotices(prev => [...prev, noticeWithImages])
          
          // Reload notices from backend to ensure consistency
          setTimeout(() => {
            loadNoticesFromAPI()
          }, 100)
        }
      }
      
      closeNoticeModal()
    } catch (error) {
      console.error('Error upserting notice:', error)
      throw error
    }
  }, [editingNotice, closeNoticeModal])

  const handleDeleteNotice = useCallback(async (id) => {
    try {
      const response = await noticesService.deleteNotice(id)
      
      if (response.http_status === 200) {
        // Remove from state
        setNotices(prev => prev.filter(notice => notice.id !== id))
        
        // Remove image from localStorage
        removeNoticeImageFromLocalStorage(id, 'all')
        
        return { success: true, response }
      } else {
        // Error response from server
        const errorMessage = response.message || `Error: HTTP ${response.http_status}`
        throw new Error(errorMessage)
      }
    } catch (error) {
      console.error('Error deleting notice:', error)
      throw error
    }
  }, [])

  // Explicit seeding action: overwrite categories and items with mocks
  const seedFromMocks = useCallback(() => {
    const mockCategories = getMockNoticeCategories()
    const mockItemsFlat = getMockNotices()

    // Persist categories
    setNoticeCategories(mockCategories)

    // Group notices by categoryId for storage shape: [{ categoryId, items: [] }]
    const grouped = mockCategories.map(cat => ({
      categoryId: cat.id,
      items: mockItemsFlat.filter(n => n.categoryId === cat.id)
    }))

    // Persist items
    setNotices(grouped)

    // Update state
    setCategories(mockCategories)
    setNotices(grouped)

    // Also write with legacy helper to keep compatibility
    writeNotices(mockCategories, grouped)

    // Return first category id for activation
    return mockCategories[0]?.id || ''
  }, [])

  return {
    categories,
    notices,
    activeCategory,
    visibleItems,
    isCategoryModalOpen,
    isNoticeModalOpen,
    editingNotice,
    confirmModalOpen,
    categoryToDelete,
    editingCategory,
    categoriesLoaded,
    categoriesLoading,
    noticesLoading,
    setActiveCategory,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    handleUpdateCategory,
    closeCategoryModal,
    openCreateNotice,
    openEditNotice,
    closeNoticeModal,
    handleUpsertNotice,
    handleDeleteNotice,
    handleConfirmDelete,
    setIsCategoryModalOpen,
    setConfirmModalOpen,
    setCategoryToDelete,
    seedFromMocks,
    loadCategoriesFromAPI,
    loadNoticesFromAPI,
    refreshCategories,
    getGroup
  }
}
