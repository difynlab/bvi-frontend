import React, { useEffect, useState } from 'react'
import { PdfViewer } from '../../components/PdfViewer'
import PlaybookUploadModal from '../../components/modals/PlaybookUploadModal'
import communicationPlaybookService from '../../services/communicationPlaybookService'
import '../../styles/sections/CommunicationsPlaybook.scss'

const DEFAULT_PLAYBOOK_PDF = '/storage/legislations/9098be04-bbbd-41c5-9666-ee57628f871f.pdf'

export const CommunicationsPlaybook = () => {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [playbookSrc, setPlaybookSrc] = useState(DEFAULT_PLAYBOOK_PDF)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let isMounted = true

    const loadPlaybook = async () => {
      setIsLoading(true)
      setError('')
      try {
        const response = await communicationPlaybookService.getPlaybook()
        if (!isMounted) return

        const data = response?.data || response?.data === null ? response.data : response

        if (data && data.file) {
          setPlaybookSrc(data.file)
        }
      } catch (err) {
        if (!isMounted) return
        setError(err?.message || 'Failed to load playbook')
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadPlaybook()

    return () => {
      isMounted = false
    }
  }, [])

  const openUploadModal = () => {
    setIsUploadModalOpen(true)
  }

  const closeUploadModal = () => {
    setIsUploadModalOpen(false)
  }

  const handleFileSelected = (playbook) => {
    if (playbook && playbook.file) {
      setPlaybookSrc(playbook.file)
    }
    setIsUploadModalOpen(false)
  }

  return (
    <div className="communications-playbook-page">
      <div className="communications-playbook-container">
        <div className="communications-playbook-header">
          <div className="communications-playbook-header-title">
            <h1>Communications Playbook</h1>
            <p>Guidelines and templates for internal and external communications.</p>
          </div>
          <div className="communications-playbook-header-actions">
            <button
              type="button"
              className="communications-playbook-update-btn communications-playbook-update-btn--desktop"
              aria-label="Update Playbook"
              onClick={openUploadModal}
            >
              Update Playbook
            </button>
          </div>
        </div>
        <div className="communications-playbook-pdf-wrap">
          {!isLoading && !error && (
            <PdfViewer src={playbookSrc} className="communications-playbook-pdf-viewer" />
          )}
          {isLoading && !error && (
            <div className="communications-playbook-pdf-viewer communications-playbook-pdf-viewer--loading">
              <p>Loading playbook…</p>
            </div>
          )}
          {!isLoading && error && (
            <div className="communications-playbook-pdf-viewer communications-playbook-pdf-viewer--error">
              <p>{error}</p>
            </div>
          )}
        </div>
      </div>
      <div className="communications-playbook-mobile-fab">
        <button
          type="button"
          className="communications-playbook-mobile-fab__btn"
          aria-label="Update Playbook"
          onClick={openUploadModal}
        >
          <i className="bi bi-plus" aria-hidden="true"></i>
        </button>
      </div>

      <PlaybookUploadModal
        isOpen={isUploadModalOpen}
        onClose={closeUploadModal}
        onFileSelected={handleFileSelected}
      />
    </div>
  )
}
