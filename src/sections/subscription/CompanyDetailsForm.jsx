import React, { useRef } from 'react';
import { setCompanyDetails } from '../../helpers/subscriptionStorage';

const CompanyDetailsForm = ({ values, errors, setField, toggleArray, onNext }) => {
  const companyValues = values.companyDetails || {};
  const firstErrorRef = useRef(null);

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
