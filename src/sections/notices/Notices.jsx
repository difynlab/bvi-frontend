import React, { useState, useEffect, useRef, useMemo } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import { useNoticesState } from '../../hooks/useNoticesState'
import { useNoticeForm } from '../../hooks/useNoticeForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useTitleMarquee } from '../../hooks/useTitleMarquee'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import RichTextEditor from '../../components/editor/RichTextEditor'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import NoticesTabPicker from '../../components/modals/NoticesTabPicker'
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock'
import EmptyPage from '../../components/EmptyPage'
import { loadActiveTabId, saveActiveTabId } from '../../helpers/noticesStorage'
import '../../styles/sections/Notices.scss'

export const Notices = () => {
  const NOTICE_PLACEHOLDER = '/images/notices-mock.png'
  const MOBILE_Q = '(max-width: 768px)'
  const failedImageIdsRef = useRef(new Set())
  const [fallbackTick, setFallbackTick] = useState(0)

  // Mobile state management
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_Q).matches)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTabId, setActiveTabId] = useState(() => loadActiveTabId() || null)
  const getNoticeImage = (n) => {
    if (!n) return NOTICE_PLACEHOLDER
    if (failedImageIdsRef.current.has(n.id)) return NOTICE_PLACEHOLDER
    return (n.imagePreviewUrl || n.imageUrl || NOTICE_PLACEHOLDER)
  }
  const onImgError = (n) => {
    if (!n?.id) return
    if (!failedImageIdsRef.current.has(n.id)) {
      failedImageIdsRef.current.add(n.id)
      setFallbackTick(t => t + 1)
    }
  }
  const { user, toggleRole, isInitialized } = useAuth()

  const {
    categories,
    activeCategory,
    visibleItems,
    isCategoryModalOpen,
    isNoticeModalOpen,
    editingNotice,
    confirmModalOpen,
    categoryToDelete,
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
    seedFromMocks
  } = useNoticesState()

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
      saveActiveTabId(null)
      return
    }
    if (!activeTabId || !categories.some(c => c.id === activeTabId)) {
      const next = categories[0].id
      setActiveTabId(next)
      saveActiveTabId(next)
    }
  }, [categories, activeTabId])

  // Sync mobile activeTabId with desktop activeCategory when in mobile mode
  useEffect(() => {
    if (isMobile && activeCategory && activeCategory !== activeTabId) {
      setActiveTabId(activeCategory)
      saveActiveTabId(activeCategory)
    }
  }, [isMobile, activeCategory, activeTabId])

  // Mobile handlers
  const onSelectCategory = (id) => {
    setActiveTabId(id)
    saveActiveTabId(id)
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
      saveActiveTabId(next)
    }
  }

  // Get active category for mobile display
  const activeCategoryData = useMemo(
    () => categories.find(c => c.id === activeTabId) || null,
    [categories, activeTabId]
  )

  const noticeForm = useNoticeForm()

  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [isNoticeDeleteConfirmOpen, setIsNoticeDeleteConfirmOpen] = useState(false)
  const [noticeToDelete, setNoticeToDelete] = useState(null)

  const modalBackdropClose = useModalBackdropClose(() => {
    if (editingNotice) {
      noticeForm.rollbackEdit()
    } else {
      noticeForm.reset()
    }
    closeNoticeModal()
  })
  const confirmModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false))
  const addCategoryModalBackdropClose = useModalBackdropClose(() => setIsCategoryModalOpen(false))

  const titleMarquee = useTitleMarquee()

  useBodyScrollLock(isNoticeModalOpen || isCategoryModalOpen || confirmModalOpen || isNoticeDeleteConfirmOpen || pickerOpen)

  const truncateText = (text, maxLength = 110) => {
    if (!text || text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '…' : truncated + '…'
  }

  const [useFallback, setUseFallback] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [missingRequired, setMissingRequired] = useState([])
  const bannerRef = useRef(null)

  // Required fields validation
  const REQUIRED = [
    { key: 'fileName', label: 'File Name', test: () => (noticeForm?.form?.fileName || '').trim().length > 0 },
    { key: 'noticeType', label: 'Notice Type', test: () => !!noticeForm?.form?.noticeType },
    {
      key: 'description', label: 'Description', test: () => {
        const html = noticeForm?.editorHtml || noticeForm?.form?.description || '';
        const text = String(html).replace(/<[^>]+>/g, '').trim();
        return text.length > 0;
      }
    },
    { key: 'linkUrl', label: 'Upload Link', test: () => (noticeForm?.form?.linkUrl || '').trim().length > 0 },
    { key: 'file', label: 'File Upload', test: () => !!(noticeForm?.form?.imagePreviewUrl || noticeForm?.form?.imageFileName) }
  ];

  // Validation function
  function validateRequired() {
    const missing = REQUIRED.filter(r => !r.test()).map(r => r.label);
    setMissingRequired(missing);
    return missing.length === 0;
  }

  useEffect(() => {
    const testElement = document.createElement('div')
    testElement.className = 'lineclamp-test'
    document.body.appendChild(testElement)
    const computed = window.getComputedStyle(testElement)
    const lineClamp = computed.getPropertyValue('-webkit-line-clamp') || computed.webkitLineClamp
    const supportsLineClamp = lineClamp === '2'
    document.body.removeChild(testElement)
    setUseFallback(!supportsLineClamp)
  }, [])

  useEffect(() => {
    if (isNoticeModalOpen && editingNotice) {
      // Small delay to ensure modal is fully open before loading data
      setTimeout(() => {
        noticeForm.loadFrom(editingNotice)
        setEditorKey(prev => prev + 1) // Force editor re-initialization
      }, 10)
    } else if (isNoticeModalOpen && !editingNotice) {
      // Small delay to ensure modal is fully open before initializing
      setTimeout(() => {
        noticeForm.initializeCreate()
        setEditorKey(prev => prev + 1) // Force editor re-initialization
      }, 10)
    }
  }, [isNoticeModalOpen, editingNotice])

  // Reactive validation
  useEffect(() => {
    if (missingRequired.length) validateRequired();
  }, [
    noticeForm?.form?.fileName,
    noticeForm?.form?.noticeType,
    noticeForm?.editorHtml,
    noticeForm?.form?.description,
    noticeForm?.form?.linkUrl,
    noticeForm?.form?.imagePreviewUrl,
    noticeForm?.form?.imageFileName
  ]);

  if (!isInitialized) {
    return (
      <div className="notices-page">
        <div className="notices-container">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    )
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    noticeForm.onChange(name, value)
  }

  const handleEditorChange = (data) => {
    const html = typeof data === 'string' ? data : (data?.html || '');
    noticeForm.setEditorHtml(html)
    const text = noticeForm.stripHtml(html)
    noticeForm.setEditorText(text)
    noticeForm.onChange('description', text)
  }

  const handleFileInputChange = (e) => {
    noticeForm.setFileFromInput(e)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      noticeForm.setFileFromDrop(file)
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validateRequired()) {
      bannerRef.current?.focus();
      return;
    }

    const payload = noticeForm.toPayload(editingNotice?.id)

    // Preserve creation timestamps when editing
    if (editingNotice) {
      // Preserve existing creation timestamps if they exist
      if (editingNotice.createdAtISO) {
        payload.createdAtISO = editingNotice.createdAtISO
      }
      if (editingNotice.createdAtMs) {
        payload.createdAtMs = editingNotice.createdAtMs
      }
    }

    handleUpsertNotice(payload)
  }

  const handleAddCategorySubmit = () => {
    const trimmedName = newCategoryName.trim()
    if (!trimmedName) {
      setCategoryError('Category name is required')
      return
    }
    handleAddCategory(trimmedName)
    setNewCategoryName('')
    setCategoryError('')
  }

  const closeCategoryModal = () => {
    setNewCategoryName('')
    setCategoryError('')
    setIsCategoryModalOpen(false)
  }

  const handleDeleteNoticeLocal = (noticeId) => {
    const notice = visibleItems.find(n => n.id === noticeId)
    if (notice && can(user, 'notices:delete')) {
      setNoticeToDelete(notice)
      setIsNoticeDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDeleteNotice = () => {
    if (noticeToDelete) {
      handleDeleteNotice(noticeToDelete.id)
      setNoticeToDelete(null)
    }
  }

  const handleSeedNotices = () => {
    seedFromMocks()
  }

  const getNoticeDescriptionText = (n) => {
    const raw =
      (typeof n?.description === 'string' && n.description) ||
      (typeof n?.descriptionHTML === 'string' && n.descriptionHTML) ||
      (typeof n?.summary === 'string' && n.summary) ||
      '';
    // strip HTML tags
    return raw.replace(/<[^>]+>/g, '').trim();
  }

  return (
    <>
      <div className="notices-page">
        <div className="notices-container">
          <div className="notices-header">
            <div className="notices-header-title">
              <h1>Notices</h1>
              <p>Manage Notices</p>
            </div>
            <div className="notices-header-actions">
              {/* TODO TEMPORARY: button to switch between admin and user view. REMOVE before production. */}
              <button
                className="temp-role-toggle-btn"
                onClick={toggleRole}
              >
                {user?.role === 'admin' ? 'Switch to Member View' : 'Switch to Admin View'}
              </button>

              <button
                className="notices-seed-btn"
                onClick={handleSeedNotices}
              >
                Seed Notices
              </button>

              {can(user, 'notices:create') && (
                <button
                  className="add-notice-btn"
                  onClick={openCreateNotice}
                >
                  <i className="bi bi-plus"></i> Add New
                </button>
              )}
            </div>
          </div>

          {/* Header area */}
          {isMobile ? (
            <div className="notices-mobile-header" role="region" aria-label="Notice categories">
              <div className="category-title">
                <button
                  type="button"
                  className="category-picker-btn"
                  onClick={() => setPickerOpen(true)}
                  aria-haspopup="dialog"
                  aria-controls="noticesTabPicker">
                  <h2>
                    {activeCategoryData?.name || 'Notices'}
                  </h2>
                  <i className="bi bi-chevron-down" aria-hidden="true"></i>
                </button>

                {/* Notices Tab Picker Dropdown */}
                <NoticesTabPicker
                  open={pickerOpen}
                  onClose={() => setPickerOpen(false)}
                  categories={categories}
                  activeTabId={activeTabId}
                  onSelect={onSelectCategory}
                  canManage={can(user, 'notices:create')}
                  onAddCategory={onAddCategory}
                  onDeleteCategory={onDeleteCategory}
                />
              </div>
              {can(user, 'notices:create') && (
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
            <div className="notices-tabs-desktop" role="tablist" aria-orientation="horizontal">
              <div className="category-tabs">
                <div className="tabs-container">
                  {categories.map(category => (
                    <div key={category.id} className="tab-group">
                      <button
                        className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                        onClick={() => setActiveCategory(category.id)}
                      >
                        <span>{category.name}</span>
                      </button>
                      {can(user, 'notices:delete') && (
                        <button
                          className="category-tab__delete"
                          onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                          aria-label="Delete category"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                    </div>
                  ))}

                  {can(user, 'notices:create') && (
                    <button
                      className="add-category-btn"
                      onClick={() => setIsCategoryModalOpen(true)}
                    >
                      <i className="bi bi-plus"></i>
                    </button>
                  )}
                </div>
                {categoryError && (
                  <div className="category-error">{categoryError}</div>
                )}
              </div>
            </div>
          )}

          {/* Dropdown Overlay */}
          {pickerOpen && (
            <div
              className="notices-dropdown-overlay"
              onClick={() => setPickerOpen(false)}
            />
          )}

          {categories.length === 0 ? (
            <EmptyPage
              isAdmin={can(user, 'notices:create')}
              title={can(user, 'notices:create') ? 'No categories yet!' : 'No categories available.'}
              description={can(user, 'notices:create') ? 'Create your first category to get started with notices.' : 'No notice categories have been created yet.'}
            />
          ) : visibleItems.length === 0 ? (
            <EmptyPage
              isAdmin={can(user, 'notices:create')}
              title={can(user, 'notices:create') ? 'No notices in this category!' : 'No notices found.'}
              description={can(user, 'notices:create') ? 'This category is empty. Add your first notice to get started!' : "This category doesn't have any notices yet."}
            />
          ) : (
            <div className="notices-list">
              {visibleItems.map(notice => (
                <div key={notice.id} className="notice-card">
                  <div className="notice-content">
                    <div className="notice-header">
                      <div className="notice-info">
                        <h3
                          className="notice-title one-line-ellipsis"
                          ref={titleMarquee.titleContainerRef}
                          onMouseEnter={titleMarquee.onMouseEnter}
                          onMouseLeave={titleMarquee.onMouseLeave}
                        >
                          <span className="notice-title__inner" title={notice.fileName}>{notice.fileName}</span>
                        </h3>
                        <p className="notice-description">{getNoticeDescriptionText(notice)}</p>
                      </div>
                      <div className="notice-actions">
                        {can(user, 'notices:delete') && (
                          <button
                            className="notice-card__delete-btn"
                            onClick={() => handleDeleteNoticeLocal(notice.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                        {can(user, 'notices:update') && (
                          <button
                            className="edit-btn"
                            onClick={() => openEditNotice(notice)}
                          >
                            Edit Notice
                          </button>
                        )}
                        <button
                          className="download-btn"
                          onClick={() => {/* TODO: Implement download functionality */ }}
                        >
                          Download Notice
                        </button>
                      </div>
                    </div>
                    <img
                      className="notice-card-image"
                      src={getNoticeImage(notice)}
                      alt={notice.title || 'Notice image'}
                      loading="lazy"
                      onError={() => onImgError(notice)}
                    />
                    <span className="notice-date">Published: {formatDate(notice.createdAt || notice.publishDate)}</span>

                    {/* Mobile actions - shown only on mobile */}
                    <div className="notice-actions-mobile">
                      <div className="notice-actions-mobile-adm">
                        {can(user, 'notices:delete') && (
                          <button
                            className="notice-card__delete-btn"
                            onClick={() => handleDeleteNoticeLocal(notice.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                        {can(user, 'notices:update') && (
                          <button
                            className="edit-btn"
                            onClick={() => openEditNotice(notice)}
                          >
                            Edit
                          </button>
                          
                        )}
                      </div>
                      <button
                        className="download-btn"
                        onClick={() => window.open(notice.linkUrl, '_blank')}
                      >
                        Download Notice
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add/Edit Notice Modal */}
        {isNoticeModalOpen && (
          <div
            className="notices-modal-overlay"
            onPointerDown={modalBackdropClose.onBackdropPointerDown}
            onPointerUp={modalBackdropClose.onBackdropPointerUp}
            onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
          >
            <ModalLifecycleLock />
            <div
              className="notices-modal"
              onPointerDown={modalBackdropClose.stopInsidePointer}
              onClick={modalBackdropClose.stopInsidePointer}
            >
              <button
                className="close-btn"
                onClick={() => {
                  if (editingNotice) {
                    noticeForm.rollbackEdit()
                  } else {
                    noticeForm.reset()
                  }
                  closeNoticeModal()
                }}
              >
                <i className="bi bi-x"></i>
              </button>
              <div className="notices-modal-header">
                <h2>Upload Notices</h2>
                <p>Please review the information before saving.</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="fileName">File Name<span className="req-star" aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="fileName"
                    name="fileName"
                    value={noticeForm.form.fileName}
                    onChange={handleInputChange}
                    placeholder="Please mention how do you want to save the document name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="noticeType">Notice Type<span className="req-star" aria-hidden="true">*</span></label>
                  <select
                    id="noticeType"
                    name="noticeType"
                    value={noticeForm.form.noticeType}
                    onChange={handleInputChange}
                  >
                    <option value="">Select category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>{category.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description<span className="req-star" aria-hidden="true">*</span></label>
                  <RichTextEditor
                    key={`${editingNotice ? `edit-${editingNotice.id}` : 'new'}-${editorKey}`}
                    docId={editingNotice ? editingNotice.id : 'new'}
                    initialHTML={noticeForm.editorHtml}
                    onChange={handleEditorChange}
                    placeholder="Write a description..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="linkUrl">Upload Link<span className="req-star" aria-hidden="true">*</span></label>
                  <input
                    type="url"
                    id="linkUrl"
                    name="linkUrl"
                    value={noticeForm.form.linkUrl}
                    onChange={handleInputChange}
                    placeholder="https://example.com"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="file">Upload File<span className="req-star" aria-hidden="true">*</span></label>
                  <div
                    className="file-upload-area dropzone-surface"
                    data-has-file={Boolean(noticeForm.form.imagePreviewUrl)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file"
                      name="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden-file-input"
                    />
                    <label htmlFor="file" className="file-input-label">
                      Choose file
                    </label>
                    <p className="file-status">
                      {noticeForm.form.imageFileName || 'No file chosen'}
                    </p>
                    {noticeForm.form.imagePreviewUrl && (
                      <div className="image-preview">
                        <img src={noticeForm.form.imagePreviewUrl} alt="Preview" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  {missingRequired.length > 0 && (
                    <div
                      className="app-form__error-banner"
                      role="alert"
                      aria-live="assertive"
                      tabIndex={-1}
                      ref={bannerRef}
                    >
                      <strong>Please fill all required fields:</strong> {missingRequired.join(', ')}
                    </div>
                  )}
                  <button type="submit" className="upload-now-btn">
                    Upload Now
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div
          className="notices-modal-overlay"
          onPointerDown={addCategoryModalBackdropClose.onBackdropPointerDown}
          onPointerUp={addCategoryModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={addCategoryModalBackdropClose.onBackdropPointerCancel}
        >
          <ModalLifecycleLock />
          <div
            className="notices-modal notices-addcat-modal"
            onPointerDown={addCategoryModalBackdropClose.stopInsidePointer}
            onClick={addCategoryModalBackdropClose.stopInsidePointer}
          >
            <div className="notices-modal-header">
              <button
                className="close-btn"
                onClick={closeCategoryModal}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="notices-addcat-modal__content">
              <h2 className="notices-addcat-modal__title">Add New Tab</h2>
              <p className="notices-addcat-modal__subtitle">Please add new tab details</p>

              <div className="form-group">
                <label htmlFor="categoryName" className="notices-addcat-modal__label">Enter the Tab Name</label>
                <input
                  type="text"
                  id="categoryName"
                  placeholder="Please mention the name of the new tab which you want to create"
                  className="notices-addcat-modal__input"
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

              <div className="notices-addcat-modal__actions">
                <button
                  type="button"
                  className="notices-addcat-modal__update-btn"
                  onClick={handleAddCategorySubmit}
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmModalOpen && (
        <div
          className="notices-modal-overlay"
          onPointerDown={confirmModalBackdropClose.onBackdropPointerDown}
          onPointerUp={confirmModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={confirmModalBackdropClose.onBackdropPointerCancel}
        >
          <ModalLifecycleLock />
          <div
            className="notices-deleteCategory-modal"
            onPointerDown={confirmModalBackdropClose.stopInsidePointer}
            onClick={confirmModalBackdropClose.stopInsidePointer}
          >
            <button
              className="close-btn"
              onClick={() => setConfirmModalOpen(false)}
            >
              <i className="bi bi-x"></i>
            </button>
            <div className="notices-deleteModal-header">
              <i className="bi bi-trah"></i>
              <h2>Delete category?</h2>
            </div>

            <div className="confirm-modal-content">
              <p>This will permanently delete the category and all its notices.</p>

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

      {/* Confirm Delete Notice Modal */}
      <ConfirmDeleteModal
        isOpen={isNoticeDeleteConfirmOpen}
        onClose={() => {
          setIsNoticeDeleteConfirmOpen(false)
          setNoticeToDelete(null)
        }}
        onConfirm={handleConfirmDeleteNotice}
      />

    </>
  )
}
