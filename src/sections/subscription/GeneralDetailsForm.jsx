import React from 'react';
import { setGeneralDetails } from '../../helpers/subscriptionStorage';

const GeneralDetailsForm = ({ values, errors, setField, onNext }) => {
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
            placeholder="Enter company name"
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
