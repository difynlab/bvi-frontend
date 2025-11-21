import React, { useState, useRef } from 'react';
import { setCompanyDetails } from '../../helpers/subscriptionStorage';

const CompanyDetailsForm = ({ values, errors, setField, toggleArray, onNext }) => {
  const companyValues = values.companyDetails || {};
  const firstErrorRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const OFFICE_PRESENCE_OPTIONS = [
    'BVI', 'Latin America', 'North America', 'Asia Pacific', 'China', 'Europe', 'Other'
  ];

  const BUSINESS_CATEGORIES_LEFT = [
    'Accountancy', 'Banking', 'Brokers', 'Business/Management Consultants', 
    'Captive Insurance', 'Compliance & Risk', 'Family Office', 'Financial Planning Services', 
    'Fund Administration', 'Fund Managers', 'ICT', 'Independent Financial Advisors', 
    'Insurance', 'Investment Banking'
  ];

  const BUSINESS_CATEGORIES_RIGHT = [
    'Investment Consultants', 'Investment Managers', 'Law', 'Life and Pensions', 
    'Marine/Aviation Services', 'Mortgage Brokers', 'Private Client Wealth Management', 
    'Real Estate', 'Stockbrokers', 'Taxation Practitioners', 'Trust & Company Administration', 'Other'
  ];

  const createValidId = (text) => {
    return text.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (onNext()) {
      setCompanyDetails(companyValues);
    } else {
      const firstErrorField = Object.keys(errors).find(key => key.startsWith('companyDetails.'));
      if (firstErrorField) {
        const fieldName = firstErrorField.split('.')[1];
        const fieldElement = document.getElementById(fieldName);
        if (fieldElement) {
          fieldElement.focus();
        }
      }
    }
  };

  const handleTelephoneChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    setField('companyDetails', 'telephone', value);
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
    const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
    if (allowedTypes.includes(file.type)) {
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      
      if (file.size > maxSize) {
        setField('companyDetails', 'signatureFileError', 'File size must not exceed 5MB');
        setField('companyDetails', 'signatureFile', null);
        return;
      }
      
      setField('companyDetails', 'signatureFile', file);
      setField('companyDetails', 'signatureFileError', '');
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

  return (
    <div className="company-details">
      {/* Company Name */}
      <div className="field">
        <label htmlFor="companyName">Company Name <span className="req-star">*</span></label>
        <input
          id="companyName"
          type="text"
          placeholder="Enter company name"
          value={companyValues.companyName || ''}
          onChange={(e) => setField('companyDetails', 'companyName', e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['companyDetails.companyName'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.companyName'] ? 'companyName-error' : undefined}
        />
        {errors['companyDetails.companyName'] && (
          <div id="companyName-error" className="error-message">
            {errors['companyDetails.companyName']}
          </div>
        )}
      </div>

      {/* Company Address */}
      <div className="field">
        <label htmlFor="companyAddress">Company Address <span className="req-star">*</span></label>
        <input
          id="companyAddress"
          type="text"
          placeholder="Enter company address"
          value={companyValues.companyAddress || ''}
          onChange={(e) => setField('companyDetails', 'companyAddress', e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['companyDetails.companyAddress'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.companyAddress'] ? 'companyAddress-error' : undefined}
        />
        {errors['companyDetails.companyAddress'] && (
          <div id="companyAddress-error" className="error-message">
            {errors['companyDetails.companyAddress']}
          </div>
        )}
      </div>

      {/* Telephone and Email Row */}
      <div className="row">
        <div className="field">
          <label htmlFor="telephone">Telephone <span className="req-star">*</span></label>
          <input
            id="telephone"
            type="number"
            placeholder="Enter phone number"
            value={companyValues.telephone || ''}
            onChange={handleTelephoneChange}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.telephone'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.telephone'] ? 'telephone-error' : undefined}
          />
          {errors['companyDetails.telephone'] && (
            <div id="telephone-error" className="error-message">
              {errors['companyDetails.telephone']}
            </div>
          )}
        </div>
        
        <div className="field">
          <label htmlFor="email">Email Address <span className="req-star">*</span></label>
          <input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={companyValues.email || ''}
            onChange={(e) => setField('companyDetails', 'email', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.email'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.email'] ? 'email-error' : undefined}
          />
          {errors['companyDetails.email'] && (
            <div id="email-error" className="error-message">
              {errors['companyDetails.email']}
            </div>
          )}
        </div>
      </div>

      {/* Website */}
      <div className="field">
        <label htmlFor="website">Website</label>
        <input
          id="website"
          type="text"
          placeholder="Enter website URL"
          value={companyValues.website || ''}
          onChange={(e) => setField('companyDetails', 'website', e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['companyDetails.website'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.website'] ? 'website-error' : undefined}
        />
        {errors['companyDetails.website'] && (
          <div id="website-error" className="error-message">
            {errors['companyDetails.website']}
          </div>
        )}
      </div>

      {/* Brief Company Profile */}
      <div className="field">
        <label htmlFor="brief">Brief company profile</label>
        <textarea
          id="brief"
          placeholder="Enter brief company description"
          value={companyValues.brief || ''}
          onChange={(e) => setField('companyDetails', 'brief', e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          aria-invalid={errors['companyDetails.brief'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.brief'] ? 'brief-error' : undefined}
        />
        {errors['companyDetails.brief'] && (
          <div id="brief-error" className="error-message">
            {errors['companyDetails.brief']}
          </div>
        )}
      </div>

      {/* Office Presence */}
      <fieldset className="office-presence" aria-invalid={errors['companyDetails.officePresence'] ? 'true' : 'false'}>
        <legend>Select all relevant choices for office presence <span className="req-star">*</span></legend>
        <div className="checkbox-group">
          {OFFICE_PRESENCE_OPTIONS.map(option => (
            <div key={option} className="checkbox-item">
              <input
                type="checkbox"
                id={`office-${createValidId(option)}`}
                checked={companyValues.officePresence?.includes(option) || false}
                onChange={() => toggleArray('companyDetails', 'officePresence', option)}
                aria-invalid={errors['companyDetails.officePresence'] ? 'true' : 'false'}
              />
              <label htmlFor={`office-${createValidId(option)}`}>{option}</label>
            </div>
          ))}
        </div>
        {errors['companyDetails.officePresence'] && (
          <div id="officePresence-error" className="error-message" aria-describedby="officePresence-error">
            {errors['companyDetails.officePresence']}
          </div>
        )}
      </fieldset>

      {/* Business Categories */}
      <fieldset className="business-categories" aria-invalid={errors['companyDetails.businessCategories'] ? 'true' : 'false'}>
        <legend>Please select all relevant category(ies) that indicate the type of business undertaken by your company <span className="req-star">*</span></legend>
        <div className="categories-grid">
          <div className="categories-column">
            {BUSINESS_CATEGORIES_LEFT.map(category => (
              <div key={category} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`category-${createValidId(category)}`}
                  checked={companyValues.businessCategories?.includes(category) || false}
                  onChange={() => toggleArray('companyDetails', 'businessCategories', category)}
                  aria-invalid={errors['companyDetails.businessCategories'] ? 'true' : 'false'}
                />
                <label htmlFor={`category-${createValidId(category)}`}>{category}</label>
              </div>
            ))}
          </div>
          <div className="categories-column">
            {BUSINESS_CATEGORIES_RIGHT.map(category => (
              <div key={category} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`category-${createValidId(category)}`}
                  checked={companyValues.businessCategories?.includes(category) || false}
                  onChange={() => toggleArray('companyDetails', 'businessCategories', category)}
                  aria-invalid={errors['companyDetails.businessCategories'] ? 'true' : 'false'}
                />
                <label htmlFor={`category-${createValidId(category)}`}>{category}</label>
              </div>
            ))}
          </div>
        </div>
        {errors['companyDetails.businessCategories'] && (
          <div id="businessCategories-error" className="error-message" aria-describedby="businessCategories-error">
            {errors['companyDetails.businessCategories']}
          </div>
        )}
      </fieldset>

      {/* Other Category Specification */}
      <div className="field">
        <label htmlFor="otherCategory">If you have chosen other, please specify</label>
        <input
          id="otherCategory"
          type="text"
          placeholder="Specify other business category"
          value={companyValues.otherCategory || ''}
          onChange={(e) => setField('companyDetails', 'otherCategory', e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!companyValues.businessCategories?.includes('Other')}
          aria-disabled={!companyValues.businessCategories?.includes('Other')}
          aria-invalid={errors['companyDetails.otherCategory'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.otherCategory'] ? 'otherCategory-error' : undefined}
        />
        {errors['companyDetails.otherCategory'] && (
          <div id="otherCategory-error" className="error-message">
            {errors['companyDetails.otherCategory']}
          </div>
        )}
      </div>

      {/* Name of the Director and Date Row */}
      <div className="row">
        <div className="field">
          <label htmlFor="company-directorName">Name of the Director <span className="req-star">*</span></label>
          <input
            id="company-directorName"
            type="text"
            placeholder="Enter director's full name"
            value={companyValues.directorName || ''}
            onChange={(e) => setField('companyDetails', 'directorName', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.directorName'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.directorName'] ? 'company-directorName-error' : undefined}
          />
          {errors['companyDetails.directorName'] && (
            <div id="company-directorName-error" className="error-message">
              {errors['companyDetails.directorName']}
            </div>
          )}
        </div>
        
        <div className="field">
          <label htmlFor="company-date">Date <span className="req-star">*</span></label>
          <input
            id="company-date"
            type="date"
            value={companyValues.date || ''}
            onChange={(e) => setField('companyDetails', 'date', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.date'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.date'] ? 'company-date-error' : undefined}
          />
          {errors['companyDetails.date'] && (
            <div id="company-date-error" className="error-message">
              {errors['companyDetails.date']}
            </div>
          )}
        </div>
      </div>

      {/* Signature Row */}
      <div className="row">
        <div className="field">
          <label id="company-signatureFile-label">Signature <span className="req-star">*</span></label>
          <div
            id="company-signatureFile"
            className={`dropzone dropzone-surface ${dragActive ? 'active' : ''}`}
            data-has-file={Boolean(companyValues.signatureFile)}
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
            aria-labelledby="company-signatureFile-label"
            aria-invalid={errors['companyDetails.signatureFile'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.signatureFile'] ? 'company-signatureFile-error' : undefined}
          >
            <div className="dropzone-content">
              <i className="bi bi-cloud-upload dropzone-icon" aria-hidden="true"></i>
              <p className="dropzone-label">
                {companyValues.signatureFile ? companyValues.signatureFile.name : 'Drag and drop signature file here'}
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
          {errors['companyDetails.signatureFile'] && (
            <div id="company-signatureFile-error" className="error-message">
              {errors['companyDetails.signatureFile']}
            </div>
          )}
          {companyValues.signatureFileError && (
            <div className="error-message">
              {companyValues.signatureFileError}
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={handleFileInput}
        className="hidden-file-input"
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

export default CompanyDetailsForm;
