import React, { useRef, useState } from 'react'
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose'
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock'
import ModalLifecycleLock from './ModalLifecycleLock'
import communicationPlaybookService from '../../services/communicationPlaybookService'
import '../../styles/components/PlaybookUploadModal.scss'

const PlaybookUploadModal = ({ isOpen, onClose, onFileSelected }) => {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const fileInputRef = useRef(null)

  const modalBackdropClose = useModalBackdropClose(onClose)
  useBodyScrollLock(isOpen)

  if (!isOpen) return null

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const validateAndSetFile = (file) => {
    if (!file) return
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed.')
      setSelectedFile(null)
      return
    }
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      setError('File size must be less than 10MB.')
      setSelectedFile(null)
      return
    }

    setError('')
    setSelectedFile(file)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    const files = Array.from(e.dataTransfer.files || [])
    if (files.length > 0) {
      validateAndSetFile(files[0])
    }
  }

  const handleFileInput = (e) => {
    const file = e.target.files && e.target.files[0]
    validateAndSetFile(file)
    e.target.value = ''
  }

  const handleBrowseClick = () => {
    fileInputRef.current?.click()
  }

  const handleClose = () => {
    setDragActive(false)
    setSelectedFile(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    onClose()
  }

  const handleSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a PDF file.')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      const response = await communicationPlaybookService.updatePlaybook(selectedFile)
      const data = response?.data || response
      if (data) {
        onFileSelected?.(data)
      } else {
        onFileSelected?.(null)
      }
      handleClose()
    } catch (err) {
      setError(err?.message || 'Failed to update playbook.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="playbook-upload-modal-overlay"
      role="presentation"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="playbook-upload-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="playbook-upload-modal-title"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
      >
        <button
          type="button"
          className="playbook-upload-modal__close"
          aria-label="Close"
          onClick={handleClose}
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>

        <header className="playbook-upload-modal__header">
          <h2 id="playbook-upload-modal-title" className="playbook-upload-modal__title">
            Update Playbook
          </h2>
          <p className="playbook-upload-modal__subtitle">
            Update the file currently displayed. Only PDF files are allowed.
          </p>
        </header>

        {error && (
          <div className="playbook-upload-modal__error" role="alert">
            {error}
          </div>
        )}

        <div className="playbook-upload-modal__body">
          <div
            className={`playbook-upload-dropzone ${dragActive ? 'playbook-upload-dropzone--active' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={handleBrowseClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                handleBrowseClick()
              }
            }}
            tabIndex={0}
            role="button"
          >
            {selectedFile ? (
              <div className="playbook-upload-dropzone__file">
                <i className="bi bi-file-earmark-pdf" aria-hidden="true"></i>
                <div className="playbook-upload-dropzone__file-info">
                  <span className="playbook-upload-dropzone__file-name">{selectedFile.name}</span>
                </div>
              </div>
            ) : (
              <div className="playbook-upload-dropzone__content">
                <i className="bi bi-cloud-upload playbook-upload-dropzone__icon" aria-hidden="true"></i>
                <p className="playbook-upload-dropzone__label">Drag and drop a PDF here</p>
                <p className="playbook-upload-dropzone__separator">or</p>
                <button
                  type="button"
                  className="playbook-upload-dropzone__browse"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleBrowseClick()
                  }}
                >
                  Browse File
                </button>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="playbook-upload-modal__file-input"
            onChange={handleFileInput}
          />
        </div>

        <footer className="playbook-upload-modal__footer">
          <button
            type="button"
            className="upload-now-btn"
            onClick={handleSubmit}
            disabled={!selectedFile || submitting}
          >
            {submitting ? 'Uploading...' : 'Submit'}
          </button>
        </footer>
      </div>
    </div>
  )
}

export default PlaybookUploadModal

