import { useState, useCallback, useMemo } from 'react';
import { readReports, writeReports, addCategory, deleteCategory, upsertReport, deleteReport } from '../helpers/reportsStorage';

export function useReportsState() {
  const [data, setData] = useState(() => readReports());
  const [activeCategory, setActiveCategory] = useState(() => {
    const initialData = readReports();
    return initialData.categories[0] || 'Annual Report';
  });
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [editingReport, setEditingReport] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);

  const visibleItems = useMemo(() => 
    data.items.filter(item => item.type === activeCategory),
    [data.items, activeCategory]
  );

  const handleAddCategory = useCallback(() => {
    setIsCategoryModalOpen(true);
  }, []);

  const confirmAddCategory = useCallback((name) => {
    const trimmedName = name.trim();
    setData(prevData => {
      if (trimmedName && !prevData.categories.includes(trimmedName)) {
        const updatedData = addCategory(trimmedName);
        return updatedData;
      }
      return prevData;
    });
    setIsCategoryModalOpen(false);
  }, []);

  const handleDeleteCategory = useCallback((name) => {
    setCategoryToDelete(name);
    setConfirmModalOpen(true);
  }, []);

  const openConfirmModal = useCallback((name) => {
    setCategoryToDelete(name);
    setConfirmModalOpen(true);
  }, []);

  const closeConfirmModal = useCallback(() => {
    setConfirmModalOpen(false);
    setCategoryToDelete(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (categoryToDelete) {
      const updatedData = deleteCategory(categoryToDelete);
      setData(updatedData);
      // Switch to first available category if current one was deleted
      setActiveCategory(prevActive => {
        if (prevActive === categoryToDelete && updatedData.categories.length > 0) {
          return updatedData.categories[0];
        }
        return prevActive;
      });
      closeConfirmModal();
    }
  }, [categoryToDelete, closeConfirmModal]);

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

  return {
    categories: data.categories,
    items: data.items,
    activeCategory,
    visibleItems,
    isCategoryModalOpen,
    isReportModalOpen,
    editingReport,
    confirmModalOpen,
    categoryToDelete,
    setActiveCategory,
    handleAddCategory,
    confirmAddCategory,
    handleDeleteCategory,
    openConfirmModal,
    closeConfirmModal,
    handleConfirmDelete,
    openCreateReportModal,
    openEditReportModal,
    closeReportModal,
    createOrUpdateReport,
    onDeleteReport,
    downloadReport,
    formatDate,
    setIsCategoryModalOpen
  };
}
