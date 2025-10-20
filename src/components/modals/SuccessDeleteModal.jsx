import React, { useEffect, useRef } from 'react'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import ModalLifecycleLock from './ModalLifecycleLock'

export const SuccessDeleteModal = ({
  isOpen,
  onClose
}) => {
  const modalBackdropClose = useModalBackdropClose(onClose)
  const timeoutRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      timeoutRef.current = setTimeout(() => {
        onClose()
      }, 3000)

      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [isOpen, onClose])

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

  return (
    <div
      className="success-delete-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="success-delete-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="success-delete-title"
      >
        <div className="success-delete-modal-content">
          <i className="bi bi-check-circle"></i>
          <h2 id="success-delete-title">Successfully Deleted!</h2>
        </div>
      </div>
    </div>
  )
}

