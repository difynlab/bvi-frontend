import React, { useState, useRef } from 'react';
import { setMembershipDetails } from '../../helpers/subscriptionStorage';

// TODO BACKEND: Replace with API data
const ORDINARY_PLANS = [
  'Standard(Basic)',
  'Silver(Intermediate)', 
  'Gold(Premium)'
];

const MembershipDetailsForm = ({ values, errors, setField, onNext }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const membershipValues = values.membershipDetails || {};

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
      setField('membershipDetails', 'signatureFile', file);
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
      // Save to localStorage on successful navigation
      setMembershipDetails(membershipValues);
    }
  };

  const handleMembershipTypeChange = (e) => {
    const newType = e.target.value;
    setField('membershipDetails', 'membershipType', newType);
    
    // Reset ordinaryPlan when switching away from Ordinary Member
    if (newType !== 'Ordinary Member') {
      setField('membershipDetails', 'ordinaryPlan', '');
    }
  };

  return (
    <div className="membership-details">
      {/* Notice Banner */}
      <div className="notice-banner">
        Declaration of Accuracy: This is an accurate reflection of the total number of full time employees on the date stated above.
      </div>

      {/* Membership Type */}
      <div className="field">
        <label htmlFor="membership-membershipType">Membership Type <span className="req-star">*</span></label>
        <select
          id="membership-membershipType"
          value={membershipValues.membershipType || ''}
          onChange={handleMembershipTypeChange}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['membershipDetails.membershipType'] ? 'true' : 'false'}
          aria-describedby={errors['membershipDetails.membershipType'] ? 'membership-membershipType-error' : undefined}
        >
          <option value="">Select Membership Type</option>
          <option value="Ordinary Member">Ordinary Member</option>
          <option value="Industry Body Member">Industry Body Member</option>
          <option value="Associate Member">Associate Member</option>
        </select>
        {errors['membershipDetails.membershipType'] && (
          <div id="membership-membershipType-error" className="error-message">
            {errors['membershipDetails.membershipType']}
          </div>
        )}
      </div>

      {/* Ordinary Plan */}
      <div className="field">
        <label htmlFor="membership-ordinaryPlan">
          If you have chosen ordinary membership, please choose your plan
          {membershipValues.membershipType === 'Ordinary Member' && <span className="req-star">*</span>}
        </label>
        <select
          id="membership-ordinaryPlan"
          value={membershipValues.ordinaryPlan || ''}
          onChange={(e) => setField('membershipDetails', 'ordinaryPlan', e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={membershipValues.membershipType !== 'Ordinary Member'}
          aria-disabled={membershipValues.membershipType !== 'Ordinary Member'}
          aria-invalid={errors['membershipDetails.ordinaryPlan'] ? 'true' : 'false'}
          aria-describedby={errors['membershipDetails.ordinaryPlan'] ? 'membership-ordinaryPlan-error' : undefined}
        >
          <option value="">Select Plan</option>
          {ORDINARY_PLANS.map(plan => (
            <option key={plan} value={plan}>{plan}</option>
          ))}
        </select>
        {errors['membershipDetails.ordinaryPlan'] && (
          <div id="membership-ordinaryPlan-error" className="error-message">
            {errors['membershipDetails.ordinaryPlan']}
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="field">
        <label htmlFor="membership-paymentMethod">Payment Method <span className="req-star">*</span></label>
        <select
          id="membership-paymentMethod"
          value={membershipValues.paymentMethod || ''}
          onChange={(e) => setField('membershipDetails', 'paymentMethod', e.target.value)}
          onKeyDown={handleKeyDown}
          aria-invalid={errors['membershipDetails.paymentMethod'] ? 'true' : 'false'}
          aria-describedby={errors['membershipDetails.paymentMethod'] ? 'membership-paymentMethod-error' : undefined}
        >
          <option value="">Select Payment Method</option>
          <option value="E-mail: members@bvifinance.vg">E-mail: members@bvifinance.vg</option>
          <option value="Hand/Mail: BVI Address">Hand/Mail: BVI Address</option>
          <option value="Cheque: to 'BVI Finance Limited'">Cheque: to 'BVI Finance Limited'</option>
        </select>
        {errors['membershipDetails.paymentMethod'] && (
          <div id="membership-paymentMethod-error" className="error-message">
            {errors['membershipDetails.paymentMethod']}
          </div>
        )}
      </div>

      {/* Signature */}
      <div className="field">
        <label id="membership-signatureFile-label">Signature <span className="req-star">*</span></label>
        <div
          id="membership-signatureFile"
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
          aria-labelledby="membership-signatureFile-label"
          aria-invalid={errors['membershipDetails.signatureFile'] ? 'true' : 'false'}
          aria-describedby={errors['membershipDetails.signatureFile'] ? 'membership-signatureFile-error' : undefined}
        >
          <div className="dropzone-content">
            <i className="bi bi-cloud-upload dropzone-icon" aria-hidden="true"></i>
            <p className="dropzone-label">
              {membershipValues.signatureFile ? membershipValues.signatureFile.name : 'Drag and drop signature file here'}
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
        {errors['membershipDetails.signatureFile'] && (
          <div id="membership-signatureFile-error" className="error-message">
            {errors['membershipDetails.signatureFile']}
          </div>
        )}
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

export default MembershipDetailsForm;
