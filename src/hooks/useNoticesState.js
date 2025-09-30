import { useState, useEffect, useCallback, useMemo } from 'react'
import { 
  readNotices, 
  writeNotices, 
  addCategory, 
  deleteCategory, 
  deleteCategoryAndNotices, 
  upsertNotice, 
  updateNotice, 
  deleteNotice 
} from '../helpers/noticesStorage'
import { makeRecentDate, fmtDateForCreatedAt } from '../helpers/seedUtils'

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

  // Demo seeding with recent dates (≤7 days old)
  const seedDemoNotices = useCallback(() => {
    const demoCategories = [
      { id: 'finances', name: 'Finances', slug: 'finances' },
      { id: 'trading', name: 'Trading', slug: 'trading' },
      { id: 'company', name: 'Company', slug: 'company' }
    ]

    const noticeTemplates = [
      // Finances notices
      {
        id: 'finances-1',
        fileName: 'Quarterly Earnings Q2',
        noticeType: 'finances',
        description: 'Review of Q2 financial performance including revenue growth, profit margins, and key financial metrics.',
        imageFileName: 'earnings-q2.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/earnings-q2'
      },
      {
        id: 'finances-2',
        fileName: 'Budget Allocation Update',
        noticeType: 'finances',
        description: 'Updated budget allocation for the upcoming quarter with focus on operational efficiency and growth initiatives.',
        imageFileName: 'budget-update.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/budget-update'
      },
      {
        id: 'finances-3',
        fileName: 'Financial Compliance Report',
        noticeType: 'finances',
        description: 'Monthly compliance report covering regulatory requirements, audit findings, and recommended actions.',
        imageFileName: 'compliance-report.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/compliance-report'
      },
      // Trading notices
      {
        id: 'trading-1',
        fileName: 'Market Analysis Update',
        noticeType: 'trading',
        description: 'Weekly market analysis covering key trends, trading opportunities, and risk assessment for portfolio management.',
        imageFileName: 'market-analysis.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/market-analysis'
      },
      {
        id: 'trading-2',
        fileName: 'Portfolio Performance Review',
        noticeType: 'trading',
        description: 'Monthly portfolio performance review with detailed analysis of returns, risk metrics, and strategic recommendations.',
        imageFileName: 'portfolio-review.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/portfolio-review'
      },
      {
        id: 'trading-3',
        fileName: 'Risk Management Guidelines',
        noticeType: 'trading',
        description: 'Updated risk management guidelines and procedures for trading operations to ensure compliance and minimize exposure.',
        imageFileName: 'risk-guidelines.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/risk-guidelines'
      },
      // Company notices
      {
        id: 'company-1',
        fileName: 'Company Policy Update',
        noticeType: 'company',
        description: 'Important updates to company policies including remote work guidelines, code of conduct, and operational procedures.',
        imageFileName: 'policy-update.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/policy-update'
      },
      {
        id: 'company-2',
        fileName: 'Team Meeting Schedule',
        noticeType: 'company',
        description: 'Updated schedule for team meetings, all-hands sessions, and departmental reviews for the upcoming month.',
        imageFileName: 'meeting-schedule.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/meeting-schedule'
      },
      {
        id: 'company-3',
        fileName: 'HR Announcements',
        noticeType: 'company',
        description: 'Latest HR announcements including benefits updates, training opportunities, and employee recognition programs.',
        imageFileName: 'hr-announcements.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/hr-announcements'
      }
    ]

    // Generate notices with recent dates (0-6 days ago)
    const demoNotices = noticeTemplates.map(template => ({
      ...template,
      createdAt: fmtDateForCreatedAt(makeRecentDate({ maxDaysAgo: 6 }))
    }))

    // Create new categories array (ensure Finances, Trading, Company exist)
    const newCategories = [...categories]
    demoCategories.forEach(demoCategory => {
      const existingCategory = newCategories.find(cat => cat.id === demoCategory.id)
      if (!existingCategory) {
        newCategories.push(demoCategory)
      }
    })

    // Create new notices groups array
    const newNoticesGroups = [...notices]
    
    // Ensure all demo categories have groups
    demoCategories.forEach(demoCategory => {
      const existingGroup = newNoticesGroups.find(group => group.categoryId === demoCategory.id)
      if (!existingGroup) {
        newNoticesGroups.push({ categoryId: demoCategory.id, items: [] })
      }
    })

    // Add demo notices to their respective groups (avoid duplicates)
    demoNotices.forEach(demoNotice => {
      const group = newNoticesGroups.find(g => g.categoryId === demoNotice.noticeType)
      if (group) {
        const existingNotice = group.items.find(notice => notice.id === demoNotice.id)
        if (!existingNotice) {
          group.items.push(demoNotice)
        }
      }
    })

    // Update state with new arrays
    setCategories(newCategories)
    setNotices(newNoticesGroups)

    // Persist to localStorage immediately
    writeNotices(newCategories, newNoticesGroups)

    // Return the first category ID for UI activation
    return 'finances'
  }, [categories, notices])

  return {
    // State
    categories,
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
