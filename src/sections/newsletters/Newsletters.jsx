import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/useAuth'
import { can } from '../../auth/acl'
import { useNewslettersState } from '../../hooks/useNewslettersState'
import { useNewsletterForm } from '../../hooks/useNewsletterForm'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import RichTextEditor from '../../components/editor/RichTextEditor'
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal'
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal'
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock'
import EmptyPage from '../../components/EmptyPage'
import NewsletterListShimmer from '../../components/newsletters/NewsletterListShimmer'
import '../../styles/sections/Newsletters.scss'

// Utility to strip HTML
const stripHtml = (html = '') => {
  const el = document.createElement('div')
  el.innerHTML = html
  return el.textContent || ''
}

const Newsletters = () => {
  // Función para obtener un fileName seguro
  const getSafeFileName = (newsletter) => {
    const fileName = newsletter.fileName || newsletter.name || 'newsletter';
    // Remover caracteres problemáticos para nombres de archivo
    return String(fileName).replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
  };

  // Función para descargar PDF desde la URL del archivo subido por el usuario
  const handleDownloadPDF = async (newsletter) => {
    const newsletterId = newsletter.id;
    
    // Activar loading para este newsletter específico
    setPdfLoadingStates(prev => ({ ...prev, [newsletterId]: true }));
    
    try {
      const fileName = `${getSafeFileName(newsletter)}.pdf`;
      
      // Si el newsletter tiene fileUrl, descargar directamente desde esa URL
      if (newsletter.fileUrl) {
        const link = document.createElement('a');
        link.href = newsletter.fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Si no hay fileUrl, mostrar error
        alert('No PDF file available for download');
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      alert(`Error al descargar el PDF: ${error.message}`);
    } finally {
      // Desactivar loading para este newsletter específico
      setPdfLoadingStates(prev => ({ ...prev, [newsletterId]: false }));
    }
  };

  // Estado para controlar el loading de PDFs individuales
  const [pdfLoadingStates, setPdfLoadingStates] = useState({});
  
  // Placeholder para imágenes de newsletters
  const NEWSLETTER_PLACEHOLDER = '/images/placeholder-notice.png'

  const { user } = useAuth()
  const {
    newsletters,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter,
    initialLoading
  } = useNewslettersState()

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState(null)
  const [editorKey, setEditorKey] = useState(0)
  const [useFallback, setUseFallback] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [newsletterToDelete, setNewsletterToDelete] = useState(null)
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false)

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
    initializeEdit,
    loadFrom
  } = useNewsletterForm()

  const modalBackdropClose = useModalBackdropClose(() => {
    closeModal()
  })

  useBodyScrollLock(isModalOpen || isConfirmDeleteOpen || isSuccessDeleteOpen)


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
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)

    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load newsletter data when opening for editing (similar to notices)
  useEffect(() => {
    if (isModalOpen && editingNewsletter) {
      // Small delay to ensure modal is fully open before loading data
      setTimeout(() => {
        loadFrom(editingNewsletter)
        setEditorKey(prev => prev + 1) // Force editor re-initialization
      }, 10)
    } else if (isModalOpen && !editingNewsletter) {
      // Small delay to ensure modal is fully open before initializing
      setTimeout(() => {
        initializeCreate()
        setEditorKey(prev => prev + 1) // Force editor re-initialization
      }, 10)
    }
  }, [isModalOpen, editingNewsletter]) // Removed loadFrom and initializeCreate from dependencies

  if (!user) {
    return (
      <div className="newsletters-page">
        <div className="newsletters-container">
          <div className="loading">Loading...</div>
        </div>
      </div>
    )
  }

  // Show loading while fetching newsletters from API
  if (initialLoading) {
    return (
      <div className="newsletters-page">
        <div className="newsletters-container">
          {/* Header */}
          <header className="newsletters-header">
            <div className="newsletters-header-title">
              <h1>Newsletters</h1>
              <p>Manage Newsletters</p>
            </div>

            <div className="newsletters-actions">
              {user?.role === 'admin' && (
                <button
                  type="button"
                  className="add-newsletter-btn"
                  onClick={() => openModal()}
                  aria-label="Add newsletter"
                  title="Add Newsletter"
                >
                  <i className="bi bi-plus" aria-hidden="true"></i>
                  <span className="btn-label">Add Newsletter</span>
                </button>
              )}
            </div>
          </header>
          
          <NewsletterListShimmer />
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) {
      return
    }

    try {
      
      const newsletterObj = await buildNewsletterObject(editingNewsletter?.id)

    if (editingNewsletter) {
      await updateNewsletter(editingNewsletter.id, newsletterObj)
    } else {
      await addNewsletter(newsletterObj)
    }

      closeModal()
    } catch (error) {
      console.error('Error creating/updating newsletter:', error)
      setErrorMessage('Error creating newsletter. Please try again.')
    }
  }

  const handleDelete = (newsletter) => {
    if (can(user, 'newsletters:delete')) {
      setNewsletterToDelete(newsletter)
      setIsConfirmDeleteOpen(true)
    }
  }

  const handleConfirmDelete = async () => {
    try {
      if (newsletterToDelete) {
        setIsDeleting(true);
        
        // Wait for delete to complete successfully
        await deleteNewsletter(newsletterToDelete.id);
        
        // Close confirmation modal first
        setIsConfirmDeleteOpen(false);
        setNewsletterToDelete(null);
        setIsDeleting(false);
        
        // Then show success modal
        setIsSuccessDeleteOpen(true);
      }
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error);
      alert('An error occurred while deleting the newsletter');
      // Close confirmation modal even on error
      setIsConfirmDeleteOpen(false);
      setNewsletterToDelete(null);
      setIsDeleting(false);
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
        <header className="newsletters-header">
          <div className="newsletters-header-title">
            <h1>Newsletters</h1>
            <p>Manage Newsletters</p>
          </div>

          <div className="newsletters-actions">
            {user?.role === 'admin' && (
              <button
                type="button"
                className="add-newsletter-btn"
                onClick={() => openModal()}
                aria-label="Add newsletter"
                title="Add Newsletter"
              >
                <i className="bi bi-plus" aria-hidden="true"></i>
                <span className="btn-label">Add Newsletter</span>
              </button>
            )}
          </div>
        </header>

        
        {/* Newsletter List */}
        {!Array.isArray(newsletters) || newsletters.length === 0 ? (
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
            {Array.isArray(newsletters) && newsletters.map((newsletter) => {
              return (
              <div key={newsletter.id || newsletter.data?.id || Math.random()} className="newsletter-card">
                <div className="newsletter-header">
                  <div className="newsletter-info">
                    <h3 className="newsletter-title">
                      {newsletter.data?.name || newsletter.name || 'Sin nombre'}
                    </h3>
                    <p
                      className={`newsletter-description ${useFallback ? 'fallback' : ''}`}
                    >
                      {(() => {
                        const description = newsletter.data?.description || newsletter.description
                        
                        // Handle description from backend - similar to notices
                        if (typeof description === 'string' && description !== '[object Object]') {
                          try {
                            const parsed = JSON.parse(description)
                            
                            // Use descriptionText if available, otherwise extract from HTML
                            if (parsed.descriptionText && parsed.descriptionText !== '[object Object]') {
                              return parsed.descriptionText
                            } else if (parsed.descriptionHtml && parsed.descriptionHtml.html) {
                              // Extract first paragraph from HTML
                              const temp = document.createElement('div')
                              temp.innerHTML = parsed.descriptionHtml.html
                              const firstP = temp.querySelector('p')
                              return firstP ? firstP.textContent?.trim() || 'Sin descripción' : 'Sin descripción'
                            }
                            return 'Sin descripción'
                          } catch (error) {
                            return description
                          }
                        } else if (description === '[object Object]') {
                          return 'Descripción no disponible'
                        } else if (description && description.descriptionText) {
                          return description.descriptionText
                        } else if (newsletter.descriptionText) {
                          return newsletter.descriptionText
                        } else if (description && description !== '[object Object]') {
                          return description
                        }
                        return 'Sin descripción'
                      })()}
                    </p>
                    <div className="newsletter-date">
                      Published: {formatDate(newsletter.data?.created_at || newsletter.createdAt || newsletter.created_at || new Date())}
                    </div>
                  </div>

                  <div className="newsletter-actions">
                    <div className="newsletter-actions-mobile">
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
                    </div>
                    {isMobile && user?.role === 'admin' ? (
                      <button
                        className="download-btn-mobileAdmin"
                        disabled={pdfLoadingStates[newsletter.id]}
                        onClick={() => handleDownloadPDF(newsletter)}
                      >
                        <i className="bi bi-download"></i>
                      </button>
                    ) : (
                      <button
                        className="download-btn"
                        disabled={pdfLoadingStates[newsletter.id]}
                        onClick={() => handleDownloadPDF(newsletter)}
                      >
                        {pdfLoadingStates[newsletter.id] ? 'Downloading...' : 'Download PDF'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              )
            })}
          </div>
        )}

        {isModalOpen && (
          <div
            className="newsletters-modal-overlay"
            onPointerDown={modalBackdropClose.onBackdropPointerDown}
            onPointerUp={modalBackdropClose.onBackdropPointerUp}
            onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
          >
            <ModalLifecycleLock />
            <div
              className="newsletters-modal"
              onPointerDown={modalBackdropClose.stopInsidePointer}
              onClick={modalBackdropClose.stopInsidePointer}
            >
              <button
                className="close-btn"
                onClick={closeModal}
              >
                <i className="bi bi-x"></i>
              </button>
              <div className="newsletters-modal-header">
                <h2>Upload Newsletters</h2>
                <p>Please review the information before saving.</p>

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
                    placeholder="Please mention how do you want to save the document name"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Description<span className="req-star" aria-hidden="true">*</span></label>
                  <RichTextEditor
                    key={editorKey}
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
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666', opacity: 0.7 }}>Only PDF files are supported. Maximum file size: 15 MB.</p>
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
                      accept="application/pdf"
                      onChange={setFileFromInput}
                      className="hidden-file-input"
                    />
                    <label htmlFor="file" className="file-input-label">
                      Choose file
                    </label>
                    <p className="file-status">
                      {form.imageFileName || 'No file chosen'}
                      {editingNewsletter && form.imageFileName && (
                        <span className="existing-file-indicator"> (Existing file)</span>
                      )}
                    </p>
                    {form.imagePreviewUrl && (
                      <div className="image-preview">
                        <img 
                          src={form.imagePreviewUrl} 
                          alt="Preview" 
                          onLoad={() => {}}
                          onError={(e) => {
                            e.target.classList.add('image-preview-hidden');
                          }}
                        />
                      </div>
                    )}
                    {editingNewsletter && form.imageFileName && (
                      <div className="existing-file-info">
                        <p className="file-info-text">
                          <i className="bi bi-file-earmark-pdf" style={{marginRight: '8px', color: '#dc2626'}}></i>
                          Current file: <strong>{form.imageFileName}</strong>
                        </p>
                        <p className="file-info-note">
                          Select a new file to replace the existing one, or leave empty to keep the current file.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  {errorMessage && (
                    <div
                      className="app-form__error-banner"
                      role="alert"
                      aria-live="assertive"
                      tabIndex={-1}
                    >
                      <strong>Error:</strong> {errorMessage}
                    </div>
                  )}
                  <button type="submit" className="upload-now-btn">
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>

      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false)
          setNewsletterToDelete(null)
        }}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
      />

      <SuccessDeleteModal
        isOpen={isSuccessDeleteOpen}
        onClose={() => setIsSuccessDeleteOpen(false)}
      />
    </div>
  )
}

export { Newsletters }
