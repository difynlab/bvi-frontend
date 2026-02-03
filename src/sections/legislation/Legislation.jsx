import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import LegislationUploadFileModal from '../../components/modals/LegislationUploadFileModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';
import legislationFilesService from '../../services/legislationFilesService';
import legislationCategoriesService from '../../services/legislationCategoriesService';
import LegislationTabPicker from '../../components/modals/LegislationTabPicker';
import { loadActiveTabId, saveActiveTabId } from '../../helpers/legislationStorage';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from '../../components/modals/ModalLifecycleLock';
import EmptyPage from '../../components/EmptyPage';
import '../../styles/sections/Legislation.scss';

const buildDownloadFileName = (title = 'legislation-document', fileUrl = '') => {
  const trimmed = (title || '').trim() || 'legislation-document';
  const baseName = trimmed
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  if (fileUrl) {
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    if (fileName && fileName.includes('.')) {
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      return `${baseName}${extension}`;
    }
  }
  
  return `${baseName}.pdf`;
};

const Legislation = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false);
  
  const MOBILE_Q = '(max-width: 768px)';
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('');
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [shouldReloadCategories, setShouldReloadCategories] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [activeTabId, setActiveTabId] = useState(() => loadActiveTabId() || null);
  const [isMobile, setIsMobile] = useState(() => window.matchMedia(MOBILE_Q).matches);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [isCategoryLoading, setIsCategoryLoading] = useState(false);
  const [pendingCategoryForUploadModal, setPendingCategoryForUploadModal] = useState(false);
  const [newCategoryIdForUploadModal, setNewCategoryIdForUploadModal] = useState(null);

  useEffect(() => {
    const loadLegislationFiles = async () => {
      setIsLoadingAttachments(true);
      try {
        const response = await legislationFilesService.getAllPages(100);
        const filesData = response?.data?.data || [];
        
        const normalizedFiles = filesData.map((fileItem) => ({
          id: `legislation-file-${fileItem.id}`,
          title: fileItem.title || '',
          displayTitle: fileItem.title || '',
          fileUrl: fileItem.file || '',
          fileName: fileItem.file ? fileItem.file.split('/').pop() : '',
          linkUrl: fileItem.link ?? '',
          apiId: fileItem.id,
          status: fileItem.status,
          createdAt: fileItem.created_at || new Date().toISOString(),
          legislation_category_id: fileItem.legislation_category_id ?? null
        }));

        const sortedFiles = normalizedFiles.sort((a, b) => {
          const titleA = (a.title || 'Untitled').toLowerCase();
          const titleB = (b.title || 'Untitled').toLowerCase();
          return titleA.localeCompare(titleB);
        });

        setAttachments(sortedFiles);
      } catch (error) {
        console.error('Failed to load legislation files:', error);
        setAttachments([]);
      } finally {
        setIsLoadingAttachments(false);
      }
    };

    loadLegislationFiles();
  }, []);

  const handleUploadClick = () => {
    setEditingFile(null);
    setIsModalOpen(true);
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingFile(null);
  };

  const handleSave = async () => {
    setIsLoadingAttachments(true);
    try {
      const response = await legislationFilesService.getAllPages(100);
      const filesData = response?.data?.data || [];
      
      const normalizedFiles = filesData.map((fileItem) => ({
        id: `legislation-file-${fileItem.id}`,
        title: fileItem.title || '',
        displayTitle: fileItem.title || '',
        fileUrl: fileItem.file || '',
        fileName: fileItem.file ? fileItem.file.split('/').pop() : '',
        linkUrl: fileItem.link ?? '',
        apiId: fileItem.id,
        status: fileItem.status,
        createdAt: fileItem.created_at || new Date().toISOString(),
        legislation_category_id: fileItem.legislation_category_id ?? null
      }));

      const sortedFiles = normalizedFiles.sort((a, b) => {
        const titleA = (a.title || 'Untitled').toLowerCase();
        const titleB = (b.title || 'Untitled').toLowerCase();
        return titleA.localeCompare(titleB);
      });

      setAttachments(sortedFiles);
    } catch (error) {
      console.error('Failed to reload legislation files after save:', error);
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  const handleDownloadAttachment = (attachment) => {
    try {
      if (attachment.fileUrl && !attachment.fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        const downloadName = attachment.downloadName || buildDownloadFileName(attachment.displayTitle || attachment.fileName || 'legislation-document', attachment.fileUrl);
        link.download = downloadName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      if (attachment.fileUrl && attachment.fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        const downloadName = attachment.downloadName || buildDownloadFileName(attachment.displayTitle || attachment.fileName || 'legislation-document', attachment.fileUrl);
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      console.warn('No downloadable content found for attachment:', attachment);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleDeleteFile = (file) => {
    if (can(user, 'legislation:update')) {
      setFileToDelete(file);
      setIsDeleteConfirmOpen(true);
      setDeleteError('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await legislationFilesService.delete(fileToDelete.apiId);
      
      setIsDeleteConfirmOpen(false);
      setFileToDelete(null);
      setIsDeleting(false);
      
      setIsSuccessDeleteOpen(true);
      
      await handleSave();
    } catch (error) {
      console.error('Error deleting file:', error);
      setDeleteError(error.message || 'Failed to delete file. Please try again.');
      setIsDeleting(false);
    }
  };

  const loadCategoriesFromAPI = useCallback(async (forceRefresh = false) => {
    if (categoriesLoading) return;
    
    if (!forceRefresh) {
      try {
        const cachedCategories = localStorage.getItem('bvi.legislation.categoriesCache');
        const isLoaded = localStorage.getItem('bvi.legislation.categoriesLoaded') === 'true';
        
        if (isLoaded && cachedCategories) {
          const parsedCategories = JSON.parse(cachedCategories);
          if (parsedCategories.length > 0) {
            setCategories(parsedCategories);
            setCategoriesLoaded(true);
          }
        }
      } catch (error) {
        console.error('Error reading cache:', error);
      }
    }
    
    setCategoriesLoading(true);
    try {
      const allCategories = [];
      let currentPage = 1;
      let hasMorePages = true;
      const perPage = 100;

      while (hasMorePages) {
        const response = await legislationCategoriesService.getLegislationCategories(perPage, currentPage);
        
        if (response.http_status === 404) {
          hasMorePages = false;
          if (allCategories.length === 0) {
            setCategories([]);
          }
        } else if (response.data) {
          let dataArray = [];
          
          if (Array.isArray(response.data)) {
            dataArray = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dataArray = response.data.data;
          }
          
          allCategories.push(...dataArray);
          
          const totalPages = response.data?.last_page || 1;
          
          if (currentPage >= totalPages || dataArray.length === 0) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } else {
          hasMorePages = false;
        }
      }
      
      if (allCategories.length > 0) {
        const apiCategories = allCategories.map(cat => ({
          id: cat.id,
          name: cat.title || cat.name,
          slug: (cat.title || cat.name).toLowerCase().replace(/\s+/g, '-'),
          status: cat.status
        }));
        
        setCategories(apiCategories);
        setCategoriesLoaded(true);
        localStorage.setItem('bvi.legislation.categoriesLoaded', 'true');
        localStorage.setItem('bvi.legislation.categoriesCache', JSON.stringify(apiCategories));
      } else {
        setCategories([]);
        setCategoriesLoaded(true);
        localStorage.setItem('bvi.legislation.categoriesLoaded', 'true');
        localStorage.setItem('bvi.legislation.categoriesCache', JSON.stringify([]));
      }
    } catch (error) {
      console.error('Error loading categories from API:', error);
      const cachedCategories = localStorage.getItem('bvi.legislation.categoriesCache');
      if (cachedCategories) {
        try {
          const parsedCategories = JSON.parse(cachedCategories);
          setCategories(parsedCategories);
        } catch (e) {
          setCategories([]);
        }
      } else {
        setCategories([]);
      }
      setCategoriesLoaded(true);
    } finally {
      setCategoriesLoading(false);
    }
  }, [categoriesLoading]);

  const refreshCategories = useCallback(async () => {
    setCategoriesLoaded(false);
    localStorage.removeItem('bvi.legislation.categoriesLoaded');
    localStorage.removeItem('bvi.legislation.categoriesCache');
    setShouldReloadCategories(true);
  }, []);

  const handleAddCategory = useCallback(async (name) => {
    const result = await legislationCategoriesService.createLegislationCategory({
      title: name.trim(),
      status: '1'
    });
    setCategoriesLoaded(false);
    localStorage.removeItem('bvi.legislation.categoriesLoaded');
    localStorage.removeItem('bvi.legislation.categoriesCache');
    try {
      const allCategories = [];
      let currentPage = 1;
      let hasMorePages = true;
      const perPage = 100;

      while (hasMorePages) {
        const response = await legislationCategoriesService.getLegislationCategories(perPage, currentPage);
        if (response.http_status === 404) {
          hasMorePages = false;
        } else if (response.data) {
          let dataArray = [];
          if (Array.isArray(response.data)) {
            dataArray = response.data;
          } else if (response.data.data && Array.isArray(response.data.data)) {
            dataArray = response.data.data;
          }
          allCategories.push(...dataArray);
          const totalPages = response.data?.last_page || 1;
          if (currentPage >= totalPages || dataArray.length === 0) {
            hasMorePages = false;
          } else {
            currentPage++;
          }
        } else {
          hasMorePages = false;
        }
      }
      if (allCategories.length > 0) {
        const apiCategories = allCategories.map(cat => ({
          id: cat.id,
          name: cat.title || cat.name,
          slug: (cat.title || cat.name).toLowerCase().replace(/\s+/g, '-'),
          status: cat.status
        }));
        setCategories(apiCategories);
        setCategoriesLoaded(true);
        localStorage.setItem('bvi.legislation.categoriesLoaded', 'true');
        localStorage.setItem('bvi.legislation.categoriesCache', JSON.stringify(apiCategories));
      }
    } catch (reloadError) {
      console.error('Error reloading categories:', reloadError);
    }
    setIsCategoryModalOpen(false);
    if (pendingCategoryForUploadModal) {
      const newId = result?.data?.id ?? result?.id ?? result?.data?.data?.id;
      if (newId != null) {
        setNewCategoryIdForUploadModal(newId);
      }
      setPendingCategoryForUploadModal(false);
    }
    return result;
  }, [pendingCategoryForUploadModal]);

  const handleDeleteCategory = useCallback((id) => {
    setCategoryToDelete(id);
    setConfirmModalOpen(true);
  }, []);

  const handleConfirmDeleteCategory = useCallback(async () => {
    if (!categoryToDelete) return;

    try {
      await legislationCategoriesService.deleteLegislationCategory(categoryToDelete);

      const updatedCategories = categories.filter(cat => cat.id !== categoryToDelete);
      setCategories(updatedCategories);

      localStorage.setItem('bvi.legislation.categoriesCache', JSON.stringify(updatedCategories));
      localStorage.setItem('bvi.legislation.categoriesLoaded', 'true');

      setConfirmModalOpen(false);
      setCategoryToDelete(null);

      setCategoriesLoaded(false);
      setShouldReloadCategories(true);
    } catch (error) {
      console.error('Error deleting category:', error);
    }
  }, [categoryToDelete, categories]);

  const handleEditCategory = useCallback((id) => {
    const category = categories.find(cat => cat.id === id);
    if (category) {
      setEditingCategory(category);
      setIsCategoryModalOpen(true);
    }
  }, [categories]);

  const handleUpdateCategory = useCallback(async (newName) => {
    if (editingCategory && newName.trim().length >= 3) {
      try {
        await legislationCategoriesService.updateLegislationCategory(editingCategory.id, {
          title: newName.trim(),
          status: editingCategory.status.toString()
        });
        
        await refreshCategories();
        
        setIsCategoryModalOpen(false);
        setEditingCategory(null);
      } catch (error) {
        console.error('Error updating category:', error);
        throw error;
      }
    }
  }, [editingCategory, refreshCategories]);

  const closeCategoryModal = useCallback(() => {
    setIsCategoryModalOpen(false);
    setEditingCategory(null);
  }, []);

  const addCategoryModalBackdropClose = useModalBackdropClose(() => setIsCategoryModalOpen(false));
  const confirmCategoryModalBackdropClose = useModalBackdropClose(() => setConfirmModalOpen(false));

  useBodyScrollLock(isModalOpen || isDeleteConfirmOpen || isSuccessDeleteOpen || isCategoryModalOpen || confirmModalOpen);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_Q);
    const onChange = () => setIsMobile(mql.matches);
    mql.addEventListener?.('change', onChange);
    return () => mql.removeEventListener?.('change', onChange);
  }, []);

  useEffect(() => {
    loadCategoriesFromAPI(true);
  }, []);

  useEffect(() => {
    if (shouldReloadCategories) {
      loadCategoriesFromAPI(true);
      setShouldReloadCategories(false);
    }
  }, [shouldReloadCategories, loadCategoriesFromAPI]);

  useEffect(() => {
    if (editingCategory) {
      setNewCategoryName(editingCategory.name);
    } else {
      setNewCategoryName('');
    }
  }, [editingCategory]);

  useEffect(() => {
    if (!categories.length) {
      setActiveTabId(null);
      saveActiveTabId(null);
      setActiveCategory('');
      return;
    }
    if (!activeTabId || !categories.some(c => c.id === activeTabId)) {
      const next = categories[0].id;
      setActiveTabId(next);
      saveActiveTabId(next);
      setActiveCategory(next);
    }
  }, [categories]);

  useEffect(() => {
    if (activeCategory && activeCategory !== activeTabId) {
      setActiveTabId(activeCategory);
      saveActiveTabId(activeCategory);
    }
  }, [activeCategory, activeTabId]);

  const onSelectCategory = (id) => {
    setActiveTabId(id);
    saveActiveTabId(id);
    setActiveCategory(id);
  };

  const onAddCategory = () => {
    setIsCategoryModalOpen(true);
  };

  const onDeleteCategory = (id) => {
    handleDeleteCategory(id);
    if (id === activeTabId) {
      const remaining = categories.filter(c => c.id !== id);
      const next = remaining[0]?.id || null;
      setActiveTabId(next);
      saveActiveTabId(next);
    }
  };

  const activeCategoryData = useMemo(
    () => categories.find(c => c.id === activeTabId) || null,
    [categories, activeTabId]
  );

  const filteredAttachments = useMemo(() => {
    if (!activeCategory) return [];
    if (!attachments.length) return [];
    return attachments.filter(
      (a) => String(a.legislation_category_id ?? '') === String(activeCategory)
    );
  }, [attachments, activeCategory]);

  const filteredDocuments = useMemo(() => {
    return filteredAttachments.filter(
      (a) => (a.fileUrl && a.fileUrl.trim() !== '') || (a.file && String(a.file).trim() !== '')
    );
  }, [filteredAttachments]);

  const filteredLinks = useMemo(() => {
    const hasFile = (a) => (a.fileUrl && a.fileUrl.trim() !== '') || (a.file && String(a.file).trim() !== '');
    return filteredAttachments.filter((a) => {
      if (hasFile(a)) return false;
      const url = a.linkUrl ?? '';
      return url && url.trim() !== '' && url.trim() !== '#';
    });
  }, [filteredAttachments]);

  const handleAddCategorySubmit = async () => {
    const trimmedName = newCategoryName.trim();
    if (!trimmedName) {
      setCategoryError('Category name is required');
      return;
    }
    if (trimmedName.length < 3) {
      setCategoryError('Category name must be at least 3 characters');
      return;
    }
    
    setIsCategoryLoading(true);
    setCategoryError('');
    
    try {
      if (editingCategory) {
        await handleUpdateCategory(trimmedName);
      } else {
        await handleAddCategory(trimmedName);
      }
      
      setNewCategoryName('');
      setCategoryError('');
      
    } catch (error) {
      console.error('Error creating/updating category:', error);
      setCategoryError(`Something went wrong. Error: ${error.message}`);
    } finally {
      setIsCategoryLoading(false);
    }
  };

  const closeCategoryModalLocal = () => {
    setNewCategoryName('');
    setCategoryError('');
    closeCategoryModal();
  };

  return (
    <div className="legislation-container">
      <div className="legislation-header">
        <div className="legislation-header-title">
          <h1>Legislation</h1>
          <p>Manage legislation files and documents.</p>
        </div>
        {can(user, 'legislation:update') && (
          <div className="legislation-header-actions">
            <button
              className="legislation-edit-btn legislation-edit-btn--desktop"
              onClick={handleUploadClick}
              aria-label="Upload legislation"
            >
              Upload Legislation
            </button>
          </div>
        )}
      </div>

      {isMobile ? (
        <div className="notices-mobile-header" role="region" aria-label="Legislation categories">
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
                    aria-controls="legislationTabPicker">
                    <h2>
                      {activeCategoryData?.name || 'Categories'}
                    </h2>
                    <i className="bi bi-chevron-down" aria-hidden="true"></i>
                  </button>

                  <LegislationTabPicker
                    open={pickerOpen}
                    onClose={() => setPickerOpen(false)}
                    categories={categories}
                    activeTabId={activeTabId}
                    onSelect={onSelectCategory}
                    canManage={can(user, 'legislation:create')}
                    onAddCategory={onAddCategory}
                    onDeleteCategory={onDeleteCategory}
                    onEditCategory={handleEditCategory}
                  />
                </>
              ) : (
                <div className="no-categories-message-mobile">
                  <p>No legislation categories created yet...</p>
                </div>
              )}
            </div>
          )}
          {can(user, 'legislation:create') && (
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
                  {can(user, 'legislation:create') && (
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
                        {can(user, 'legislation:update') && (
                          <button
                            className="category-tab__edit"
                            onClick={(e) => { e.stopPropagation(); handleEditCategory(category.id); }}
                            aria-label="Edit category"
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                        )}
                        {can(user, 'legislation:delete') && (
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
                      <p>No legislation categories created yet...</p>
                    </div>
                  )}
                  {can(user, 'legislation:create') && (
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

      <div className="legislation-attachments">
        {isLoadingAttachments ? (
          <p>Loading files...</p>
        ) : categories.length === 0 ? (
          <EmptyPage
            isAdmin={user?.role === 'admin'}
            title={user?.role === 'admin' ? 'No categories yet!' : 'No categories available.'}
            description={
              user?.role === 'admin'
                ? <>Create your first category to get started with legislation files.</>
                : <>No legislation categories have been created yet.</>
            }
          />
        ) : filteredDocuments.length === 0 && filteredLinks.length === 0 ? (
          <EmptyPage
            isAdmin={user?.role === 'admin'}
            title={user?.role === 'admin' ? 'No files in this category!' : 'No files found.'}
            description={
              user?.role === 'admin'
                ? <>This category is empty. Add your first file or link to get started!</>
                : <>This category doesn't have any files or links yet.</>
            }
          />
        ) : (
          <>
            {filteredDocuments.length > 0 && (
              <section className="legislation-documents-section">
                <h3 className="legislation-section-title">Documents</h3>
                {filteredDocuments.map((attachment) => (
                  <div key={attachment.id} className="attachment-item">
                    <div className="meta">
                      <i className="bi bi-file-earmark attachment-icon" aria-hidden="true"></i>
                      <span className="attachment-title">{attachment.displayTitle || attachment.title}</span>
                    </div>
                    <div className="actions">
                      {can(user, 'legislation:update') && (
                        <>
                          <button
                            className="attachment-edit-btn"
                            onClick={() => handleEditFile(attachment)}
                            aria-label={`Edit ${attachment.title}`}
                          >
                            <i className="bi bi-pencil-square"></i>
                          </button>
                          <button
                            className="attachment-delete-btn"
                            onClick={() => handleDeleteFile(attachment)}
                            aria-label={`Delete ${attachment.title}`}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </>
                      )}
                      <button
                        className="attachment-download-btn"
                        onClick={() => handleDownloadAttachment(attachment)}
                        aria-label={`Download ${attachment.title}`}
                      >
                        <i className="bi bi-download"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </section>
            )}
            {filteredLinks.length > 0 && (
              <section className="legislation-links-section">
                <h3 className="legislation-section-title">Links</h3>
                <ul className="legislation-links-list">
                  {filteredLinks.map((linkItem) => {
                    const href = (linkItem.linkUrl ?? '').trim() || '#';
                    return (
                      <li key={linkItem.id}>
                        <a href={href} target="_blank" rel="noopener noreferrer">
                          <i className="bi bi-link-45deg" aria-hidden="true"></i>
                          <span>{linkItem.displayTitle || linkItem.title}</span>
                        </a>
                        {can(user, 'legislation:update') && (
                          <span className="legislation-link-actions">
                            <button
                              type="button"
                              className="attachment-edit-btn"
                              onClick={() => handleEditFile(linkItem)}
                              aria-label={`Edit ${linkItem.title}`}
                            >
                              <i className="bi bi-pencil-square"></i>
                            </button>
                            <button
                              type="button"
                              className="attachment-delete-btn"
                              onClick={() => handleDeleteFile(linkItem)}
                              aria-label={`Delete ${linkItem.title}`}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </section>
            )}
          </>
        )}
      </div>

      <LegislationUploadFileModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        editFile={editingFile}
        categories={categories}
        onOpenAddCategoryModal={() => {
          setPendingCategoryForUploadModal(true);
          setIsCategoryModalOpen(true);
        }}
        preselectedCategoryId={newCategoryIdForUploadModal}
        onClearPreselectedCategory={() => setNewCategoryIdForUploadModal(null)}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setFileToDelete(null);
          setDeleteError('');
        }}
        onConfirm={handleConfirmDelete}
        message={fileToDelete ? `Are you sure you want to delete "${fileToDelete.title || fileToDelete.displayTitle}"? This action cannot be reversed.` : undefined}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />

      <SuccessDeleteModal
        isOpen={isSuccessDeleteOpen}
        onClose={() => setIsSuccessDeleteOpen(false)}
      />

      {can(user, 'legislation:update') && (
        <div className="legislation-mobile-fab">
          <button
            className="legislation-mobile-fab__btn legislation-mobile-fab__btn--upload"
            onClick={handleUploadClick}
            aria-label="Upload legislation"
          >
            <i className="bi bi-plus" aria-hidden="true"></i>
          </button>
        </div>
      )}

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
              <p>This will permanently delete the category and all its files.</p>

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
    </div>
  );
};

export { Legislation };
