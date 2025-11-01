import React, { useEffect, useState, useMemo } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import membersService from '../../services/membersService';
import '../../styles/components/MemberDetailsModal.scss';

export const MemberDetailsModal = ({
  isOpen,
  onClose,
  member,
  onMemberUpdated,
  onDeleteMember
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [currentMember, setCurrentMember] = useState(member);

  const modalBackdropClose = useModalBackdropClose(onClose);

  useBodyScrollLock(isOpen);

  // Initialize with prop data immediately, then fetch updated data in background
  useEffect(() => {
    if (isOpen && member) {
      // Set initial data immediately from prop (don't wait for API)
      setCurrentMember(member);
      setFetchError('');
      
      // Then fetch latest data from API in background
      if (member.id) {
        setIsLoadingMember(true);
        const fetchMemberData = async () => {
          try {
            const memberResponse = await membersService.getMember(member.id);
            
            // Update currentMember with fresh data from API
            if (memberResponse && memberResponse.data) {
              setCurrentMember(memberResponse.data);
              setFetchError('');
            } else if (memberResponse && !memberResponse.data && memberResponse.id) {
              // If response structure is flat (data is the object itself)
              setCurrentMember(memberResponse);
              setFetchError('');
            } else {
              // Keep existing member data from prop
              setFetchError('Failed to load member details. Displaying cached data.');
            }
          } catch (error) {
            console.error('Error fetching member data:', error);
            setFetchError(error.message || 'Failed to load member details. Displaying cached data.');
            // Keep existing member data from prop
          } finally {
            setIsLoadingMember(false);
          }
        };
        fetchMemberData();
      }
    } else if (member) {
      // If modal is not open but member exists, use prop member
      setCurrentMember(member);
    }
  }, [isOpen, member]);

  // Initialize edit data when currentMember changes
  useEffect(() => {
    if (currentMember) {
      setEditData({
        firstName: currentMember.first_name || '',
        lastName: currentMember.last_name || '',
        email: currentMember.email || '',
        phone: currentMember.phone || '',
        status: currentMember.status !== undefined && currentMember.status !== null 
          ? (Number(currentMember.status) === 1 ? 'Active' : 'Inactive')
          : ''
      });
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [currentMember]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Check if there are changes (dirty state)
  const hasChanges = useMemo(() => {
    if (!currentMember) return false;
    
    const currentFirstName = currentMember.first_name || '';
    const currentLastName = currentMember.last_name || '';
    const currentEmail = currentMember.email || '';
    const currentPhone = currentMember.phone || '';
    const currentStatus = currentMember.status !== undefined && currentMember.status !== null 
      ? (Number(currentMember.status) === 1 ? 'Active' : 'Inactive')
      : '';

    return (
      editData.firstName !== currentFirstName ||
      editData.lastName !== currentLastName ||
      editData.email !== currentEmail ||
      editData.phone !== currentPhone ||
      editData.status !== currentStatus
    );
  }, [currentMember, editData]);

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

  if (!isOpen || !currentMember) return null;

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '—';
    }
  };

  const formatPaymentDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return '—';
    }
  };

  const formatPaymentAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    try {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return `$${numAmount.toFixed(2)}`;
    } catch {
      return '—';
    }
  };

  // Prepare payment data: use currentMember.payments if available, otherwise use mock data
  const getPaymentHistory = () => {
    // Check if currentMember.payments exists and has data
    if (currentMember && currentMember.payments && Array.isArray(currentMember.payments) && currentMember.payments.length > 0) {
      // Map API payment data to table format
      return currentMember.payments.map((payment) => ({
        id: payment.id || null,
        date: formatPaymentDate(payment.date || payment.created_at || payment.payment_date),
        status: payment.status || '—',
        amount: formatPaymentAmount(payment.amount || payment.total),
        receipt: payment.receipt || payment.receipt_url || null,
        isPending: payment.status?.toLowerCase() === 'pending' || payment.status === 'Pending'
      }));
    }

    // Mock data (to be replaced when API provides payments)
    return [
      {
        id: null,
        date: '01/15/2024',
        status: 'Paid',
        amount: '$299.00',
        receipt: 'download',
        isPending: false
      },
      {
        id: null,
        date: '12/15/2023',
        status: 'Paid',
        amount: '$299.00',
        receipt: 'download',
        isPending: false
      },
      {
        id: null,
        date: '11/15/2023',
        status: 'Pending',
        amount: '$299.00',
        receipt: null,
        isPending: true
      },
      {
        id: null,
        date: '10/15/2023',
        status: 'Paid',
        amount: '$299.00',
        receipt: 'download',
        isPending: false
      }
    ];
  };

  const paymentHistory = getPaymentHistory();

  const fullName = currentMember ? `${currentMember.first_name || ''} ${currentMember.last_name || ''}`.trim() || '—' : '—';
  const isActive = currentMember && currentMember.status !== undefined && currentMember.status !== null && Number(currentMember.status) === 1;

  const handleEditClick = () => {
    setIsEditing(!isEditing);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSaveChanges = async () => {
    if (!currentMember || !hasChanges || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      // Prepare data for API - convert status back to 1/0
      const statusValue = editData.status === 'Active' ? 1 : (editData.status === 'Inactive' ? 0 : null);
      
      const updateData = {
        first_name: editData.firstName,
        last_name: editData.lastName,
        email: editData.email,
        phone: editData.phone,
        status: statusValue
      };

      const response = await membersService.updateMember(currentMember.id, updateData);

      // Check if response is successful (200 OK)
      if (response && (response.http_status === 200 || !response.http_status)) {
        // Fetch updated member data from API
        try {
          const updatedMemberResponse = await membersService.getMember(currentMember.id);
          
          // Update currentMember with fresh data from API
          if (updatedMemberResponse && updatedMemberResponse.data) {
            setCurrentMember(updatedMemberResponse.data);
          } else if (updatedMemberResponse && !updatedMemberResponse.data && updatedMemberResponse.id) {
            // If response structure is flat (data is the object itself)
            setCurrentMember(updatedMemberResponse);
          }
        } catch (fetchError) {
          console.error('Error fetching updated member:', fetchError);
          // Still show success even if fetch fails
        }

        setSuccessMessage('Member information updated successfully!');
        setIsEditing(false);
        
        // Refresh members list in parent component if callback provided
        if (onMemberUpdated && typeof onMemberUpdated === 'function') {
          onMemberUpdated();
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        throw new Error(response?.message || 'Failed to update member');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while updating member information');
      console.error('Error updating member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="member-details-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="member-details-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-details-title"
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x"></i>
        </button>

        <div className="member-details-modal-header">
          <h2 id="member-details-title">
            Member Information <span className={`member-details-id ${isActive ? 'active' : 'inactive'}`}>ID#{currentMember.id || '—'}</span>
          </h2>
        </div>

        <div className="member-details-modal-content">
          {fetchError && (
            <div className="app-form__error-banner" role="alert" aria-live="assertive" style={{ marginBottom: '16px' }}>
              <strong>Warning:</strong> {fetchError}
            </div>
          )}
          {isLoadingMember && (
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }}></i>
              Loading latest data...
            </div>
          )}
          <div className="member-details-columns">
            <div className="member-details-image-column">
              {currentMember.image ? (
                <img 
                  src={currentMember.image} 
                  alt={fullName}
                  className="member-details-image"
                />
              ) : (
                <div className="member-details-image-placeholder">
                  <i className="bi bi-person-fill"></i>
                </div>
              )}
            </div>

            <div className="member-details-column">
              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-person"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Name:</span>
                  <input
                    type="text"
                    className="member-detail-value"
                    value={isEditing ? `${editData.firstName || ''} ${editData.lastName || ''}`.trim() : fullName}
                    readOnly={!isEditing}
                    onChange={(e) => {
                      const parts = e.target.value.split(' ');
                      handleInputChange('firstName', parts[0] || '');
                      handleInputChange('lastName', parts.slice(1).join(' ') || '');
                    }}
                  />
                </div>
              </div>

              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-envelope"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Mail:</span>
                  <input
                    type="email"
                    className="member-detail-value"
                    value={isEditing ? editData.email : (currentMember.email || '—')}
                    readOnly={!isEditing}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-telephone"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Phone Number:</span>
                  <input
                    type="tel"
                    className="member-detail-value"
                    value={isEditing ? editData.phone : (currentMember.phone || '—')}
                    readOnly={!isEditing}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="member-details-column">
              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-person-badge"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Status:</span>
                  {isEditing ? (
                    <input
                      type="text"
                      className="member-detail-value"
                      value={editData.status}
                      readOnly={false}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                    />
                  ) : (
                    <span className={`member-detail-status-badge ${isActive ? 'active' : 'inactive'}`}>
                      {currentMember.status !== undefined && currentMember.status !== null
                        ? (Number(currentMember.status) === 1 ? 'Active' : 'Inactive')
                        : '—'}
                    </span>
                  )}
                </div>
              </div>

              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-calendar-event"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Created at:</span>
                  <input
                    type="text"
                    className="member-detail-value"
                    value={formatDate(currentMember.created_at)}
                    readOnly
                  />
                </div>
              </div>

              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-calendar-check"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Updated at:</span>
                  <input
                    type="text"
                    className="member-detail-value"
                    value={formatDate(currentMember.updated_at)}
                    readOnly
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="member-payment-history">
            <h3 className="member-payment-history-title">Payment History</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '20px' }}>
                        No payment history available
                      </td>
                    </tr>
                  ) : (
                    paymentHistory.map((payment, index) => (
                      <tr key={payment.id || `mock-payment-${index}`}>
                        <td>{payment.date || '—'}</td>
                        <td>
                          {payment.isPending ? (
                            <span className="pending-text">{payment.status}</span>
                          ) : (
                            payment.status || '—'
                          )}
                        </td>
                        <td>{payment.amount || '—'}</td>
                        <td>
                          {payment.isPending ? (
                            <span className="pending-text">Pending</span>
                          ) : payment.receipt ? (
                            <a 
                              href={typeof payment.receipt === 'string' && payment.receipt.startsWith('http') 
                                ? payment.receipt 
                                : '#'} 
                              className="receipt-link"
                              onClick={(e) => {
                                if (!payment.receipt || !payment.receipt.startsWith('http')) {
                                  e.preventDefault();
                                }
                              }}
                            >
                              Download
                            </a>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="member-details-modal-footer">
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
          <button
            className="member-details-btn member-details-btn--edit"
            onClick={isEditing ? handleSaveChanges : handleEditClick}
            disabled={isEditing && (!hasChanges || isLoading)}
          >
            <i className="bi bi-pencil-square"></i>
            {isLoading ? 'Loading...' : (isEditing ? 'Save Changes' : 'Edit Info')}
          </button>
          <button
            className="member-details-btn member-details-btn--delete"
            onClick={() => {
              if (onDeleteMember && currentMember) {
                onDeleteMember(currentMember);
              }
            }}
          >
            <i className="bi bi-exclamation-triangle"></i>
            Delete Member
          </button>
        </div>
      </div>
    </div>
  );
};
