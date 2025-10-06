import React, { useState, useRef } from 'react';
import { setGeneralDetails } from '../../helpers/subscriptionStorage';

const GeneralDetailsForm = ({ values, errors, setField, onNext }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

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
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
    if (allowedTypes.includes(file.type)) {
      setField('signatureFile', file);
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (onNext()) {
      setGeneralDetails(values);
    }
  };

  return (
    <div className="general-details">
      <div className="row">
        <div className="field">
          <label htmlFor="general-companyName">Company Name <span className="req-star">*</span></label>
          <input
            id="general-companyName"
            type="text"
            value={values.companyName || ''}
            onChange={(e) => setField('companyName', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors.companyName ? 'true' : 'false'}
            aria-describedby={errors.companyName ? 'general-companyName-error' : undefined}
          />
          {errors.companyName && (
            <div id="general-companyName-error" className="error-message">
              {errors.companyName}
            </div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="general-directorName">Name of the Director <span className="req-star">*</span></label>
          <input
            id="general-directorName"
            type="text"
            value={values.directorName || ''}
            onChange={(e) => setField('directorName', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors.directorName ? 'true' : 'false'}
            aria-describedby={errors.directorName ? 'general-directorName-error' : undefined}
          />
          {errors.directorName && (
            <div id="general-directorName-error" className="error-message">
              {errors.directorName}
            </div>
          )}
        </div>
        
        <div className="field">
          <label htmlFor="general-date">Date <span className="req-star">*</span></label>
          <input
            id="general-date"
            type="date"
            value={values.date || ''}
            onChange={(e) => setField('date', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors.date ? 'true' : 'false'}
            aria-describedby={errors.date ? 'general-date-error' : undefined}
          />
          {errors.date && (
            <div id="general-date-error" className="error-message">
              {errors.date}
            </div>
          )}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label id="general-signatureFile-label">Signature <span className="req-star">*</span></label>
          <div
            id="general-signatureFile"
            className={`dropzone ${dragActive ? 'active' : ''}`}
            onDragEnter={handleDragIn}
            onDragLeave={handleDragOut}
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
            aria-labelledby="general-signatureFile-label"
            aria-invalid={errors.signatureFile ? 'true' : 'false'}
            aria-describedby={errors.signatureFile ? 'general-signatureFile-error' : undefined}
          >
            <div className="dropzone-content">
              <i className="bi bi-cloud-upload dropzone-icon" aria-hidden="true"></i>
              <p className="dropzone-label">
                {values.signatureFile ? values.signatureFile.name : 'Drag and drop signature file here'}
              </p>
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
              <p className="dropzone-hint">PNG, JPG, JPEG, PDF (max 5MB)</p>
            </div>
          </div>
          {errors.signatureFile && (
            <div id="general-signatureFile-error" className="error-message">
              {errors.signatureFile}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={handleFileInput}
        style={{ display: 'none' }}
        aria-hidden="true"
      />

      <div className="actions">
        <button
          type="button"
          className="next-button"
          onClick={handleSubmit}
        >
          Move To Next Page
        </button>
      </div>
    </div>
  );
};

export default GeneralDetailsForm;
