import React, { useState, useRef, useEffect, useMemo } from 'react'
import { useAuth } from '../../context/AuthContext'
import { can } from '../../auth/acl'
import { useNoticesState } from '../../hooks/useNoticesState'
import { useNoticeForm } from '../../hooks/useNoticeForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useTitleMarquee } from '../../hooks/useTitleMarquee'
import { stripHtmlToPlainText } from '../../helpers/noticesValidation'
import '../../styles/sections/Notices.scss'

export const Notices = () => {
  const { user, toggleRole, isInitialized } = useAuth()
  
  // Notices state management
  const { 
    categories, 
    notices, 
    addCategory, 
    deleteCategory, 
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
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [categoryError, setCategoryError] = useState('')
  const [confirmModalOpen, setConfirmModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState(null)
  
  // Form management
  const initialFormData = useMemo(() => {
    if (modalMode === 'edit' && editingNoticeId) {
      const allNotices = notices.flatMap(group => group.items)
      return allNotices.find(notice => notice.id === editingNoticeId) || {}
    }
    return {}
  }, [modalMode, editingNoticeId, notices])
  
  const noticeForm = useNoticeForm({ 
    initial: initialFormData,
    mode: modalMode 
  })
  
  // Modal backdrop close behavior
  const modalBackdropClose = useModalBackdropClose(() => setIsModalOpen(false))
  const confirmModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false))
  
  // Title marquee behavior
  const titleMarquee = useTitleMarquee()
  
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

  // WYSIWYG Editor Functions
  const execCommand = (command, value = null) => {
    try {
      document.execCommand(command, false, value)
      noticeForm.editorRef.current?.focus()
    } catch (error) {
      console.error('Error in execCommand:', error)
    }
  }

  const handleEditorChange = () => {
    try {
      if (noticeForm.editorRef.current) {
        const plainText = noticeForm.editorRef.current.textContent || noticeForm.editorRef.current.innerText || ''
        noticeForm.onChange('description', plainText)
      }
    } catch (error) {
      console.error('Error in handleEditorChange:', error)
    }
  }

  const clearFormatting = () => {
    execCommand('removeFormat')
    execCommand('formatBlock', 'p')
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      execCommand('createLink', url)
    }
  }

  const removeLink = () => {
    execCommand('unlink')
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

  const resetForm = () => {
    noticeForm.resetForm()
  }

  const openCreateModal = () => {
    try {
      setModalMode('create')
      setEditingNoticeId(null)
      setIsModalOpen(true)
    } catch (error) {
      console.error('Error in openCreateModal:', error)
      alert('An error occurred while opening create modal')
    }
  }

  const openEditModal = (noticeId) => {
    try {
      setModalMode('edit')
      setEditingNoticeId(noticeId)
      setIsModalOpen(true)
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
      resetForm()
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
    if (!newCategoryName.trim()) return
    
    try {
      addCategory(newCategoryName.trim())
      setNewCategoryName('')
      setShowAddCategory(false)
      setCategoryError('')
    } catch (error) {
      console.error('Error adding category:', error)
      alert('An error occurred while adding the category')
    }
  }

  const handleDeleteCategory = (categoryId) => {
    if (categoryId === 'general') return // Don't allow deleting default category
    
    try {
      deleteCategory(categoryId)
      if (activeCategory === categoryId) {
        setActiveCategory('general')
      }
    } catch (error) {
      setCategoryError('Cannot delete category with existing notices')
      setTimeout(() => setCategoryError(''), 3000)
    }
  }

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
      <style>
        {`
          .notice-description {
            display: -webkit-box;
            -webkit-line-clamp: 2;
            line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
            word-break: break-word;
          }
          
          .one-line-ellipsis {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            display: block;
            position: relative;
          }
          
          .notice-title[data-marquee="1"]:hover .notice-title__inner {
            animation: notice-title-slide var(--marquee-duration, 10s) linear infinite alternate;
            will-change: transform;
          }
          
          @keyframes notice-title-slide {
            0% { transform: translateX(0); }
            100% { transform: translateX(calc(-1 * var(--overflow-px, 0px))); }
          }
          
          @media (prefers-reduced-motion: reduce) {
            .notice-title[data-marquee="1"]:hover .notice-title__inner {
              animation: none;
            }
          }
          
        `}
      </style>
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
                <div className="add-category-control">
                  {showAddCategory ? (
                    <div className="add-category-input">
                      <input
                        type="text"
                        placeholder="Category name"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                        autoFocus
                      />
                      <button onClick={handleAddCategory}>Add</button>
                      <button onClick={() => {
                        setShowAddCategory(false)
                        setNewCategoryName('')
                      }}>Cancel</button>
                    </div>
                  ) : (
                    <button
                      className="add-category-btn"
                      onClick={() => setShowAddCategory(true)}
                    >
                      + Category
                    </button>
                  )}
                </div>
              )}
            </div>
            {categoryError && (
              <div className="category-error">{categoryError}</div>
            )}
          </div>

          {currentNotices.length === 0 ? (
            <div className="empty-state">
              <img src="/public/empty-state-admin.png" alt="" />
              <h2>No notices in this category</h2>
              <p>This category doesn't have any notices yet.</p>
            </div>
          ) : (
            <div className="notices-list">
              {currentNotices.map(notice => (
                <div key={notice.id} className="notice-card">
                  <div className="notice-content">
                    <div className="notice-header">
                      <div 
                        className="notice-title one-line-ellipsis"
                        ref={titleMarquee.titleContainerRef}
                        onMouseEnter={titleMarquee.onMouseEnter}
                        onMouseLeave={titleMarquee.onMouseLeave}
                      >
                        <span className="notice-title__inner" title={notice.fileName}>{notice.fileName}</span>
                      </div>
                      <span className="notice-date">{formatDate(notice.createdAt)}</span>
                    </div>
                    <p className="notice-description">
                      {useFallback ? truncateText(notice.description) : notice.description}
                    </p>
                    <div className="notice-actions">
                      {can(user, 'notices:update') && (
                        <button
                          className="edit-btn"
                          onClick={() => handleEdit(notice.id)}
                        >
                          Edit Notice
                        </button>
                      )}
                      {can(user, 'notices:delete') && (
                        <button
                          className="notice-card__delete-btn"
                          onClick={() => handleDelete(notice.id)}
                        >
                          Delete Notice
                        </button>
                      )}
                      <button
                        className="download-btn"
                        onClick={() => {/* TODO: Implement download functionality */}}
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
                <h2>{modalMode === 'create' ? 'Add New Notice' : 'Edit Notice'}</h2>
                <button
                  className="close-btn"
                  onClick={closeModal}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label htmlFor="fileName">File Name</label>
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
                  <label htmlFor="noticeType">Notice Type</label>
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
                  <label htmlFor="description">Description</label>
                  <div className="wysiwyg-toolbar">
                    {/* Format Dropdown */}
                    <select
                      onChange={(e) => execCommand('formatBlock', e.target.value)}
                      defaultValue="p"
                    >
                      <option value="p">Paragraph</option>
                      <option value="h1">Heading 1</option>
                      <option value="h2">Heading 2</option>
                      <option value="h3">Heading 3</option>
                    </select>

                    {/* Text Formatting */}
                    <button type="button" onClick={() => execCommand('bold')} title="Bold">
                      <strong>B</strong>
                    </button>
                    <button type="button" onClick={() => execCommand('italic')} title="Italic">
                      <em>I</em>
                    </button>
                    <button type="button" onClick={() => execCommand('underline')} title="Underline">
                      <u>U</u>
                    </button>
                    <button type="button" onClick={() => execCommand('strikeThrough')} title="Strikethrough">
                      <s>S</s>
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Lists */}
                    <button type="button" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
                      • List
                    </button>
                    <button type="button" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
                      1. List
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Alignment */}
                    <button type="button" onClick={() => execCommand('justifyLeft')} title="Align Left">
                      ←
                    </button>
                    <button type="button" onClick={() => execCommand('justifyCenter')} title="Align Center">
                      ↔
                    </button>
                    <button type="button" onClick={() => execCommand('justifyRight')} title="Align Right">
                      →
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Special Formatting */}
                    <button type="button" onClick={() => execCommand('formatBlock', 'blockquote')} title="Quote">
                      " Quote
                    </button>
                    <button type="button" onClick={() => execCommand('insertText', '`code`')} title="Inline Code">
                      `code`
                    </button>
                    <button type="button" onClick={() => execCommand('formatBlock', 'pre')} title="Code Block">
                      { } Code
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Links */}
                    <button type="button" onClick={insertLink} title="Insert Link">
                      🔗 Link
                    </button>
                    <button type="button" onClick={removeLink} title="Remove Link">
                      🔗× Unlink
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* History */}
                    <button type="button" onClick={() => execCommand('undo')} title="Undo">
                      ↶ Undo
                    </button>
                    <button type="button" onClick={() => execCommand('redo')} title="Redo">
                      ↷ Redo
                    </button>

                    <div className="toolbar-separator"></div>

                    {/* Clear */}
                    <button type="button" onClick={clearFormatting} title="Clear Formatting">
                      ✕ Clear
                    </button>
                  </div>
                  <div
                    ref={noticeForm.editorRef}
                    className="wysiwyg-content wysiwyg-content-fix"
                    contentEditable
                    onInput={handleEditorChange}
                    suppressContentEditableWarning={true}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="linkUrl">Upload Link</label>
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
                  <div style={{ color: '#ff0a0a', fontSize: '12px', marginBottom: '10px' }}>
                    {noticeForm.errorMessage}
                  </div>
                )}

                <div className="form-actions">
                  <button type="button" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit">
                    {modalMode === 'create' ? 'Upload Notice' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

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

            <div style={{ padding: '20px' }}>
              <p>This will permanently delete the category and all its notices. Are you sure?</p>
              
              <div className="form-actions">
                <button type="button" onClick={closeConfirmModal}>
                  Cancel
                </button>
                <button type="button" onClick={handleConfirmDelete} style={{ backgroundColor: '#dc3545', color: 'white' }}>
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
