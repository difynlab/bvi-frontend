import React from 'react'
import { PdfViewer } from '../../components/PdfViewer'
import '../../styles/sections/CommunicationsPlaybook.scss'

const DEFAULT_PLAYBOOK_PDF = '/storage/legislations/9098be04-bbbd-41c5-9666-ee57628f871f.pdf'

export const CommunicationsPlaybook = () => {
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
            >
              Update Playbook
            </button>
          </div>
        </div>
        <div className="communications-playbook-pdf-wrap">
          <PdfViewer src={DEFAULT_PLAYBOOK_PDF} className="communications-playbook-pdf-viewer" />
        </div>
      </div>
      <div className="communications-playbook-mobile-fab">
        <button
          type="button"
          className="communications-playbook-mobile-fab__btn"
          aria-label="Update Playbook"
        >
          <i className="bi bi-plus" aria-hidden="true"></i>
        </button>
      </div>
    </div>
  )
}
