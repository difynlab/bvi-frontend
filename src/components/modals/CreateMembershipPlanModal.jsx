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
    pricing: { 6: 0, 12: 0, 18: 0 },
    status: 1
  });
  const [durations, setDurations] = useState([6, 12, 18]);
  const [editingDurationIndex, setEditingDurationIndex] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(6);
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const modalBackdropClose = useModalBackdropClose(onClose);
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen) {
      let pricing = { 6: 0, 12: 0, 18: 0 };
      if (initialData?.pricing) {
        if (typeof initialData.pricing === 'object' && !Array.isArray(initialData.pricing)) {
          pricing = {
            6: typeof initialData.pricing[6] === 'number' ? initialData.pricing[6] : parseFloat(initialData.pricing[6]) || 0,
            12: typeof initialData.pricing[12] === 'number' ? initialData.pricing[12] : parseFloat(initialData.pricing[12]) || 0,
            18: typeof initialData.pricing[18] === 'number' ? initialData.pricing[18] : parseFloat(initialData.pricing[18]) || 0
          };
        } else if (Array.isArray(initialData.pricing) && initialData.pricing.length > 0) {
          pricing = {
            6: typeof initialData.pricing[0] === 'number' ? initialData.pricing[0] : parseFloat(initialData.pricing[0]) || 0,
            12: typeof initialData.pricing[1] === 'number' ? initialData.pricing[1] : (typeof initialData.pricing[0] === 'number' ? initialData.pricing[0] : parseFloat(initialData.pricing[0]) || 0),
            18: typeof initialData.pricing[2] === 'number' ? initialData.pricing[2] : (typeof initialData.pricing[0] === 'number' ? initialData.pricing[0] : parseFloat(initialData.pricing[0]) || 0)
          };
        }
      }
      setFormState({
        title: initialData?.title || '',
        description: initialData?.description || '',
        eligibility_criteria: initialData?.eligibility_criteria || '',
        perks: initialData?.perks?.length ? [...initialData.perks] : [''],
        pricing,
        status: 1
      });
      
      if (initialData?.pricingArray && Array.isArray(initialData.pricingArray) && initialData.pricingArray.length > 0) {
        const extractedDurations = initialData.pricingArray.map(item => {
          const durationStr = item.duration || '';
          const match = durationStr.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 6;
        });
        setDurations(extractedDurations.length >= 3 ? extractedDurations.slice(0, 3) : [6, 12, 18]);
      } else {
        setDurations([6, 12, 18]);
      }
      
      setSelectedDuration(durations[0] || 6);
      setEditingDurationIndex(null);
      setErrorMessage('');
    } else {
      setDurations([6, 12, 18]);
      setSelectedDuration(6);
      setEditingDurationIndex(null);
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

  const handlePricingChange = useCallback((duration, value) => {
    setFormState((prev) => {
      const pricing = { ...prev.pricing };
      if (value === '' || value === null || value === undefined) {
        pricing[duration] = '';
      } else {
        const numValue = parseFloat(value);
        pricing[duration] = isNaN(numValue) ? '' : numValue;
      }
      return {
        ...prev,
        pricing
      };
    });
    setErrorMessage('');
  }, []);

  const handlePricingBlur = useCallback((duration) => {
    setFormState((prev) => {
      const pricing = { ...prev.pricing };
      if (pricing[duration] === '' || pricing[duration] === null || pricing[duration] === undefined) {
        pricing[duration] = 0;
      }
      return {
        ...prev,
        pricing
      };
    });
  }, []);

  const handleDurationEdit = useCallback((index) => {
    setEditingDurationIndex(index);
  }, []);

  const handleDurationChange = useCallback((index, value) => {
    if (value === '' || value === null || value === undefined) {
      setDurations((prev) => {
        const newDurations = [...prev];
        newDurations[index] = '';
        return newDurations;
      });
      return;
    }
    
    const numValue = parseInt(value, 10);
    if (!isNaN(numValue) && numValue > 0) {
      const oldDuration = durations[index];
      const newDuration = numValue;
      
      setDurations((prev) => {
        const newDurations = [...prev];
        newDurations[index] = numValue;
        return newDurations;
      });
      
      setFormState((prev) => {
        const pricing = { ...prev.pricing };
        if (oldDuration && pricing[oldDuration] !== undefined) {
          pricing[newDuration] = pricing[oldDuration];
          delete pricing[oldDuration];
        }
        return {
          ...prev,
          pricing
        };
      });
      
      if (selectedDuration === oldDuration) {
        setSelectedDuration(newDuration);
      }
    }
  }, [durations, selectedDuration]);

  const handleDurationBlur = useCallback(() => {
    setDurations((prev) => {
      const newDurations = prev.map((d, idx) => {
        if (idx === editingDurationIndex && (d === '' || d === null || d === undefined || d < 1)) {
          return 6;
        }
        return d;
      });
      return newDurations;
    });
    setEditingDurationIndex(null);
  }, [editingDurationIndex]);



  const isValid = useMemo(() => {
    const { title, description, eligibility_criteria, perks, pricing } = formState;
    const pricingObj = typeof pricing === 'object' && !Array.isArray(pricing) ? pricing : {};
    const hasValidPrices = durations.every(d => {
      const price = pricingObj[d];
      return typeof price === 'number' && price >= 0;
    });
    return (
      title.trim().length >= MIN_FIELD_LENGTH &&
      description.trim().length >= MIN_FIELD_LENGTH &&
      eligibility_criteria.trim().length >= MIN_FIELD_LENGTH &&
      sanitizePerks(perks).length > 0 &&
      hasValidPrices
    );
  }, [formState, durations]);

  const handleSubmit = async () => {
    if (!isValid || isSubmitting) {
      if (!isValid) {
        setErrorMessage('Please fill all required fields and add at least one valid perk (min 3 characters).');
      }
      return;
    }
    
    const pricingObj = typeof formState.pricing === 'object' && !Array.isArray(formState.pricing)
      ? formState.pricing
      : { 6: 0, 12: 0, 18: 0 };

    const durationsArray = durations.map(d => `${d} months`);
    const prices = durations.map(d => {
      const price = pricingObj[d];
      return typeof price === 'number' && price >= 0 ? price : 0;
    });
    
    const payload = {
      title: formState.title.trim(),
      description: formState.description.trim(),
      eligibility_criteria: formState.eligibility_criteria.trim(),
      perks: sanitizePerks(formState.perks),
      pricing: pricingObj,
      durations: durationsArray,
      prices,
      status: 1
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
              Pricing
            </label>
            <div className="plan-durations-container">
              {durations.map((duration, index) => {
                const isSelected = selectedDuration === duration;
                const isEditing = editingDurationIndex === index;
                return (
                  <div key={`duration-${index}`} className="plan-duration-wrapper">
                    {isEditing ? (
                      <div className="plan-duration-edit-container">
                        <input
                          type="number"
                          className="plan-duration-input"
                          value={duration === '' ? '' : duration}
                          onChange={(e) => handleDurationChange(index, e.target.value)}
                          onBlur={handleDurationBlur}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleDurationBlur();
                            }
                          }}
                          min="1"
                          autoFocus
                        />
                        <span className="plan-duration-m-label">M</span>
                      </div>
                    ) : (
                      <button
                        type="button"
                        className={`plan-duration-button ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedDuration(duration)}
                      >
                        {duration}M
                        <button
                          type="button"
                          className="plan-duration-edit-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDurationEdit(index);
                          }}
                          aria-label="Edit duration"
                        >
                          <i className="bi bi-pencil-square"></i>
                        </button>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="plan-pricing-input-wrapper">
              <i className="bi bi-currency-dollar plan-pricing-currency"></i>
              <input
                type="number"
                className="plan-pricing-input"
                value={formState.pricing[selectedDuration] === '' || formState.pricing[selectedDuration] === null || formState.pricing[selectedDuration] === undefined ? '' : formState.pricing[selectedDuration]}
                onChange={(e) => handlePricingChange(selectedDuration, e.target.value)}
                onBlur={() => handlePricingBlur(selectedDuration)}
                placeholder="0.00"
                min="0"
                step="0.01"
                onWheel={(e) => e.target.blur()}
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

