import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { isValidUrl } from '../../helpers/urlValidation';
import ModalLifecycleLock from './ModalLifecycleLock';
import legislationService from '../../services/legislationService';
import '../../styles/components/LegislationEditModal.scss';

const createEmptyLink = () => ({
  id: `link-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  url: ''
});

const sanitizeFileName = (title) => {
  const fallback = `document-${Date.now()}`;
  const trimmed = (title || '').trim();
  const base = trimmed ? trimmed : fallback;
  const slug = base
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return slug ? `${slug}.pdf` : `${fallback}.pdf`;
};

const deriveDisplayTitleFromFileName = (name = '') => {
  if (!name) return '';
  const decoded = decodeURIComponent(name);
  const withoutExt = decoded.replace(/\.pdf$/i, '');
  return withoutExt
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());
};

const createEmptyFileRow = () => ({
  id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  title: '',
  file: null,
  fileName: '',
  fileUrl: null,
  isExisting: false
});

const normalizeExistingFiles = (rawFiles = []) => {
  if (!Array.isArray(rawFiles)) return [];

  return rawFiles
    .map((item, index) => {
      if (!item) return null;

      const id =
        (typeof item === 'object' && item.id) ?
          `existing-${item.id}` :
          `existing-file-${index}`;

      let fileUrl = '';
      let fileName = '';
      let title = '';

      if (typeof item === 'object') {
        fileUrl = item.file || item.fileUrl || item.url || '';
        fileName = item.fileName || (fileUrl ? fileUrl.split('/').pop() : '');
        title = item.title || item.displayTitle || deriveDisplayTitleFromFileName(fileName);
      } else if (typeof item === 'string') {
        fileUrl = item;
        fileName = fileUrl.split('/').pop() || '';
        title = deriveDisplayTitleFromFileName(fileName);
      }

      return {
        id,
        title: title || '',
        file: null,
        fileName: fileName || '',
        fileUrl: fileUrl || '',
        isExisting: true
      };
    })
    .filter(Boolean);
};

const resolveFileDownloadUrl = (rawUrl) => {
  if (!rawUrl || typeof rawUrl !== 'string') return null;

  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl;
  }

  const baseURL = legislationService?.baseURL || '';
  if (!baseURL) return rawUrl;

  const isBaseRelative = baseURL.startsWith('/');
  const sanitizedBase = baseURL.endsWith('/')
    ? baseURL.slice(0, -1)
    : baseURL;

  if (isBaseRelative && rawUrl.startsWith('/')) {
    return rawUrl;
  }

  const sanitizedPath = rawUrl.startsWith('/')
    ? rawUrl.slice(1)
    : rawUrl;

  return `${sanitizedBase}/${sanitizedPath}`;
};

const getDownloadHeaders = () => {
  try {
    const token = typeof legislationService.getToken === 'function'
      ? legislationService.getToken()
      : null;

    if (!token) return {};

    return {
      Authorization: `Bearer ${token}`,
    };
  } catch (error) {
    console.warn('LegislationEditModal.getDownloadHeaders: failed to build auth headers', error);
    return {};
  }
};

const LegislationEditModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [links, setLinks] = useState(() => [createEmptyLink()]);
  const [fileRows, setFileRows] = useState(() => [createEmptyFileRow()]);
  const [existingFiles, setExistingFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [removedFiles, setRemovedFiles] = useState([]);
  const [errors, setErrors] = useState({});
  const [missingRequired, setMissingRequired] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bannerRef = useRef(null);
  const fileInputRefs = useRef({});
  
  const modalBackdropClose = useModalBackdropClose(onClose);
  
  useBodyScrollLock(isOpen);

  const makeLink = (title = '', url = '') => ({
    ...createEmptyLink(),
    title,
    url
  });

  const normalizeLinks = (rawLinks, fallbackLink) => {
    const normalized = [];

    if (Array.isArray(rawLinks)) {
      rawLinks.forEach((item) => {
        if (!item) return;

        if (typeof item === 'object') {
          const title = (item.title || '').trim();
          const url = (item.url || item.href || '').trim();
          if (title || url) {
            normalized.push(makeLink(title, url));
          }
        } else if (typeof item === 'string') {
          const url = item.trim();
          if (url) {
            normalized.push(makeLink('', url));
          }
        }
      });
    }

    if (fallbackLink && typeof fallbackLink === 'string') {
      const trimmed = fallbackLink.trim();
      if (trimmed && !normalized.some(link => link.url === trimmed)) {
        normalized.push(makeLink('', trimmed));
      }
    }

    return normalized.length > 0 ? normalized : [createEmptyLink()];
  };

  // Inicializar datos desde props al abrir el modal
  useEffect(() => {
    if (isOpen) {
      const initialLinks = initialData
        ? normalizeLinks(initialData?.links, initialData?.link)
        : [createEmptyLink()];

      const normalizedExisting = normalizeExistingFiles(initialData?.files);

      setLinks(initialLinks.length > 0 ? initialLinks : [createEmptyLink()]);
      setExistingFiles(normalizedExisting);
      setNewFiles([]);
      setRemovedFiles([]);
      setFileRows(normalizedExisting.length > 0 ? [...normalizedExisting] : [createEmptyFileRow()]);
      setErrors({});
      setMissingRequired([]);
    } else {
      setLinks([createEmptyLink()]);
      setExistingFiles([]);
      setNewFiles([]);
      setRemovedFiles([]);
      setFileRows([createEmptyFileRow()]);
      setErrors({});
      setMissingRequired([]);
    }
  }, [isOpen, initialData]);

  const handleFileInputChange = (fileRowId, event) => {
    const files = Array.from(event.target.files || []);
    handleFilesSelect(fileRowId, files);
    event.target.value = '';
  };

  const handleFilesSelect = (fileRowId, fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];

    const maxSize = 15 * 1024 * 1024; // 15MB in bytes (según backend)
    const allowedTypes = ['application/pdf'];

    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, files: `${file.name}: File size must be less than 15MB` }));
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, files: `${file.name}: Only PDF files are allowed` }));
      return;
    }

    setErrors(prev => ({ ...prev, files: '' }));

    const targetRow = fileRows.find(row => row.id === fileRowId);
    const currentTitle = targetRow ? (targetRow.title || '') : '';

    if (targetRow?.isExisting) {
      setRemovedFiles(prev => (prev.includes(fileRowId) ? prev : [...prev, fileRowId]));
      setExistingFiles(prev => prev.filter(fileEntry => fileEntry.id !== fileRowId));
    }

    setFileRows(prev => prev.map(row => {
      if (row.id !== fileRowId) return row;
      return {
        ...row,
        file,
        fileName: file.name,
        fileUrl: null,
        isExisting: false
      };
    }));

    setNewFiles(prev => {
      const existing = prev.find(f => f.id === fileRowId);
      if (existing) {
        return prev.map(f => f.id === fileRowId ? { ...f, file, fileName: file.name, title: currentTitle } : f);
      }
      return [...prev, { id: fileRowId, file, fileName: file.name, title: currentTitle }];
    });
  };

  const handleLinkFieldChange = (linkId, field, value) => {
    setLinks(prev => {
      const updated = prev.map(link => (
        link.id === linkId ? { ...link, [field]: value } : link
      ));

      validateLinks(updated);
      return updated;
    });
  };

  const handleAddLinkRow = () => {
    setLinks(prev => [...prev, createEmptyLink()]);
  };

  const handleRemoveLinkRow = (linkId) => {
    setLinks(prev => {
      const next = prev.filter(link => link.id !== linkId);
      const normalized = next.length > 0 ? next : [createEmptyLink()];
      validateLinks(normalized);
      return normalized;
    });
  };

  // Actualizar título de un archivo
  const handleFileTitleChange = (fileRowId, title) => {
    setFileRows(prev => prev.map(row => (
      row.id === fileRowId ? { ...row, title } : row
    )));

    setNewFiles(prev => prev.map(fileEntry => (
      fileEntry.id === fileRowId ? { ...fileEntry, title } : fileEntry
    )));

    setExistingFiles(prev => prev.map(fileEntry => (
      fileEntry.id === fileRowId ? { ...fileEntry, title } : fileEntry
    )));
  };

  // Eliminar archivo (marcar como removido si es existente, eliminar si es nuevo)
  const handleRemoveFile = (fileRowId) => {
    const targetRow = fileRows.find(row => row.id === fileRowId);

    setFileRows(prev => {
      const filtered = prev.filter(row => row.id !== fileRowId);
      return filtered.length > 0 ? filtered : [createEmptyFileRow()];
    });

    if (targetRow?.isExisting) {
      setExistingFiles(prev => prev.filter(f => f.id !== fileRowId));
      setRemovedFiles(prev => (prev.includes(fileRowId) ? prev : [...prev, fileRowId]));
    } else {
      setNewFiles(prev => prev.filter(f => f.id !== fileRowId));
    }

    if (fileInputRefs.current[fileRowId]) {
      delete fileInputRefs.current[fileRowId];
    }
  };

  const handleAddFileRow = () => {
    setFileRows(prev => [...prev, createEmptyFileRow()]);
  };

  const handleSelectFileClick = (fileRowId) => {
    const input = fileInputRefs.current[fileRowId];
    if (input) {
      input.click();
    }
  };

  const createFileFromExistingUrl = async (row, sanitizedFileName, displayTitle) => {
    try {
      const downloadUrl = resolveFileDownloadUrl(row.fileUrl);
      if (!downloadUrl) {
        throw new Error('Missing file URL for existing attachment.');
      }

      const response = await fetch(downloadUrl, {
        method: 'GET',
        credentials: 'include',
        headers: {
          ...getDownloadHeaders(),
        }
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch existing file: ${response.status}`);
      }
      const blob = await response.blob();
      const fileType = blob.type || 'application/pdf';
      const fileNameToUse = sanitizedFileName || row.fileName || sanitizeFileName(displayTitle || 'document');
      return new File([blob], fileNameToUse, { type: fileType });
    } catch (error) {
      console.error('Error fetching existing file for submission:', error);
      throw new Error(displayTitle
        ? `Failed to retrieve the existing file "${displayTitle}". Please try again.`
        : 'Failed to retrieve one of the existing files. Please try again.');
    }
  };

  const populatedFileRows = useMemo(
    () => fileRows.filter(row => row.file || row.fileUrl),
    [fileRows]
  );

  const lastFileRow = fileRows[fileRows.length - 1];
  const canAddAnotherFile =
    !!lastFileRow &&
    (lastFileRow.title || '').trim().length > 0 &&
    (!!lastFileRow.file || !!lastFileRow.fileUrl);

  const lastLink = links.length > 0 ? links[links.length - 1] : null;
  const canAddAnotherLink =
    !!lastLink &&
    (lastLink.title || '').trim().length > 0 &&
    (lastLink.url || '').trim().length > 0;

  const validateLinks = (linksToCheck) => {
    const sanitized = (linksToCheck || []).map(link => ({
      title: (link.title || '').trim(),
      url: (link.url || '').trim()
    }));

    const hasInvalidUrl = sanitized.some(link => link.url && !isValidUrl(link.url));
    const hasIncomplete = sanitized.some(link =>
      (link.title && !link.url) || (link.url && !link.title)
    );

    if (hasInvalidUrl) {
      setErrors(prev => ({ ...prev, links: 'All link URLs must be valid' }));
      return false;
    }

    if (hasIncomplete) {
      setErrors(prev => ({ ...prev, links: 'Links with a title must include a URL' }));
      return false;
    }

    setErrors(prev => ({ ...prev, links: '' }));
    return true;
  };

  // Validation function
  const validateRequired = () => {
    const missing = [];

    const hasFiles = populatedFileRows.length > 0;

    const filesWithoutTitle = populatedFileRows.filter(f => !(f.title || '').trim());
    if (filesWithoutTitle.length > 0) {
      missing.push('All files must have a title');
      setErrors(prev => ({ ...prev, files: 'All files must have a title.' }));
    } else {
      setErrors(prev => ({ ...prev, files: '' }));
    }

    if (!validateLinks(links)) {
      missing.push('Review link fields');
    }

    if (!hasFiles && !links.some(link => (link.url || '').trim())) {
      missing.push('Add at least one file or link');
    }

    setMissingRequired(missing);
    return missing.length === 0;
  };

  // Reactive validation
  useEffect(() => {
    if (isOpen) {
      validateRequired();
    }
  }, [links, fileRows, isOpen]);

  const handleSave = async () => {
    if (!validateRequired()) {
      bannerRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Preparar archivos finales para enviar (existentes + nuevos)
      const filesToSend = [];
      const titlesToSend = [];
      const removedIdsSet = new Set(removedFiles);

      for (const row of fileRows) {
        const hasContent = !!row.file || !!row.fileUrl;
        if (!hasContent) continue;
        if (removedIdsSet.has(row.id)) continue;

        const titleTrimmed = (row.title || '').trim();
        const titleForFallback =
          titleTrimmed ||
          deriveDisplayTitleFromFileName(row.fileName) ||
          (row.isExisting ? deriveDisplayTitleFromFileName(row.fileUrl?.split('/').pop() || '') : '') ||
          'Documento';
        const sanitizedFileName = sanitizeFileName(titleForFallback);

        if (row.file) {
          const fileType = row.file.type || 'application/pdf';
          const renamedFile = new File([row.file], sanitizedFileName, { type: fileType });
          filesToSend.push(renamedFile);
          titlesToSend.push(titleTrimmed || titleForFallback);
        } else if (row.isExisting && row.fileUrl) {
          const existingFile = await createFileFromExistingUrl(row, sanitizedFileName, titleForFallback);
          filesToSend.push(existingFile);
          titlesToSend.push(titleTrimmed || titleForFallback);
        }
      }

      const linksToInclude = links
        .map(link => ({
          title: (link.title || '').trim(),
          url: (link.url || '').trim()
        }))
        .filter(link => link.title || link.url)
        .filter(link => link.url && isValidUrl(link.url));

      // Preparar datos para enviar al backend
      const backendData = {
        files: filesToSend,
        links: linksToInclude.length > 0 ? linksToInclude : undefined,
        titles:
          filesToSend.length > 0
            ? titlesToSend.slice(0, filesToSend.length)
            : (removedFiles.length > 0 && populatedFileRows.length === 0 ? [] : undefined)
      };

      // Enviar al backend
      await legislationService.updateLegislation(backendData);

      // Llamar callback para refrescar
      if (onSave && typeof onSave === 'function') {
        onSave();
      }
      
      handleClose();
    } catch (error) {
      console.error('Error updating legislation:', error);
      setErrors({ 
        submit: error.message || 'Error al actualizar legislación. Por favor intente nuevamente.' 
      });
      bannerRef.current?.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setLinks([createEmptyLink()]);
    setExistingFiles([]);
    setNewFiles([]);
    setRemovedFiles([]);
    setErrors({});
    setMissingRequired([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="legislation-edit-modal-overlay"
      role="presentation"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="legislation-edit-modal"
        role="dialog"
        aria-modal="true"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
      >
        <button
          type="button"
          className="legislation-edit-modal__close"
          aria-label="Close"
          onClick={handleClose}
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>

        <header className="legislation-edit-modal__header">
          <h2 className="legislation-edit-modal__title">Upload Legislation</h2>
          <p className="legislation-edit-modal__subtitle">Add legislation links or supporting documents</p>
        </header>

        <div className="legislation-edit-modal__body">
          <div className="form-group">
            <label>Links</label>
            <div className="links-list">
              {links.map((link) => (
                <div className="link-row" key={link.id}>
                  <div className="link-field">
                    <label htmlFor={`link-title-${link.id}`}>Link Title</label>
                    <input
                      id={`link-title-${link.id}`}
                      type="text"
                      value={link.title}
                      onChange={(e) => handleLinkFieldChange(link.id, 'title', e.target.value)}
                      placeholder="Enter link title"
                      className="form-input"
                    />
                  </div>
                  <div className="link-field">
                    <label htmlFor={`link-url-${link.id}`}>Link URL</label>
                    <input
                      id={`link-url-${link.id}`}
                      type="url"
                      value={link.url}
                      onChange={(e) => handleLinkFieldChange(link.id, 'url', e.target.value)}
                      placeholder="https://example.com/resource"
                      className="form-input"
                    />
                  </div>
                  <button
                    type="button"
                    className="link-remove-btn"
                    onClick={() => handleRemoveLinkRow(link.id)}
                    aria-label={link.title ? `Remove link ${link.title}` : 'Remove link'}
                    disabled={links.length === 1}
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </div>
              ))}
            </div>
            <div className="link-actions">
              <button
                type="button"
                className="add-link-btn"
                onClick={handleAddLinkRow}
                disabled={!canAddAnotherLink}
              >
                <i className="bi bi-plus-lg"></i>
                Add new link
              </button>
            </div>
            {errors.links && (
              <div className="error-message">{errors.links}</div>
            )}
          </div>

          <div className="form-group">
            <h3 className="form-group__title">Attachment Files</h3>
            <div className="files-list">
              {fileRows.map((fileItem) => (
                <div key={fileItem.id} className="file-item-banner">
                  <div className="file-item-content">
                    <div className="file-item-info">
                      <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                      <div className="file-item-details">
                        <label htmlFor={`file-title-${fileItem.id}`} className="file-title-label">File Title</label>
                        <input
                          id={`file-title-${fileItem.id}`}
                          type="text"
                          className="file-title-input"
                          value={fileItem.title}
                          onChange={(e) => handleFileTitleChange(fileItem.id, e.target.value)}
                          placeholder="Enter file title..."
                        />
                        <div className="file-upload-row">
                          <input
                            ref={(element) => {
                              if (element) {
                                fileInputRefs.current[fileItem.id] = element;
                              } else {
                                delete fileInputRefs.current[fileItem.id];
                              }
                            }}
                            type="file"
                            accept="application/pdf"
                            className="hidden-file-input"
                            onChange={(event) => handleFileInputChange(fileItem.id, event)}
                          />
                          <button
                            type="button"
                            className="file-select-btn"
                            onClick={() => handleSelectFileClick(fileItem.id)}
                          >
                            Select file
                          </button>
                          <span className="file-name">
                            {(fileItem.isExisting && !fileItem.file) ? '(Existing) ' : ''}
                            {fileItem.fileName || 'No uploaded file'}
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="file-remove-btn"
                      onClick={() => handleRemoveFile(fileItem.id)}
                      aria-label={`Remove ${fileItem.fileName || 'file'}`}
                      disabled={fileRows.length === 1 && !fileItem.file && !fileItem.fileUrl}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="file-actions">
              <button
                type="button"
                className="add-file-btn"
                onClick={handleAddFileRow}
                disabled={!canAddAnotherFile}
              >
                <i className="bi bi-plus-lg"></i>
                Add new file
              </button>
            </div>
            {errors.files && (
              <div className="error-message">{errors.files}</div>
            )}
          </div>
        </div>

        <div className="legislation-edit-modal__footer">
          {missingRequired.length > 0 && (
            <div
              className="app-form__error-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              ref={bannerRef}
            >
              <strong>Please fill all required fields:</strong> {missingRequired.join(', ')}
            </div>
          )}
          {errors.submit && (
            <div
              className="app-form__error-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              ref={bannerRef}
            >
              <strong>Error:</strong> {errors.submit}
            </div>
          )}
          <button
            type="button"
            className="btn update-now-btn"
            onClick={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegislationEditModal;
