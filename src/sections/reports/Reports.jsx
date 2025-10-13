import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import { useReportsState } from '../../hooks/useReportsState';
import { useReportForm } from '../../hooks/useReportForm';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import ReportsTabPicker from '../../components/modals/ReportsTabPicker';
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock';
import '../../styles/sections/Reports.scss';

export default function Reports() {
  const MOBILE_Q = '(max-width: 768px)'
  const { user, toggleRole, isInitialized } = useAuth();

  // Mobile state management
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_Q).matches)
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
    setActiveCategory,
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
    setConfirmModalOpen
  } = useReportsState();

  // Memoize initialReport to prevent recreation on every render
  const initialReport = useMemo(() => editingReport || null, [editingReport?.id]);

  const reportForm = useReportForm(initialReport, isReportModalOpen, editingReport ? 'edit' : 'add');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isReportDeleteConfirmOpen, setIsReportDeleteConfirmOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Mobile responsive effect
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_Q)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])

  // Active tab management effect
  useEffect(() => {
    if (!categories.length) {
      setActiveTabId(null)
      localStorage.removeItem('reports-active-tab')
      return
    }
    if (!activeTabId || !categories.includes(activeTabId)) {
      const next = categories[0]
      setActiveTabId(next)
      localStorage.setItem('reports-active-tab', next)
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
      const remaining = categories.filter(c => c !== id)
      const next = remaining[0] || null
      setActiveTabId(next)
      if (next) {
        localStorage.setItem('reports-active-tab', next)
      } else {
        localStorage.removeItem('reports-active-tab')
      }
    }
  }

  // Get active category for mobile display
  const activeCategoryData = useMemo(
    () => activeTabId || null,
    [activeTabId]
  )

  const categoryModalBackdropClose = useModalBackdropClose(() => setIsCategoryModalOpen(false));
  const reportModalBackdropClose = useModalBackdropClose(() => closeReportModalWithReset());
  const confirmModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false));

  useBodyScrollLock(isCategoryModalOpen || isReportModalOpen || confirmModalOpen || isReportDeleteConfirmOpen || pickerOpen);

  const closeCategoryModal = () => {
    setNewCategoryName('');
    setCategoryError('');
    setIsCategoryModalOpen(false);
  };

  const closeReportModalWithReset = () => {
    reportForm.resetForm();
    closeReportModal();
  };

  const handleAddCategorySubmit = () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setCategoryError('Category name is required');
      return;
    }
    if (categories.includes(trimmedName)) {
      setCategoryError('Category already exists');
      return;
    }
    handleAddCategory(trimmedName);
    closeCategoryModal();
  };

  const handleReportSubmit = (e) => {
    e.preventDefault();
    if (reportForm.validate()) {
      // Enforce valid existing category
      const trimmedCats = categories
        .map(name => (typeof name === 'string' ? name.trim() : ''))
        .filter(Boolean);

      // Resolve legacy name to id by using the name string itself as id in storage
      // Since categories are stored as string names, we use the name as both id and name
      const currentId = reportForm.form.typeId && trimmedCats.includes(reportForm.form.typeId)
        ? reportForm.form.typeId
        : '';

      if (!currentId) {
        // If form had legacy typeName equal to active name, try fallback
        const byName = trimmedCats.find(n => n.toLowerCase() === (reportForm.form.typeId || '').trim().toLowerCase());
        if (!byName) {
          // show error and stop
          reportForm.setField('typeId', '');
          return;
        }
      }

      const catName = reportForm.form.typeId;

      const payload = {
        ...reportForm.toPayload(editingReport?.id),
        typeId: reportForm.form.typeId,
        typeName: catName
      };
      createOrUpdateReport(payload);
    }
  };

  const handleDeleteReport = (reportId) => {
    const report = visibleItems.find(r => r.id === reportId)
    if (report && can(user, 'reports:delete')) {
      setReportToDelete(report)
      setIsReportDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDeleteReport = () => {
    if (reportToDelete) {
      onDeleteReport(reportToDelete.id)
      setReportToDelete(null)
    }
  }

  const onConfirmDeleteCategory = () => {
    if (activeCategory) {
      deleteCategoryCascade(activeCategory);
      setConfirmModalOpen(false);
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
          <h1>Reports</h1>
          <p>Plan, view, and download annual and other key reports with ease.</p>
        </div>

      <div className="reports-header-actions">
        {/* TODO TEMPORARY: button to switch between admin and user view. REMOVE before production. */}
        <button
          className="temp-role-toggle-btn"
          onClick={toggleRole}
        >
          {user?.role === 'admin' ? 'Switch to User View' : 'Switch to Admin View'}
        </button>

        <button
          className="reports-seed-btn"
          onClick={seedDemoReports}
        >
          Seed Reports
        </button>

        {can(user, 'reports:create') && (
          <button type="button" className="add-report-btn add-report-btn--desktop" onClick={openCreateReportModal}>
            <i className="bi bi-plus" aria-hidden="true"></i> Add New
          </button>
        )}
      </div>
      </div>

      {/* Header area */}
      {isMobile ? (
        <div className="reports-mobile-header" role="region" aria-label="Report categories">
          <div className="category-title">
            <button
              type="button"
              className="category-picker-btn"
              onClick={() => setPickerOpen(true)}
              aria-haspopup="dialog"
              aria-controls="reportsTabPicker">
              <h2>
                {activeCategoryData || 'Reports'}
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
            />
          </div>
          {can(user, 'reports:create') && (
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
          <div className="reports-tabs">
            {categories.map(cat => (
              <div key={cat} className="reports-tab-group">
                <button
                  className={`reports-tab ${cat === activeCategory ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat)}
                >
                  <span>{cat}</span>
                </button>
                {can(user, 'reports:create') && (
                  <button
                    className="reports-tab__delete"
                    onClick={(e) => { e.stopPropagation(); handleDeleteCategory(cat); }}
                    aria-label="Delete category"
                  >
                    <i className="bi bi-x-lg"></i>
                  </button>
                )}
              </div>
            ))}

            {can(user, 'reports:create') && (
              <button
                className="reports-add-category-btn"
                onClick={() => setIsCategoryModalOpen(true)}
              >
                <i className="bi bi-plus"></i>
              </button>
            )}
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
        {visibleItems.length === 0 ? (
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
          <div className="reports-list">
            {visibleItems.map(r => (
              <article key={r.id} className="report-item">
                <div className="report-info">
                  <div className="report-meta">Published: {formatDate(r.publishedAt)}</div>
                  <div className="report-title">{r.title}</div>
                </div>
                <div className="report-actions">
                  {can(user, 'reports:delete') && (
                    <button type="button" className="btn-delete" onClick={() => handleDeleteReport(r.id)} aria-label={`Delete ${r.title}`}>
                      Delete
                    </button>
                  )}
                  {can(user, 'reports:create') && (
                    <button type="button" className="btn-edit" onClick={() => openEditReportModal(r)} aria-label={`Edit ${r.title}`}>
                      Edit Report
                    </button>
                  )}
                  <button type="button" className="btn-download" onClick={() => downloadReport(r)} aria-label={`Download ${r.title}`}>
                    Download PDF
                  </button>

                  {/* Mobile actions - shown only on mobile */}
                  <div className="report-actions-mobile">
                    {can(user, 'reports:delete') && (
                      <button type="button" className="btn-delete-mobile" onClick={() => handleDeleteReport(r.id)} aria-label={`Delete ${r.title}`}>
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                    {can(user, 'reports:create') && (
                      <button type="button" className="btn-edit-mobile" onClick={() => openEditReportModal(r)} aria-label={`Edit ${r.title}`}>
                        Edit
                      </button>
                    )}
                    <button type="button" className={`btn-download-mobile ${!can(user, 'reports:create') ? 'btn-download-mobile--user' : ''}`} onClick={() => downloadReport(r)} aria-label={`Download ${r.title}`}>
                      Download PDF
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
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
          className="reports-modal-overlay"
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
                onClick={closeCategoryModal}
              >
                <i className="bi bi-x-lg"></i>
              </button>
              <h2 className="reports-addcat-modal__title">Enter Tab name</h2>
              <p className="reports-addcat-modal__subtitle">Please add new tab details</p>

              <div className="form-group">
                <label htmlFor="categoryName" className="reports-addcat-modal__label">Enter the Tab Name</label>
                <input
                  type="text"
                  id="categoryName"
                  placeholder="Please mention the name of the new tab which you want to create"
                  className="reports-addcat-modal__input"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCategorySubmit();
                    }
                  }}
                  autoFocus
                />
              </div>

              {categoryError && (
                <div className="error-message">
                  {categoryError}
                </div>
              )}

              <div className="reports-addcat-modal__actions">
                <button
                  type="button"
                  className="reports-addcat-modal__update-btn"
                  onClick={handleAddCategorySubmit}
                >
                  Update
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
            <div className="reports-modal-header">
              <h2>Upload Reports</h2>
              <p>Please upload the reports you'd like to store or manage in your account</p>
              <button
                className="close-btn"
                onClick={closeReportModalWithReset}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleReportSubmit}>
              <div className="form-group">
                <label htmlFor="title">Title<span className="req-star" aria-hidden="true">*</span></label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={reportForm.form.title}
                  onChange={(e) => reportForm.setField('title', e.target.value)}
                  placeholder="Please mention how do you want to save the document name"
                  required
                />
                {reportForm.errors.title && (
                  <div className="error-message">{reportForm.errors.title}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="typeId">Report Type<span className="req-star" aria-hidden="true">*</span></label>
                <select
                  id="typeId"
                  name="typeId"
                  value={reportForm.form.typeId || ''}
                  onChange={(e) => reportForm.setField('typeId', e.target.value)}
                  required
                >
                  <option value="" disabled>Select type</option>
                  {categories
                    .map(name => (typeof name === 'string' ? name.trim() : ''))
                    .filter(Boolean)
                    .map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                </select>
                {reportForm.errors.typeId && (
                  <div className="error-message">{reportForm.errors.typeId}</div>
                )}
                {reportForm.form.typeId && !categories.includes(reportForm.form.typeId) && (
                  <p className="report-type-helper">Previously selected category was removed. Please choose another.</p>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="linkUrl">Link<span className="req-star" aria-hidden="true">*</span></label>
                <input
                  type="url"
                  id="linkUrl"
                  name="linkUrl"
                  value={reportForm.form.linkUrl}
                  onChange={(e) => reportForm.setField('linkUrl', e.target.value)}
                  placeholder="https://example.com/report.pdf"
                  required
                />
                {reportForm.errors.linkUrl && (
                  <div className="error-message">{reportForm.errors.linkUrl}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="file">File Upload</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => reportForm.setFile(e.target.files?.[0])}
                    className="hidden-file-input"
                  />
                  <label htmlFor="file" className="file-input-label">
                    Choose file
                  </label>
                  <p className="file-status">
                    {reportForm.form.fileName || 'No file chosen'}
                  </p>
                  {reportForm.form.imagePreviewUrl && (
                    <div className="image-preview">
                      <img 
                        src={reportForm.form.imagePreviewUrl} 
                        alt="Preview" 
                        onError={(e) => {
                          e.target.classList.add('image-preview-hidden');
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="upload-now-btn">
                  Upload Now
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
              <p>This will permanently delete the category and all its reports.</p>

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
      />
    </div>
  );
}
