import { useState, useEffect } from 'react'

const defaultCategories = [
  { id: 'general', name: 'General', slug: 'general' }
]

const defaultNotices = [
  { categoryId: 'general', items: [] }
]

export const useNoticesState = () => {
  const [categories, setCategories] = useState([])
  const [notices, setNotices] = useState([])
  const [loading, setLoading] = useState(false)

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedCategories = localStorage.getItem('noticeCategories')
      const savedNotices = localStorage.getItem('notices')
      
      if (savedCategories && savedNotices) {
        const parsedCategories = JSON.parse(savedCategories)
        const parsedNotices = JSON.parse(savedNotices)
        setCategories(parsedCategories)
        setNotices(parsedNotices)
      } else {
        // If no saved data, seed with defaults
        setCategories(defaultCategories)
        setNotices(defaultNotices)
        localStorage.setItem('noticeCategories', JSON.stringify(defaultCategories))
        localStorage.setItem('notices', JSON.stringify(defaultNotices))
      }
    } catch (error) {
      console.error('Error loading notices data from localStorage:', error)
      // Fallback to defaults
      setCategories(defaultCategories)
      setNotices(defaultNotices)
    }
  }, [])

  // Save data to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem('noticeCategories', JSON.stringify(categories))
    } catch (error) {
      console.error('Error saving categories to localStorage:', error)
    }
  }, [categories])

  useEffect(() => {
    try {
      localStorage.setItem('notices', JSON.stringify(notices))
    } catch (error) {
      console.error('Error saving notices to localStorage:', error)
    }
  }, [notices])

  const getGroup = (categoryId) => {
    return notices.find(group => group.categoryId === categoryId)
  }

  const addCategory = (name) => {
    const slug = name.toLowerCase().replace(/\s+/g, '-')
    const newCategory = {
      id: slug,
      name: name.trim(),
      slug: slug
    }
    
    // TODO BACKEND: Save new category to backend
    // try {
    //   const response = await fetch('/api/notice-categories', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify(newCategory)
    //   })
    //   if (!response.ok) throw new Error('Failed to create category')
    //   const savedCategory = await response.json()
    //   setCategories(prev => [...prev, savedCategory])
    // } catch (error) {
    //   console.error('Error creating category:', error)
    //   alert('Failed to create category. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Add to local state (will be saved to localStorage via useEffect)
    setCategories(prev => [...prev, newCategory])
    
    // Create empty group for new category
    setNotices(prev => [...prev, { categoryId: slug, items: [] }])
  }

  const deleteCategory = (id) => {
    const group = getGroup(id)
    if (group && group.items.length > 0) {
      throw new Error('Cannot delete category with existing notices')
    }

    // TODO BACKEND: Delete category from backend
    // try {
    //   const response = await fetch(`/api/notice-categories/${id}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`
    //     }
    //   })
    //   if (!response.ok) throw new Error('Failed to delete category')
    //   setCategories(prev => prev.filter(cat => cat.id !== id))
    // } catch (error) {
    //   console.error('Error deleting category:', error)
    //   alert('Failed to delete category. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Remove from local state (will be saved to localStorage via useEffect)
    setCategories(prev => prev.filter(cat => cat.id !== id))
    setNotices(prev => prev.filter(group => group.categoryId !== id))
  }

  const deleteCategoryAndNotices = (id) => {
    // TODO BACKEND: Delete category and all its notices from backend
    // try {
    //   const response = await fetch(`/api/notice-categories/${id}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`
    //     }
    //   })
    //   if (!response.ok) throw new Error('Failed to delete category')
    //   setCategories(prev => prev.filter(cat => cat.id !== id))
    //   setNotices(prev => prev.filter(group => group.categoryId !== id))
    // } catch (error) {
    //   console.error('Error deleting category:', error)
    //   alert('Failed to delete category. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Remove category and all its notices from local state (will be saved to localStorage via useEffect)
    setCategories(prev => prev.filter(cat => cat.id !== id))
    setNotices(prev => prev.filter(group => group.categoryId !== id))
  }

  const seedDemoNotices = () => {
    const demoCategories = [
      { id: 'finances', name: 'Finances', slug: 'finances' },
      { id: 'trading', name: 'Trading', slug: 'trading' },
      { id: 'company', name: 'Company', slug: 'company' }
    ]

    const demoNotices = [
      // Finances notices
      {
        id: 'finances-1',
        fileName: 'Quarterly Earnings Q2',
        noticeType: 'finances',
        description: 'Review of Q2 financial performance including revenue growth, profit margins, and key financial metrics.',
        imageFileName: 'earnings-q2.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/earnings-q2',
        createdAt: new Date().toISOString().slice(0, 10)
      },
      {
        id: 'finances-2',
        fileName: 'Budget Allocation Update',
        noticeType: 'finances',
        description: 'Updated budget allocation for the upcoming quarter with focus on operational efficiency and growth initiatives.',
        imageFileName: 'budget-update.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/budget-update',
        createdAt: new Date().toISOString().slice(0, 10)
      },
      {
        id: 'finances-3',
        fileName: 'Financial Compliance Report',
        noticeType: 'finances',
        description: 'Monthly compliance report covering regulatory requirements, audit findings, and recommended actions.',
        imageFileName: 'compliance-report.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/compliance-report',
        createdAt: new Date().toISOString().slice(0, 10)
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
        linkUrl: 'https://example.com/market-analysis',
        createdAt: new Date().toISOString().slice(0, 10)
      },
      {
        id: 'trading-2',
        fileName: 'Portfolio Performance Review',
        noticeType: 'trading',
        description: 'Monthly portfolio performance review with detailed analysis of returns, risk metrics, and strategic recommendations.',
        imageFileName: 'portfolio-review.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/portfolio-review',
        createdAt: new Date().toISOString().slice(0, 10)
      },
      {
        id: 'trading-3',
        fileName: 'Risk Management Guidelines',
        noticeType: 'trading',
        description: 'Updated risk management guidelines and procedures for trading operations to ensure compliance and minimize exposure.',
        imageFileName: 'risk-guidelines.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/risk-guidelines',
        createdAt: new Date().toISOString().slice(0, 10)
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
        linkUrl: 'https://example.com/policy-update',
        createdAt: new Date().toISOString().slice(0, 10)
      },
      {
        id: 'company-2',
        fileName: 'Team Meeting Schedule',
        noticeType: 'company',
        description: 'Updated schedule for team meetings, all-hands sessions, and departmental reviews for the upcoming month.',
        imageFileName: 'meeting-schedule.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/meeting-schedule',
        createdAt: new Date().toISOString().slice(0, 10)
      },
      {
        id: 'company-3',
        fileName: 'HR Announcements',
        noticeType: 'company',
        description: 'Latest HR announcements including benefits updates, training opportunities, and employee recognition programs.',
        imageFileName: 'hr-announcements.jpg',
        imageUrl: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?w=800&h=600&fit=crop',
        imagePreviewUrl: '',
        linkUrl: 'https://example.com/hr-announcements',
        createdAt: new Date().toISOString().slice(0, 10)
      }
    ]

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
    try {
      localStorage.setItem('noticeCategories', JSON.stringify(newCategories))
      localStorage.setItem('notices', JSON.stringify(newNoticesGroups))
    } catch (error) {
      console.error('Error saving seeded data to localStorage:', error)
    }

    // Return the first category ID for UI activation
    return 'finances'
  }

  const addNotice = (noticeObj) => {
    const group = getGroup(noticeObj.noticeType)
    if (!group) {
      console.error('Category group not found for notice')
      return
    }

    // TODO BACKEND: Save new notice to backend
    // try {
    //   const response = await fetch('/api/notices', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify(noticeObj)
    //   })
    //   if (!response.ok) throw new Error('Failed to create notice')
    //   const savedNotice = await response.json()
    //   setNotices(prev => prev.map(group => 
    //     group.categoryId === noticeObj.noticeType 
    //       ? { ...group, items: [...group.items, savedNotice] }
    //       : group
    //   ))
    // } catch (error) {
    //   console.error('Error creating notice:', error)
    //   alert('Failed to create notice. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Add to local state (will be saved to localStorage via useEffect)
    setNotices(prev => prev.map(group => 
      group.categoryId === noticeObj.noticeType 
        ? { ...group, items: [...group.items, noticeObj] }
        : group
    ))
  }

  const updateNotice = (noticeObj) => {
    const oldGroup = notices.find(group => 
      group.items.some(notice => notice.id === noticeObj.id)
    )
    const newGroup = getGroup(noticeObj.noticeType)

    if (!oldGroup || !newGroup) {
      console.error('Category groups not found for notice update')
      return
    }

    // TODO BACKEND: Update existing notice in backend
    // try {
    //   const response = await fetch(`/api/notices/${noticeObj.id}`, {
    //     method: 'PUT',
    //     headers: {
    //       'Content-Type': 'application/json',
    //       'Authorization': `Bearer ${token}`
    //     },
    //     body: JSON.stringify(noticeObj)
    //   })
    //   if (!response.ok) throw new Error('Failed to update notice')
    //   const updatedNotice = await response.json()
    //   // Handle category change logic here
    // } catch (error) {
    //   console.error('Error updating notice:', error)
    //   alert('Failed to update notice. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Update in local state (will be saved to localStorage via useEffect)
    if (oldGroup.categoryId === newGroup.categoryId) {
      // Same category - just update the notice
      setNotices(prev => prev.map(group => 
        group.categoryId === oldGroup.categoryId
          ? { ...group, items: group.items.map(notice => 
              notice.id === noticeObj.id ? noticeObj : notice
            )}
          : group
      ))
    } else {
      // Different category - move notice between groups
      setNotices(prev => prev.map(group => {
        if (group.categoryId === oldGroup.categoryId) {
          // Remove from old group
          return { ...group, items: group.items.filter(notice => notice.id !== noticeObj.id) }
        } else if (group.categoryId === newGroup.categoryId) {
          // Add to new group
          return { ...group, items: [...group.items, noticeObj] }
        }
        return group
      }))
    }
  }

  const deleteNotice = (id) => {
    // TODO BACKEND: Delete notice from backend
    // try {
    //   const response = await fetch(`/api/notices/${id}`, {
    //     method: 'DELETE',
    //     headers: {
    //       'Authorization': `Bearer ${token}`
    //     }
    //   })
    //   if (!response.ok) throw new Error('Failed to delete notice')
    //   setNotices(prev => prev.map(group => ({
    //     ...group,
    //     items: group.items.filter(notice => notice.id !== id)
    //   })))
    // } catch (error) {
    //   console.error('Error deleting notice:', error)
    //   alert('Failed to delete notice. Please try again.')
    //   return
    // }

    // LOCALSTORAGE: Remove from local state (will be saved to localStorage via useEffect)
    setNotices(prev => prev.map(group => ({
      ...group,
      items: group.items.filter(notice => notice.id !== id)
    })))
  }

  return {
    categories,
    setCategories,
    notices,
    setNotices,
    addCategory,
    deleteCategory,
    deleteCategoryAndNotices,
    addNotice,
    updateNotice,
    deleteNotice,
    getGroup,
    seedDemoNotices,
    loading
  }
}
