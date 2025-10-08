import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import { useNewslettersState } from '../../hooks/useNewslettersState'
import { useNewsletterForm } from '../../hooks/useNewsletterForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import RichTextEditor from '../../components/editor/RichTextEditor'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import EmptyPage from '../../components/EmptyPage'
import '../../styles/sections/Newsletters.scss'

// Utility to strip HTML
const stripHtml = (html = '') => {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || ''
}

const Newsletters = () => {
  const { user, toggleRole } = useAuth()
  const {
    newsletters,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter,
    seedFromMocks
  } = useNewslettersState()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState(null)
  const [useFallback, setUseFallback] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [newsletterToDelete, setNewsletterToDelete] = useState(null)

  const {
    form,
    onChange,
    editorHtml,
    setEditorHtml,
    setEditorText,
    errorMessage,
    setErrorMessage,
    fileInputRef,
    setFileFromInput,
    setFileFromDrop,
    validate,
    buildNewsletterObject,
    resetForm,
    initializeCreate,
    initializeEdit
  } = useNewsletterForm()

  const modalBackdropClose = useModalBackdropClose(() => {
    closeModal()
  })

  useBodyScrollLock(isModalOpen || isConfirmDeleteOpen)


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

  if (!user) {
    return (
      <div className="newsletters-page">
        <div className="newsletters-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  const openModal = (newsletter = null) => {
    setEditingNewsletter(newsletter)
    setIsModalOpen(true)
    setErrorMessage('')
    
    if (newsletter) {
      initializeEdit(newsletter)
    } else {
      initializeCreate()
    }
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingNewsletter(null)
    resetForm()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) {
      return
    }

    const newsletterObj = buildNewsletterObject(editingNewsletter?.id)

    if (editingNewsletter) {
      updateNewsletter(newsletterObj)
    } else {
      addNewsletter(newsletterObj)
    }

    closeModal()
  }

  const handleDelete = (newsletter) => {
    if (can(user, 'newsletters:delete')) {
      setNewsletterToDelete(newsletter)
      setIsConfirmDeleteOpen(true)
    }
  }

  const handleConfirmDelete = () => {
    if (newsletterToDelete) {
      deleteNewsletter(newsletterToDelete.id)
      setNewsletterToDelete(null)
    }
  }

  const handleEditorChange = (html) => {
    setEditorHtml(html)
    const text = stripHtml(html)
    setEditorText(text)
    onChange('description', text)
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) {
      setFileFromDrop(file)
    }
  }

  const handleFileDragOver = (e) => {
    e.preventDefault()
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    } catch {
      return dateString
    }
  }

  return (
    <div className="newsletters-page">
      <div className="newsletters-container">
        {/* Header */}
        <div className="newsletters-header">
          <div className="notices-header-title">
            <h1>Newsletters</h1>
            <p>Manage Newsletters</p>
          </div>

          <div className="newsletters-toolbar">
            {/* TODO TEMPORARY: button to switch between admin and user view. REMOVE before production. */}
            <button
              className="temp-role-toggle-btn"
              onClick={toggleRole}
            >
              {user?.role === 'admin' ? 'Switch to User View' : 'Switch to Admin View'}
            </button>

            {user?.role === 'admin' && (
              <button
                className="newsletters-seed-btn"
                onClick={seedFromMocks}
              >
                Seeds
              </button>
            )}

            {user?.role === 'admin' && (
              <button
                className="add-newsletter-btn"
                onClick={() => openModal()}
              >
                <i className="bi bi-plus"></i> Add New
              </button>
            )}
          </div>
        </div>

        {/* Newsletter List */}
        {newsletters.length === 0 ? (
          <EmptyPage
            isAdmin={user?.role === 'admin'}
            title={user?.role === 'admin' ? 'Oops nothing to see here yet!' : 'Oops! No data found.'}
            description={
              user?.role === 'admin'
                ? <>Looks like you haven't added anything. Go ahead and add<br /> your first item to get started!</>
                : <>Nothing's been added here yet, or there might be a hiccup.<br />Try again or check back later!</>
            }
          />
        ) : (
          <div className="newsletters-list">
            {newsletters.map((newsletter) => (
              <div key={newsletter.id} className="newsletter-card">
                <div className="newsletter-header">
                  <div className="newsletter-info">
                    <h3 className="newsletter-title">
                      {newsletter.fileName}
                    </h3>
                    <p
                      className={`newsletter-description ${useFallback ? 'fallback' : ''}`}
                    >
                      {newsletter.description}
                    </p>
                    <div className="newsletter-date">
                      Published: {formatDate(newsletter.createdAt)}
                    </div>
                  </div>

                  <div className="newsletter-actions">
                    {user?.role === 'admin' && (
                      <button
                        className="newsletter-card__delete-btn"
                        onClick={() => handleDelete(newsletter)}
                      >
                        <i className="bi bi-trash"></i>
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button
                        className="edit-btn"
                        onClick={() => openModal(newsletter)}
                      >
                        Edit Newsletter
                      </button>
                    )}
                    <button
                      className="download-btn"
                      onClick={() => {/* TODO: Implement download functionality */ }}
                    >
                      Download PDF
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add/Edit Modal */}
        {isModalOpen && (
          <div
            className="newsletters-modal-overlay"
            onPointerDown={modalBackdropClose.onBackdropPointerDown}
            onPointerUp={modalBackdropClose.onBackdropPointerUp}
            onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
          >
            <div
              className="newsletters-modal"
              onPointerDown={modalBackdropClose.stopInsidePointer}
              onClick={modalBackdropClose.stopInsidePointer}
            >
              <div className="newsletters-modal-header">
                <h2>Upload Newsletters</h2>
                <p>Please review the information before saving.</p>
                <button
                  className="close-btn"
                  onClick={closeModal}
                >
                  <i className="bi bi-x"></i>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                {errorMessage && (
                  <div className="error-message">
                    {errorMessage}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="fileName">File Name<span className="req-star" aria-hidden="true">*</span></label>
                  <input
                    type="text"
                    id="fileName"
                    name="fileName"
                    value={form.fileName}
                    onChange={(e) => onChange('fileName', e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description<span className="req-star" aria-hidden="true">*</span></label>
                  <RichTextEditor
                    docId={editingNewsletter ? editingNewsletter.id : 'new'}
                    initialHTML={editorHtml}
                    onChange={handleEditorChange}
                    placeholder="Write newsletter description..."
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="linkUrl">Link URL<span className="req-star" aria-hidden="true">*</span></label>
                  <input
                    type="url"
                    id="linkUrl"
                    name="linkUrl"
                    value={form.linkUrl}
                    onChange={(e) => onChange('linkUrl', e.target.value)}
                    placeholder="https://example.com/newsletter"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="file">Upload File<span className="req-star" aria-hidden="true">*</span></label>
                  <div
                    className="file-upload-area dropzone-surface"
                    data-has-file={Boolean(form.imagePreviewUrl)}
                    onDragOver={handleFileDragOver}
                    onDragLeave={(e) => e.preventDefault()}
                    onDrop={handleFileDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="file"
                      name="file"
                      accept="image/*"
                      onChange={setFileFromInput}
                      className="hidden-file-input"
                    />
                    <label htmlFor="file" className="file-input-label">
                      Choose file
                    </label>
                    <p className="file-status">
                      {form.imageFileName || 'No file chosen'}
                    </p>
                    {form.imagePreviewUrl && (
                      <div className="image-preview">
                        <img src={form.imagePreviewUrl} alt="Preview" />
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

      </div>

      {/* Confirm Delete Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false)
          setNewsletterToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        entityLabel="Newsletter"
        itemName={newsletterToDelete?.fileName}
      />
    </div>
  )
}

export { Newsletters }
