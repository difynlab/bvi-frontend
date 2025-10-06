import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  readNotices, 
  writeNotices, 
  addCategory, 
  deleteCategory, 
  deleteCategoryAndNotices, 
  upsertNotice, 
  updateNotice, 
  deleteNotice,
  getMockNotices
} from '../helpers/noticesStorage'

export const useNoticesState = () => {
  const [categories, setCategories] = useState([])
  const [notices, setNotices] = useState([])
  const [activeCategory, setActiveCategory] = useState('')
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false)
  const [isNoticeModalOpen, setIsNoticeModalOpen] = useState(false)
  const [editingNotice, setEditingNotice] = useState(null)
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)

  // Load data from storage on mount
  useEffect(() => {
    const { categories: storedCategories, items: storedNotices } = readNotices()
    setCategories(storedCategories)
    setNotices(storedNotices)
    // Set first category as active if available
    if (storedCategories.length > 0) {
      setActiveCategory(storedCategories[0].id)
    }
  }, [])

  // Derived state
  const visibleItems = useMemo(() => {
    const group = notices.find(group => group.categoryId === activeCategory)
    return group?.items || []
  }, [notices, activeCategory])

  const getGroup = useCallback((categoryId) => {
    return notices.find(group => group.categoryId === categoryId)
  }, [notices])

  // Category actions
  const handleAddCategory = useCallback((name) => {
    const { categories: updatedCategories, items: updatedItems } = addCategory(name)
    setCategories(updatedCategories)
    setNotices(updatedItems)
    setIsCategoryModalOpen(false)
    // Set the new category as active
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    setActiveCategory(slug)
  }, [])

  const handleDeleteCategory = useCallback((id) => {
    setCategoryToDelete(id)
    setConfirmModalOpen(true)
  }, [])

  const handleConfirmDelete = useCallback(() => {
    if (categoryToDelete) {
      const { categories: updatedCategories, items: updatedItems } = deleteCategoryAndNotices(categoryToDelete)
      setCategories(updatedCategories)
      setNotices(updatedItems)
      
      // Switch to first remaining category if current was deleted
      if (activeCategory === categoryToDelete) {
        if (updatedCategories.length > 0) {
          setActiveCategory(updatedCategories[0].id)
        } else {
          setActiveCategory('')
        }
      }
      
      setConfirmModalOpen(false)
      setCategoryToDelete(null)
    }
  }, [categoryToDelete, activeCategory])

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

  // Demo seeding with mock notices that have proper timestamps
  const seedDemoNotices = useCallback(() => {
    // Get mock notices with recent timestamps
    const mockNotices = getMockNotices()
    
    // Create a general category if it doesn't exist
    const generalCategory = {
      id: 'general',
      name: 'General',
      slug: 'general'
    }
    
    // Create new categories array (ensure General exists)
    const newCategories = [...categories]
    const existingGeneralCategory = newCategories.find(cat => cat.id === 'general')
    if (!existingGeneralCategory) {
      newCategories.push(generalCategory)
    }
    
    // Create new notices groups array
    const newNoticesGroups = [...notices]
    
    // Ensure general category has a group
    const existingGeneralGroup = newNoticesGroups.find(group => group.categoryId === 'general')
    if (!existingGeneralGroup) {
      newNoticesGroups.push({ categoryId: 'general', items: [] })
    }
    
    // Add mock notices to the general group (avoid duplicates)
    const generalGroup = newNoticesGroups.find(g => g.categoryId === 'general')
    if (generalGroup) {
      mockNotices.forEach(mockNotice => {
        const existingNotice = generalGroup.items.find(notice => notice.id === mockNotice.id)
        if (!existingNotice) {
          generalGroup.items.push(mockNotice)
        }
      })
    }
    
    // Update state with new arrays
    setCategories(newCategories)
    setNotices(newNoticesGroups)
    
    // Persist to localStorage immediately
    writeNotices(newCategories, newNoticesGroups)
    
    // Return the general category ID for UI activation
    return 'general'
  }, [categories, notices])

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
    
    // Actions
    setActiveCategory,
    handleAddCategory,
    handleDeleteCategory,
    openCreateNotice,
    openEditNotice,
    closeNoticeModal,
    handleUpsertNotice,
    handleDeleteNotice,
    handleConfirmDelete,
    setIsCategoryModalOpen,
    setConfirmModalOpen,
    setCategoryToDelete,
    seedDemoNotices,
    
    // Legacy compatibility
    getGroup
  }
}
