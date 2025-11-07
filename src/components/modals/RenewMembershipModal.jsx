import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import membersService from '../../services/membersService';
import CustomDropdown from '../CustomDropdown';
import '../../styles/components/RenewMembershipModal.scss';

export const RenewMembershipModal = ({
  isOpen,
  onClose,
  member,
  onRenewed
}) => {
  const [membershipType, setMembershipType] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const modalBackdropClose = useModalBackdropClose(onClose);

  useBodyScrollLock(isOpen);

  // Map membership types for display
  const membershipTypeOptions = [
    { value: 'standard', label: 'Basic Plan' },
    { value: 'silver', label: 'Silver Plan' },
    { value: 'gold', label: 'Gold Plan' }
  ];

  // Get last payment data to preload
  const lastPayment = useMemo(() => {
    if (!member || !member.payments || !Array.isArray(member.payments) || member.payments.length === 0) {
      return null;
    }
    // Get the most recent payment (assuming payments are sorted by date)
    return member.payments[0];
  }, [member]);

  // Initialize form with last payment data or defaults
  useEffect(() => {
    if (isOpen && member) {
      if (lastPayment) {
        // Preload from last payment
        setMembershipType(lastPayment.membership_type || 'standard');
        setAmount(lastPayment.amount ? parseFloat(lastPayment.amount).toString() : '');
      } else {
        // Default values
        setMembershipType('standard');
        setAmount('');
      }
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, member, lastPayment]);

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setMembershipType('');
      setAmount('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Check if there are changes from initial values
  const hasChanges = useMemo(() => {
    if (!lastPayment) {
      // If no last payment, any value is a change
      return membershipType !== '' || amount !== '';
    }
    
    const lastAmount = lastPayment.amount ? parseFloat(lastPayment.amount).toString() : '';
    const lastType = lastPayment.membership_type || '';
    
    return membershipType !== lastType || amount !== lastAmount;
  }, [membershipType, amount, lastPayment]);

  // Handle input changes
  const handleMembershipTypeChange = (e) => {
    setMembershipType(e.target.value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleAmountChange = (e) => {
    const value = e.target.value;
    // Allow only numbers and one decimal point
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
      setErrorMessage('');
      setSuccessMessage('');
    }
  };

  // Handle save
  const handleSave = useCallback(async () => {
    if (!member || !member.id || isLoading) return;

    // Validate required fields
    if (!membershipType || !amount || amount === '') {
      setErrorMessage('Membership plan and amount are required');
      return;
    }

    // Validate amount is a valid number
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMessage('Amount must be a valid positive number');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Create date in YYYY-MM-DD format (current date)
      const today = new Date();
      const dateString = today.toISOString().split('T')[0];

      // Prepare renewal data
      const renewalData = {
        membership_type: membershipType,
        date: dateString,
        amount: amountNum,
        status: 1 // Default status
      };

      // Call API
      const response = await membersService.renewMember(member.id, renewalData);

      // Check if response is successful
      if (response && (response.http_status === 200 || !response.http_status)) {
        setSuccessMessage('Membership renewed successfully!');
        
        // Call callback to refresh member data
        if (onRenewed && typeof onRenewed === 'function') {
          onRenewed();
        }
        
        // Close modal after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        throw new Error(response?.message || 'Failed to renew membership');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while renewing membership');
      console.error('Error renewing membership:', error);
    } finally {
      setIsLoading(false);
    }
  }, [member, membershipType, amount, isLoading, onRenewed, onClose]);

  // Handle ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !member) return null;

  return (
    <div
      className="renew-membership-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="renew-membership-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="renew-membership-title"
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x"></i>
        </button>

        <div className="renew-membership-modal-header">
          <h2 id="renew-membership-title">Update Membership Data</h2>
        </div>

        <div className="renew-membership-modal-content">
          <div className="form-field">
            <label className="form-label">
              Membership Plan<span className="required">*</span>
            </label>
            <CustomDropdown
              name="membershipType"
              value={membershipType}
              onChange={handleMembershipTypeChange}
              options={membershipTypeOptions}
              placeholder="Select membership plan"
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Amount<span className="required">*</span>
            </label>
            <div className="amount-input-wrapper">
              <span className="amount-prefix">$</span>
              <input
                type="text"
                inputMode="decimal"
                className="amount-input"
                value={amount}
                onChange={handleAmountChange}
                placeholder="0.00"
              />
            </div>
          </div>
        </div>

        <div className="renew-membership-modal-footer">
          {errorMessage && (
            <div
              className="app-form__error-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          {successMessage && (
            <div
              className="app-form__success-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <strong>Success:</strong> {successMessage}
            </div>
          )}
          <div className="modal-footer-buttons">
            <button
              className="btn btn-cancel"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              className="btn btn-save"
              onClick={handleSave}
              disabled={!hasChanges || isLoading || !membershipType || !amount}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

