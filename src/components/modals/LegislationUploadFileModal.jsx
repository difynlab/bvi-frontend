import React, { useState, useRef, useEffect } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import CustomDropdown from '../CustomDropdown';
import legislationFilesService from '../../services/legislationFilesService';
import '../../styles/components/LegislationUploadFileModal.scss';

const LegislationUploadFileModal = ({ isOpen, onClose, onSave, editFile = null }) => {
  const [fileTitle, setFileTitle] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [existingFileUrl, setExistingFileUrl] = useState(null);
  const [existingFileName, setExistingFileName] = useState(null);
  const [linkUrl, setLinkUrl] = useState('');
  const [contentType, setContentType] = useState('link');
  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const fileInputRef = useRef(null);
  
  const modalBackdropClose = useModalBackdropClose(onClose);
  useBodyScrollLock(isOpen);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = Array.from(e.dataTransfer.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = '';
  };

  const handleFileSelect = (file) => {
    const maxSize = 15 * 1024 * 1024;
    const allowedTypes = ['application/pdf'];

    if (file.size > maxSize) {
      setErrors({ file: 'File size must be less than 15MB' });
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      setErrors({ file: 'Only PDF files are allowed' });
      return;
    }

    setErrors({});
    setSelectedFile(file);
    setHasChanges(true);
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setErrors({});
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (editFile) {
      setHasChanges(fileTitle.trim() !== (editFile.title || '').trim());
    } else {
      setHasChanges(false);
    }
  };

  const handleSubmit = async () => {
    const newErrors = {};

    if (!fileTitle.trim()) {
      newErrors.title = 'File title is required';
    }

    if (contentType === 'pdf' && !editFile && !selectedFile) {
      newErrors.file = 'Please select a file';
    }

    if (contentType === 'link' && !linkUrl.trim()) {
      newErrors.link = 'Link URL is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    
    try {
      if (contentType === 'pdf') {
        if (editFile) {
          await legislationFilesService.update(editFile.apiId, fileTitle.trim(), 1, selectedFile || null);
        } else {
          await legislationFilesService.create(fileTitle.trim(), selectedFile, 1);
        }
      } else {
        if (editFile) {
          await legislationFilesService.update(editFile.apiId, fileTitle.trim(), 1, null);
        } else {
          await legislationFilesService.create(fileTitle.trim(), null, 1);
        }
      }
      
      if (onSave && typeof onSave === 'function') {
        await onSave();
      }
      
      handleClose();
    } catch (error) {
      console.error(`Error ${editFile ? 'updating' : 'creating'} legislation file:`, error);
      setErrors({ 
        submit: error.message || `Error al ${editFile ? 'actualizar' : 'crear'} el archivo. Por favor intente nuevamente.` 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (isOpen && editFile) {
      setFileTitle(editFile.title || '');
      setExistingFileUrl(editFile.fileUrl || editFile.file || null);
      setExistingFileName(editFile.fileName || (editFile.fileUrl ? editFile.fileUrl.split('/').pop() : null));
      const hasFile = editFile.fileUrl || editFile.file;
      const hasLink = editFile.linkUrl && editFile.linkUrl.trim() !== '' && editFile.linkUrl.trim() !== '#';
      setContentType(hasFile ? 'pdf' : (hasLink ? 'link' : 'link'));
      setLinkUrl(editFile.linkUrl || '');
      setSelectedFile(null);
      setHasChanges(false);
      setErrors({});
    } else if (isOpen && !editFile) {
      setFileTitle('');
      setSelectedFile(null);
      setExistingFileUrl(null);
      setExistingFileName(null);
      setLinkUrl('');
      setContentType('link');
      setHasChanges(false);
      setErrors({});
    }
  }, [isOpen, editFile]);

  useEffect(() => {
    if (!isOpen) return;
    
    const originalTitle = editFile?.title || '';
    const originalLinkUrl = editFile?.linkUrl || '';
    const hasTitleChanged = fileTitle.trim() !== originalTitle.trim();
    const hasFileChanged = selectedFile !== null;
    const hasLinkChanged = linkUrl.trim() !== originalLinkUrl.trim();
    const hasContentTypeChanged = contentType !== (editFile?.fileUrl ? 'pdf' : (editFile?.linkUrl ? 'link' : 'link'));
    
    setHasChanges(hasTitleChanged || hasFileChanged || hasLinkChanged || hasContentTypeChanged);
  }, [fileTitle, selectedFile, linkUrl, contentType, editFile, isOpen]);

  const handleClose = () => {
    setFileTitle('');
    setSelectedFile(null);
    setExistingFileUrl(null);
    setExistingFileName(null);
    setLinkUrl('');
    setContentType('link');
    setDragActive(false);
    setErrors({});
    setIsSubmitting(false);
    setHasChanges(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="legislation-upload-file-modal-overlay"
      role="presentation"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="legislation-upload-file-modal"
        role="dialog"
        aria-modal="true"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
      >
        <button
          type="button"
          className="legislation-upload-file-modal__close"
          aria-label="Close"
          onClick={handleClose}
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>

        <header className="legislation-upload-file-modal__header">
          <h2 className="legislation-upload-file-modal__title">
            {editFile ? 'Edit File' : 'Upload File'}
          </h2>
          <p className="legislation-upload-file-modal__subtitle">
            {editFile 
              ? 'Edit the file title or upload a new file.'
              : 'Upload files (PDF, PNG, JPG, JPEG) to add inside the attachment files section.'}
          </p>
        </header>

        <div className="legislation-upload-file-modal__body">
          <div className="form-group">
            <label htmlFor="file-title-input">File Title</label>
            <input
              id="file-title-input"
              type="text"
              className="form-input"
              value={fileTitle}
              onChange={(e) => setFileTitle(e.target.value)}
              placeholder="Enter file title..."
            />
            {errors.title && (
              <div className="error-message">{errors.title}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="contentType">Content Type</label>
            <CustomDropdown
              id="contentType"
              name="contentType"
              value={contentType}
              onChange={(e) => {
                setContentType(e.target.value);
                if (e.target.value === 'link') {
                  setSelectedFile(null);
                  setExistingFileUrl(null);
                  setExistingFileName(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                } else {
                  setLinkUrl('');
                }
                setErrors({});
              }}
              options={[
                { value: 'link', label: 'Link' },
                { value: 'pdf', label: 'PDF Document' }
              ]}
              placeholder="Select content type"
            />
          </div>

          {contentType === 'link' ? (
            <div className="form-group">
              <label htmlFor="linkUrl">Link</label>
              <input
                type="text"
                id="linkUrl"
                name="linkUrl"
                className="form-input"
                value={linkUrl}
                onChange={(e) => {
                  setLinkUrl(e.target.value);
                  setHasChanges(true);
                }}
                placeholder="https://example.com or #"
              />
              {errors.link && (
                <div className="error-message">{errors.link}</div>
              )}
            </div>
          ) : (
            <div className="form-group">
              <label htmlFor="pdf-file-dropzone">PDF Document</label>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#666', opacity: 0.7 }}>PDF files are supported. Maximum file size: 15 MB.</p>
              <div
                id="pdf-file-dropzone"
                className={`legislation-upload-file-dropzone ${dragActive ? 'active' : ''}`}
                data-has-file={Boolean(selectedFile || existingFileUrl)}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={handleBrowseClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleBrowseClick();
                  }
                }}
                tabIndex={0}
                role="button"
              >
                {selectedFile ? (
                  <div className="file-preview-card">
                    <div className="file-preview-content">
                      <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                      <div className="file-preview-info">
                        <span className="file-preview-name">{selectedFile.name}</span>
                        <span className="file-preview-size">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </span>
                      </div>
                      <button
                        type="button"
                        className="file-preview-remove"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFile();
                        }}
                        aria-label="Remove file"
                      >
                        <i className="bi bi-x-lg" aria-hidden="true"></i>
                      </button>
                    </div>
                  </div>
                ) : existingFileUrl ? (
                  <div className="file-preview-card">
                    <div className="file-preview-content">
                      <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                      <div className="file-preview-info">
                        <span className="file-preview-name">{existingFileName || 'Current file'}</span>
                        <span className="file-preview-size">Existing file</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="dropzone-content">
                    <i className="bi bi-cloud-upload dropzone-icon" aria-hidden="true"></i>
                    <p className="dropzone-label">Drag and drop file here</p>
                    <p className="dropzone-separator">or</p>
                    <button
                      type="button"
                      className="dropzone-browse"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBrowseClick();
                      }}
                    >
                      Browse File
                    </button>
                    <p className="dropzone-hint">PDF (max 15MB)</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden-file-input"
                onChange={handleFileInput}
              />
              {errors.file && (
                <div className="error-message">{errors.file}</div>
              )}
            </div>
          )}
        </div>

        <div className="legislation-upload-file-modal__footer">
          {errors.submit && (
            <div className="error-message" style={{ width: '100%', marginBottom: '10px' }}>
              {errors.submit}
            </div>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={isSubmitting || (editFile && !hasChanges)}
          >
            {isSubmitting ? (editFile ? 'Updating...' : 'Uploading...') : 'Submit'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LegislationUploadFileModal;

