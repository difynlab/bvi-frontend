import React from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import '../../styles/components/ConfirmLogoutModal.scss';

export default function ConfirmLogoutModal({ isOpen, onClose, onConfirm }) {
  const modalBackdropClose = useModalBackdropClose(onClose);

  useBodyScrollLock(isOpen);

  if (!isOpen) return null;

  return (
    <div
      className="logout-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="logout-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-modal-title"
      >
        <div className="logout-modal-header">
          <h2 id="logout-modal-title">Confirm Logout</h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="bi bi-x-lg"></i>
          </button>
        </div>

        <div className="logout-modal-content">
          <p>Are you sure you want to log out of your account?</p>

          <div className="logout-modal-footer">
            <button 
              type="button" 
              onClick={onClose} 
              className="modal-btn-cancel"
            >
              Cancel
            </button>
            <button 
              type="button" 
              onClick={onConfirm} 
              className="modal-btn-danger"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
