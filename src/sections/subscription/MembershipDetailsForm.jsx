import React, { useState, useRef } from 'react';
import { setMembershipDetails } from '../../helpers/subscriptionStorage';
import CustomDropdown from '../../components/CustomDropdown';

// TODO BACKEND: Replace with API data
const ORDINARY_PLANS = [
  'Standard (Basic)',
  'Silver (Intermediate)', 
  'Gold (Premium)'
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
      setMembershipDetails(membershipValues);
    }
  };

  const handleMembershipTypeChange = (e) => {
    const newType = e.target.value;
    setField('membershipDetails', 'membershipType', newType);
    
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
        <CustomDropdown
          id="membership-membershipType"
          name="membershipType"
          value={membershipValues.membershipType || ''}
          onChange={handleMembershipTypeChange}
          options={[
            { value: 'Ordinary Member', label: 'Ordinary Member' },
            { value: 'Industry Body Member', label: 'Industry Body Member' },
            { value: 'Associate Member', label: 'Associate Member' }
          ]}
          placeholder="Select Membership Type"
        />
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
        <CustomDropdown
          id="membership-ordinaryPlan"
          name="ordinaryPlan"
          value={membershipValues.ordinaryPlan || ''}
          onChange={(e) => setField('membershipDetails', 'ordinaryPlan', e.target.value)}
          options={ORDINARY_PLANS.map(plan => ({ value: plan, label: plan }))}
          placeholder="Select Plan"
          disabled={membershipValues.membershipType !== 'Ordinary Member'}
        />
        {errors['membershipDetails.ordinaryPlan'] && (
          <div id="membership-ordinaryPlan-error" className="error-message">
            {errors['membershipDetails.ordinaryPlan']}
          </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="field">
        <label htmlFor="membership-paymentMethod">Payment Method <span className="req-star">*</span></label>
        <CustomDropdown
          id="membership-paymentMethod"
          name="paymentMethod"
          value={membershipValues.paymentMethod || ''}
          onChange={(e) => setField('membershipDetails', 'paymentMethod', e.target.value)}
          options={[
            { value: 'E-mail: members@bvifinance.vg', label: 'E-mail: members@bvifinance.vg' },
            { value: 'Hand/Mail: BVI Address', label: 'Hand/Mail: BVI Address' },
            { value: 'Cheque: to \'BVI Finance Limited\'', label: 'Cheque: to \'BVI Finance Limited\'' }
          ]}
          placeholder="Select Payment Method"
        />
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
          className={`dropzone dropzone-surface ${dragActive ? 'active' : ''}`}
          data-has-file={Boolean(membershipValues.signatureFile)}
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

export default MembershipDetailsForm;
