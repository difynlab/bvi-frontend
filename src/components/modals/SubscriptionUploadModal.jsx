import React, { useState, useRef, useEffect } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import '../../styles/components/SubscriptionUploadModal.scss';

const SubscriptionUploadModal = ({ isOpen, onClose, onConfirm, initialTitle = '', initialDescription = '', initialImage = '' }) => {
  const [dragActive, setDragActive] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [previewDataUrl, setPreviewDataUrl] = useState(initialImage);
  const [errorMessage, setErrorMessage] = useState('');
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  
  const modalBackdropClose = useModalBackdropClose(onClose);
  
  useBodyScrollLock(isOpen);

  // Reset form when modal opens/closes or initial values change
  useEffect(() => {
    if (isOpen) {
      setTitle(initialTitle);
      setDescription(initialDescription);
      setPreviewDataUrl(initialImage);
      setErrorMessage('');
    }
  }, [isOpen, initialTitle, initialDescription, initialImage]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [description]);

  // Check if there are changes
  const hasChanges = () => {
    return (
      title !== initialTitle ||
      description !== initialDescription ||
      previewDataUrl !== initialImage
    );
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFile = (file) => {
    if (file && file.type.startsWith('image/')) {
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      
      if (file.size > maxSize) {
        setErrorMessage('Image size must not exceed 5MB')
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewDataUrl(reader.result);
        setErrorMessage('');
      };
      reader.readAsDataURL(file);
    } else {
      setErrorMessage('Please upload an image file');
    }
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleSaveChanges = () => {
    if (hasChanges()) {
      onConfirm({
        title,
        description,
        image: previewDataUrl
      });
    }
  };

  const handleDescriptionChange = (e) => {
    setDescription(e.target.value);
  };

  if (!isOpen) return null;

  return (
    <div
      className="subscription-upload-modal-overlay"
      role="presentation"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <div
        className="subscription-upload-modal"
        role="dialog"
        aria-modal="true"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
      >
        <button
          type="button"
          className="subscription-upload-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          <i className="bi bi-x" aria-hidden="true"></i>
        </button>

        <header className="subscription-upload-modal__header">
          <h2 className="subscription-upload-modal__title">Edit Membership Info</h2>
        </header>

        <div className="subscription-upload-modal__body">
          {/* Title Input */}
          <div className="subscription-upload-modal__field">
            <label htmlFor="card-title" className="subscription-upload-modal__label">Title</label>
            <input
              id="card-title"
              type="text"
              className="subscription-upload-modal__input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter card title"
            />
          </div>

          {/* Description Textarea */}
          <div className="subscription-upload-modal__field">
            <label htmlFor="card-description" className="subscription-upload-modal__label">Description</label>
            <textarea
              id="card-description"
              ref={textareaRef}
              className="subscription-upload-modal__textarea"
              value={description}
              onChange={handleDescriptionChange}
              placeholder="Enter card description"
              rows={3}
            />
          </div>

          {/* Dropzone */}
          <div className="subscription-upload-modal__field">
            <label className="subscription-upload-modal__label">Image</label>
          {previewDataUrl ? (
            <div className="subscription-upload-modal__preview">
              <img 
                src={previewDataUrl} 
                alt="Preview" 
                className="subscription-upload-modal__preview-image"
              />
              <button
                type="button"
                className="subscription-upload-modal__remove-preview"
                onClick={() => setPreviewDataUrl('')}
                aria-label="Remove preview"
              >
                <i className="bi bi-x" aria-hidden="true"></i>
              </button>
            </div>
          ) : (
            <div
              className={`subscription-upload-modal__dropzone dropzone-surface ${dragActive ? 'active' : ''}`}
              data-has-file={Boolean(previewDataUrl)}
              onDragEnter={handleDragIn}
              onDragLeave={handleDragOut}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="subscription-upload-modal__content">
                <i className="bi bi-cloud-upload subscription-upload-modal__icon" aria-hidden="true"></i>
                <p className="subscription-upload-modal__label">Drag and drop files here</p>
                <p className="subscription-upload-modal__separator">or</p>
                <button
                  type="button"
                  className="subscription-upload-modal__browse"
                  onClick={handleBrowseClick}
                >
                  Browse File
                </button>
                  <p className="subscription-upload-modal__hint">Maximum file size is 5MB</p>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            className="subscription-upload-modal__file"
            aria-hidden="true"
          />
          </div>
        </div>

        <div className="subscription-upload-modal__footer">
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
          {hasChanges() && (
          <button
            type="button"
            className="subscription-upload-modal__update"
              onClick={handleSaveChanges}
          >
              Submit
          </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUploadModal;
