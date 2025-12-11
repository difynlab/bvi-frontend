import React, { useState, useEffect, useRef } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import '../../styles/components/PasswordConfirmModal.scss';

export default function PasswordConfirmModal({ isOpen, onClose, onConfirm, errorMessage = '' }) {
  const [password, setPassword] = useState('');
  const passwordInputRef = useRef(null);
  const modalBackdropClose = useModalBackdropClose(onClose);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (isOpen && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (password.trim()) {
      onConfirm(password);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && password.trim()) {
      handleConfirm();
    }
  };

  return (
    <div
      className="password-confirm-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="password-confirm-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="password-confirm-title"
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x-lg"></i>
        </button>

        <div className="password-confirm-header">
          <h2 id="password-confirm-title">Confirm Changes</h2>
        </div>

        <div className="password-confirm-content">
          <p>Please enter your password to confirm changes</p>

          <div className="password-confirm-input-group">
            <input
              ref={passwordInputRef}
              type="text"
              className="password-confirm-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
              autoComplete="current-password"
            />
          </div>

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

          <div className="password-confirm-footer">
            <button
              type="button"
              onClick={onClose}
              className="password-confirm-btn-cancel"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="password-confirm-btn-save"
              disabled={!password.trim()}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

