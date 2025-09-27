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
    notices,
    addCategory,
    deleteCategoryAndNotices,
    addNotice,
    updateNotice,
    deleteNotice,
    getGroup,
    seedDemoNotices
  } = useNoticesState()

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('create')
  const [editingNoticeId, setEditingNoticeId] = useState(null)
  const [activeCategory, setActiveCategory] = useState('general')
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  const [addCategoryModalOpen, setAddCategoryModalOpen] = useState(false)

  // Form management
  const noticeForm = useNoticeForm()

  // Cancel handler for modal close
  const handleCancel = () => {
    try {
      if (modalMode === 'edit') {
        noticeForm.rollbackEdit()
      } else {
        noticeForm.resetForm()
      }
      setIsModalOpen(false)
      setModalMode('create')
      setEditingNoticeId(null)
    } catch (error) {
      console.error('Error in handleCancel:', error)
    }
  }

  // Modal backdrop close behavior
  const modalBackdropClose = useModalBackdropClose(handleCancel)
  const confirmModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false))
  const addCategoryModalBackdropClose = useModalBackdropClose(() => setAddCategoryModalOpen(false))

  // Title marquee behavior
  const titleMarquee = useTitleMarquee()

  // Body scroll lock for modals
  useBodyScrollLock(isModalOpen || addCategoryModalOpen || confirmModalOpen)

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

  const validateForm = () => {
    return noticeForm.validate(categories)
  }

  const handleSubmit = (e) => {
    try {
      e.preventDefault()
      if (!validateForm()) return

      if (modalMode === 'create') {
        const newNotice = noticeForm.buildNoticeObject()
        addNotice(newNotice)
      } else if (modalMode === 'edit' && editingNoticeId) {
        const updatedNotice = noticeForm.buildNoticeObject(editingNoticeId)
        updateNotice(updatedNotice)
      }

      closeModal()
    } catch (error) {
      console.error('Error in handleSubmit:', error)
      alert('An error occurred while saving the notice')
    }
  }

  const openCreateModal = () => {
    try {
      setModalMode('create')
      setEditingNoticeId(null)
      noticeForm.initializeCreate()
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error in openCreateModal:', error)
      alert('An error occurred while opening create modal')
    }
  }

  const openEditModal = (noticeId) => {
    try {
      const allNotices = notices.flatMap(group => group.items)
      const notice = allNotices.find(n => n.id === noticeId)
      if (notice) {
        setModalMode('edit')
        setEditingNoticeId(noticeId)
        noticeForm.beginEdit(notice)
        setIsModalOpen(true)
      }
    } catch (error) {
      console.error('Error in openEditModal:', error)
      alert('An error occurred while opening edit modal')
    }
  }

  const closeModal = () => {
    try {
      setIsModalOpen(false)
      setModalMode('create')
      setEditingNoticeId(null)
      noticeForm.resetForm()
    } catch (error) {
      console.error('Error in closeModal:', error)
    }
  }

  const handleEdit = (noticeId) => {
    try {
      openEditModal(noticeId)
    } catch (error) {
      console.error('Error in handleEdit:', error)
      alert('An error occurred while opening edit modal')
    }
  }

  const handleDelete = (noticeId) => {
    try {
      deleteNotice(noticeId)
    } catch (error) {
      console.error('Error in handleDelete:', error)
      alert('An error occurred while deleting the notice')
    }
  }

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) {
      setCategoryError('Category name is required')
      return
    }

    try {
      addCategory(newCategoryName.trim())
      setNewCategoryName('')
      setAddCategoryModalOpen(false)
      setCategoryError('')
      // Set the new category as active
      const slug = newCategoryName.trim().toLowerCase().replace(/\s+/g, '-')
      setActiveCategory(slug)
    } catch (error) {
      console.error('Error adding category:', error)
      setCategoryError('An error occurred while adding the category')
    }
  }

  const openAddCategoryModal = () => {
    setAddCategoryModalOpen(true)
    setNewCategoryName('')
    setCategoryError('')
  }

  const closeAddCategoryModal = () => {
    setAddCategoryModalOpen(false)
    setNewCategoryName('')
    setCategoryError('')
  }

  // TODO: Implement category deletion functionality
  // const handleDeleteCategory = (categoryId) => {
  //   if (categoryId === 'general') return // Don't allow deleting default category

  //   try {
  //     deleteCategory(categoryId)
  //     if (activeCategory === categoryId) {
  //       setActiveCategory('general')
  //     }
  //   } catch (error) {
  //     setCategoryError('Cannot delete category with existing notices')
  //     setTimeout(() => setCategoryError(''), 3000)
  //   }
  // }

  const openConfirmModal = (categoryId) => {
    setCategoryToDelete(categoryId)
    setConfirmModalOpen(true)
  }

  const closeConfirmModal = () => {
    setConfirmModalOpen(false)
    setCategoryToDelete(null)
  }

  const handleConfirmDelete = () => {
    if (categoryToDelete) {
      deleteCategoryAndNotices(categoryToDelete)

      // Switch to first remaining category if current was deleted
      if (activeCategory === categoryToDelete) {
        const remainingCategories = categories.filter(cat => cat.id !== categoryToDelete)
        if (remainingCategories.length > 0) {
          setActiveCategory(remainingCategories[0].id)
        } else {
          setActiveCategory('general')
        }
      }

      closeConfirmModal()
    }
  }

  const handleSeedNotices = () => {
    try {
      const firstCategoryId = seedDemoNotices()
      // Immediately activate the first category to show the seeded notices
      setActiveCategory(firstCategoryId)
    } catch (error) {
      console.error('Error seeding notices:', error)
      alert('An error occurred while seeding notices')
    }
  }

  const currentNotices = getGroup(activeCategory)?.items || []

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
                  onClick={openCreateModal}
                >
                  <i className="bi bi-plus"></i> Add New
                </button>
              )}
            </div>
          </div>

          {/* Category Tabs */}
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
                  {can(user, 'notices:delete') && category.id !== 'general' && (
                    <button
                      className="category-tab__delete"
                      onClick={(e) => { e.stopPropagation(); openConfirmModal(category.id); }}
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
                  onClick={openAddCategoryModal}
                >
                  <i className="bi bi-plus"></i>
                </button>
              )}
            </div>
            {categoryError && (
              <div className="category-error">{categoryError}</div>
            )}
          </div>

          {currentNotices.length === 0 ? (
            <div className="empty-state">
              {can(user, 'events:create') ? (
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
            <div className="notices-list">
              {currentNotices.map(notice => (
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
                            onClick={() => handleDelete(notice.id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        )}
                        {can(user, 'notices:update') && (
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(notice.id)}
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
        {isModalOpen && (
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
                  onClick={handleCancel}
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
                    key={`rte-${modalMode === 'edit' ? editingNoticeId : 'new'}`}
                    contentKey={modalMode === 'edit' ? editingNoticeId : 'new'}
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
      {addCategoryModalOpen && (
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
                onClick={closeAddCategoryModal}
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
                      handleAddCategory();
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
                  onClick={handleAddCategory}
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
                onClick={closeConfirmModal}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="confirm-modal-content">
              <p>This will permanently delete the category and all its notices.</p>

              <div className="form-actions">
                <button type="button" onClick={closeConfirmModal} className="cancel-button">
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
