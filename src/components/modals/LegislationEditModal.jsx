import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import RichTextEditor from '../editor/RichTextEditor';
import { isValidUrl } from '../../helpers/urlValidation';
import ModalLifecycleLock from './ModalLifecycleLock';
import legislationService from '../../services/legislationService';
import '../../styles/components/LegislationEditModal.scss';

const LegislationEditModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [errors, setErrors] = useState({});
  const [missingRequired, setMissingRequired] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bannerRef = useRef(null);
  
  const fileInputRef = useRef(null);
  
  // Estado para archivos existentes del servidor
  const [existingFiles, setExistingFiles] = useState([]);
  // Estado para archivos nuevos (File objects)
  const [newFiles, setNewFiles] = useState([]);
  // Archivos eliminados (IDs o índices)
  const [removedFiles, setRemovedFiles] = useState([]);
  
  const modalBackdropClose = useModalBackdropClose(onClose);
  
  useBodyScrollLock(isOpen);

  // Inicializar datos desde props al abrir el modal
  useEffect(() => {
    if (isOpen && initialData) {
      // Cargar description
      setDescription(initialData?.description || '');
      
      // Cargar link
      setLinkUrl(initialData?.link || '');
      
      // Cargar archivos existentes del servidor
      const files = Array.isArray(initialData?.files) ? initialData.files : [];
      const fileList = files.map((fileItem, index) => {
        // El backend puede retornar fileItem como objeto { title, file } o como string (URL)
        if (typeof fileItem === 'object' && fileItem !== null) {
          return {
            id: `existing-${index}`,
            title: fileItem.title || `Document ${index + 1}`,
            fileUrl: fileItem.file || fileItem.fileUrl || '',
            fileName: (fileItem.file || fileItem.fileUrl || '').split('/').pop() || `document-${index + 1}.pdf`,
            isExisting: true
          };
        } else if (typeof fileItem === 'string') {
          // Si es solo una URL string
          return {
            id: `existing-${index}`,
            title: `Document ${index + 1}`,
            fileUrl: fileItem,
            fileName: fileItem.split('/').pop() || `document-${index + 1}.pdf`,
            isExisting: true
          };
        }
        return null;
      }).filter(Boolean);
      
      setExistingFiles(fileList);
    } else if (isOpen && !initialData) {
      // Si no hay datos iniciales, resetear
      setDescription('');
      setLinkUrl('');
      setExistingFiles([]);
    }
    
    // Reset al cerrar
    if (!isOpen) {
      setDescription('');
      setLinkUrl('');
      setExistingFiles([]);
      setNewFiles([]);
      setRemovedFiles([]);
      setErrors({});
      setMissingRequired([]);
      setIsDragOver(false);
    }
  }, [isOpen, initialData]);

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFilesSelect(files);
    }
  };

  const handleFileInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFilesSelect(files);
    }
    // Reset input para permitir seleccionar el mismo archivo de nuevo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFilesSelect = (files) => {
    const maxSize = 15 * 1024 * 1024; // 15MB in bytes (según backend)
    const allowedTypes = ['application/pdf'];
    
    const validFiles = [];
    const fileErrors = [];
    
    files.forEach((file, index) => {
      if (file.size > maxSize) {
        fileErrors.push(`${file.name}: File size must be less than 15MB`);
        return;
      }
      
      if (!allowedTypes.includes(file.type)) {
        fileErrors.push(`${file.name}: Only PDF files are allowed`);
        return;
      }
      
      validFiles.push({
        id: `new-${Date.now()}-${index}`,
        file: file,
        title: '',
        fileName: file.name,
        isExisting: false
      });
    });
    
    if (fileErrors.length > 0) {
      setErrors(prev => ({ ...prev, files: fileErrors.join(', ') }));
    } else {
      setErrors(prev => ({ ...prev, files: '' }));
      setNewFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleLinkChange = (e) => {
    const value = e.target.value;
    setLinkUrl(value);
    if (!value || isValidUrl(value)) {
      setErrors(prev => ({ ...prev, link: '' }));
    }
  };

  const handleDescriptionChange = (data) => {
    const htmlContent = data?.html || '';
    setDescription(htmlContent);
    if (htmlContent.trim()) {
      setErrors(prev => ({ ...prev, description: '' }));
    }
  };

  // Actualizar título de un archivo
  const handleFileTitleChange = (fileId, title) => {
    // Buscar en archivos existentes
    const existingIndex = existingFiles.findIndex(f => f.id === fileId);
    if (existingIndex !== -1) {
      setExistingFiles(prev => prev.map((f, idx) => 
        idx === existingIndex ? { ...f, title } : f
      ));
      return;
    }
    
    // Buscar en archivos nuevos
    const newIndex = newFiles.findIndex(f => f.id === fileId);
    if (newIndex !== -1) {
      setNewFiles(prev => prev.map((f, idx) => 
        idx === newIndex ? { ...f, title } : f
      ));
    }
  };

  // Eliminar archivo (marcar como removido si es existente, eliminar si es nuevo)
  const handleRemoveFile = (fileId) => {
    // Si es archivo existente, marcarlo como removido
    const existingIndex = existingFiles.findIndex(f => f.id === fileId);
    if (existingIndex !== -1) {
      setRemovedFiles(prev => [...prev, fileId]);
      return;
    }
    
    // Si es archivo nuevo, eliminarlo directamente
    setNewFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Todos los archivos visibles (existentes no removidos + nuevos)
  const visibleFiles = useMemo(() => {
    const existing = existingFiles.filter(f => !removedFiles.includes(f.id));
    return [...existing, ...newFiles];
  }, [existingFiles, newFiles, removedFiles]);

  // Validation function
  const validateRequired = () => {
    const missing = [];
    
    const hasDescription = (description || '').trim().length > 0;
    const hasFiles = visibleFiles.length > 0;
    const hasLink = linkUrl.trim().length > 0;
    
    // Validar que todos los archivos tengan título
    const filesWithoutTitle = visibleFiles.filter(f => !f.title || f.title.trim() === '');
    if (filesWithoutTitle.length > 0) {
      missing.push('All files must have a title');
    }
    
    // Si hay un link, debe ser válido
    if (hasLink && !isValidUrl(linkUrl)) {
      missing.push('Link URL must be a valid URL');
    }
    
    // Al menos uno de los 3 debe estar presente
    if (!hasDescription && !hasFiles && !hasLink) {
      missing.push('At least one field (Description, Files, or Link) is required');
    }
    
    setMissingRequired(missing);
    return missing.length === 0;
  };

  // Reactive validation
  useEffect(() => {
    if (isOpen) {
      validateRequired();
    }
  }, [description, visibleFiles, linkUrl, isOpen]);

  const handleSave = async () => {
    if (!validateRequired()) {
      bannerRef.current?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      // Preparar archivos nuevos (File objects) - solo los nuevos
      const filesToSend = newFiles.map(f => f.file).filter(Boolean);
      
      // Preparar títulos correspondientes - solo para los archivos nuevos
      // El backend espera que titles[i] corresponda a files[i]
      const titles = newFiles.map(f => f.title.trim()).filter((title, idx) => {
        // Solo incluir títulos para archivos que tienen título
        return title && filesToSend[idx];
      });
      
      // Preparar links (array)
      const links = linkUrl.trim() ? [linkUrl.trim()] : [];
      
      // Determinar si debemos enviar archivos:
      // - Si hay archivos nuevos: enviar los nuevos (el backend reemplazará todos)
      // - Si se eliminaron archivos existentes pero no hay nuevos: enviar array vacío (eliminar todos)
      // - Si no hay cambios en archivos: no enviar el campo files (mantener existentes)
      const hasRemovedFiles = removedFiles.length > 0;
      const hasNewFiles = filesToSend.length > 0;
      let filesToInclude = undefined;
      let titlesToInclude = undefined;
      
      if (hasNewFiles) {
        // Hay archivos nuevos: enviar los nuevos (reemplazará todos)
        filesToInclude = filesToSend;
        titlesToInclude = titles.length > 0 ? titles : undefined;
      } else if (hasRemovedFiles && existingFiles.length === removedFiles.length) {
        // Se eliminaron todos los archivos existentes: enviar array vacío
        filesToInclude = [];
        titlesToInclude = undefined;
      }
      // Si no hay cambios en archivos, no enviamos el campo files (undefined)
      
      // Preparar datos para enviar al backend
      const backendData = {
        description: description.trim() || undefined,
        files: filesToInclude,
        titles: titlesToInclude,
        links: links.length > 0 ? links : undefined
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
    setDescription('');
    setLinkUrl('');
    setExistingFiles([]);
    setNewFiles([]);
    setRemovedFiles([]);
    setErrors({});
    setMissingRequired([]);
    setIsDragOver(false);
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
          <h2 className="legislation-edit-modal__title">Edit Legislation</h2>
          <p className="legislation-edit-modal__subtitle">Update legislation documents and information</p>
        </header>

        <div className="legislation-edit-modal__body">
          <>
              <div className="form-group">
                <label>Description</label>
                <RichTextEditor
                  initialHtml={description}
                  onChange={handleDescriptionChange}
                  placeholder="Enter legislation description..."
                  className="legislation-edit-modal__editor"
                />
                {errors.description && (
                  <div className="error-message">{errors.description}</div>
                )}
                {errors.descriptionOrFile && (
                  <div className="error-message">{errors.descriptionOrFile}</div>
                )}
              </div>

              <div className="form-group">
                <label>Files</label>
                
                {/* Mostrar archivos existentes y nuevos */}
                {visibleFiles.length > 0 && (
                  <div className="files-list">
                    {visibleFiles.map((fileItem) => (
                      <div key={fileItem.id} className="file-item-banner">
                        <div className="file-item-info">
                          <i className="bi bi-file-earmark-pdf" style={{ marginRight: '8px', color: '#dc2626' }}></i>
                          <div className="file-item-details">
                            <input
                              type="text"
                              className="file-title-input"
                              value={fileItem.title}
                              onChange={(e) => handleFileTitleChange(fileItem.id, e.target.value)}
                              placeholder="Enter file title..."
                            />
                            <span className="file-name">
                              {fileItem.isExisting ? '(Existing) ' : ''}{fileItem.fileName}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className="file-remove-btn"
                          onClick={() => handleRemoveFile(fileItem.id)}
                          aria-label={`Remove ${fileItem.fileName}`}
                        >
                          <i className="bi bi-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Dropzone para agregar nuevos archivos */}
                <div
                  className={`dropzone ${isDragOver ? 'drag-over' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <input
                    ref={fileInputRef}
                    id="file"
                    type="file"
                    accept="application/pdf"
                    multiple
                    onChange={handleFileInputChange}
                    className="hidden-file-input"
                    aria-hidden="true"
                  />
                  <label htmlFor="file" className="file-input-label">
                    Choose files
                  </label>
                  <p className="file-status">
                    Drag and drop PDF files here or click to browse
                  </p>
                  <p className="file-hint">
                    Maximum 15MB per file. Only PDF files are allowed.
                  </p>
                </div>
                {errors.files && (
                  <div className="error-message">{errors.files}</div>
                )}
              </div>

              <div className="form-group">
                <label>Link</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={handleLinkChange}
                  placeholder="https://example.com/document.pdf"
                  className="form-input"
                />
                {errors.link && (
                  <div className="error-message">{errors.link}</div>
                )}
              </div>
          </>
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
