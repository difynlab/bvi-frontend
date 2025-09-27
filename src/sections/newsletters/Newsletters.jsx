import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/useAuth'
import { useNewslettersState } from '../../hooks/useNewslettersState'
import { useNewsletterForm } from '../../hooks/useNewsletterForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import RichTextEditor from '../../components/editor/RichTextEditor'
import '../../styles/sections/Newsletters.scss'

const Newsletters = () => {
  const { user, toggleRole } = useAuth()
  const {
    newsletters,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter,
    seedDemoNewsletters
  } = useNewslettersState()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState(null)
  const [useFallback, setUseFallback] = useState(false)

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

  // Body scroll lock for modals
  useBodyScrollLock(isModalOpen)


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
    deleteNewsletter(newsletter.id)
  }

  const handleEditorChange = ({ html, text }) => {
    setEditorHtml(html)
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

            <button
              className="newsletters-seed-btn"
              onClick={seedDemoNewsletters}
            >
              Seed Newsletters
            </button>

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
          <div className="empty-state">
            {user?.role === 'admin' ? (
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
                    key={`rte-${editingNewsletter ? editingNewsletter.id : 'new'}`}
                    contentKey={editingNewsletter ? editingNewsletter.id : 'new'}
                    initialHtml={editorHtml}
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
                    className="file-upload-area"
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
    </div>
  )
}

export { Newsletters }
