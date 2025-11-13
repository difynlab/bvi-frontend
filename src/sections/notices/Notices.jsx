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
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal'
import NoticesTabPicker from '../../components/modals/NoticesTabPicker'
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock'
import EmptyPage from '../../components/EmptyPage'
import CustomDropdown from '../../components/CustomDropdown'
import { loadActiveTabId, saveActiveTabId } from '../../helpers/noticesStorage'
import { getNoticeImageFromLocalStorage, saveNoticeImageToLocalStorage } from '../../utils/noticeTransformers'
import noticeCategoriesService from '../../services/noticeCategoriesService'
import noticesService from '../../services/noticesService'
import NoticesListShimmer from '../../components/notices/NoticesListShimmer'
import '../../styles/sections/Notices.scss'

export const Notices = () => {
  // Función para obtener un fileName seguro
  const getSafeFileName = (notice) => {
    const fileName = notice.fileName || notice.title || 'notice';
    // Remover caracteres problemáticos para nombres de archivo
    return String(fileName).replace(/[<>:"/\\|?*]/g, '_').substring(0, 50);
  };

  // Función para descargar PDF desde la URL del archivo subido por el usuario
  const handleDownloadPDF = async (notice) => {
    const noticeId = notice.id;
    
    // Activar loading para este notice específico
    setPdfLoadingStates(prev => ({ ...prev, [noticeId]: true }));
    
    try {
      const fileName = `${getSafeFileName(notice)}.pdf`;
      
      // Si el notice tiene fileUrl, descargar directamente desde esa URL
      if (notice.fileUrl) {
        const link = document.createElement('a');
        link.href = notice.fileUrl;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        // Si no hay fileUrl, intentar descargar desde el endpoint de la API
        const blob = await noticesService.downloadNoticePDF(noticeId);
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      // Mostrar error al usuario
      alert(`Error al descargar el PDF: ${error.message}`);
    } finally {
      // Desactivar loading para este notice específico
      setPdfLoadingStates(prev => ({ ...prev, [noticeId]: false }));
    }
  };

  // Estado para controlar el loading de PDFs individuales
  const [pdfLoadingStates, setPdfLoadingStates] = useState({});
  const MOBILE_Q = '(max-width: 768px)'
  const failedImageIdsRef = useRef(new Set())
  const [fallbackTick, setFallbackTick] = useState(0)
  
  // Placeholder para imágenes de notices
  const NOTICE_PLACEHOLDER = '/images/placeholder-notice.png'

  // Mobile state management
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_Q).matches)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [activeTabId, setActiveTabId] = useState(() => loadActiveTabId() || null)
  const getNoticeImage = (n) => {
    if (!n) return NOTICE_PLACEHOLDER
    if (failedImageIdsRef.current.has(n.id)) return NOTICE_PLACEHOLDER
    
    // PRIORITY 1: Try to get image from localStorage first
    const localStorageImage = getNoticeImageFromLocalStorage(n.id, 'original')
    
    if (localStorageImage) {
      return localStorageImage
    }
    
    // PRIORITY 2: Fallback to notice data
    const imageUrl = n.original_thumbnail || n.imagePreviewUrl || n.imageUrl || NOTICE_PLACEHOLDER
    return imageUrl
  }
  
  const getNoticeBlurredImage = (n) => {
    if (!n) return NOTICE_PLACEHOLDER
    if (failedImageIdsRef.current.has(n.id)) return NOTICE_PLACEHOLDER
    
    // PRIORITY 1: Try to get blurred image from localStorage first
    const localStorageBlurred = getNoticeImageFromLocalStorage(n.id, 'blurred')
    
    if (localStorageBlurred) {
      return localStorageBlurred
    }
    
    // PRIORITY 2: Fallback to notice data
    const blurredUrl = n.blurred_thumbnail || n.original_thumbnail || n.imagePreviewUrl || n.imageUrl || NOTICE_PLACEHOLDER
    return blurredUrl
  }
  const onImgError = (n) => {
    if (!n?.id) return
    if (!failedImageIdsRef.current.has(n.id)) {
      failedImageIdsRef.current.add(n.id)
      setFallbackTick(t => t + 1)
    }
  }
  const { user, isInitialized } = useAuth()

  const {
    categories,
    activeCategory,
    visibleItems,
    isCategoryModalOpen,
    isNoticeModalOpen,
    editingNotice,
    confirmModalOpen,
    categoryToDelete,
    editingCategory,
    categoriesLoaded,
    categoriesLoading,
    noticesLoading,
    setActiveCategory,
    handleAddCategory,
    handleDeleteCategory,
    handleEditCategory,
    handleUpdateCategory,
    closeCategoryModal,
    openCreateNotice,
    openEditNotice,
    closeNoticeModal,
    handleUpsertNotice,
    handleDeleteNotice,
    handleConfirmDelete,
    setIsCategoryModalOpen,
    setConfirmModalOpen,
    setCategoryToDelete,
    loadCategoriesFromAPI
  } = useNoticesState()

  // Mobile responsive effect
  useEffect(() => {
    const mql = window.matchMedia(MOBILE_Q)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener?.('change', onChange)
    return () => mql.removeEventListener?.('change', onChange)
  }, [])

  // Load categories from API when component mounts
  useEffect(() => {
    loadCategoriesFromAPI()
  }, []) // Empty dependency array - only run once on mount

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
  }, [categories]) // Removed activeTabId to prevent infinite loop

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
  const [isCategoryLoading, setIsCategoryLoading] = useState(false)
  const [isNoticeDeleteConfirmOpen, setIsNoticeDeleteConfirmOpen] = useState(false)
  const [noticeToDelete, setNoticeToDelete] = useState(null)
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const modalBackdropClose = useModalBackdropClose(() => {
    if (editingNotice) {
      noticeForm.rollbackEdit()
    } else {
      noticeForm.reset()
    }
    setPdfGenerationError('') // Clear PDF generation errors when closing modal
    closeNoticeModal()
  })
  const confirmModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false))
  const addCategoryModalBackdropClose = useModalBackdropClose(() => setIsCategoryModalOpen(false))

  const titleMarquee = useTitleMarquee()

  useBodyScrollLock(isNoticeModalOpen || isCategoryModalOpen || confirmModalOpen || isNoticeDeleteConfirmOpen || isSuccessDeleteOpen || pickerOpen)

  const truncateText = (text, maxLength = 110) => {
    if (!text || text.length <= maxLength) return text
    const truncated = text.substring(0, maxLength)
    const lastSpaceIndex = truncated.lastIndexOf(' ')
    return lastSpaceIndex > 0 ? truncated.substring(0, lastSpaceIndex) + '…' : truncated + '…'
  }

  const [useFallback, setUseFallback] = useState(false)
  const [editorKey, setEditorKey] = useState(0)
  const [missingRequired, setMissingRequired] = useState([])
  const [pdfGenerationError, setPdfGenerationError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
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
    {
      key: 'file',
      label: 'PDF File Upload',
      test: () => {
        if (editingNotice) {
          return !!(
            noticeForm?.form?.file ||
            noticeForm?.form?.imageFileName ||
            editingNotice?.fileUrl ||
            editingNotice?.file
          );
        }
        return !!noticeForm?.form?.file;
      }
    }
  ];

  // Validation function
  function validateRequired() {
    const missing = REQUIRED.filter(r => !r.test()).map(r => r.label);
    setMissingRequired(missing);
    const isValid = missing.length === 0;
    return isValid;
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
    noticeForm?.form?.file,
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

  const formatDate = (value) => {
    if (!value) return 'Date not available'

    // Si viene como fecha sólo (YYYY-MM-DD), parsear en UTC para evitar desfasajes
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateRequired()) {
      bannerRef.current?.focus();
      return;
    }

    // Set loading state
    setIsSubmitting(true)

    // Clear any previous errors
    setPdfGenerationError('')

    const payload = noticeForm.buildNoticeObject(editingNotice?.id)

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

    try {
      const isEditMode = Boolean(editingNotice)
      const uploadedFile = payload.file
      const maxSize = 15 * 1024 * 1024 // 15MB in bytes

      if (uploadedFile) {
        if (uploadedFile.type !== 'application/pdf') {
          setPdfGenerationError('Please upload a PDF file.')
          bannerRef.current?.focus()
          setIsSubmitting(false)
          return
        }

        if (uploadedFile.size > maxSize) {
          setPdfGenerationError('PDF size must not exceed 15MB')
          bannerRef.current?.focus()
          setIsSubmitting(false)
          return
        }

        payload.file = uploadedFile
        await handleUpsertNotice(payload)
      } else if (isEditMode) {
        delete payload.file
        await handleUpsertNotice(payload)
      } else {
        setPdfGenerationError('Please upload a PDF file.')
        bannerRef.current?.focus()
        setIsSubmitting(false)
        return
      }

    } catch (error) {
      console.error('Error in handleSubmit:', error)
      
      // Handle errors
      setPdfGenerationError(`Error: ${error.message}`)
      bannerRef.current?.focus()
    } finally {
      // Reset loading state
      setIsSubmitting(false)
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
        // Update existing category
        await handleUpdateCategory(trimmedName)
      } else {
        // Create new category
        await handleAddCategory(trimmedName)
      }
      
      // Close modal on success
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

  // Effect to preload category name when editing
  useEffect(() => {
    if (editingCategory) {
      setNewCategoryName(editingCategory.name)
    } else {
      setNewCategoryName('')
    }
  }, [editingCategory])

  const handleDeleteNoticeLocal = (noticeId) => {
    const notice = visibleItems.find(n => n.id === noticeId)
    if (notice && can(user, 'notices:delete')) {
      setNoticeToDelete(notice)
      setIsDeleting(false)
      setIsNoticeDeleteConfirmOpen(true)
    }
  }

  const handleConfirmDeleteNotice = async () => {
    try {
      if (noticeToDelete) {
        setIsDeleting(true)
        
        // Wait for delete to complete successfully
        await handleDeleteNotice(noticeToDelete.id)
        
        // Close confirmation modal first
        setIsNoticeDeleteConfirmOpen(false)
        setNoticeToDelete(null)
        setIsDeleting(false)
        
        // Then show success modal
        setIsSuccessDeleteOpen(true)
      }
    } catch (error) {
      console.error('Error in handleConfirmDeleteNotice:', error)
      alert('An error occurred while deleting the notice')
      // Close confirmation modal even on error
      setIsNoticeDeleteConfirmOpen(false)
      setNoticeToDelete(null)
      setIsDeleting(false)
    }
  }


  const getNoticeDescriptionText = (n) => {
    // Use descriptionText (first paragraph) from the parsed description
    if (n?.descriptionText) {
      return n.descriptionText;
    }
    
    // Fallback to other fields if descriptionText is not available
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
                        aria-controls="noticesTabPicker">
                        <h2>
                          {activeCategoryData?.name || 'Categories'}
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
                        onEditCategory={handleEditCategory}
                      />
                    </>
                  ) : (
                    <div className="no-categories-message-mobile">
                      <p>No notice categories created yet...</p>
                    </div>
                  )}
                </div>
              )}
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
            /* Desktop tabs header with skeleton loading */
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
                      {can(user, 'notices:create') && (
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
                            {can(user, 'notices:update') && (
                              <button
                                className="category-tab__edit"
                                onClick={(e) => { e.stopPropagation(); handleEditCategory(category.id); }}
                                aria-label="Edit category"
                              >
                                <i className="bi bi-pencil-square"></i>
                              </button>
                            )}
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
                        ))
                      ) : (
                        <div className="no-categories-message">
                          <p>No notice categories created yet...</p>
                        </div>
                      )}
                      {can(user, 'notices:create') && (
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
          ) : noticesLoading ? (
            <NoticesListShimmer />
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
                          disabled={pdfLoadingStates[notice.id]}
                          onClick={() => handleDownloadPDF(notice)}
                        >
                          {pdfLoadingStates[notice.id] ? 'Downloading...' : 'Download Notice'}
                        </button>
                      </div>
                    </div>
                    <div className="notice-preview-container">
                      <div className="notice-preview-card">
                        {/* Header */}
                        <div className="notice-preview-header">
                          <h2 className="notice-preview-title">Official Notice</h2>
                          <p className="notice-preview-subtitle">Here's what's happening with your membership</p>
                        </div>
                        
                        {/* Content section */}
                        <div className="notice-preview-content">
                          <div className="notice-preview-info">
                            <div className="notice-preview-field">
                              <span className="notice-preview-label">Category:</span>
                              <span className="notice-preview-value">
                                {categories.find(cat => cat.id === notice.noticeType)?.name || 'Not specified'}
                              </span>
                            </div>
                            <div className="notice-preview-field">
                              <span className="notice-preview-label">Date:</span>
                              <span className="notice-preview-value">
                                {formatDate(notice.createdAt || notice.createdAtISO || notice.publishDate)}
                              </span>
                            </div>
                            <div className="notice-preview-field">
                              <span className="notice-preview-label">Link:</span>
                              <span className="notice-preview-value">
                                {typeof notice.linkUrl === 'string' && notice.linkUrl.trim() ? (
                                  <a
                                    href={notice.linkUrl}
                                    className="notice-preview-link"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {notice.linkUrl}
                                  </a>
                                ) : (
                                  'No link provided'
                                )}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
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
                        disabled={pdfLoadingStates[notice.id]}
                        onClick={() => handleDownloadPDF(notice)}
                      >
                        {pdfLoadingStates[notice.id] ? 'Generating...' : 'Download Notice'}
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
                  setPdfGenerationError('') // Clear errors when closing modal
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
                  <CustomDropdown
                    id="noticeType"
                    name="noticeType"
                    value={noticeForm.form.noticeType}
                    onChange={handleInputChange}
                    options={categories.map(category => ({ value: category.id, label: category.name }))}
                    placeholder="Select category"
                    actionLabel="New category..."
                    onAction={() => setIsCategoryModalOpen(true)}
                  />
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
                  <label htmlFor="file">Upload PDF File<span className="req-star" aria-hidden="true">*</span></label>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666', opacity: 0.7 }}>Only PDF files are supported. Maximum file size: 15 MB.</p>
                  <div
                    className="file-upload-area dropzone-surface"
                    data-has-file={Boolean(noticeForm.form.file || noticeForm.form.imageFileName)}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      id="file"
                      name="file"
                      accept="application/pdf"
                      onChange={handleFileInputChange}
                      className="hidden-file-input"
                    />
                    <label htmlFor="file" className="file-input-label">
                      Choose file
                    </label>
                    <p className="file-status">
                      {noticeForm.form.imageFileName || 'No file chosen'}
                      {editingNotice && noticeForm.form.imageFileName && (
                        <span className="existing-file-indicator"> (Existing file)</span>
                      )}
                    </p>
                    {noticeForm.form.imagePreviewUrl && (
                      <div className="image-preview">
                        <img 
                          src={noticeForm.form.imagePreviewUrl} 
                          alt="Preview" 
                          onLoad={() => {}}
                          onError={(e) => {
                            e.target.classList.add('image-preview-hidden');
                          }}
                        />
                      </div>
                    )}
                    {noticeForm.form.imageFileName && noticeForm.form.imageFileName.toLowerCase().endsWith('.pdf') && !noticeForm.form.imagePreviewUrl && (
                      <div className="file-preview">
                        <i className="bi bi-file-pdf" style={{ fontSize: '3rem', color: '#dc3545' }}></i>
                        <p>{noticeForm.form.imageFileName}</p>
                      </div>
                    )}
                    {editingNotice && noticeForm.form.imageFileName && (
                      <div className="existing-file-info">
                        <p className="file-info-text">
                          <i className="bi bi-file-earmark-pdf" style={{marginRight: '8px', color: '#dc2626'}}></i>
                          Current file: <strong>{noticeForm.form.imageFileName}</strong>
                        </p>
                        <p className="file-info-note">
                          Select a new file to replace the existing one, or leave empty to keep the current file.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="form-actions">
                  {(missingRequired.length > 0 || noticeForm.errorMessage || pdfGenerationError) && (
                    <div
                      className="app-form__error-banner"
                      role="alert"
                      aria-live="assertive"
                      tabIndex={-1}
                      ref={bannerRef}
                    >
                      {missingRequired.length > 0 && (
                        <div>
                          <strong>Please fill all required fields:</strong> {missingRequired.join(', ')}
                        </div>
                      )}
                      {noticeForm.errorMessage && (
                        <div>
                          <strong>Error:</strong> {noticeForm.errorMessage}
                        </div>
                      )}
                      {pdfGenerationError && (
                        <div>
                          <strong>Error:</strong> {pdfGenerationError}
                        </div>
                      )}
                    </div>
                  )}
                  <button 
                    type="submit" 
                    className="upload-now-btn"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Loading...' : (editingNotice ? 'Update' : 'Submit')}
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
          setIsDeleting(false)
        }}
        onConfirm={handleConfirmDeleteNotice}
        isDeleting={isDeleting}
      />

      <SuccessDeleteModal
        isOpen={isSuccessDeleteOpen}
        onClose={() => setIsSuccessDeleteOpen(false)}
      />

    </>
  )
}
