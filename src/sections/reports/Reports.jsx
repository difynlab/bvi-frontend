import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import { useReportsState } from '../../hooks/useReportsState';
import { useReportForm } from '../../hooks/useReportForm';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';
import ReportsTabPicker from '../../components/modals/ReportsTabPicker';
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock';
import CustomDropdown from '../../components/CustomDropdown';
import ReportsListShimmer from '../../components/reports/ReportsListShimmer';
import ReportsListShimmerMobile from '../../components/reports/ReportsListShimmerMobile';
import '../../styles/sections/Reports.scss';

export default function Reports() {
  const MOBILE_Q = '(max-width: 768px)'
  const { user, isInitialized } = useAuth();

  // Mobile state management
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_Q).matches)
  const [isVerySmallScreen, setIsVerySmallScreen] = useState(() => window.innerWidth < 350)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTabId, setActiveTabId] = useState(() => {
    // Load from localStorage or default to first category
    const saved = localStorage.getItem('reports-active-tab')
    return saved || null
  })

  const {
    categories,
    activeCategory,
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
    setActiveCategory,
    handleAddCategory,
    handleDeleteCategory,
    resetCreatingCategory,
    handleEditCategory,
    handleUpdateCategory,
    handleConfirmDelete,
    openCreateReportModal,
    openEditReportModal,
    closeReportModal,
    createOrUpdateReport,
    onDeleteReport,
    downloadReport,
    setIsCategoryModalOpen,
    setConfirmModalOpen,
    setCategoryToDelete,
    reportsLoading,
    refreshReports,
    loadReportsFromAPI
  } = useReportsState();

  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);
  const [paginationStart, setPaginationStart] = useState(1);


  // Memoize initialReport to prevent recreation on every render
  const initialReport = useMemo(() => {
    return editingReport || null;
  }, [editingReport?.id]);

  const reportForm = useReportForm(initialReport, isReportModalOpen, editingReport ? 'edit' : 'add', categories);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isReportDeleteConfirmOpen, setIsReportDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleFileDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) reportForm.setFile(file);
  };

  // Effect to preload category name when editing
  useEffect(() => {
    if (editingCategory) {
      setNewCategoryName(editingCategory.title);
    } else {
      setNewCategoryName('');
    }
  }, [editingCategory]);

  // Reset creating category state when modal closes
  useEffect(() => {
    if (!isCategoryModalOpen && creatingCategory) {
      resetCreatingCategory();
    }
  }, [isCategoryModalOpen, creatingCategory, resetCreatingCategory]);

  // Mobile responsive effect
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_Q)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])

  // Detect very small screens
  useEffect(() => {
    const handleResize = () => {
      setIsVerySmallScreen(window.innerWidth < 350)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Active tab management effect
  useEffect(() => {
    if (!categories.length) {
      setActiveTabId(null)
      localStorage.removeItem('reports-active-tab')
      return
    }
    if (!activeTabId || !categories.some(cat => cat.id === activeTabId)) {
      const next = categories[0]?.id
      setActiveTabId(next)
      if (next) {
        localStorage.setItem('reports-active-tab', next)
      }
    }
  }, [categories, activeTabId])

  // Sync mobile activeTabId with desktop activeCategory when in mobile mode
  useEffect(() => {
    if (isMobile && activeCategory && activeCategory !== activeTabId) {
      setActiveTabId(activeCategory)
      localStorage.setItem('reports-active-tab', activeCategory)
    }
  }, [isMobile, activeCategory, activeTabId])

  // Mobile handlers
  const onSelectCategory = (id) => {
    setActiveTabId(id)
    localStorage.setItem('reports-active-tab', id)
    if (isMobile) {
      setActiveCategory(id)
    }
  }

  const onAddCategory = () => {
    setIsCategoryModalOpen(true)
  }

  const onDeleteCategory = (id) => {
    handleDeleteCategory(id)
    if (id === activeTabId) {
      const remaining = categories.filter(c => c.id !== id)
      const next = remaining[0]?.id || null
      setActiveTabId(next)
      if (next) {
        localStorage.setItem('reports-active-tab', next)
      } else {
        localStorage.removeItem('reports-active-tab')
      }
    }
  }

  const activeCategoryData = useMemo(
    () => {
      const activeCat = categories.find(cat => cat.id === activeTabId);
      return activeCat || null;
    },
    [categories, activeTabId]
  );

  const totalItems = visibleItems.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE) || 1;

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return visibleItems.slice(startIndex, endIndex);
  }, [visibleItems, currentPage]);

  const visiblePages = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const endPage = Math.min(paginationStart + 4, totalPages);
    return Array.from({ length: endPage - paginationStart + 1 }, (_, i) => paginationStart + i);
  }, [totalPages, paginationStart]);

  useEffect(() => {
    setCurrentPage(1);
    setPaginationStart(1);
  }, [activeCategory]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
      setPaginationStart(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    if (totalPages <= 5) {
      setPaginationStart(1);
    } else {
      if (currentPage < paginationStart) {
        setPaginationStart(currentPage);
      } else if (currentPage > paginationStart + 4) {
        setPaginationStart(currentPage - 4);
      }
    }
  }, [currentPage, totalPages]);

  const showLeftArrow = totalPages > 5 && paginationStart > 1;
  const showRightArrow = totalPages > 5;
  const isRightArrowDisabled = totalPages > 5 && paginationStart + 4 >= totalPages;

  const handlePreviousPages = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPages = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const categoryModalBackdropClose = useModalBackdropClose(() => setIsCategoryModalOpen(false));
  const reportModalBackdropClose = useModalBackdropClose(() => closeReportModalWithReset());
  const confirmModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false));

  useBodyScrollLock(isCategoryModalOpen || isReportModalOpen || confirmModalOpen || isReportDeleteConfirmOpen || isSuccessDeleteOpen || pickerOpen);

  const closeCategoryModal = () => {
    setNewCategoryName('');
    setCategoryError('');
    setIsCategoryModalOpen(false);
    // Reset creating category state when modal is closed
    resetCreatingCategory();
    // Reset editing category state
    if (editingCategory) {
      setEditingCategory(null);
    }
  };

  const closeReportModalWithReset = () => {
    reportForm.resetForm();
    closeReportModal();
  };

  const handleAddCategorySubmit = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setCategoryError('Category name is required');
      return;
    }
    if (trimmedName.length < 3) {
      setCategoryError('Category name must be at least 3 characters long');
      return;
    }
    if (categories.some(cat => cat.title === trimmedName && cat.id !== editingCategory?.id)) {
      setCategoryError('Category already exists');
      return;
    }
    
    try {
      if (editingCategory) {
        // Update existing category
        await handleUpdateCategory(trimmedName);
        setEditingCategory(null); // Reset editing state
      } else {
        // Create new category
        await handleAddCategory(trimmedName);
      }
      // Only close modal if successful
      closeCategoryModal();
    } catch (error) {
      // Show error in banner, don't close modal
      setCategoryError(`Error: ${error.message || 'Failed to save category'}`);
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    
    if (reportForm.validate()) {
      setIsSubmittingReport(true);
      setReportError('');
      
      try {
        if (
          !reportForm.form.linkUrl.trim() &&
          !reportForm.form.file &&
          !reportForm.form.fileName
        ) {
          setReportError('You must provide at least a link or a PDF file before submitting this publication.');
          setIsSubmittingReport(false);
          return;
        }

        // Enforce valid existing category
        const activeCategories = categories
          .filter(cat => cat.status === 1)
          .map(cat => cat.title);


        // Check if selected category exists in active categories
        const currentId = reportForm.form.typeId && activeCategories.includes(reportForm.form.typeId)
          ? reportForm.form.typeId
          : '';


        if (!currentId) {
          // If form had legacy typeName equal to active name, try fallback
          const byName = activeCategories.find(n => n.toLowerCase() === (reportForm.form.typeId || '').trim().toLowerCase());
          if (!byName) {
            // Show error in banner instead of resetting field
            setReportError('Selected category is no longer available. Please choose another category.');
            return;
          }
        }

        const catName = reportForm.form.typeId;
        
        // Find the category ID from the selected category title
        const selectedCategory = categories.find(cat => cat.title === reportForm.form.typeId);
        const categoryId = selectedCategory ? selectedCategory.id : null;

        if (!categoryId) {
          setReportError('Invalid category selected. Please choose another category.');
          return;
        }

        const payload = {
          ...reportForm.toPayload(editingReport?.id),
          report_category_id: categoryId  // Send the numeric ID, not the title
        };
        
        
        await createOrUpdateReport(payload);
      } catch (error) {
        setReportError(`Error: ${error.message || 'Failed to save report'}`);
      } finally {
        setIsSubmittingReport(false);
      }
    }
  };

  const handleDeleteReport = (reportId) => {
    const report = visibleItems.find(r => r.id === reportId)
    if (report && can(user, 'reports:delete')) {
      setReportToDelete(report)
      setIsReportDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDeleteReport = async () => {
    try {
      if (reportToDelete) {
        setIsDeleting(true);
        
        await onDeleteReport(reportToDelete.id);
        await loadReportsFromAPI();
        
        setIsReportDeleteConfirmOpen(false);
        setReportToDelete(null);
        setIsDeleting(false);
        
        setIsSuccessDeleteOpen(true);
      }
    } catch (error) {
      alert('An error occurred while deleting the report');
      setIsReportDeleteConfirmOpen(false);
      setReportToDelete(null);
      setIsDeleting(false);
    }
  };

  const onConfirmDeleteCategory = async () => {
    if (activeCategory) {
      try {
        await handleConfirmDelete();
        // Show success modal after successful deletion
        setIsSuccessDeleteOpen(true);
      } catch (error) {
        // Don't show success modal if there was an error
      }
    }
  };

  if (!isInitialized) {
    return (
      <div className="reports-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="reports-container">
      <div className="reports-header">
        <div className="reports-header-title">
          <h1>Publications</h1>
          <p>Plan, view, and download annual and other key publications with ease.</p>
        </div>

      <div className="reports-header-actions">
        {can(user, 'reports:create') && (
          <button type="button" className="add-report-btn add-report-btn--desktop" onClick={openCreateReportModal}>
            <i className="bi bi-plus" aria-hidden="true"></i> Add New
          </button>
        )}
      </div>
      </div>

      {/* Header area */}
      {isMobile ? (
        <div className="reports-mobile-header" role="region" aria-label="Publication categories">
          {categoriesLoading ? (
            <div className="category-title-skeleton">
              <span style={{ opacity: 0 }}>Loading...</span>
            </div>
          ) : (
            <div className="category-title">
              {categories.length > 0 ? (
                <>
                  <button
                    type="button"
                    className="category-picker-btn"
                    onClick={() => setPickerOpen(true)}
                    aria-haspopup="dialog"
                    aria-controls="reportsTabPicker">
                    <h2>
                      {activeCategoryData?.title || 'Publications'}
                    </h2>
                    <i className="bi bi-chevron-down" aria-hidden="true"></i>
                  </button>
                  
                  {/* Reports Tab Picker Dropdown */}
                  <ReportsTabPicker
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    categories={categories}
                    activeTabId={activeTabId}
                    onSelect={onSelectCategory}
                    canManage={can(user, 'reports:create')}
                    onAddCategory={onAddCategory}
                    onDeleteCategory={onDeleteCategory}
                    onEditCategory={handleEditCategory}
                  />
                </>
              ) : (
                <div className="no-categories-message-mobile">
                  <p>No publication categories created yet...</p>
                </div>
              )}
            </div>
          )}
          {can(user, 'reports:create') && !categoriesLoading && (
            <button
              type="button"
              className="add-tab-btn"
              onClick={onAddCategory}
              aria-label="Add category"
              title="Add category"
            >
              <i className="bi bi-plus" aria-hidden="true"></i>
            </button>
          )}
        </div>
      ) : (
        /* existing desktop tabs header stays as-is */
        <div className="reports-tabs-desktop" role="tablist" aria-orientation="horizontal">
          <div className="category-tabs">
            <div className="tabs-container">
              {categoriesLoading ? (
                <>
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="tab-skeleton-group">
                      <div className="category-tab-skeleton">
                        <span style={{ opacity: 0 }}>Loading...</span>
                      </div>
                    </div>
                  ))}
                  {can(user, 'reports:create') && (
                    <button
                      className="add-category-btn"
                      onClick={() => setIsCategoryModalOpen(true)}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  )}
                </>
              ) : (
                <>
                  {categories.length > 0 ? (
                    categories.map(category => (
                      <div key={category.id} className="tab-group">
                        <button
                          className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                          onClick={() => setActiveCategory(category.id)}
                        >
                          <span>{category.title}</span>
                        </button>
                        {can(user, 'reports:update') && (
                          <button
                            className="category-tab__edit"
                            onClick={(e) => { e.stopPropagation(); handleEditCategory(category.id); }}
                            aria-label="Edit category"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        )}
                        {can(user, 'reports:create') && (
                          <button
                            className="category-tab__delete"
                            onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                            aria-label="Delete category"
                          >
                            <i className="bi bi-x-lg"></i>
                          </button>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="no-categories-message">
                      <p>No publication categories created yet...</p>
                    </div>
                  )}
                  {can(user, 'reports:create') && (
                    <button
                      className="add-category-btn"
                      onClick={() => setIsCategoryModalOpen(true)}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dropdown Overlay */}
      {pickerOpen && (
        <div 
          className="reports-dropdown-overlay" 
          onClick={() => setPickerOpen(false)}
        />
      )}

      <section className="reports-list-wrap" aria-live="polite">
        {reportsLoading ? (
          <>
            <ReportsListShimmer />
            <ReportsListShimmerMobile />
          </>
        ) : visibleItems.length === 0 ? (
          <div className="empty-state">
            {can(user, 'reports:create') ? (
              <>
                <img src="/empty-state-admin.png" alt="" />
                <h2>Oops nothing to see here yet!</h2>
                <p>Looks like you haven't added anything. Go ahead and add<br /> your first item to get started!</p>
              </>
            ) : (
              <>
                <img src="/empty-state-user.png" alt="" className="empty-state-user" />
                <h2>Oops! No data found.</h2>
                <p>Nothing's been added here yet, or there might be a hiccup.<br />Try again or check back later!</p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="reports-list">
              {paginatedData.map(r => {
                const hasLink = !!(r.link || r.link_url);
                const hasFile = !!(r.fileUrl || r.file || r.file_url);
                const viewUrl = r.link || r.link_url || '';
                const handleView = () => { if (viewUrl) window.open(viewUrl, '_blank', 'noopener,noreferrer'); };
                return (
                <article key={r.id} className="report-item">
                  <div className="report-info">
                    <div className="report-title">{r.name}</div>
                  </div>
                  <div className="report-actions">
                    {can(user, 'reports:delete') && (
                      <button
                        type="button"
                        className="btn-delete"
                        onClick={() => handleDeleteReport(r.id)}
                        aria-label={`Delete ${r.name}`}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                    {can(user, 'reports:create') && (
                      <button
                        type="button"
                        className="btn-edit"
                        onClick={() => openEditReportModal(r)}
                        aria-label={`Edit ${r.name}`}
                      >
                        Edit details
                      </button>
                    )}
                    {hasLink && (
                      <button type="button" className={`btn-download${hasFile ? ' btn-download--view' : ''}`} onClick={handleView} aria-label={`View ${r.name}`}>
                        <i className="bi bi-link-45deg" aria-hidden="true"></i> View
                      </button>
                    )}
                    {hasFile && (
                      <button type="button" className="btn-download" onClick={() => downloadReport(r)} aria-label={`Download ${r.name}`}>
                        <i className="bi bi-download" aria-hidden="true"></i> Download
                      </button>
                    )}
                    {!hasLink && !hasFile && (
                      <button type="button" className="btn-download" disabled aria-label={`No file or link`}>
                        Download
                      </button>
                    )}
                    <div className="report-actions-mobile">
                      <div className="report-actions-mobile__row report-actions-mobile__row--primary">
                        {can(user, 'reports:delete') && (
                          <button
                            type="button"
                            className="btn-delete-mobile"
                            onClick={() => handleDeleteReport(r.id)}
                            aria-label={`Delete ${r.name}`}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                        {can(user, 'reports:create') && (
                          <button type="button" className="btn-edit-mobile" onClick={() => openEditReportModal(r)} aria-label={`Edit ${r.name}`}>
                            Edit
                          </button>
                        )}
                      </div>
                      <div className="report-actions-mobile__row report-actions-mobile__row--secondary">
                        {hasLink && (
                          <button type="button" className={`btn-download-mobile${hasFile ? ' btn-download-mobile--view' : ''}`} onClick={handleView} aria-label={`View ${r.name}`}>
                            <i className="bi bi-link-45deg" aria-hidden="true"></i> View
                          </button>
                        )}
                        {hasFile && (
                          <button type="button" className="btn-download-mobile" onClick={() => downloadReport(r)} aria-label={`Download ${r.name}`}>
                            <i className="bi bi-download" aria-hidden="true"></i> Download
                          </button>
                        )}
                        {!hasLink && !hasFile && (
                          <button type="button" className="btn-download-mobile" disabled aria-label={`No file or link`}>
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
                );
              })}
            </div>
            {totalPages > 1 && (
              <div className="reports-pagination">
                <div className="pagination__buttons">
                  {showLeftArrow && (
                    <button
                      className="pagination__arrow"
                      type="button"
                      onClick={handlePreviousPages}
                      aria-label="Previous pages"
                    >
                      <i className="bi bi-chevron-left" aria-hidden="true"></i>
                    </button>
                  )}
                  {visiblePages.map((page) => (
                    <button
                      key={page}
                      className={`pagination__button ${currentPage === page ? 'pagination__button--active' : ''}`}
                      type="button"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}
                  {showRightArrow && (
                    <button
                      className="pagination__arrow"
                      type="button"
                      onClick={handleNextPages}
                      disabled={isRightArrowDisabled}
                      aria-label="Next pages"
                    >
                      <i className="bi bi-chevron-right" aria-hidden="true"></i>
                    </button>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </section>

    {/* Mobile FAB */}
    {can(user, 'reports:create') && (
      <button 
        type="button" 
        className="add-report-btn add-report-btn--mobile"
        onClick={openCreateReportModal}
        aria-label="Add new report"
      >
        <i className="bi bi-plus" aria-hidden="true"></i>
        <span className="btn-text">Add New</span>
      </button>
    )}

    {/* Category Modal */}
      {isCategoryModalOpen && (
        <div
          className="reports-modal-overlay reports-addcat-overlay"
          onPointerDown={categoryModalBackdropClose.onBackdropPointerDown}
          onPointerUp={categoryModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={categoryModalBackdropClose.onBackdropPointerCancel}
        >
          <ModalLifecycleLock />
          <div
            className="reports-modal reports-addcat-modal"
            onPointerDown={categoryModalBackdropClose.stopInsidePointer}
            onClick={categoryModalBackdropClose.stopInsidePointer}
          >

            <div className="reports-addcat-modal__content">
              <button
                className="close-btn"
                onClick={creatingCategory ? undefined : closeCategoryModal}
                disabled={creatingCategory}
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <h2 className="reports-addcat-modal__title">
                {editingCategory ? 'Edit Category Name' : 'Enter Category Name'}
              </h2>
              <p className="reports-addcat-modal__subtitle">
                {editingCategory ? 'Please update category details' : 'Please add new category details'}
              </p>

              <div className="form-group">
                <label htmlFor="categoryName" className="reports-addcat-modal__label">Enter Title</label>
                <input
                  type="text"
                  id="categoryName"
                  placeholder="Please mention the title of the new category you want to create"
                  className="reports-addcat-modal__input"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    // Clear error when user starts typing
                    if (categoryError) {
                      setCategoryError('');
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !creatingCategory) {
                      e.preventDefault();
                      handleAddCategorySubmit();
                    }
                  }}
                  disabled={creatingCategory}
                  autoFocus
                />
              </div>

              {categoryError && (
                <div
                  className="app-form__error-banner"
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                >
                  <strong>Error:</strong> {categoryError}
                </div>
              )}

              <div className="reports-addcat-modal__actions">
                <button
                  type="button"
                  className="reports-addcat-modal__update-btn"
                  onClick={handleAddCategorySubmit}
                  disabled={creatingCategory}
                >
                  {creatingCategory ? 'Loading...' : (editingCategory ? 'Submit' : 'Upload')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReportModalOpen && (
        <div
          className="reports-modal-overlay"
          onPointerDown={reportModalBackdropClose.onBackdropPointerDown}
          onPointerUp={reportModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={reportModalBackdropClose.onBackdropPointerCancel}
        >
          <ModalLifecycleLock />
          <div
            className="reports-modal"
            onPointerDown={reportModalBackdropClose.stopInsidePointer}
            onClick={reportModalBackdropClose.stopInsidePointer}
          >
            <button
              className="close-btn"
              onClick={closeReportModalWithReset}
            >
              <i className="bi bi-x-lg"></i>
            </button>
            <div className="reports-modal-header">
              <h2>Upload Publications</h2>
              <p>Please upload the publications you'd like to store or manage in your account</p>
            </div>

            <form onSubmit={handleReportSubmit}>
              <div className="form-group">
                <label htmlFor="title">Publications Title<span className="req-star" aria-hidden="true">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={reportForm.form.title}
                  onChange={(e) => {
                    reportForm.setField('title', e.target.value);
                    if (reportError) setReportError('');
                  }}
                  placeholder="Please mention how do you want to save the document name"
                  required
                />
                {reportForm.errors.title && (
                  <div
                    className="app-form__error-banner"
                    role="alert"
                    aria-live="assertive"
                    tabIndex={-1}
                  >
                    <strong>Error:</strong> {reportForm.errors.title}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="typeId">Publication Type<span className="req-star" aria-hidden="true">*</span></label>
                <CustomDropdown
                  id="typeId"
                  name="typeId"
                  value={reportForm.form.typeId || ''}
                  onChange={(e) => {
                    reportForm.setField('typeId', e.target.value);
                    if (reportError) setReportError('');
                  }}
                  options={categories
                    .filter(cat => cat.status === 1)
                    .map(cat => ({ value: cat.title, label: cat.title }))}
                  placeholder="Select type"
                  actionLabel="New category..."
                  onAction={() => setIsCategoryModalOpen(true)}
                />
                {reportForm.errors.typeId && (
                  <div
                    className="app-form__error-banner"
                    role="alert"
                    aria-live="assertive"
                    tabIndex={-1}
                  >
                    <strong>Error:</strong> {reportForm.errors.typeId}
                  </div>
                )}
                {reportForm.form.typeId && !categories.some(cat => cat.title === reportForm.form.typeId) && (
                  <p className="report-type-helper">Previously selected category was removed. Please choose another.</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="linkUrl">Link</label>
                <input
                  type="url"
                  id="linkUrl"
                  name="linkUrl"
                  value={reportForm.form.linkUrl}
                  onChange={(e) => {
                    reportForm.setField('linkUrl', e.target.value);
                    if (reportError) setReportError('');
                  }}
                  placeholder="https://example.com/report.pdf"
                />
                {reportForm.errors.linkUrl && (
                  <div
                    className="app-form__error-banner"
                    role="alert"
                    aria-live="assertive"
                    tabIndex={-1}
                  >
                    <strong>Error:</strong> {reportForm.errors.linkUrl}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="file">File Upload</label>
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666', opacity: 0.7 }}>Only PDF files are supported. Maximum file size: 15 MB.</p>
                <div
                  className="file-upload-area dropzone-surface"
                  data-has-file={Boolean(reportForm.form.imagePreviewUrl || reportForm.form.fileName)}
                  onDragOver={handleFileDragOver}
                  onDragLeave={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => reportForm.setFile(e.target.files?.[0])}
                    className="hidden-file-input"
                  />
                  {!reportForm.form.imagePreviewUrl && !reportForm.form.fileName && (
                    <div className="dropzone-content">
                      <i className="bi bi-cloud-upload dropzone-icon" aria-hidden="true"></i>
                      <p className="dropzone-label">Drag and drop file here</p>
                      <p className="dropzone-separator">or</p>
                      <button
                        type="button"
                        className="dropzone-browse"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Browse File
                      </button>
                    </div>
                  )}
                  <p className="file-status">
                    {reportForm.form.fileName || 'No file chosen'}
                    {editingReport && reportForm.form.fileName && (
                      <span className="existing-file-indicator"> (Existing file)</span>
                    )}
                  </p>
                  {reportForm.form.imagePreviewUrl && (
                    <div className="image-preview">
                      <img 
                        src={reportForm.form.imagePreviewUrl} 
                        alt="Preview" 
                        onLoad={() => {}}
                        onError={(e) => {
                          e.target.classList.add('image-preview-hidden');
                        }}
                      />
                    </div>
                  )}
                  {editingReport && reportForm.form.fileName && (
                    <div className="existing-file-info">
                      <p className="file-info-text">
                        <i className="bi bi-file-earmark-pdf" style={{marginRight: '8px', color: '#dc2626'}}></i>
                        Current file: <strong>{reportForm.form.fileName}</strong>
                      </p>
                      <p className="file-info-note">
                        Select a new file to replace the existing one, or leave empty to keep the current file.
                      </p>
                    </div>
                  )}
                  {reportForm.errors.file && (
                    <div
                      className="app-form__error-banner"
                      role="alert"
                      aria-live="assertive"
                      tabIndex={-1}
                    >
                      <strong>Error:</strong> {reportForm.errors.file}
                    </div>
                  )}
                </div>
              </div>

              {reportError && (
                <div
                  className="app-form__error-banner"
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                >
                  <strong>Error:</strong> {reportError}
                </div>
              )}

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="upload-now-btn"
                  disabled={isSubmittingReport}
                >
                  {isSubmittingReport ? 'Loading...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModalOpen && (
        <div
          className="reports-modal-overlay"
          onPointerDown={confirmModalBackdropClose.onBackdropPointerDown}
          onPointerUp={confirmModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={confirmModalBackdropClose.onBackdropPointerCancel}
        >
          <ModalLifecycleLock />
          <div
            className="reports-modal"
            onPointerDown={confirmModalBackdropClose.stopInsidePointer}
            onClick={confirmModalBackdropClose.stopInsidePointer}
          >
            <div className="reports-modal-header">
              <h2>Delete category?</h2>
              <button
                className="close-btn"
                onClick={() => setConfirmModalOpen(false)}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <div className="confirm-modal-content">
              <p>This will permanently delete the category and all its publications.</p>

              <div className="form-actions">
                <button type="button" onClick={() => setConfirmModalOpen(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="button" onClick={onConfirmDeleteCategory} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Report Modal */}
      <ConfirmDeleteModal
        isOpen={isReportDeleteConfirmOpen}
        onClose={() => {
          setIsReportDeleteConfirmOpen(false)
          setReportToDelete(null)
        }}
        onConfirm={handleConfirmDeleteReport}
        isDeleting={isDeleting}
      />

      <SuccessDeleteModal
        isOpen={isSuccessDeleteOpen}
        onClose={() => setIsSuccessDeleteOpen(false)}
      />
    </div>
  );
}
