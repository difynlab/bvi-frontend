import React, { useEffect, useRef } from 'react'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import ModalLifecycleLock from './ModalLifecycleLock'

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm
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
    onConfirm()
    onClose()
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
            Deleting this file record will erase all the data from the system permanently. This action cannot be reversed.
          </p>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="delete-button"
              ref={deleteButtonRef}
            >
              <i className="bi bi-trash"></i>Confirm Deletion
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
