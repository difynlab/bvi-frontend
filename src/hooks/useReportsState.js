import { useState, useCallback, useMemo, useEffect } from 'react';
import reportCategoriesService from '../services/reportCategoriesService';
import reportsService from '../services/reportsService';
// import { readReports, writeReports, addCategory, deleteCategory, upsertReport, deleteReport, saveReportsAndCategories } from '../helpers/reportsStorage';

const CACHE_KEY = 'reports_categories_cache';
const REPORTS_CACHE_KEY = 'reports_cache';
const CACHE_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutos en milisegundos

const getCachedCategories = () => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    // CRITICAL: Validate cached data structure
    if (!Array.isArray(data) || data.some(cat => !cat.id || !cat.title)) {
      console.error('🚨 Invalid cached categories data structure, clearing cache');
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading cached categories:', error);
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const setCachedCategories = (categories) => {
  try {
    // Validate data before caching
    if (!Array.isArray(categories) || categories.some(cat => !cat.id || !cat.title)) {
      console.error('🚨 Invalid categories data, not caching');
      return;
    }
    
    const cacheData = {
      data: categories,
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching categories:', error);
  }
};

const clearCategoriesCache = () => {
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch (error) {
    console.error('Error clearing categories cache:', error);
  }
};

// Reports cache functions
const getCachedReports = () => {
  try {
    const cached = localStorage.getItem(REPORTS_CACHE_KEY);
    if (!cached) return null;
    
    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();
    
    if (now - timestamp > CACHE_EXPIRY_TIME) {
      localStorage.removeItem(REPORTS_CACHE_KEY);
      return null;
    }
    
    // Validate cached data structure
    if (!Array.isArray(data) || data.some(report => !report.id || !report.name)) {
      console.error('🚨 Invalid cached reports data structure, clearing cache');
      localStorage.removeItem(REPORTS_CACHE_KEY);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error reading cached reports:', error);
    localStorage.removeItem(REPORTS_CACHE_KEY);
    return null;
  }
};

const setCachedReports = (reports) => {
  try {
    // Validate data before caching
    if (!Array.isArray(reports) || reports.some(report => !report.id || !report.name)) {
      console.error('🚨 Invalid reports data, not caching');
      return;
    }
    
    const cacheData = {
      data: reports,
      timestamp: Date.now()
    };
    localStorage.setItem(REPORTS_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.error('Error caching reports:', error);
  }
};

const clearReportsCache = () => {
  try {
    localStorage.removeItem(REPORTS_CACHE_KEY);
  } catch (error) {
    console.error('Error clearing reports cache:', error);
  }
};

export function useReportsState() {
  // Initialize with empty state instead of localStorage
  const [data, setData] = useState({ categories: [], items: [] });
  
  // Initialize with cached data if available
  useEffect(() => {
    const cachedCategories = getCachedCategories();
    if (cachedCategories) {
      setData(prev => ({ ...prev, categories: cachedCategories }));
      if (cachedCategories.length > 0) {
        setActiveCategoryId(cachedCategories[0].id);
      }
    }
  }, []);
  
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [shouldReloadCategories, setShouldReloadCategories] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [shouldReloadReports, setShouldReloadReports] = useState(false);

  // Function to refresh categories (called after create/update/delete)
  const refreshCategories = useCallback(async () => {
    // Clear cache to force API call
    clearCategoriesCache();
    setShouldReloadCategories(true);
  }, []);

  // Load categories from API function
  const loadCategoriesFromAPI = useCallback(async () => {
      // Check cache first for immediate display
      const cachedCategories = getCachedCategories();
      if (cachedCategories) {
        setData(prev => ({ ...prev, categories: cachedCategories }));
        
        if (!activeCategoryId && cachedCategories.length > 0) {
          setActiveCategoryId(cachedCategories[0].id);
        }
        
        // Check if cache is still fresh (less than 5 minutes old)
        const cacheData = JSON.parse(localStorage.getItem(CACHE_KEY));
        const cacheAge = Date.now() - cacheData.timestamp;
        const isCacheFresh = cacheAge < CACHE_EXPIRY_TIME;
        
        if (isCacheFresh) {
          return; // Skip API call if cache is fresh
        }
      }
      
      // Only call API if no cache or cache is expired
      setCategoriesLoading(true);
      try {
        const response = await reportCategoriesService.getReportCategories();
        
        if (response.http_status === 200 && response.data) {
          // Handle different response structures
          let dataArray = [];
          
          if (Array.isArray(response.data)) {
            // Direct array response
            dataArray = response.data;
          } else if (response.data.categories && Array.isArray(response.data.categories)) {
            // Nested categories array
            dataArray = response.data.categories;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            // Double nested data
            dataArray = response.data.data;
          }
          
          // Transform backend categories to frontend format
          const categories = dataArray.map(category => ({
            id: category.id,
            title: category.title,
            status: category.status
          }));
          
          setData(prev => ({ ...prev, categories }));
          
          // Validate server data vs cached data
          const cachedCategories = getCachedCategories();
          if (cachedCategories && JSON.stringify(cachedCategories) !== JSON.stringify(categories)) {
            console.warn('🚨 Cache inconsistency detected! Server data differs from cache');
          }
          
          // Cache the validated server categories
          setCachedCategories(categories);
          
          // Set first category as active if none is selected
          if (!activeCategoryId && categories.length > 0) {
            setActiveCategoryId(categories[0].id);
          }
        }
      } catch (error) {
        if (error.message.includes('No data found')) {
          // Handle 404 - no categories found
          setData(prev => ({ ...prev, categories: [] }));
        } else {
          console.error('Error loading report categories from API:', error);
          // Keep empty state on other errors
        }
      } finally {
        setCategoriesLoading(false);
      }
  }, []);

  // Function to refresh reports (called after create/update/delete)
  const refreshReports = useCallback(async () => {
    
    // Clear cache to force API call
    clearReportsCache();
    
    // Immediately update local state to remove deleted items
    setData(prev => ({ ...prev, items: [] }));
    
    setShouldReloadReports(true);
  }, []);

  const loadReportsFromAPI = useCallback(async () => {
    const cachedReports = getCachedReports();
    
    if (cachedReports) {
      setData(prev => ({ ...prev, items: cachedReports }));
      
      const cacheData = JSON.parse(localStorage.getItem(REPORTS_CACHE_KEY));
      const cacheAge = Date.now() - cacheData.timestamp;
      const isCacheFresh = cacheAge < CACHE_EXPIRY_TIME;
      
      if (isCacheFresh) {
        return;
      }
    }

    setReportsLoading(true);
    try {
      const allReports = [];
      let currentPage = 1;
      let hasMorePages = true;
      const perPage = 100;
      
      while (hasMorePages) {
        const response = await reportsService.getReports(perPage, currentPage);
        
        if (response.http_status === 200 && response.data) {
          let dataArray = [];
          if (Array.isArray(response.data)) {
            dataArray = response.data;
          } else if (response.data.reports && Array.isArray(response.data.reports)) {
            dataArray = response.data.reports;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dataArray = response.data.data;
          }
          
          allReports.push(...dataArray);
          
          const totalPages = response.data?.last_page || 1;
          
          if (currentPage >= totalPages || dataArray.length === 0) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } else if (response.http_status === 404) {
          hasMorePages = false;
          if (allReports.length === 0) {
            setData(prev => ({ ...prev, items: [] }));
          }
        } else {
          hasMorePages = false;
        }
      }
      
      if (allReports.length > 0) {
        setData(prev => ({ ...prev, items: allReports }));
        setCachedReports(allReports);
      } else if (allReports.length === 0) {
        setData(prev => ({ ...prev, items: [] }));
      }
    } catch (error) {
      if (error.message.includes('No data found')) {
        setData(prev => ({ ...prev, items: [] }));
      } else {
        console.error('Error loading reports from API:', error);
      }
    } finally {
      setReportsLoading(false);
    }
  }, []);

  // Effect to reload categories when needed
  useEffect(() => {
    if (shouldReloadCategories) {
      loadCategoriesFromAPI();
      setShouldReloadCategories(false);
    }
  }, [shouldReloadCategories, loadCategoriesFromAPI]);

  // Effect to reload reports when needed
  useEffect(() => {
    if (shouldReloadReports) {
      loadReportsFromAPI();
      setShouldReloadReports(false);
    }
  }, [shouldReloadReports, loadReportsFromAPI]);

  // Load categories from API on component mount
  useEffect(() => {
    loadCategoriesFromAPI();
  }, [loadCategoriesFromAPI]);

  // Load reports from API on component mount
  useEffect(() => {
    loadReportsFromAPI();
  }, [loadReportsFromAPI]);

  // Remove localStorage save effect - data will come from API
  // useEffect(() => {
  //   writeReports(data);
  // }, [data]);

  const filteredReports = useMemo(() => {
    if (!activeCategoryId) return [];
    
    return data.items.filter(item => {
      return item.report_category_id === activeCategoryId;
    });
  }, [data.items, activeCategoryId]);

  const visibleItems = useMemo(() => filteredReports, [filteredReports]);

  const handleAddCategory = useCallback(async (name) => {
    const trimmedName = name.trim();
    if (trimmedName && !data.categories.some(cat => cat.title === trimmedName)) {
      setCreatingCategory(true);
      try {
        await reportCategoriesService.createReportCategory({
          title: trimmedName,
          status: 1
        });
        
        // Refresh categories from API (this will handle shimmer loading)
        await refreshCategories();
        
        // Don't close modal here - let the component handle it
      } catch (error) {
        console.error('Error creating report category:', error);
        throw error; // Re-throw to be handled by the component
      } finally {
        setCreatingCategory(false);
      }
    }
  }, [data.categories, refreshCategories]);

  const handleDeleteCategory = useCallback((id) => {
    setCategoryToDelete(id);
    setConfirmModalOpen(true);
  }, []);

  const resetCreatingCategory = useCallback(() => {
    setCreatingCategory(false);
  }, []);

  const handleEditCategory = useCallback((id) => {
    const category = data.categories.find(cat => cat.id === id);
    if (category) {
      setEditingCategory(category);
      setIsCategoryModalOpen(true);
    }
  }, [data.categories]);

  const handleUpdateCategory = useCallback(async (newName) => {
    if (editingCategory && newName.trim().length >= 3) {
      setCreatingCategory(true);
      try {
        await reportCategoriesService.updateReportCategory(editingCategory.id, {
          title: newName.trim(),
          status: editingCategory.status
        });
        
        // Refresh categories from API (this will handle shimmer loading)
        await refreshCategories();
        
        // Don't close modal here - let the component handle it
      } catch (error) {
        console.error('Error updating report category:', error);
        throw error; // Re-throw to be handled by the component
      } finally {
        setCreatingCategory(false);
      }
    }
  }, [editingCategory, refreshCategories]);

  const handleConfirmDelete = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      let updatedCategories = [];
      let filteredReports = [];

      await reportCategoriesService.deleteReportCategory(categoryToDelete);

      setData(prev => {
        updatedCategories = prev.categories.filter(cat => cat.id !== categoryToDelete);
        filteredReports = prev.items.filter(report => report.report_category_id !== categoryToDelete);

        // Keep local caches in sync so the UI stays updated across navigation
        setCachedCategories(updatedCategories);
        setCachedReports(filteredReports);

        return {
          categories: updatedCategories,
          items: filteredReports
        };
      });

      if (activeCategoryId === categoryToDelete) {
        setActiveCategoryId(updatedCategories[0]?.id || null);
      }

      setConfirmModalOpen(false);
      setCategoryToDelete(null);

      // Trigger background refresh to stay aligned with backend
      setShouldReloadCategories(true);
      setShouldReloadReports(true);
    } catch (error) {
      console.error('Error deleting report category:', error);
    }
  }, [
    categoryToDelete,
    activeCategoryId
  ]);

  const openCreateReportModal = useCallback(() => {
    setEditingReport(null);
    setIsReportModalOpen(true);
  }, []);

  const openEditReportModal = useCallback((report) => {
    setEditingReport(report);
    setIsReportModalOpen(true);
  }, []);

  const closeReportModal = useCallback(() => {
    setIsReportModalOpen(false);
    setEditingReport(null);
  }, []);

  const createOrUpdateReport = useCallback(async (reportData) => {
    try {
      if (editingReport) {
        // Update existing report
        await reportsService.updateReport(editingReport.id, reportData);
      } else {
        // Create new report
        await reportsService.createReport(reportData);
      }
      
      // Refresh reports from API
      await refreshReports();
      
      setIsReportModalOpen(false);
      setEditingReport(null);
    } catch (error) {
      console.error('Error creating/updating report:', error);
      throw error; // Re-throw to be handled by the component
    }
  }, [editingReport, refreshReports]);

  const onDeleteReport = useCallback(async (id) => {
    try {
      await reportsService.deleteReport(id);
      
      // Refresh reports from API
      await refreshReports();
    } catch (error) {
      console.error('Error deleting report:', error);
      throw error; // Re-throw to be handled by the component
    }
  }, [refreshReports]);

  const downloadReport = useCallback(async (report) => {
    
    // Try different field names for file URL
    const fileUrl = report.fileUrl || report.file || report.file_url;
    const fileName = report.title || report.name || 'report';
    
    if (fileUrl) {
      
      try {
        // Get token for authenticated download
        const token = localStorage.getItem('token');
        if (!token) {
          // Fallback to direct download
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
        
        // Fetch file with authorization header
        const response = await fetch(fileUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/pdf,application/octet-stream,*/*'
          }
        });
        
        if (!response.ok) {
          // Fallback to direct download
          const link = document.createElement('a');
          link.href = fileUrl;
          link.download = fileName;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          return;
        }
        
        // Get file blob
        const blob = await response.blob();
        
        // Create download link
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        
      } catch (error) {
        // Fallback to direct download
        const link = document.createElement('a');
        link.href = fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    }
  }, []);

  const formatDate = useCallback((dateString) => {
    try {
      if (!dateString) return '';
      
      // Handle both ISO format and YYYY-MM-DD format
      let date;
      if (dateString.includes('T')) {
        // ISO format: "2025-01-27T10:30:00Z"
        date = new Date(dateString);
      } else {
        // YYYY-MM-DD format: "2025-01-27"
        date = new Date(dateString + 'T00:00:00');
      }
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.warn('Invalid date:', dateString);
        return dateString || '';
      }
      
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      console.warn('Error formatting date:', dateString, error);
      return dateString || '';
    }
  }, []);

  const seedDemoReports = useCallback(() => {
    // TODO: Remove demo data seeding - will use API data
    
    const demoData = {
      categories: ['Annual Report', 'Other Reports'], 
      items: [
        { id: 1, title: 'Annual Report 2024', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2025-01-01', fileUrl: 'https://example.com/annual-2024.pdf' },
        { id: 2, title: 'Annual Report 2023', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2024-01-01', fileUrl: 'https://example.com/annual-2023.pdf' },
        { id: 3, title: 'Annual Report 2022', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2023-01-01', fileUrl: 'https://example.com/annual-2022.pdf' },
        { id: 4, title: 'Annual Report 2021', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2022-01-01', fileUrl: 'https://example.com/annual-2021.pdf' },
        { id: 5, title: 'Annual Report 2020', typeId: 'Annual Report', typeName: 'Annual Report', publishedAt: '2021-01-01', fileUrl: 'https://example.com/annual-2020.pdf' },
        { id: 6, title: 'Q4 2024 Quarterly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2025-01-15', fileUrl: 'https://example.com/q4-2024.pdf' },
        { id: 7, title: 'Q3 2024 Quarterly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-10-15', fileUrl: 'https://example.com/q3-2024.pdf' },
        { id: 8, title: 'December 2024 Monthly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2025-01-01', fileUrl: 'https://example.com/dec-2024.pdf' },
        { id: 9, title: 'November 2024 Monthly Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-12-01', fileUrl: 'https://example.com/nov-2024.pdf' },
        { id: 10, title: 'Week 52 2024 Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-12-30', fileUrl: 'https://example.com/week52-2024.pdf' },
        { id: 11, title: 'Week 51 2024 Report', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2024-12-23', fileUrl: 'https://example.com/week51-2024.pdf' },
        { id: 12, title: 'Financial Summary Q4', typeId: 'Other Reports', typeName: 'Other Reports', publishedAt: '2025-01-10', fileUrl: 'https://example.com/financial-q4.pdf' }
      ]
    };

    setData(demoData);
    
    // Set first category as active
    if (demoData.categories.length > 0) {
      setActiveCategoryId(demoData.categories[0]);
    }
    
    return demoData.categories[0];
  }, []);

  return {
    categories: data.categories,
    items: data.items,
    activeCategory: activeCategoryId,
    visibleItems,
    isCategoryModalOpen,
    isReportModalOpen,
    editingReport,
    confirmModalOpen,
    categoryToDelete,
    categoriesLoading,
    creatingCategory,
    editingCategory,
    setEditingCategory,
    setActiveCategory: setActiveCategoryId,
    handleAddCategory,
    handleDeleteCategory,
    resetCreatingCategory,
    handleEditCategory,
    handleUpdateCategory,
    handleConfirmDelete,
    refreshCategories,
    openCreateReportModal,
    openEditReportModal,
    closeReportModal,
    createOrUpdateReport,
    onDeleteReport,
    downloadReport,
    formatDate,
    seedDemoReports,
    setIsCategoryModalOpen,
    setConfirmModalOpen,
    setCategoryToDelete,
    reportsLoading,
    refreshReports,
    loadReportsFromAPI
  };
}
