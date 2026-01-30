import React, { useState, useEffect, useMemo } from 'react'
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
import CustomDropdown from '../../components/CustomDropdown'
import NewsletterTabPicker from '../../components/modals/NewsletterTabPicker'
import { loadActiveTabId, saveActiveTabId } from '../../helpers/newslettersStorage'
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
    loadNewslettersFromAPI,
    categories,
    activeCategory,
    setActiveCategory,
    isCategoryModalOpen,
    editingCategory,
    confirmModalOpen,
    categoryToDelete,
    categoriesLoaded,
    categoriesLoading,
    handleAddCategory,
    handleDeleteCategory,
    handleConfirmDeleteCategory,
    handleEditCategory,
    handleUpdateCategory,
    closeCategoryModal,
    setIsCategoryModalOpen,
    setConfirmModalOpen,
    setCategoryToDelete,
    loadCategoriesFromAPI,
    refreshCategories
  } = useNewslettersState()

  const MOBILE_Q = '(max-width: 768px)'
  
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTabId, setActiveTabId] = useState(() => loadActiveTabId() || null)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingNewsletter, setEditingNewsletter] = useState(null)
  const [editorKey, setEditorKey] = useState(0)
  const [useFallback, setUseFallback] = useState(false)
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false)
  const [newsletterToDelete, setNewsletterToDelete] = useState(null)
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState('')
  const [isCategoryLoading, setIsCategoryLoading] = useState(false)

  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_Q).matches)

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

  const addCategoryModalBackdropClose = useModalBackdropClose(() => setIsCategoryModalOpen(false))
  const confirmCategoryModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false))

  useBodyScrollLock(isModalOpen || isConfirmDeleteOpen || isSuccessDeleteOpen || isViewNewsletterModalOpen || isCategoryModalOpen || confirmModalOpen)


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
    const mql = window.matchMedia(MOBILE_Q)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
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

  useEffect(() => {
    loadCategoriesFromAPI(true)
  }, [])

  useEffect(() => {
    if (editingCategory) {
      setNewCategoryName(editingCategory.name)
    } else {
      setNewCategoryName('')
    }
  }, [editingCategory])

  useEffect(() => {
    if (!categories.length) {
      setActiveTabId(null)
      saveActiveTabId(null)
      setActiveCategory('')
      return
    }
    if (!activeTabId || !categories.some(c => c.id === activeTabId)) {
      const next = categories[0].id
      setActiveTabId(next)
      saveActiveTabId(next)
      setActiveCategory(next)
    }
  }, [categories])

  useEffect(() => {
    if (activeCategory && activeCategory !== activeTabId) {
      setActiveTabId(activeCategory)
      saveActiveTabId(activeCategory)
    }
  }, [activeCategory, activeTabId])

  const onSelectCategory = (id) => {
    setActiveTabId(id)
    saveActiveTabId(id)
    setActiveCategory(id)
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

  const activeCategoryData = useMemo(
    () => categories.find(c => c.id === activeTabId) || null,
    [categories, activeTabId]
  )

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
                  aria-label="Add new"
                  title="Add New"
                >
                  <i className="bi bi-plus" aria-hidden="true"></i>
                  <span className="btn-label">Add New</span>
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

  const handleAddCategorySubmit = async () => {
    const trimmedName = newCategoryName.trim()
    if (!trimmedName) {
      setCategoryError('Category name is required')
      return
    }
    if (trimmedName.length < 3) {
      setCategoryError('Category name must be at least 3 characters')
      return
    }
    
    setIsCategoryLoading(true)
    setCategoryError('')
    
    try {
      if (editingCategory) {
        await handleUpdateCategory(trimmedName)
      } else {
        await handleAddCategory(trimmedName)
      }
      
      setNewCategoryName('')
      setCategoryError('')
      
    } catch (error) {
      console.error('Error creating/updating category:', error)
      setCategoryError(`Something went wrong. Error: ${error.message}`)
    } finally {
      setIsCategoryLoading(false)
    }
  }

  const closeCategoryModalLocal = () => {
    setNewCategoryName('')
    setCategoryError('')
    closeCategoryModal()
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
                aria-label="Add new"
                title="Add New"
              >
                <i className="bi bi-plus" aria-hidden="true"></i>
                <span className="btn-label">Add New</span>
              </button>
            )}
          </div>
        </header>

        {isMobile ? (
          <div className="notices-mobile-header" role="region" aria-label="Newsletter categories">
            {categoriesLoading ? (
              <div className="category-title-skeleton">
                <span style={{ opacity: 0 }}>Loading...</span>
              </div>
            ) : (
              <div className="category-title">
                {categories.length > 0 ? (
                  <>
                    <button
                      type="button"
                      className="category-picker-btn"
                      onClick={() => setPickerOpen(true)}
                      aria-haspopup="dialog"
                      aria-controls="newsletterTabPicker">
                      <h2>
                        {activeCategoryData?.name || 'Categories'}
                      </h2>
                      <i className="bi bi-chevron-down" aria-hidden="true"></i>
                    </button>

                    <NewsletterTabPicker
                      open={pickerOpen}
                      onClose={() => setPickerOpen(false)}
                      categories={categories}
                      activeTabId={activeTabId}
                      onSelect={onSelectCategory}
                      canManage={can(user, 'newsletters:create')}
                      onAddCategory={onAddCategory}
                      onDeleteCategory={onDeleteCategory}
                      onEditCategory={handleEditCategory}
                    />
                  </>
                ) : (
                  <div className="no-categories-message-mobile">
                    <p>No newsletter categories created yet...</p>
                  </div>
                )}
              </div>
            )}
            {can(user, 'newsletters:create') && (
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
          <div className="notices-tabs-desktop" role="tablist" aria-orientation="horizontal">
            <div className="category-tabs">
              <div className="tabs-container">
                {categoriesLoading ? (
                  <>
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="tab-skeleton-group">
                        <div className="category-tab-skeleton">
                          <span style={{ opacity: 0 }}>Loading...</span>
                        </div>
                      </div>
                    ))}
                    {can(user, 'newsletters:create') && (
                      <button
                        className="add-category-btn"
                        onClick={() => setIsCategoryModalOpen(true)}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    )}
                  </>
                ) : (
                  <>
                    {categories.length > 0 ? (
                      categories.map(category => (
                        <div key={category.id} className="tab-group">
                          <button
                            className={`category-tab ${activeCategory === category.id ? 'active' : ''}`}
                            onClick={() => setActiveCategory(category.id)}
                          >
                            <span>{category.name}</span>
                          </button>
                          {can(user, 'newsletters:update') && (
                            <button
                              className="category-tab__edit"
                              onClick={(e) => { e.stopPropagation(); handleEditCategory(category.id); }}
                              aria-label="Edit category"
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                          )}
                          {can(user, 'newsletters:delete') && (
                            <button
                              className="category-tab__delete"
                              onClick={(e) => { e.stopPropagation(); handleDeleteCategory(category.id); }}
                              aria-label="Delete category"
                            >
                              <i className="bi bi-x-lg"></i>
                            </button>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="no-categories-message">
                        <p>No newsletter categories created yet...</p>
                      </div>
                    )}
                    {can(user, 'newsletters:create') && (
                      <button
                        className="add-category-btn"
                        onClick={() => setIsCategoryModalOpen(true)}
                      >
                        <i className="bi bi-plus"></i>
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {pickerOpen && (
          <div
            className="notices-dropdown-overlay"
            onClick={() => setPickerOpen(false)}
          />
        )}

        <section className="newsletters-section">
          {/* Newsletter List */}
          {categories.length === 0 ? (
            <EmptyPage
              isAdmin={user?.role === 'admin'}
              title={user?.role === 'admin' ? 'No categories yet!' : 'No categories available.'}
              description={user?.role === 'admin' ? 'Create your first category to get started with newsletters.' : 'No newsletter categories have been created yet.'}
            />
          ) : visibleItems.length === 0 ? (
            <EmptyPage
              isAdmin={user?.role === 'admin'}
              title={user?.role === 'admin' ? 'No newsletters in this category!' : 'No newsletters found.'}
              description={user?.role === 'admin' ? 'This category is empty. Add your first newsletter to get started!' : "This category doesn't have any newsletters yet."}
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
                  <label htmlFor="newsletterType">Newsletter Category<span className="req-star" aria-hidden="true">*</span></label>
                  <CustomDropdown
                    id="newsletterType"
                    name="newsletterType"
                    value={form.newsletterType || ''}
                    onChange={(e) => onChange('newsletterType', e.target.value)}
                    options={categories.map(category => ({ value: category.id, label: category.name }))}
                    placeholder="Select category"
                    actionLabel="New category..."
                    onAction={() => setIsCategoryModalOpen(true)}
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
                onClick={closeCategoryModalLocal}
              >
                <i className="bi bi-x"></i>
              </button>
            </div>

            <div className="notices-addcat-modal__content">
              <h2 className="notices-addcat-modal__title">
                {editingCategory ? 'Update Category Title' : 'Add New Category'}
              </h2>
              <p className="notices-addcat-modal__subtitle">
                {editingCategory ? 'Please update the category name' : 'Please add new category details'}
              </p>

              <div className="form-group">
                <label htmlFor="categoryName" className="notices-addcat-modal__label">Enter Title</label>
                <input
                  type="text"
                  id="categoryName"
                  placeholder={editingCategory ? "Please enter the new title" : "Please mention the title of the new category which you want to create"}
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
                <div className="app-form__error-banner">
                  Error: {categoryError}
                </div>
              )}

              <div className="notices-addcat-modal__actions">
                <button
                  type="button"
                  className="notices-addcat-modal__update-btn"
                  onClick={handleAddCategorySubmit}
                  disabled={isCategoryLoading}
                >
                  {isCategoryLoading ? 'Loading...' : (editingCategory ? 'Update' : 'Update')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {confirmModalOpen && categoryToDelete && (
        <div
          className="notices-modal-overlay"
          onPointerDown={confirmCategoryModalBackdropClose.onBackdropPointerDown}
          onPointerUp={confirmCategoryModalBackdropClose.onBackdropPointerUp}
          onPointerCancel={confirmCategoryModalBackdropClose.onBackdropPointerCancel}
        >
          <ModalLifecycleLock />
          <div
            className="notices-deleteCategory-modal"
            onPointerDown={confirmCategoryModalBackdropClose.stopInsidePointer}
            onClick={confirmCategoryModalBackdropClose.stopInsidePointer}
          >
            <button
              className="close-btn"
              onClick={() => setConfirmModalOpen(false)}
            >
              <i className="bi bi-x"></i>
            </button>
            <div className="confirm-delete-modal-header">
              <i className="bi bi-exclamation-triangle"></i>
              <h2>Delete category?</h2>
            </div>

            <div className="confirm-modal-content">
              <p>This will permanently delete the category and all its newsletters.</p>

              <div className="form-actions">
                <button type="button" onClick={() => setConfirmModalOpen(false)} className="cancel-button">
                  Cancel
                </button>
                <button type="button" onClick={handleConfirmDeleteCategory} className="delete-button">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
