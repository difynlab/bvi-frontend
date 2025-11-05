import React, { useState, useRef, useEffect } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import RichTextEditor from '../editor/RichTextEditor';
import { isValidUrl } from '../../helpers/urlValidation';
import ModalLifecycleLock from './ModalLifecycleLock';
import { pdf } from '@react-pdf/renderer';
import LegislationPDFDocument from '../pdf/LegislationPDFDocument';
import legislationService from '../../services/legislationService';
import '../../styles/components/LegislationEditModal.scss';

const LegislationEditModal = ({ isOpen, onClose, onSave, existingAttachments = [] }) => {
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [missingRequired, setMissingRequired] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const bannerRef = useRef(null);
  
  const fileInputRef = useRef(null);
  
  const modalBackdropClose = useModalBackdropClose(onClose);
  
  useBodyScrollLock(isOpen);

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
    
    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleFileSelect = (file) => {
    const maxSize = 200 * 1024 * 1024; // 200MB in bytes
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, file: 'File size must be less than 200MB' }));
      return;
    }

    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, file: 'Please select a valid document file (PDF, DOC, DOCX, TXT, XLS, XLSX)' }));
      return;
    }

    setSelectedFile(file);
    setFileName(file.name);
    setErrors(prev => ({ ...prev, file: '' }));
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleLinkChange = (e) => {
    const value = e.target.value;
    setLinkUrl(value);
    // No mostrar error mientras escribe, solo limpiar si es válido
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

  // Validation function - todos opcionales, pero al menos uno debe estar presente
  const validateRequired = () => {
    const missing = [];
    
    // Verificar que al menos uno de los 3 campos esté presente
    const hasDescription = (description || '').trim().length > 0;
    const hasFile = !!selectedFile;
    const hasLink = linkUrl.trim().length > 0;
    
    // Si hay un link, debe ser válido
    if (hasLink && !isValidUrl(linkUrl)) {
      missing.push('Link URL must be a valid URL');
    }
    
    // Al menos uno de los 3 debe estar presente
    if (!hasDescription && !hasFile && !hasLink) {
      missing.push('At least one field (Description, File Upload, or Link Upload) is required');
    }
    
    setMissingRequired(missing);
    return missing.length === 0;
  };

  // Reactive validation
  useEffect(() => {
    if (missingRequired.length) validateRequired();
  }, [description, selectedFile, linkUrl]);

  const validateForm = () => {
    const newErrors = {};
    
    // Verificar que al menos uno de los 3 campos esté presente
    const hasDescription = (description || '').trim().length > 0;
    const hasFile = !!selectedFile;
    const hasLink = linkUrl.trim().length > 0;
    
    // Si hay un link, debe ser válido
    if (hasLink && !isValidUrl(linkUrl)) {
      newErrors.link = 'Please enter a valid URL';
    }
    
    // Al menos uno de los 3 debe estar presente
    if (!hasDescription && !hasFile && !hasLink) {
      newErrors.descriptionOrFile = 'At least one field (Description, File Upload, or Link Upload) is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateRequired()) {
      bannerRef.current?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // Si no se adjunta archivo, NO generar PDF: enviar files[] vacío
      const fileToSend = selectedFile ? selectedFile : null;

      // Preparar datos para enviar al backend
      const backendData = {
        description: description.trim(),
        link: linkUrl.trim(),
        files: fileToSend ? [fileToSend] : []
      };

      // Enviar al backend
      await legislationService.updateLegislation(backendData);

      // Si es exitoso, actualizar estado local
      // Generate automatic title based on existing attachments
      const generateSupportDocumentTitle = (attachments) => {
        if (!attachments || attachments.length === 0) {
          return 'Support Document 1';
        }

        const numbers = attachments
          .map(attachment => {
            const match = attachment.title?.match(/Support Document (\d+)/i);
            return match ? parseInt(match[1], 10) : 0;
          })
          .filter(num => num > 0);

        const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
        return `Support Document ${maxNumber + 1}`;
      };

      const newAttachment = {
        id: `attachment-${Date.now()}`,
        title: generateSupportDocumentTitle(existingAttachments),
        descriptionHTML: description,
        fileUrl: fileToSend ? URL.createObjectURL(fileToSend) : '',
        fileName: fileToSend ? fileToSend.name : fileName,
        linkUrl: linkUrl,
        createdAt: new Date().toISOString()
      };

      onSave(newAttachment);
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
    setSelectedFile(null);
    setFileName('');
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
          <h2 className="legislation-edit-modal__title">Add New Attachment</h2>
          <p className="legislation-edit-modal__subtitle">Upload a new document to the legislation</p>
        </header>

        <div className="legislation-edit-modal__body">
          <div className="form-group">
            <label>Description</label>
            <RichTextEditor
              initialHtml=""
              onChange={handleDescriptionChange}
              placeholder="Enter attachment description..."
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
            <label>File Upload</label>
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
                accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
                onChange={handleFileInputChange}
                className="hidden-file-input"
                aria-hidden="true"
              />
              <label htmlFor="file" className="file-input-label">
                Choose file
              </label>
              <p className="file-status">
                {fileName || 'No file chosen'}
              </p>
            </div>
            {errors.file && (
              <div className="error-message">{errors.file}</div>
            )}
          </div>

          <div className="form-group">
            <label>Link Upload</label>
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
