import React, { useEffect, useRef } from 'react'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'

export const ConfirmDeleteModal = ({
  isOpen,
  onClose,
  onConfirm,
  entityLabel,
  itemName
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
      className="notices-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <div
        className="notices-modal confirm-delete-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-delete-title"
      >
        <div className="notices-modal-header">
          <h2 id="confirm-delete-title">Confirm Deletion</h2>
          <button
            className="close-btn"
            onClick={onClose}
            aria-label="Close modal"
          >
            <i className="bi bi-x"></i>
          </button>
        </div>

        <div className="confirm-modal-content">
          <p>
            Are you sure you want to delete this {entityLabel}
            {itemName ? ` "${itemName}"` : ''}?
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
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
