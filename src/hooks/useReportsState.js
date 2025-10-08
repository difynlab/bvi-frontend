import { useState, useCallback, useMemo, useEffect } from 'react';
import { readReports, writeReports, addCategory, deleteCategory, upsertReport, deleteReport, saveReportsAndCategories } from '../helpers/reportsStorage';

export function useReportsState() {
  const [data, setData] = useState(() => readReports());
  const [activeCategoryId, setActiveCategoryId] = useState(() => {
    const initialData = readReports();
    return initialData.categories[0] || null;
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  // Save data to storage whenever data changes
  useEffect(() => {
    writeReports(data);
  }, [data]);

  const visibleItems = useMemo(() => 
    data.items.filter(item => {
      const byId = item.typeId && item.typeId === activeCategoryId;
      const byName = item.typeName && item.typeName === activeCategoryId;
      return byId || byName;
    }),
    [data.items, activeCategoryId]
  );

  const deleteCategoryCascade = useCallback((categoryId) => {
    setData(prev => {
      const deleted = prev.categories.find(c => c === categoryId) || null;
      const deletedName = (deleted || '').trim().toLowerCase();

      const nextCategories = prev.categories.filter(c => c !== categoryId);

      // Remove all reports belonging to the deleted category.
      // Also catch legacy items that only stored typeName.
      const nextReports = prev.items.filter(r => {
        const byId = r.typeId && r.typeId !== categoryId;
        const byName = (r.typeName || '').trim().toLowerCase() !== deletedName;
        return byId && byName;
      });

      // Persist atomically
      saveReportsAndCategories(nextReports, nextCategories);

      // Fix active tab
      const nextActive = nextCategories[0] || null;

      return { ...prev, categories: nextCategories, items: nextReports, activeCategoryId: nextActive };
    });
    
    // Update active category
    setActiveCategoryId(prevActive => {
      if (prevActive === categoryId) {
        const nextCategories = data.categories.filter(c => c !== categoryId);
        return nextCategories[0] || null;
      }
      return prevActive;
    });
  }, [data.categories]);

  const handleAddCategory = useCallback((name) => {
    const trimmedName = name.trim();
    if (trimmedName && !data.categories.includes(trimmedName)) {
      const updatedData = addCategory(trimmedName);
      setData(updatedData);
      setIsCategoryModalOpen(false);
    }
  }, [data.categories]);

  const handleDeleteCategory = useCallback((name) => {
    setCategoryToDelete(name);
    setConfirmModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (categoryToDelete) {
      deleteCategoryCascade(categoryToDelete);
      setConfirmModalOpen(false);
      setCategoryToDelete(null);
    }
  }, [categoryToDelete, deleteCategoryCascade]);

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

  const createOrUpdateReport = useCallback((payload) => {
    const updatedData = upsertReport(payload);
    setData(updatedData);
    setIsReportModalOpen(false);
    setEditingReport(null);
  }, []);

  const onDeleteReport = useCallback((id) => {
    const updatedData = deleteReport(id);
    setData(updatedData);
    // TODO BACKEND: DELETE /api/reports/:id
  }, []);

  const downloadReport = useCallback((report) => {
    if (report.fileUrl) {
      // Create temporary anchor for download
      const link = document.createElement('a');
      link.href = report.fileUrl;
      link.download = report.title;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      console.info('Download report', report.id);
    }
  }, []);

  const formatDate = useCallback((iso) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return iso || '';
    }
  }, []);

  const seedDemoReports = useCallback(() => {
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
    writeReports(demoData);
    
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
    setActiveCategory: setActiveCategoryId,
    handleAddCategory,
    handleDeleteCategory,
    handleConfirmDelete,
    deleteCategoryCascade,
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
    setCategoryToDelete
  };
}
