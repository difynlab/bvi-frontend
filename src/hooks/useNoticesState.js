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
  getMockNotices,
  getMockNoticeCategories,
  setNoticeCategories,
  setNotices
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
    seedFromMocks,
    
    // Legacy compatibility
    getGroup
  }
}
