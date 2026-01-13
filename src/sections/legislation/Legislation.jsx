import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/useAuth';
import { can } from '../../auth/acl';
import LegislationUploadFileModal from '../../components/modals/LegislationUploadFileModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';
import legislationFilesService from '../../services/legislationFilesService';
import '../../styles/sections/Legislation.scss';

const buildDownloadFileName = (title = 'legislation-document', fileUrl = '') => {
  const trimmed = (title || '').trim() || 'legislation-document';
  const baseName = trimmed
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  
  if (fileUrl) {
    const urlParts = fileUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    if (fileName && fileName.includes('.')) {
      const extension = fileName.substring(fileName.lastIndexOf('.'));
      return `${baseName}${extension}`;
    }
  }
  
  return `${baseName}.pdf`;
};

const Legislation = () => {
  const { user } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFile, setEditingFile] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [isLoadingAttachments, setIsLoadingAttachments] = useState(true);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false);

  useEffect(() => {
    const loadLegislationFiles = async () => {
      setIsLoadingAttachments(true);
      try {
        const response = await legislationFilesService.getAllPages(100);
        const filesData = response?.data?.data || [];
        
        const normalizedFiles = filesData.map((fileItem) => ({
          id: `legislation-file-${fileItem.id}`,
          title: fileItem.title || '',
          displayTitle: fileItem.title || '',
          fileUrl: fileItem.file || '',
          fileName: fileItem.file ? fileItem.file.split('/').pop() : '',
          apiId: fileItem.id,
          status: fileItem.status,
          createdAt: fileItem.created_at || new Date().toISOString()
        }));

        const sortedFiles = normalizedFiles.sort((a, b) => {
          const titleA = (a.title || 'Untitled').toLowerCase();
          const titleB = (b.title || 'Untitled').toLowerCase();
          return titleA.localeCompare(titleB);
        });

        setAttachments(sortedFiles);
      } catch (error) {
        console.error('Failed to load legislation files:', error);
        setAttachments([]);
      } finally {
        setIsLoadingAttachments(false);
      }
    };

    loadLegislationFiles();
  }, []);

  const handleUploadClick = () => {
    setEditingFile(null);
    setIsModalOpen(true);
  };

  const handleEditFile = (file) => {
    setEditingFile(file);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingFile(null);
  };

  const handleSave = async () => {
    setIsLoadingAttachments(true);
    try {
      const response = await legislationFilesService.getAllPages(100);
      const filesData = response?.data?.data || [];
      
      const normalizedFiles = filesData.map((fileItem) => ({
        id: `legislation-file-${fileItem.id}`,
        title: fileItem.title || '',
        displayTitle: fileItem.title || '',
        fileUrl: fileItem.file || '',
        fileName: fileItem.file ? fileItem.file.split('/').pop() : '',
        apiId: fileItem.id,
        status: fileItem.status,
        createdAt: fileItem.created_at || new Date().toISOString()
      }));

      const sortedFiles = normalizedFiles.sort((a, b) => {
        const titleA = (a.title || 'Untitled').toLowerCase();
        const titleB = (b.title || 'Untitled').toLowerCase();
        return titleA.localeCompare(titleB);
      });

      setAttachments(sortedFiles);
    } catch (error) {
      console.error('Failed to reload legislation files after save:', error);
    } finally {
      setIsLoadingAttachments(false);
    }
  };

  const handleDownloadAttachment = (attachment) => {
    try {
      if (attachment.fileUrl && !attachment.fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        const downloadName = attachment.downloadName || buildDownloadFileName(attachment.displayTitle || attachment.fileName || 'legislation-document', attachment.fileUrl);
        link.download = downloadName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      if (attachment.fileUrl && attachment.fileUrl.startsWith('blob:')) {
        const link = document.createElement('a');
        link.href = attachment.fileUrl;
        const downloadName = attachment.downloadName || buildDownloadFileName(attachment.displayTitle || attachment.fileName || 'legislation-document', attachment.fileUrl);
        link.download = downloadName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      console.warn('No downloadable content found for attachment:', attachment);
    } catch (error) {
      console.error('Error downloading attachment:', error);
    }
  };

  const handleDeleteFile = (file) => {
    if (can(user, 'legislation:update')) {
      setFileToDelete(file);
      setIsDeleteConfirmOpen(true);
      setDeleteError('');
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await legislationFilesService.delete(fileToDelete.apiId);
      
      setIsDeleteConfirmOpen(false);
      setFileToDelete(null);
      setIsDeleting(false);
      
      setIsSuccessDeleteOpen(true);
      
      await handleSave();
    } catch (error) {
      console.error('Error deleting file:', error);
      setDeleteError(error.message || 'Failed to delete file. Please try again.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="legislation-container">
      <div className="legislation-header">
        <div className="legislation-header-title">
          <h1>Legislation</h1>
          <p>Manage legislation files and documents.</p>
        </div>
        {can(user, 'legislation:update') && (
          <div className="legislation-header-actions">
            <button
              className="legislation-edit-btn legislation-edit-btn--desktop"
              onClick={handleUploadClick}
              aria-label="Upload legislation"
            >
              Upload Legislation
            </button>
          </div>
        )}
      </div>

      <div className="legislation-attachments">
        <h3>Files</h3>
        {isLoadingAttachments ? (
          <p>Loading files...</p>
        ) : attachments.length === 0 ? (
          <p>No files available</p>
        ) : (
          attachments.map((attachment) => (
            <div key={attachment.id} className="attachment-item">
              <div className="meta">
                <i className="bi bi-file-earmark attachment-icon" aria-hidden="true"></i>
                <span className="attachment-title">{attachment.displayTitle || attachment.title}</span>
              </div>
              <div className="actions">
                {can(user, 'legislation:update') && (
                  <>
                    <button
                      className="attachment-edit-btn"
                      onClick={() => handleEditFile(attachment)}
                      aria-label={`Edit ${attachment.title}`}
                    >
                      <i className="bi bi-pencil-square"></i>
                    </button>
                    <button
                      className="attachment-delete-btn"
                      onClick={() => handleDeleteFile(attachment)}
                      aria-label={`Delete ${attachment.title}`}
                    >
                      <i className="bi bi-trash"></i>
                    </button>
                  </>
                )}
                <button
                  className="attachment-download-btn"
                  onClick={() => handleDownloadAttachment(attachment)}
                  aria-label={`Download ${attachment.title}`}
                >
                  <i className="bi bi-download"></i>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <LegislationUploadFileModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        editFile={editingFile}
      />

      <ConfirmDeleteModal
        isOpen={isDeleteConfirmOpen}
        onClose={() => {
          setIsDeleteConfirmOpen(false);
          setFileToDelete(null);
          setDeleteError('');
        }}
        onConfirm={handleConfirmDelete}
        message={fileToDelete ? `Are you sure you want to delete "${fileToDelete.title || fileToDelete.displayTitle}"? This action cannot be reversed.` : undefined}
        isDeleting={isDeleting}
        errorMessage={deleteError}
      />

      <SuccessDeleteModal
        isOpen={isSuccessDeleteOpen}
        onClose={() => setIsSuccessDeleteOpen(false)}
      />

      {can(user, 'legislation:update') && (
        <div className="legislation-mobile-fab">
          <button
            className="legislation-mobile-fab__btn legislation-mobile-fab__btn--upload"
            onClick={handleUploadClick}
            aria-label="Upload legislation"
          >
            <i className="bi bi-plus" aria-hidden="true"></i>
          </button>
        </div>
      )}
    </div>
  );
};

export { Legislation };
