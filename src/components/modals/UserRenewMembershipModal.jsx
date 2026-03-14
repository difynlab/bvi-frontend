import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import membersService from '../../services/membersService';
import membershipPlansService from '../../services/membershipPlansService';
import CustomDropdown from '../CustomDropdown';
import '../../styles/components/UserRenewMembershipModal.scss';

export const UserRenewMembershipModal = ({
  isOpen,
  onClose,
  user,
  onRenewed
}) => {
  const [membershipPlanId, setMembershipPlanId] = useState('');
  const [selectedDurationKey, setSelectedDurationKey] = useState('');
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

  useEffect(() => {
    if (isOpen) {
      setMembershipPlanId('');
      setSelectedDurationKey('');
      setAmount('');
      setErrorMessage('');
      setSuccessMessage('');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const extractPlansArray = (payload) => {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (payload.data) return extractPlansArray(payload.data);
      if (payload.items) return extractPlansArray(payload.items);
      if (payload.plans) return extractPlansArray(payload.plans);
      return [];
    };

    const fetchPlans = async () => {
      setIsLoadingPlans(true);
      try {
        const response = await membershipPlansService.getMembershipPlans({ pagination: 50, page: 1 });
        if (!isMounted) return;
        const plansArray = extractPlansArray(response);
        if (isMounted) {
          setMembershipPlans(plansArray);
        }
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching membership plans:', error);
          setMembershipPlans([]);
          setErrorMessage(error.message || 'Failed to load membership plans.');
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
  }, [isOpen]);

  const selectedPlan = useMemo(() => {
    if (!membershipPlanId || !membershipPlans.length) return null;
    return membershipPlans.find(plan => plan.id !== undefined && plan.id !== null && String(plan.id) === membershipPlanId);
  }, [membershipPlanId, membershipPlans]);

  const pricingOptions = useMemo(() => {
    if (!selectedPlan) return [];
    const pricing = selectedPlan.pricing;
    if (!pricing) return [];
    let arr = [];
    if (Array.isArray(pricing)) {
      arr = pricing;
    } else if (typeof pricing === 'string') {
      try {
        const parsed = JSON.parse(pricing);
        arr = Array.isArray(parsed) ? parsed : [];
      } catch (_) {
        return [];
      }
    } else {
      return [];
    }
    return arr
      .map((item, index) => {
        if (item && typeof item === 'object' && 'price' in item) {
          const duration = item.duration || item.duration_months || `Option ${index + 1}`;
          const key = String(index);
          return { key, label: duration, price: item.price };
        }
        if (typeof item === 'number' || (typeof item === 'string' && !isNaN(parseFloat(item)))) {
          const price = typeof item === 'number' ? item : parseFloat(item);
          return { key: String(index), label: `Option ${index + 1}`, price };
        }
        return null;
      })
      .filter(Boolean);
  }, [selectedPlan]);

  useEffect(() => {
    if (pricingOptions.length > 0 && !selectedDurationKey) {
      setSelectedDurationKey(pricingOptions[0].key);
    }
    if (pricingOptions.length === 0) {
      setSelectedDurationKey('');
    }
  }, [pricingOptions, selectedDurationKey]);

  const planPrice = useMemo(() => {
    if (pricingOptions.length > 0) {
      const option = selectedDurationKey
        ? pricingOptions.find(opt => opt.key === selectedDurationKey)
        : pricingOptions[0];
      return option ? String(option.price ?? '') : '';
    }
    if (!selectedPlan) return '';
    const pricing = selectedPlan.pricing;
    if (!pricing) return '';
    if (Array.isArray(pricing) && pricing.length > 0) {
      const first = pricing[0];
      if (typeof first === 'object' && first !== null && 'price' in first) return String(first.price ?? '');
      return String(first);
    }
    if (typeof pricing === 'number') return String(pricing);
    if (typeof pricing === 'string') {
      const num = parseFloat(pricing);
      if (!isNaN(num)) return String(num);
    }
    return '';
  }, [selectedPlan, pricingOptions, selectedDurationKey]);

  useEffect(() => {
    if (planPrice !== '') {
      setAmount(planPrice);
    } else {
      setAmount('');
    }
  }, [planPrice]);

  const handleMembershipPlanChange = (e) => {
    setMembershipPlanId(e.target.value);
    setSelectedDurationKey('');
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleDurationChange = (e) => {
    setSelectedDurationKey(e.target.value);
    setErrorMessage('');
    setSuccessMessage('');
  };

  const handleRenew = useCallback(async () => {
    if (!user || !user.id || isLoading || !membershipPlanId || !amount) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateString = `${year}-${month}-${day}`;

      const amountNum = parseFloat(amount);
      if (isNaN(amountNum) || amountNum < 0) {
        setErrorMessage('Invalid amount');
        setIsLoading(false);
        return;
      }

      const renewalData = {
        membership_plan_id: Number(membershipPlanId),
        date: dateString,
        amount: amountNum,
        status: 1
      };

      const response = await membersService.renewOwnMembership(renewalData);

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
  }, [user, membershipPlanId, amount, isLoading, onRenewed, onClose]);

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

  if (!isOpen || !user) return null;

  return (
    <div
      className="user-renew-membership-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="user-renew-membership-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="user-renew-membership-title"
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x"></i>
        </button>

        <div className="user-renew-membership-modal-header">
          <h2 id="user-renew-membership-title">Renew Membership</h2>
        </div>

        <div className="user-renew-membership-modal-content">
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

          {pricingOptions.length > 0 && (
            <div className="form-field">
              <label className="form-label">
                Duration<span className="required">*</span>
              </label>
              <CustomDropdown
                name="duration"
                value={selectedDurationKey}
                onChange={handleDurationChange}
                options={pricingOptions.map(opt => ({ value: opt.key, label: opt.label }))}
                placeholder="Select duration"
              />
            </div>
          )}

          <div className="form-field">
            <label className="form-label">
              Pricing<span className="required">*</span>
            </label>
            <div style={{ position: 'relative' }}>
              <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }}>$</span>
              <input
                type="number"
                name="amount"
                value={amount}
                readOnly
                placeholder="0.00"
                min="0"
                step="0.01"
                style={{ width: '100%', paddingLeft: '30px', padding: '10px 10px 10px 30px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#f9fafb', cursor: 'not-allowed' }}
              />
            </div>
          </div>
        </div>

        <div className="user-renew-membership-modal-footer">
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
              className="btn btn-renew"
              onClick={handleRenew}
              disabled={isLoading || !membershipPlanId || !amount}
            >
              {isLoading ? 'Processing...' : 'Renew Membership'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

