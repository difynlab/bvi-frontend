import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import CustomDropdown from '../CustomDropdown';
import '../../styles/components/CreateMembershipPlanModal.scss';

const MIN_FIELD_LENGTH = 3;

const sanitizePerks = (perks = []) =>
  perks
    .map((perk) => (typeof perk === 'string' ? perk.trim() : ''))
    .filter((perk) => perk.length >= MIN_FIELD_LENGTH);

export const CreateMembershipPlanModal = ({
  isOpen,
  onClose,
  onSave,
  initialData
}) => {
  const [formState, setFormState] = useState({
    title: '',
    description: '',
    eligibility_criteria: '',
    perks: [''],
    status: 1,
    pricing: { 6: 0, 12: 10, 18: 25 },
    selected_duration: 6
  });
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalBackdropClose = useModalBackdropClose(onClose);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      setFormState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        eligibility_criteria: initialData?.eligibility_criteria || '',
        perks: initialData?.perks?.length ? [...initialData.perks] : [''],
        status: 1,
        pricing: initialData?.pricing || { 6: 0, 12: 10, 18: 25 },
        selected_duration: initialData?.selected_duration || initialData?.selectedDuration || 6
      });
      setErrorMessage('');
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const handleInputChange = useCallback((field, value) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value
    }));
    setErrorMessage('');
  }, []);

  const handlePerkChange = useCallback((index, value) => {
    setFormState((prev) => {
      const perks = [...prev.perks];
      perks[index] = value;
      return {
        ...prev,
        perks
      };
    });
    setErrorMessage('');
  }, []);

  const handleAddPerk = useCallback(() => {
    setFormState((prev) => ({
      ...prev,
      perks: [...prev.perks, '']
    }));
  }, []);

  const handleDeletePerk = useCallback((index) => {
    setFormState((prev) => {
      const perks = prev.perks.filter((_, perkIndex) => perkIndex !== index);
      return {
        ...prev,
        perks: perks.length > 0 ? perks : ['']
      };
    });
  }, []);

  const handleDurationChange = useCallback((duration) => {
    setFormState((prev) => {
      const durationNum = parseInt(duration, 10);
      const pricing = prev.pricing || { 6: 0, 12: 10, 18: 25 };
      return {
        ...prev,
        selected_duration: durationNum,
        pricing: {
          ...pricing,
          [durationNum]: pricing[durationNum] !== undefined ? pricing[durationNum] : (durationNum === 6 ? 0 : durationNum === 12 ? 10 : 25)
        }
      };
    });
    setErrorMessage('');
  }, []);

  const handlePricingChange = useCallback((value) => {
    setFormState((prev) => {
      const numValue = parseFloat(value) || 0;
      const pricing = prev.pricing || { 6: 0, 12: 10, 18: 25 };
      const selectedDuration = prev.selected_duration || 6;
      return {
        ...prev,
        pricing: {
          ...pricing,
          [selectedDuration]: numValue
        }
      };
    });
    setErrorMessage('');
  }, []);

  const isValid = useMemo(() => {
    const { title, description, eligibility_criteria, perks } = formState;
    return (
      title.trim().length >= MIN_FIELD_LENGTH &&
      description.trim().length >= MIN_FIELD_LENGTH &&
      eligibility_criteria.trim().length >= MIN_FIELD_LENGTH &&
      sanitizePerks(perks).length > 0
    );
  }, [formState]);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) {
      if (!isValid) {
        setErrorMessage('Please fill all required fields and add at least one valid perk (min 3 characters).');
      }
      return;
    }

    const convertPricingToBackendFormat = (pricingObj) => {
      const pricing = pricingObj || { 6: 0, 12: 10, 18: 25 };
      return [
        { duration: 6, price: pricing[6] || 0 },
        { duration: 12, price: pricing[12] || 10 },
        { duration: 18, price: pricing[18] || 25 }
      ];
    };

    const pricingArray = convertPricingToBackendFormat(formState.pricing);
    
    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      eligibility_criteria: formState.eligibility_criteria.trim(),
      perks: sanitizePerks(formState.perks),
      status: 1,
      pricing: pricingArray
    };

    try {
      setIsSubmitting(true);
      await Promise.resolve(onSave?.(payload));
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while creating the plan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="membership-plan-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="membership-plan-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-plan-modal-title"
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x"></i>
        </button>

        <div className="membership-plan-modal-header">
          <h2 id="membership-plan-modal-title">Create Membership Plan</h2>
          <p className="subtitle">Define the details, eligibility, and perks for the new membership plan.</p>
        </div>

        <div className="membership-plan-modal-content">
          <div className="form-field">
            <label className="form-label" htmlFor="plan-title">
              Plan title<span className="required">*</span>
            </label>
            <input
              id="plan-title"
              type="text"
              value={formState.title}
              onChange={(event) => handleInputChange('title', event.target.value)}
              placeholder="Gold Premium Plan"
              className="text-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="plan-description">
              Description<span className="required">*</span>
            </label>
            <textarea
              id="plan-description"
              value={formState.description}
              onChange={(event) => handleInputChange('description', event.target.value)}
              placeholder="Plan updated with new benefits"
              className="textarea-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label" htmlFor="plan-eligibility">
              Eligibility criteria<span className="required">*</span>
            </label>
            <textarea
              id="plan-eligibility"
              value={formState.eligibility_criteria}
              onChange={(event) => handleInputChange('eligibility_criteria', event.target.value)}
              placeholder="Companies with more than 100 employees"
              className="textarea-input"
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Perks<span className="required">*</span>
            </label>
            <ul className="plan-perks plan-perks-editable">
              {formState.perks.map((perk, index) => (
                <li key={`perk-${index}`} className="plan-perk-editable-item">
                  <input
                    type="text"
                    className="plan-perk-input"
                    value={perk}
                    onChange={(event) => handlePerkChange(index, event.target.value)}
                    placeholder="Add a benefit"
                  />
                  <button
                    type="button"
                    className="plan-perk-delete-btn"
                    onClick={() => handleDeletePerk(index)}
                    aria-label="Delete perk"
                  >
                    <i className="bi bi-trash"></i>
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="plan-add-perk-btn"
              onClick={handleAddPerk}
            >
              <i className="bi bi-plus-lg"></i>
              Add perk
            </button>
          </div>

          <div className="form-field">
            <label className="form-label">
              Duration
            </label>
            <CustomDropdown
              name="duration"
              value={formState.selected_duration.toString()}
              onChange={(e) => handleDurationChange(e.target.value)}
              options={[
                { value: '6', label: '6 months' },
                { value: '12', label: '12 months' },
                { value: '18', label: '18 months' }
              ]}
              placeholder="Select duration"
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Pricing
            </label>
            <div className="plan-pricing-input-wrapper">
              <span className="plan-pricing-currency">$</span>
              <input
                type="number"
                className="plan-pricing-input"
                value={formState.pricing[formState.selected_duration] || 0}
                onChange={(e) => handlePricingChange(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
          </div>
        </div>

        <div className="membership-plan-modal-footer">
          {errorMessage && (
            <div className="app-form__error-banner" role="alert" aria-live="assertive">
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          <div className="modal-footer-buttons">
            <button
              type="button"
              className="btn btn-cancel"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-save"
              onClick={handleSubmit}
              disabled={!isValid || isSubmitting}
            >
              {isSubmitting ? 'Saving...' : 'Save plan'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateMembershipPlanModal;

