import React, { useState, useRef, useEffect } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import RichTextEditor from '../editor/RichTextEditor';
import { isValidUrl } from '../../helpers/urlValidation';
import ModalLifecycleLock from './ModalLifecycleLock';
import '../../styles/components/LegislationEditModal.scss';

const LegislationEditModal = ({ isOpen, onClose, onSave, existingAttachments = [] }) => {
  const [description, setDescription] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [errors, setErrors] = useState({});
  const [missingRequired, setMissingRequired] = useState([]);
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
    
    if (value && !isValidUrl(value)) {
      setErrors(prev => ({ ...prev, link: 'Please enter a valid URL' }));
    } else {
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

  // Required fields validation
  const REQUIRED = [
    { key: 'description', label: 'Description', test: () => (description || '').trim().length > 0 },
    { key: 'file', label: 'File Upload', test: () => !!selectedFile },
    { key: 'link', label: 'Link URL', test: () => (linkUrl || '').trim().length > 0 && isValidUrl(linkUrl) }
  ];

  // Validation function
  const validateRequired = () => {
    const missing = REQUIRED.filter(r => !r.test()).map(r => r.label);
    setMissingRequired(missing);
    return missing.length === 0;
  };

  // Reactive validation
  useEffect(() => {
    if (missingRequired.length) validateRequired();
  }, [description, selectedFile, linkUrl]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!selectedFile) {
      newErrors.file = 'File upload is required';
    }
    
    if (!linkUrl.trim()) {
      newErrors.link = 'Link URL is required';
    } else if (!isValidUrl(linkUrl)) {
      newErrors.link = 'Please enter a valid URL';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (!validateRequired()) {
      bannerRef.current?.focus();
      return;
    }

    // Generate automatic title based on existing attachments
    const generateSupportDocumentTitle = (attachments) => {
      if (!attachments || attachments.length === 0) {
        return 'Support Document 1';
      }

      // Extract numbers from existing titles
      const numbers = attachments
        .map(attachment => {
          const match = attachment.title?.match(/Support Document (\d+)/i);
          return match ? parseInt(match[1], 10) : 0;
        })
        .filter(num => num > 0);

      // Find the highest number
      const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
      
      return `Support Document ${maxNumber + 1}`;
    };

    const newAttachment = {
      id: `attachment-${Date.now()}`,
      title: generateSupportDocumentTitle(existingAttachments),
      descriptionHTML: description,
      fileUrl: selectedFile ? URL.createObjectURL(selectedFile) : '',
      fileName: fileName,
      linkUrl: linkUrl,
      createdAt: new Date().toISOString()
    };

    onSave(newAttachment);
    handleClose();
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
            <label>Description<span className="req-star" aria-hidden="true">*</span></label>
            <RichTextEditor
              initialHtml=""
              onChange={handleDescriptionChange}
              placeholder="Enter attachment description..."
              className="legislation-edit-modal__editor"
            />
            {errors.description && (
              <div className="error-message">{errors.description}</div>
            )}
          </div>

          <div className="form-group">
            <label>File Upload<span className="req-star" aria-hidden="true">*</span></label>
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
            <label>Link Upload<span className="req-star" aria-hidden="true">*</span></label>
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
          <button
            type="button"
            className="btn update-now-btn"
            onClick={handleSave}
          >
            Update Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegislationEditModal;
