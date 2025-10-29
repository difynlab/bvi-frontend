import React, { useEffect, useState } from 'react';
import { useLegislationState } from '../../hooks/useLegislationState';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import LegislationEditModal from '../../components/modals/LegislationEditModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';
import { pdf } from '@react-pdf/renderer';
import LegislationPDFDocument from '../../components/pdf/LegislationPDFDocument';
import legislationService from '../../services/legislationService';
import '../../styles/sections/Legislation.scss';

const Legislation = () => {
  const { legislation } = useLegislationState(); // Solo usamos legislation del localStorage (info general)
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = useState(null);
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false);
  
  // Estado local para attachments que vienen del backend (NO localStorage)
  const [attachments, setAttachments] = useState([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);

  // Cargar attachments desde el index del backend
  useEffect(() => {
    const loadLegislationFromApi = async () => {
      setIsLoadingAttachments(true);
      try {
        const res = await legislationService.getLegislation();
        const apiData = res?.data || res;

        // Construir lista de attachments desde files[] y/o description
        const built = [];

        // Si el backend trae archivos, mapear a attachments con títulos generados
        const files = Array.isArray(apiData?.files) ? apiData.files : [];
        files.forEach((fileUrl, idx) => {
          built.push({
            id: `api-attachment-${idx + 1}`,
            title: `Support Document ${idx + 1}`,
            descriptionHTML: apiData?.description || '',
            fileUrl: fileUrl,
            fileName: fileUrl.split('/').pop() || undefined,
            linkUrl: apiData?.link || '',
            createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
          });
        });

        // Si no hay archivos pero hay description, crear un attachment virtual
        if (built.length === 0 && (apiData?.description || '').trim()) {
          built.push({
            id: `api-attachment-1`,
            title: 'Support Document 1',
            descriptionHTML: apiData.description,
            fileUrl: '',
            fileName: undefined,
            linkUrl: apiData?.link || '',
            createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
          });
        }

        setAttachments(built);
      } catch (error) {
        console.error('Failed to load legislation from API:', error);
        setAttachments([]); // En caso de error, lista vacía
      } finally {
        setIsLoadingAttachments(false);
      }
    };

    loadLegislationFromApi();
  }, []);

  const handleEditClick = () => {
    if (can(user, 'legislation:update')) {
      setIsModalOpen(true);
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleSaveAttachment = async (newAttachment) => {
    // Recargar desde el backend después de guardar para tener los datos actualizados
    // El backend ya guardó, así que refrescamos para obtener la respuesta del servidor
    try {
      const res = await legislationService.getLegislation();
      const apiData = res?.data || res;

      const built = [];
      const files = Array.isArray(apiData?.files) ? apiData.files : [];
      files.forEach((fileUrl, idx) => {
        built.push({
          id: `api-attachment-${idx + 1}`,
          title: `Support Document ${idx + 1}`,
          descriptionHTML: apiData?.description || '',
          fileUrl: fileUrl,
          fileName: fileUrl.split('/').pop() || undefined,
          linkUrl: apiData?.link || '',
          createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
        });
      });

      if (built.length === 0 && (apiData?.description || '').trim()) {
        built.push({
          id: `api-attachment-1`,
          title: 'Support Document 1',
          descriptionHTML: apiData.description,
          fileUrl: '',
          fileName: undefined,
          linkUrl: apiData?.link || '',
          createdAt: apiData?.updated_at || apiData?.created_at || new Date().toISOString()
        });
      }

      setAttachments(built);
    } catch (error) {
      console.error('Failed to reload attachments after save:', error);
    }
  };

  const handleDownloadAttachment = async (attachment) => {
    try {
      // Si hay fileUrl del backend (URL completa del servidor)
      if (attachment.fileUrl && !attachment.fileUrl.startsWith('blob:')) {
        // Es una URL del backend, descargarla directamente
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        link.download = attachment.fileName || attachment.title || 'legislation-document.pdf';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Si hay fileUrl y es blob (archivo subido localmente antes de guardar)
      if (attachment.fileUrl && attachment.fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        link.download = attachment.fileName || 'legislation-document.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }
      
      // Si NO hay fileUrl pero sí descriptionHTML, generar PDF desde HTML
      if (attachment.descriptionHTML && !attachment.fileUrl) {
        const pdfBlob = await pdf(
          <LegislationPDFDocument 
            description={attachment.descriptionHTML} 
            link={attachment.linkUrl} 
          />
        ).toBlob();
        
        // Crear enlace de descarga
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${attachment.title || 'legislation-document'}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        return;
      }
      
      // Si solo hay linkUrl, abrir en nueva pestaña
      if (attachment.linkUrl) {
        window.open(attachment.linkUrl, '_blank');
        return;
      }
      
      console.warn('No downloadable content found for attachment:', attachment);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleDeleteAttachment = (attachmentId) => {
    if (can(user, 'legislation:delete')) {
      const attachment = attachments.find(att => att.id === attachmentId)
      if (attachment) {
        setAttachmentToDelete(attachment)
        setIsConfirmDeleteOpen(true)
      }
    }
  }

  const handleConfirmDeleteAttachment = async () => {
    if (attachmentToDelete) {
      // TODO: Implementar DELETE en el backend si es necesario
      // Por ahora, solo eliminamos del estado local temporalmente
      // pero debería venir del backend
      setAttachments(prev => prev.filter(att => att.id !== attachmentToDelete.id));
      setAttachmentToDelete(null);
      setIsSuccessDeleteOpen(true);
    }
  }

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
            className="legislation-edit-btn legislation-edit-btn--desktop"
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
        {isLoadingAttachments ? (
          <p>Loading attachments...</p>
        ) : attachments.length === 0 ? (
          <p>No attachments available</p>
        ) : (
          attachments.map((attachment) => (
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
        ))
        )}
      </div>

      <LegislationEditModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSaveAttachment}
        existingAttachments={attachments}
      />

      {/* Confirm Delete Attachment Modal */}
      <ConfirmDeleteModal
        isOpen={isConfirmDeleteOpen}
        onClose={() => {
          setIsConfirmDeleteOpen(false)
          setAttachmentToDelete(null)
        }}
        onConfirm={handleConfirmDeleteAttachment}
      />

      <SuccessDeleteModal
        isOpen={isSuccessDeleteOpen}
        onClose={() => setIsSuccessDeleteOpen(false)}
      />

      {/* Mobile FAB */}
      {can(user, 'legislation:update') && (
        <button 
          className="legislation-edit-btn legislation-edit-btn--mobile"
          onClick={handleEditClick}
          aria-label="Edit legislation"
        >
          <i className="bi bi-pencil-square" aria-hidden="true"></i>
          <span className="btn-text">Edit Legislation</span>
        </button>
      )}
    </div>
  );
};

export { Legislation };
