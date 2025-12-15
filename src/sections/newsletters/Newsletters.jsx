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

  const handleViewNewsletter = (newsletter) => {
    setViewingNewsletter(newsletter);
    setIsViewNewsletterModalOpen(true);
  };

  const handleDownloadFile = async (newsletter) => {
    const newsletterId = newsletter.id;
    
    setPdfLoadingStates(prev => ({ ...prev, [newsletterId]: true }));
    
    try {
      const getFileExtension = () => {
        if (newsletter.imageFileName) {
          const fileName = newsletter.imageFileName.toLowerCase();
          if (fileName.endsWith('.pdf')) return '.pdf';
        }
        if (newsletter.fileUrl) {
          const url = newsletter.fileUrl.toLowerCase();
          if (url.includes('.pdf')) return '.pdf';
        }
        return '.pdf';
      };
      
      const extension = getFileExtension();
      const baseFileName = getSafeFileName(newsletter);
      const fileName = `${baseFileName}${extension}`;
      
      if (newsletter.fileUrl) {
        const link = document.createElement('a');
        link.href = newsletter.fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error('No file available for download');
      }
    } catch (error) {
      console.error('Error downloading file:', error);
      alert(`Error downloading file: ${error.message}`);
    } finally {
      setPdfLoadingStates(prev => ({ ...prev, [newsletterId]: false }));
    }
  };

  const hasFile = (newsletter) => {
    return !!(newsletter.fileUrl || newsletter.imageFileName || newsletter.imagePreviewUrl || newsletter.imageUrl);
  };

  const getNewsletterDescriptionText = (newsletter) => {
    const description = newsletter.data?.description || newsletter.description;
    
    if (typeof description === 'string' && description !== '[object Object]') {
      try {
        const parsed = JSON.parse(description);
        if (parsed.descriptionText && parsed.descriptionText !== '[object Object]') {
          return parsed.descriptionText;
        } else if (parsed.descriptionHtml && parsed.descriptionHtml.html) {
          const temp = document.createElement('div');
          temp.innerHTML = parsed.descriptionHtml.html;
          const firstP = temp.querySelector('p');
          return firstP ? firstP.textContent?.trim() || 'No description' : 'No description';
        }
        return 'No description';
      } catch (error) {
        return description;
      }
    } else if (description === '[object Object]') {
      return 'Description not available';
    } else if (description && description.descriptionText) {
      return description.descriptionText;
    } else if (newsletter.descriptionText) {
      return newsletter.descriptionText;
    } else if (description && description !== '[object Object]') {
      return description;
    }
    return 'No description';
  };

  const [pdfLoadingStates, setPdfLoadingStates] = useState({});
  const [isViewNewsletterModalOpen, setIsViewNewsletterModalOpen] = useState(false);
  const [viewingNewsletter, setViewingNewsletter] = useState(null);
  
  // Placeholder para imágenes de newsletters
  const NEWSLETTER_PLACEHOLDER = '/images/placeholder-notice.png'

  const { user } = useAuth()
  const {
    newsletters,
    visibleItems,
    pagination,
    addNewsletter,
    updateNewsletter,
    deleteNewsletter,
    initialLoading,
    changePage,
    loadNewslettersFromAPI
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

  const viewNewsletterModalBackdropClose = useModalBackdropClose(() => {
    setIsViewNewsletterModalOpen(false)
  })

  useBodyScrollLock(isModalOpen || isConfirmDeleteOpen || isSuccessDeleteOpen || isViewNewsletterModalOpen)


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

      await loadNewslettersFromAPI()
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
        
        await deleteNewsletter(newsletterToDelete.id);
        await loadNewslettersFromAPI();
        
        setIsConfirmDeleteOpen(false);
        setNewsletterToDelete(null);
        setIsDeleting(false);
        
        setIsSuccessDeleteOpen(true);
      }
    } catch (error) {
      console.error('Error in handleConfirmDelete:', error);
      alert('An error occurred while deleting the newsletter');
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

  const formatDate = (value) => {
    if (!value) return 'Date not available'

    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      const [y, m, d] = value.split('-').map(Number)
      const dateUtc = new Date(Date.UTC(y, m - 1, d))
      return dateUtc.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC'
      })
    }

    const date = typeof value === 'number' ? new Date(value) : new Date(String(value))
    if (isNaN(date.getTime())) return 'Invalid date'

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC'
    })
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

        <section className="newsletters-section">
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
            <>
              <div className="newsletters-list">
                {Array.isArray(visibleItems) && visibleItems.map((newsletter) => {
                return (
                <div key={newsletter.id || newsletter.data?.id || Math.random()} className="newsletter-card">
                  <div className="newsletter-header">
                    <div className="newsletter-info">
                      <h3 className="newsletter-title">
                        {newsletter.fileName || newsletter.data?.name || newsletter.name || 'Sin nombre'}
                      </h3>
                      <p
                        className={`newsletter-description ${useFallback ? 'fallback' : ''}`}
                      >
                        {(() => {
                          const description = newsletter.data?.description || newsletter.description
                          
                          if (typeof description === 'string' && description !== '[object Object]') {
                            try {
                              const parsed = JSON.parse(description)
                              
                              if (parsed.descriptionText && parsed.descriptionText !== '[object Object]') {
                                return parsed.descriptionText
                              } else if (parsed.descriptionHtml && parsed.descriptionHtml.html) {
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
                        Published: {formatDate(newsletter.publishDate || newsletter.publish_date || newsletter.data?.publish_date || newsletter.data?.created_at || newsletter.createdAt || newsletter.created_at)}
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
                      <button
                        className="download-btn"
                        onClick={() => handleViewNewsletter(newsletter)}
                      >
                        View Newsletter
                      </button>
                    </div>
                  </div>
                </div>
                )
              })}
              </div>
              {pagination.last_page > 1 && (
                <div className="newsletters-pagination">
                  <button 
                    className="prev-btn"
                    onClick={() => changePage(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <div className="page-counter">
                    <span>{pagination.current_page} / {pagination.last_page}</span>
                  </div>
                  <button 
                    className="next-btn"
                    onClick={() => changePage(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </>
          )}
        </section>

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

                <div className="form-row">
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
                    <label htmlFor="publishDate">Publish Date</label>
                    <input
                      type="date"
                      id="publishDate"
                      name="publishDate"
                      value={form.publishDate || ''}
                      onChange={(e) => onChange('publishDate', e.target.value)}
                    />
                  </div>
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
                  <label htmlFor="linkUrl">Link URL</label>
                  <input
                    type="url"
                    id="linkUrl"
                    name="linkUrl"
                    value={form.linkUrl}
                    onChange={(e) => onChange('linkUrl', e.target.value)}
                    placeholder="https://example.com/newsletter"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="file">Upload File</label>
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

      {isViewNewsletterModalOpen && viewingNewsletter && (
        <div
          className="newsletters-modal-overlay"
          onPointerDown={viewNewsletterModalBackdropClose.onBackdropPointerDown}
          onPointerUp={viewNewsletterModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={viewNewsletterModalBackdropClose.onBackdropPointerCancel}
        >
          <ModalLifecycleLock />
          <div
            className="newsletters-modal view-newsletter-modal"
            onPointerDown={viewNewsletterModalBackdropClose.stopInsidePointer}
            onClick={viewNewsletterModalBackdropClose.stopInsidePointer}
          >
            <div className="view-newsletter-header-section">
              <div className="view-newsletter-header-top">
                <img src="/BVI-logo.png" alt="BVI Finance" className="view-newsletter-logo" />
                <button
                  className="close-btn view-newsletter-close-btn"
                  onClick={() => setIsViewNewsletterModalOpen(false)}
                  aria-label="Close modal"
                >
                  <i className="bi bi-x-lg"></i>
                </button>
              </div>
              <h2 className="view-newsletter-header-title">Official Newsletter</h2>
              <hr className="view-newsletter-header-divider" />
            </div>
            
            <div className="view-newsletter-content">
              <div className="view-newsletter-header">
                <h2 className="view-newsletter-title">{viewingNewsletter.data?.name || viewingNewsletter.name || viewingNewsletter.fileName || 'Newsletter'}</h2>
                <span className="view-newsletter-date">
                  {formatDate(viewingNewsletter.publishDate || viewingNewsletter.publish_date || viewingNewsletter.data?.publish_date || viewingNewsletter.data?.created_at || viewingNewsletter.createdAt || viewingNewsletter.created_at)}
                </span>
              </div>
              
              <div className="view-newsletter-description">
                {viewingNewsletter.data?.description || viewingNewsletter.description ? (
                  (() => {
                    const description = viewingNewsletter.data?.description || viewingNewsletter.description;
                    if (typeof description === 'string') {
                      try {
                        const parsed = JSON.parse(description);
                        if (parsed.descriptionHtml && parsed.descriptionHtml.html) {
                          return <div dangerouslySetInnerHTML={{ __html: parsed.descriptionHtml.html }} />;
                        } else if (parsed.descriptionHtml && typeof parsed.descriptionHtml === 'string') {
                          return <div dangerouslySetInnerHTML={{ __html: parsed.descriptionHtml }} />;
                        }
                      } catch (e) {
                        return <div dangerouslySetInnerHTML={{ __html: description }} />;
                      }
                    }
                    return <p>{getNewsletterDescriptionText(viewingNewsletter)}</p>;
                  })()
                ) : (
                  <p>{getNewsletterDescriptionText(viewingNewsletter)}</p>
                )}
              </div>
              
              {viewingNewsletter.data?.link || viewingNewsletter.link || viewingNewsletter.linkUrl ? (
                (() => {
                  const linkUrl = viewingNewsletter.data?.link || viewingNewsletter.link || viewingNewsletter.linkUrl;
                  if (linkUrl && linkUrl.trim() !== '#' && linkUrl.trim() !== '') {
                    return (
                      <div className="view-newsletter-link">
                        <a 
                          href={linkUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="view-newsletter-link-url"
                        >
                          {linkUrl}
                        </a>
                      </div>
                    );
                  }
                  return null;
                })()
              ) : null}
              
              <hr className="view-newsletter-divider" />
              
              <div className="view-newsletter-download-section">
                <button
                  className="download-newsletter-btn"
                  disabled={!hasFile(viewingNewsletter)}
                  onClick={() => {
                    if (hasFile(viewingNewsletter)) {
                      handleDownloadFile(viewingNewsletter);
                    }
                  }}
                >
                  {pdfLoadingStates[viewingNewsletter.id] ? 'Downloading...' : 'Download Newsletter'}
                </button>
                {!hasFile(viewingNewsletter) && (
                  <p className="no-file-message">No uploaded file available for download</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export { Newsletters }
