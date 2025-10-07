import React, { useState, useRef } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import '../../styles/components/SubscriptionUploadModal.scss';

const SubscriptionUploadModal = ({ isOpen, onClose, onConfirm }) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewDataUrl, setPreviewDataUrl] = useState('');
  const fileInputRef = useRef(null);
  
  const modalBackdropClose = useModalBackdropClose(onClose);
  
  useBodyScrollLock(isOpen);

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
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewDataUrl(reader.result);
      };
      reader.readAsDataURL(file);
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

  const handleUpdate = () => {
    if (previewDataUrl) {
      onConfirm(previewDataUrl);
    }
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
          <h2 className="subscription-upload-modal__title">Upload New Resource</h2>
          <p className="subscription-upload-modal__subtitle">Please upload the new file here</p>
        </header>

        <div className="subscription-upload-modal__body">
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
                <p className="subscription-upload-modal__hint">Maximum file size is 200MB</p>
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

        <div className="subscription-upload-modal__footer">
          <button
            type="button"
            className="subscription-upload-modal__update"
            onClick={handleUpdate}
            disabled={!previewDataUrl}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUploadModal;
