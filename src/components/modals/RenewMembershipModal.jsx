import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import membersService from '../../services/membersService';
import membershipPlansService from '../../services/membershipPlansService';
import CustomDropdown from '../CustomDropdown';
import '../../styles/components/RenewMembershipModal.scss';

const parsePricingFromBackend = (pricing) => {
  if (!pricing) {
    return [];
  }
  
  if (typeof pricing === 'string') {
    try {
      pricing = JSON.parse(pricing);
    } catch (_) {
      return [];
    }
  }
  
  if (Array.isArray(pricing)) {
    return pricing;
  }
  
  return [];
};

export const RenewMembershipModal = ({
  isOpen,
  onClose,
  member,
  onRenewed
}) => {
  const [membershipPlanId, setMembershipPlanId] = useState('');
  const [duration, setDuration] = useState('');
  const [amount, setAmount] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [membershipPlans, setMembershipPlans] = useState([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);

  const modalBackdropClose = useModalBackdropClose(onClose);

  useBodyScrollLock(isOpen);

  const membershipPlanOptions = useMemo(() => {
    return membershipPlans
      .map((plan) => ({
        value: plan && plan.id !== undefined && plan.id !== null ? String(plan.id) : '',
        label: plan?.title || `Plan #${plan?.id ?? ''}`
      }))
      .filter((option) => option.value);
  }, [membershipPlans]);

  const selectedPlan = useMemo(() => {
    if (!membershipPlanId) return null;
    return membershipPlans.find(plan => String(plan?.id) === membershipPlanId);
  }, [membershipPlanId, membershipPlans]);

  const durationOptions = useMemo(() => {
    if (!selectedPlan) return [];
    
    const pricing = parsePricingFromBackend(selectedPlan.pricing);
    if (!Array.isArray(pricing) || pricing.length === 0) return [];
    
    return pricing.map(item => ({
      value: String(item.duration),
      label: `${item.duration} months - $${parseFloat(item.price || 0).toFixed(2)}`
    }));
  }, [selectedPlan]);

  // Get last payment data to preload
  const lastPayment = useMemo(() => {
    if (!member || !member.payments || !Array.isArray(member.payments) || member.payments.length === 0) {
      return null;
    }
    // Get the most recent payment (assuming payments are sorted by date)
    return member.payments[0];
  }, [member]);

  useEffect(() => {
    if (isOpen && member) {
      if (lastPayment) {
        if (lastPayment.membership_plan_id !== undefined && lastPayment.membership_plan_id !== null) {
          setMembershipPlanId(String(lastPayment.membership_plan_id));
        } else {
          setMembershipPlanId('');
        }
        setDuration('');
        setAmount('');
      } else {
        setMembershipPlanId('');
        setDuration('');
        setAmount('');
      }
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen, member, lastPayment]);

  useEffect(() => {
    if (duration && selectedPlan) {
      const pricing = parsePricingFromBackend(selectedPlan.pricing);
      const selectedPricing = pricing.find(item => String(item.duration) === duration);
      if (selectedPricing) {
        setAmount(parseFloat(selectedPricing.price || 0).toFixed(2));
      } else {
        setAmount('');
      }
    } else if (!duration) {
      setAmount('');
    }
  }, [duration, selectedPlan]);

  useEffect(() => {
    if (!isOpen) {
      setMembershipPlanId('');
      setDuration('');
      setAmount('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  // Fetch membership plans when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await membershipPlansService.getMembershipPlans({ pagination: 50, page: 1 });

        const extractPlansArray = (payload) => {
          if (!payload) return [];
          if (Array.isArray(payload)) return payload;
          if (payload.data) return extractPlansArray(payload.data);
          if (payload.items) return extractPlansArray(payload.items);
          return [];
        };

        const plansArray = extractPlansArray(response);

        if (isMounted) {
          setMembershipPlans(plansArray);
          setMembershipPlanId((currentValue) => {
            if (currentValue) {
              const exists = plansArray.some((plan) => String(plan?.id ?? '') === currentValue);
              if (exists) return currentValue;
            }

            const fallbackId =
              (lastPayment?.membership_plan_id ? String(lastPayment.membership_plan_id) : '') ||
              (member?.membership_plan_id ? String(member.membership_plan_id) : '') ||
              (plansArray[0] && plansArray[0].id !== undefined ? String(plansArray[0].id) : '');

            return fallbackId || currentValue;
          });
        }
      } catch (error) {
        console.error('Error fetching membership plans:', error);
        if (isMounted) {
          setMembershipPlans([]);
          setErrorMessage((prev) => prev || error.message || 'Failed to load membership plans.');
        }
      } finally {
        if (isMounted) {
          setIsLoadingPlans(false);
        }
      }
    };

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, [isOpen, member, lastPayment]);

  const hasChanges = useMemo(() => {
    if (!lastPayment) {
      return membershipPlanId !== '' || duration !== '';
    }
    
    const lastPlanId = lastPayment.membership_plan_id ? String(lastPayment.membership_plan_id) : '';
    
    return membershipPlanId !== lastPlanId || duration !== '';
  }, [membershipPlanId, duration, lastPayment]);

  const handleMembershipPlanChange = (e) => {
    setMembershipPlanId(e.target.value);
    setDuration('');
    setAmount('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDurationChange = (e) => {
    setDuration(e.target.value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleSave = useCallback(async () => {
    if (!member || !member.id || isLoading) return;

    if (!membershipPlanId || !duration || !amount) {
      setErrorMessage('Membership plan and duration are required');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0) {
      setErrorMessage('Invalid amount');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const renewalData = {
        membership_plan_id: Number(membershipPlanId),
        date: dateString,
        amount: amountNum,
        duration: Number(duration),
        status: 2
      };

      const response = await membersService.renewMember(member.id, renewalData);

      if (response && (response.http_status === 200 || !response.http_status)) {
        setSuccessMessage('Membership renewed successfully!');
        
        if (onRenewed && typeof onRenewed === 'function') {
          onRenewed();
        }
        
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
  }, [member, membershipPlanId, duration, amount, isLoading, onRenewed, onClose]);

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
              name="membershipPlanId"
              value={membershipPlanId}
              onChange={handleMembershipPlanChange}
              options={membershipPlanOptions}
              placeholder={isLoadingPlans ? 'Loading plans...' : 'Select membership plan'}
              disabled={isLoadingPlans}
            />
          </div>

          <div className="form-field">
            <label className="form-label">
              Duration<span className="required">*</span>
            </label>
            <CustomDropdown
              name="duration"
              value={duration}
              onChange={handleDurationChange}
              options={durationOptions}
              placeholder={!membershipPlanId ? 'Select a plan first' : durationOptions.length === 0 ? 'No durations available' : 'Select duration'}
              disabled={!membershipPlanId || durationOptions.length === 0}
            />
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
              disabled={!hasChanges || isLoading || !membershipPlanId || !duration}
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

