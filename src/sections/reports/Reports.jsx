import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import { useReportsState } from '../../hooks/useReportsState';
import { useReportForm } from '../../hooks/useReportForm';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import '../../styles/sections/Reports.scss';

export default function Reports() {
  const { user, toggleRole, isInitialized } = useAuth();

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

  const reportForm = useReportForm();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');

  // Modal backdrop close handlers
  const categoryModalBackdropClose = useModalBackdropClose(() => setIsCategoryModalOpen(false));
  const reportModalBackdropClose = useModalBackdropClose(() => closeReportModal());
  const confirmModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false));

  // Body scroll lock for modals
  useBodyScrollLock(isCategoryModalOpen || isReportModalOpen || confirmModalOpen);

  // Load form data when editing
  useEffect(() => {
    if (isReportModalOpen && editingReport) {
      reportForm.loadFrom(editingReport);
    } else if (isReportModalOpen && !editingReport) {
      reportForm.reset();
    }
  }, [isReportModalOpen, editingReport, reportForm]);

  const closeCategoryModal = () => {
    setNewCategoryName('');
    setCategoryError('');
    setIsCategoryModalOpen(false);
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
      const payload = reportForm.toPayload(editingReport?.id);
      createOrUpdateReport(payload);
    }
  };

  const handleSeedReports = () => {
    const firstCategory = seedDemoReports();
    setActiveCategory(firstCategory);
  };

  // Safety check for initialization and user context
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
          onClick={handleSeedReports}
        >
          Seed Reports
        </button>

        {can(user, 'reports:create') && (
          <button type="button" className="add-report-btn" onClick={openCreateReportModal}>
            <i className="bi bi-plus" aria-hidden="true"></i> Add New
          </button>
        )}
      </div>
      </div>

      <div className="reports-tabs" role="tablist">
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

      <section className="reports-list-wrap" aria-live="polite">
        {visibleItems.length === 0 ? (
          <div className="empty-state">
            {can(user, 'reports:create') ? (
              // Admin empty state
              <>
                <img src="/empty-state-admin.png" alt="" />
                <h2>Oops nothing to see here yet!</h2>
                <p>Looks like you haven't added anything. Go ahead and add<br /> your first item to get started!</p>
              </>
            ) : (
              // User empty state
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
                  {can(user, 'reports:create') && (
                    <button type="button" className="btn-edit" onClick={() => openEditReportModal(r)} aria-label={`Edit ${r.title}`}>
                      Edit Report
                    </button>
                  )}
                  <button type="button" className="btn-download" onClick={() => downloadReport(r)} aria-label={`Download ${r.title}`}>
                    Download PDF
                  </button>
                  <button type="button" className="btn-delete" onClick={() => onDeleteReport(r.id)} aria-label={`Delete ${r.title}`}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Category Modal */}
      {isCategoryModalOpen && (
        <div
          className="reports-modal-overlay"
          onPointerDown={categoryModalBackdropClose.onBackdropPointerDown}
          onPointerUp={categoryModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={categoryModalBackdropClose.onBackdropPointerCancel}
        >
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
                onClick={closeReportModal}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            </div>

            <form onSubmit={handleReportSubmit}>
              <div className="form-group">
                <label htmlFor="fileName">File Name<span className="req-star" aria-hidden="true">*</span></label>
                <input
                  type="text"
                  id="fileName"
                  name="fileName"
                  value={reportForm.form.fileName}
                  onChange={(e) => reportForm.onChange('fileName', e.target.value)}
                  placeholder="Please mention how do you want to save the document name"
                  required
                />
                {reportForm.errors.fileName && (
                  <div className="error-message">{reportForm.errors.fileName}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="type">Type<span className="req-star" aria-hidden="true">*</span></label>
                <select
                  id="type"
                  name="type"
                  value={reportForm.form.type}
                  onChange={(e) => reportForm.onChange('type', e.target.value)}
                  required
                >
                  <option value="">Select a type</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                {reportForm.errors.type && (
                  <div className="error-message">{reportForm.errors.type}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="fileUrl">Link Upload<span className="req-star" aria-hidden="true">*</span></label>
                <input
                  type="url"
                  id="fileUrl"
                  name="fileUrl"
                  value={reportForm.form.fileUrl}
                  onChange={(e) => reportForm.onChange('fileUrl', e.target.value)}
                  placeholder="https://example.com/report.pdf"
                  required
                />
                {reportForm.errors.fileUrl && (
                  <div className="error-message">{reportForm.errors.fileUrl}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="file">File Upload</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    id="file"
                    name="file"
                    accept="image/*"
                    onChange={(e) => reportForm.onChange('fileBlob', e.target.files?.[0])}
                    className="hidden-file-input"
                  />
                  <label htmlFor="file" className="file-input-label">
                    Choose file
                  </label>
                  <p className="file-status">
                    {reportForm.form.fileBlob?.name || 'No file chosen'}
                  </p>
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
                <button type="button" onClick={handleConfirmDelete} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
