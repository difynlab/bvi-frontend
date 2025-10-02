import React, { useState } from 'react';
import { useLegislationState } from '../../hooks/useLegislationState';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import LegislationEditModal from '../../components/modals/LegislationEditModal';
import '../../styles/sections/Legislation.scss';

const Legislation = () => {
  const { legislation, attachments, addAttachment, removeAttachment } = useLegislationState();
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleEditClick = () => {
    if (can(user, 'legislation:update')) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSaveAttachment = (newAttachment) => {
    addAttachment(newAttachment);
  };

  const handleDownloadAttachment = (attachment) => {
    const url = attachment.fileUrl || attachment.linkUrl;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleDeleteAttachment = (attachmentId) => {
    if (can(user, 'legislation:delete')) {
      removeAttachment(attachmentId);
    }
  };

  if (!legislation) {
    return (
      <div className="legislation-container">
        <div className="legislation-header">
          <div className="legislation-header-title">
            <h1>Legislation Details</h1>
            <p>Manage your account and adjust settings to optimize your workflow.</p>
          </div>
        </div>
        <p>Loading legislation data...</p>
      </div>
    );
  }

  return (
    <div className="legislation-container">
      {/* Header */}
      <div className="legislation-header">
        <div className="legislation-header-title">
          <h1>Legislation Details</h1>
          <p>Manage your account and adjust settings to optimize your workflow.</p>
        </div>
        {can(user, 'legislation:update') && (
          <button 
            className="btn btn-primary legislation-edit-btn"
            onClick={handleEditClick}
            aria-label="Edit legislation"
          >
            <i className="bi bi-pencil-square" aria-hidden="true"></i>
            Edit Legislation
          </button>
        )}
      </div>

      {/* Meta Information */}
      <dl className="legislation-meta">
        <dt>Title:</dt>
        <dd>{legislation.title}</dd>
        
        <dt>Category:</dt>
        <dd>{legislation.category}</dd>
        
        <dt>Legislation Type:</dt>
        <dd>{legislation.type}</dd>
        
        <dt>Jurisdiction:</dt>
        <dd>{legislation.jurisdiction}</dd>
        
        <dt>Status:</dt>
        <dd>{legislation.status}</dd>
        
        <dt>Date Enacted:</dt>
        <dd>{legislation.dateEnacted}</dd>
        
        <dt>Effective Date:</dt>
        <dd>{legislation.effectiveDate}</dd>
        
        <dt>Last Amended:</dt>
        <dd>{legislation.lastAmended}</dd>
        
        <dt>Reference Number:</dt>
        <dd>{legislation.referenceNumber}</dd>
      </dl>

      <div className="legislation-divider"></div>

      {/* Summary */}
      <div>
        <h3>Summary:</h3>
        <p>{legislation.summary}</p>
      </div>

      <div className="legislation-divider"></div>

      {/* Key Provisions */}
      <div>
        <h3>Key Provisions:</h3>
        <ul className="legislation-list">
          {legislation.keyProvisions.map((provision, index) => (
            <li key={index}>{provision}</li>
          ))}
        </ul>
      </div>

      <div className="legislation-divider"></div>

      {/* Amendments */}
      <div>
        <h3>Amendments:</h3>
        <ul className="legislation-list">
          {legislation.amendments.map((amendment, index) => (
            <li key={index}>
              <strong>{amendment.date}:</strong> {amendment.text}
            </li>
          ))}
        </ul>
      </div>

      <div className="legislation-divider"></div>

      {/* Responsible Body */}
      <div>
        <h3>Responsible Body:</h3>
        <p>{legislation.responsibleBody}</p>
      </div>

      {/* Attachments */}
      <div className="legislation-attachments">
        <h3>Attachments:</h3>
        {attachments.map((attachment) => (
          <div key={attachment.id} className="attachment-item">
            <div className="meta">
              <span className="source-label">Lorem Ipsum</span>
              <span className="attachment-title">{attachment.title}</span>
            </div>
            <div className="actions">
              <button
                className="download-btn"
                onClick={() => handleDownloadAttachment(attachment)}
                aria-label={`Download ${attachment.title}`}
              >
                Download PDF
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteAttachment(attachment.id)}
                aria-label={`Delete ${attachment.title}`}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      <LegislationEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveAttachment}
      />
    </div>
  );
};

export { Legislation };
