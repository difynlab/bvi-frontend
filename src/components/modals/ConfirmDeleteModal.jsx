import React, { useEffect, useRef } from 'react'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import ModalLifecycleLock from './ModalLifecycleLock'

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  message,
  isDeleting = false,
  errorMessage = ''
}) => {
  const modalBackdropClose = useModalBackdropClose(onClose)
  const deleteButtonRef = useRef(null)

  useEffect(() => {
    if (isOpen && deleteButtonRef.current) {
      deleteButtonRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      return () => document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleConfirm = () => {
    // Don't close modal here - let parent handle it after successful delete
    onConfirm()
  }

  return (
    <div
      className="confirm-delete-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="confirm-delete-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x"></i>
        </button>
        <div className="confirm-delete-modal-header">
          <i className="bi bi-exclamation-triangle"></i>
          <h2 id="confirm-delete-title">Are you sure?</h2>

        </div>

        <div className="confirm-modal-content">
          <p>
            {message || 'Are you sure you want to delete this item? This action cannot be reversed.'}
          </p>

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

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
              disabled={isDeleting}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="delete-button"
              ref={deleteButtonRef}
              disabled={isDeleting}
            >
              <i className="bi bi-trash"></i>{isDeleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
