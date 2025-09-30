import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import { useNoticesState } from '../../hooks/useNoticesState'
import { useNoticeForm } from '../../hooks/useNoticeForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useTitleMarquee } from '../../hooks/useTitleMarquee'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import RichTextEditor from '../../components/editor/RichTextEditor'
import '../../styles/sections/Notices.scss'

export const Notices = () => {
  const { user, toggleRole, isInitialized } = useAuth()

  // Notices state management
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
    seedDemoNotices
  } = useNoticesState()

  // Form management
  const noticeForm = useNoticeForm()

  // Local state for modals
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')

  // Modal backdrop close behavior
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

  // Title marquee behavior
  const titleMarquee = useTitleMarquee()

  // Body scroll lock for modals
  useBodyScrollLock(isNoticeModalOpen || isCategoryModalOpen || confirmModalOpen)

  // Utility function to truncate text at word boundary
  const truncateText = (text, maxLength = 110) => {
    if (!text || text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '…' : truncated + '…'
  }

  const [useFallback, setUseFallback] = useState(false)

  // Check if CSS line-clamp is supported
  useEffect(() => {
    const testElement = document.createElement('div')
    testElement.style.display = '-webkit-box'
    testElement.style.webkitLineClamp = '2'
    testElement.style.webkitBoxOrient = 'vertical'
    testElement.style.overflow = 'hidden'

    // If the browser doesn't support line-clamp, the styles won't be applied
    const supportsLineClamp = testElement.style.webkitLineClamp === '2'
    setUseFallback(!supportsLineClamp)
  }, [])

  // Load form data when editing
  useEffect(() => {
    if (isNoticeModalOpen && editingNotice) {
      noticeForm.loadFrom(editingNotice)
    } else if (isNoticeModalOpen && !editingNotice) {
      noticeForm.reset()
    }
  }, [isNoticeModalOpen, editingNotice])

  // Safety check for initialization and user context
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

  // Rich Text Editor handler
  const handleEditorChange = ({ html, text }) => {
    noticeForm.setEditorHtml(html)
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
    if (noticeForm.validate(categories)) {
      const payload = noticeForm.toPayload(editingNotice?.id)
      handleUpsertNotice(payload)
    }
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

  const handleSeedNotices = () => {
    const firstCategoryId = seedDemoNotices()
    setActiveCategory(firstCategoryId)
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
                {user?.role === 'admin' ? 'Switch to User View' : 'Switch to Admin View'}
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

          {categories.length === 0 ? (
            <div className="empty-state">
              {can(user, 'notices:create') ? (
                // Admin empty state
                <>
                  <img src="/empty-state-admin.png" alt="" />
                  <h2>No categories yet!</h2>
                  <p>Create your first category to get started with notices.</p>
                </>
              ) : (
                // User empty state
                <>
                  <img src="/empty-state-user.png" alt="" className="empty-state-user" />
                  <h2>No categories available.</h2>
                  <p>No notice categories have been created yet.</p>
                </>
              )}
            </div>
          ) : visibleItems.length === 0 ? (
            <div className="empty-state">
              {can(user, 'notices:create') ? (
                // Admin empty state
                <>
                  <img src="/empty-state-admin.png" alt="" />
                  <h2>No notices in this category!</h2>
                  <p>This category is empty. Add your first notice to get started!</p>
                </>
              ) : (
                // User empty state
                <>
                  <img src="/empty-state-user.png" alt="" className="empty-state-user" />
                  <h2>No notices found.</h2>
                  <p>This category doesn't have any notices yet.</p>
                </>
              )}
            </div>
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
                        <p className="notice-description">
                          {useFallback ? truncateText(notice.description) : notice.description}
                        </p>
                      </div>
                      <div className="notice-actions">
                        {can(user, 'notices:delete') && (
                          <button
                            className="notice-card__delete-btn"
                            onClick={() => handleDeleteNotice(notice.id)}
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
                    {(notice.imagePreviewUrl || notice.imageUrl) && (
                      <div className="notice-image">
                        <img
                          src={notice.imagePreviewUrl || notice.imageUrl}
                          alt={notice.fileName || 'Notice image'}
                        />
                      </div>
                    )}
                    <span className="notice-date">Published: {formatDate(notice.createdAt)}</span>
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
            <div
              className="notices-modal"
              onPointerDown={modalBackdropClose.stopInsidePointer}
              onClick={modalBackdropClose.stopInsidePointer}
            >
              <div className="notices-modal-header">
                <h2>Upload Notices</h2>
                <p>Please review the information before saving.</p>
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
                    key={`rte-${editingNotice ? editingNotice.id : 'new'}`}
                    contentKey={editingNotice ? editingNotice.id : 'new'}
                    initialHtml={noticeForm.editorHtml}
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
                  <label htmlFor="file">Upload File</label>
                  <div
                    className="file-upload-area"
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

                {noticeForm.errorMessage && (
                  <div className="error-message">
                    {noticeForm.errorMessage}
                  </div>
                )}

                <div className="form-actions">
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
          <div
            className="notices-modal"
            onPointerDown={confirmModalBackdropClose.stopInsidePointer}
            onClick={confirmModalBackdropClose.stopInsidePointer}
          >
            <div className="notices-modal-header">
              <h2>Delete category?</h2>
              <button
                className="close-btn"
                onClick={() => setConfirmModalOpen(false)}
              >
                <i className="bi bi-x"></i>
              </button>
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
    </>
  )
}
