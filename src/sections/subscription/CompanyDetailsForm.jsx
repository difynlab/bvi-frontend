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
    setField('companyDetails', 'company_phone', value);
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
        setField('companyDetails', 'signature_error', 'File size must not exceed 5MB');
        setField('companyDetails', 'signature', null);
        return;
      }
      
      setField('companyDetails', 'signature', file);
      setField('companyDetails', 'signature_error', '');
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
          value={companyValues.company_name || ''}
          onChange={(e) => setField('companyDetails', 'company_name', e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['companyDetails.company_name'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.company_name'] ? 'companyName-error' : undefined}
        />
        {errors['companyDetails.company_name'] && (
          <div id="companyName-error" className="error-message">
            {errors['companyDetails.company_name']}
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
          value={companyValues.company_address || ''}
          onChange={(e) => setField('companyDetails', 'company_address', e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['companyDetails.company_address'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.company_address'] ? 'companyAddress-error' : undefined}
        />
        {errors['companyDetails.company_address'] && (
          <div id="companyAddress-error" className="error-message">
            {errors['companyDetails.company_address']}
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
            value={companyValues.company_phone || ''}
            onChange={handleTelephoneChange}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.company_phone'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.company_phone'] ? 'telephone-error' : undefined}
          />
          {errors['companyDetails.company_phone'] && (
            <div id="telephone-error" className="error-message">
              {errors['companyDetails.company_phone']}
            </div>
          )}
        </div>
        
        <div className="field">
          <label htmlFor="email">Email Address <span className="req-star">*</span></label>
          <input
            id="email"
            type="email"
            placeholder="Enter email address"
            value={companyValues.company_email || ''}
            onChange={(e) => setField('companyDetails', 'company_email', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.company_email'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.company_email'] ? 'email-error' : undefined}
          />
          {errors['companyDetails.company_email'] && (
            <div id="email-error" className="error-message">
              {errors['companyDetails.company_email']}
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
          value={companyValues.company_website || ''}
          onChange={(e) => setField('companyDetails', 'company_website', e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['companyDetails.company_website'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.company_website'] ? 'website-error' : undefined}
        />
        {errors['companyDetails.company_website'] && (
          <div id="website-error" className="error-message">
            {errors['companyDetails.company_website']}
          </div>
        )}
      </div>

      {/* Brief Company Profile */}
      <div className="field">
        <label htmlFor="brief">Brief company profile</label>
        <textarea
          id="brief"
          placeholder="Enter brief company description"
          value={companyValues.company_profile || ''}
          onChange={(e) => setField('companyDetails', 'company_profile', e.target.value)}
          onKeyDown={handleKeyDown}
          rows={4}
          aria-invalid={errors['companyDetails.company_profile'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.company_profile'] ? 'brief-error' : undefined}
        />
        {errors['companyDetails.company_profile'] && (
          <div id="brief-error" className="error-message">
            {errors['companyDetails.company_profile']}
          </div>
        )}
      </div>

      {/* Office Presence */}
      <fieldset className="office-presence" aria-invalid={errors['companyDetails.office_presence_regions'] ? 'true' : 'false'}>
        <legend>Select all relevant choices for office presence <span className="req-star">*</span></legend>
        <div className="checkbox-group">
          {OFFICE_PRESENCE_OPTIONS.map(option => (
            <div key={option} className="checkbox-item">
              <input
                type="checkbox"
                id={`office-${createValidId(option)}`}
                checked={companyValues.office_presence_regions?.includes(option) || false}
                onChange={() => toggleArray('companyDetails', 'office_presence_regions', option)}
                aria-invalid={errors['companyDetails.office_presence_regions'] ? 'true' : 'false'}
              />
              <label htmlFor={`office-${createValidId(option)}`}>{option}</label>
            </div>
          ))}
        </div>
        {errors['companyDetails.office_presence_regions'] && (
          <div id="officePresence-error" className="error-message" aria-describedby="officePresence-error">
            {errors['companyDetails.office_presence_regions']}
          </div>
        )}
      </fieldset>

      {/* Business Categories */}
      <fieldset className="business-categories" aria-invalid={errors['companyDetails.business_categories'] ? 'true' : 'false'}>
        <legend>Please select all relevant category(ies) that indicate the type of business undertaken by your company <span className="req-star">*</span></legend>
        <div className="categories-grid">
          <div className="categories-column">
            {BUSINESS_CATEGORIES_LEFT.map(category => (
              <div key={category} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`category-${createValidId(category)}`}
                  checked={companyValues.business_categories?.includes(category) || false}
                  onChange={() => toggleArray('companyDetails', 'business_categories', category)}
                  aria-invalid={errors['companyDetails.business_categories'] ? 'true' : 'false'}
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
                  checked={companyValues.business_categories?.includes(category) || false}
                  onChange={() => toggleArray('companyDetails', 'business_categories', category)}
                  aria-invalid={errors['companyDetails.business_categories'] ? 'true' : 'false'}
                />
                <label htmlFor={`category-${createValidId(category)}`}>{category}</label>
              </div>
            ))}
          </div>
        </div>
        {errors['companyDetails.business_categories'] && (
          <div id="businessCategories-error" className="error-message" aria-describedby="businessCategories-error">
            {errors['companyDetails.business_categories']}
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
          value={companyValues.other_business_category || ''}
          onChange={(e) => setField('companyDetails', 'other_business_category', e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={!companyValues.business_categories?.includes('Other')}
          aria-disabled={!companyValues.business_categories?.includes('Other')}
          aria-invalid={errors['companyDetails.other_business_category'] ? 'true' : 'false'}
          aria-describedby={errors['companyDetails.other_business_category'] ? 'otherCategory-error' : undefined}
        />
        {errors['companyDetails.other_business_category'] && (
          <div id="otherCategory-error" className="error-message">
            {errors['companyDetails.other_business_category']}
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
            value={companyValues.director_name || ''}
            onChange={(e) => setField('companyDetails', 'director_name', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.director_name'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.director_name'] ? 'company-directorName-error' : undefined}
          />
          {errors['companyDetails.director_name'] && (
            <div id="company-directorName-error" className="error-message">
              {errors['companyDetails.director_name']}
            </div>
          )}
        </div>
        
        <div className="field">
          <label htmlFor="company-date">Date <span className="req-star">*</span></label>
          <input
            id="company-date"
            type="date"
            value={companyValues.director_signed_at || ''}
            onChange={(e) => setField('companyDetails', 'director_signed_at', e.target.value)}
            onKeyDown={handleKeyDown}
            aria-invalid={errors['companyDetails.director_signed_at'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.director_signed_at'] ? 'company-date-error' : undefined}
          />
          {errors['companyDetails.director_signed_at'] && (
            <div id="company-date-error" className="error-message">
              {errors['companyDetails.director_signed_at']}
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
            data-has-file={Boolean(companyValues.signature)}
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
            aria-invalid={errors['companyDetails.signature'] ? 'true' : 'false'}
            aria-describedby={errors['companyDetails.signature'] ? 'company-signatureFile-error' : undefined}
          >
            <div className="dropzone-content">
              <i className="bi bi-cloud-upload dropzone-icon" aria-hidden="true"></i>
              <p className="dropzone-label">
                {companyValues.signature ? companyValues.signature.name : 'Drag and drop signature file here'}
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
          {errors['companyDetails.signature'] && (
            <div id="company-signatureFile-error" className="error-message">
              {errors['companyDetails.signature']}
            </div>
          )}
          {companyValues.signature_error && (
            <div className="error-message">
              {companyValues.signature_error}
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
