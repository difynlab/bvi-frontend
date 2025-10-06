import React, { useRef } from 'react';
import { setMembershipLicenseOfficers } from '../../helpers/subscriptionStorage';
import { useAuth } from '../../context/useAuth';

const MembershipLicenseOfficerForm = ({ values, errors, setOfficer, onSave }) => {
  const { isAdmin } = useAuth();
  const firstErrorRef = useRef(null);

  const officersValues = values.membershipLicenseOfficers?.officers || [
    { name: '', title: '', phone: '', email: '' }, // Officer 1
    { name: '', title: '', phone: '', email: '' }  // Officer 2
  ];

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePhoneChange = (officerIndex, value) => {
    const digitsOnly = value.replace(/\D/g, '');
    setOfficer(officerIndex, 'phone', digitsOnly);
  };

  const handleSubmit = () => {
    if (onSave()) {
      setMembershipLicenseOfficers(values.membershipLicenseOfficers);
      
      const button = document.querySelector('.membership-license-officer .update-button');
      if (button) {
        const originalText = button.textContent;
        button.textContent = 'Saved!';
        button.classList.add('update-button--saved');
        setTimeout(() => {
          button.textContent = originalText;
          button.classList.remove('update-button--saved');
        }, 2000);
      }
    } else {
      const firstErrorField = Object.keys(errors).find(key => key.startsWith('membershipLicenseOfficers.'));
      if (firstErrorField) {
        const fieldElement = document.getElementById(firstErrorField);
        if (fieldElement) {
          fieldElement.focus();
        }
      }
    }
  };

  const renderOfficerBlock = (officerIndex, title, isRequired = false) => {
    const officer = officersValues[officerIndex] || { name: '', title: '', phone: '', email: '' };
    const hasError = Object.keys(errors).some(key => key.includes(`officer${officerIndex + 1}`));

    return (
      <div key={officerIndex} className="officer-block">
        <h3 className="officer-block-title">
          {title}
          {isRequired && <span className="req-star">*</span>}
        </h3>
        
        <div className="row">
          <div className="field">
            <label htmlFor={`officer${officerIndex + 1}-name`}>Name</label>
            <input
              id={`officer${officerIndex + 1}-name`}
              type="text"
              value={officer.name}
              onChange={(e) => setOfficer(officerIndex, 'name', e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={hasError ? `officer${officerIndex + 1}-name-error` : undefined}
            />
            {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.name`] && (
              <div id={`officer${officerIndex + 1}-name-error`} className="error-message">
                {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.name`]}
              </div>
            )}
          </div>
          
          <div className="field">
            <label htmlFor={`officer${officerIndex + 1}-title`}>Title</label>
            <input
              id={`officer${officerIndex + 1}-title`}
              type="text"
              value={officer.title}
              onChange={(e) => setOfficer(officerIndex, 'title', e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={hasError ? `officer${officerIndex + 1}-title-error` : undefined}
            />
            {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.title`] && (
              <div id={`officer${officerIndex + 1}-title-error`} className="error-message">
                {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.title`]}
              </div>
            )}
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label htmlFor={`officer${officerIndex + 1}-phone`}>Direct Line and/or mobile number</label>
            <input
              id={`officer${officerIndex + 1}-phone`}
              type="tel"
              value={officer.phone}
              onChange={(e) => handlePhoneChange(officerIndex, e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={hasError ? `officer${officerIndex + 1}-phone-error` : undefined}
            />
            {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.phone`] && (
              <div id={`officer${officerIndex + 1}-phone-error`} className="error-message">
                {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.phone`]}
              </div>
            )}
          </div>
          
          <div className="field">
            <label htmlFor={`officer${officerIndex + 1}-email`}>Email Address</label>
            <input
              id={`officer${officerIndex + 1}-email`}
              type="email"
              value={officer.email}
              onChange={(e) => setOfficer(officerIndex, 'email', e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              aria-describedby={hasError ? `officer${officerIndex + 1}-email-error` : undefined}
            />
            {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.email`] && (
              <div id={`officer${officerIndex + 1}-email-error`} className="error-message">
                {errors[`membershipLicenseOfficers.officer${officerIndex + 1}.email`]}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="membership-license-officer">
      <p className="intro-text">
        Please provide the contact details of the persons at your firm that you wish to be your Membership Liaison Officer.
      </p>

      {renderOfficerBlock(0, 'Membership Liaison Officer(s)', true)}
      {renderOfficerBlock(1, 'Membership Liaison Officer(s)')}

      {/* Update Button - Visible for all users */}
      <div className="actions">
        <button
          type="button"
          className="update-button"
          onClick={handleSubmit}
        >
          Update Now
        </button>
      </div>
    </div>
  );
};

export default MembershipLicenseOfficerForm;
