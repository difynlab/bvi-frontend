import React from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import '../../styles/components/SubscriptionConfirmModal.scss';

const SubscriptionConfirmModal = ({ isOpen, onClose, onSave, onDiscard }) => {
  // Modal backdrop close behavior
  const modalBackdropClose = useModalBackdropClose(onClose);
  
  // Body scroll lock for modal
  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="subscription-confirm-modal-overlay"
      role="presentation"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <div
        className="subscription-confirm-modal"
        role="dialog"
        aria-modal="true"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
      >
        <button
          type="button"
          className="subscription-confirm-modal__close"
          aria-label="Close"
          onClick={onClose}
        >
          <i className="bi bi-x" aria-hidden="true"></i>
        </button>

        <div className="subscription-confirm-modal__header">
          <h2 className="subscription-confirm-modal__title">Save Changes</h2>
          <p className="subscription-confirm-modal__subtitle">
            You have unsaved changes. Do you want to save them before closing?
          </p>
        </div>

        <div className="subscription-confirm-modal__footer">
          <button
            type="button"
            className="subscription-confirm-modal__discard"
            onClick={onDiscard}
          >
            Discard
          </button>
          <button
            type="button"
            className="subscription-confirm-modal__save"
            onClick={onSave}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionConfirmModal;
