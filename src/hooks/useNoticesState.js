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
  setNotices
} from '../helpers/noticesStorage'
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
  const [shouldReloadCategories, setShouldReloadCategories] = useState(false)

  // Load notices from storage on mount (categories will be loaded from API)
  useEffect(() => {
    // Don't load notices from localStorage - they should come from API too
    setNotices([])
    
    // Only load categories from localStorage if they came from API (not mocks)
    try {
      const cachedCategories = localStorage.getItem('bvi.notices.categoriesCache')
      const isFromAPI = localStorage.getItem('bvi.notices.categoriesFromAPI') === 'true'
      
      if (cachedCategories && isFromAPI) {
        const parsedCategories = JSON.parse(cachedCategories)
        setCategories(parsedCategories)
        setCategoriesLoaded(true)
        if (parsedCategories.length > 0 && !activeCategory) {
          setActiveCategory(parsedCategories[0].id)
        }
      }
    } catch (error) {
      console.error('Error loading cached categories:', error)
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
          if (!activeCategory) {
            setActiveCategory(parsedCategories[0].id)
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
        
        // Set first category as active if available
        if (apiCategories.length > 0 && !activeCategory) {
          setActiveCategory(apiCategories[0].id)
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
  }, [categoriesLoaded, categoriesLoading, activeCategory]) // Remove categories from dependencies

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

  // Derived state
  const visibleItems = useMemo(() => {
    const group = notices.find(group => group.categoryId === activeCategory)
    return group?.items || []
  }, [notices, activeCategory])

  const getGroup = useCallback((categoryId) => {
    return notices.find(group => group.categoryId === categoryId)
  }, [notices])

  // Category actions using API
  const handleAddCategory = useCallback(async (name) => {
    try {
      await noticeCategoriesService.createNoticeCategory({
        title: name.trim(),
        status: '1'
      })
      
      // Refresh categories from API
      await refreshCategories()
      
      // Set the new category as active
      const slug = name.toLowerCase().replace(/\s+/g, '-')
      setActiveCategory(slug)
      
      setIsCategoryModalOpen(false)
    } catch (error) {
      console.error('Error creating category:', error)
      throw error // Re-throw to be handled by the component
    }
  }, [refreshCategories])

  const handleDeleteCategory = useCallback((id) => {
    setCategoryToDelete(id)
    setConfirmModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    if (categoryToDelete) {
      try {
        await noticeCategoriesService.deleteNoticeCategory(categoryToDelete)
        
        // Refresh categories from API
        await refreshCategories()
        
        // Switch to first remaining category if current was deleted
        if (activeCategory === categoryToDelete) {
          const remainingCategories = categories.filter(cat => cat.id !== categoryToDelete)
          if (remainingCategories.length > 0) {
            setActiveCategory(remainingCategories[0].id)
          } else {
            setActiveCategory('')
          }
        }
        
        setConfirmModalOpen(false)
        setCategoryToDelete(null)
      } catch (error) {
        console.error('Error deleting category:', error)
      }
    }
  }, [categoryToDelete, activeCategory, categories, refreshCategories])

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

  const handleUpsertNotice = useCallback((payload) => {
    // TODO BACKEND: replace seeds with GET /api/notices
    if (editingNotice) {
      // Update existing notice
      const { categories: updatedCategories, items: updatedItems } = updateNotice(payload)
      setCategories(updatedCategories)
      setNotices(updatedItems)
    } else {
      // Create new notice
      const { categories: updatedCategories, items: updatedItems } = upsertNotice(payload)
      setCategories(updatedCategories)
      setNotices(updatedItems)
    }
    closeNoticeModal()
  }, [editingNotice, closeNoticeModal])

  const handleDeleteNotice = useCallback((id) => {
    const { categories: updatedCategories, items: updatedItems } = deleteNotice(id)
    setCategories(updatedCategories)
    setNotices(updatedItems)
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
    // State
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
    
    // Actions
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
    refreshCategories,
    // loadNoticesForCategory, // Commented for future use
    
    // Legacy compatibility
    getGroup
  }
}
