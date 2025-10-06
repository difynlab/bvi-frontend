import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import SubscriptionUploadModal from './SubscriptionUploadModal';
import SubscriptionConfirmModal from './SubscriptionConfirmModal';
import '../../styles/components/SubscriptionInfoModal.scss';

const MAP = {
  eligibility: {
    title: 'Membership Eligibility',
    subtitle: 'Eligibility to membership of BVI Finance shall be limited to the companies, firms, entities, bodies and associations',
    img: '/modal-info.png'
  },
  benefits: {
    title: 'Membership Benefits',
    subtitle: 'BVI Finance provides three membership benefit packages tailored to the specific needs of its various member categories.',
    img: '/modal-info.png'
  },
  payment: {
    title: 'Payment Details',
    subtitle: 'View essential payment information, including account name, and required proof of payment to be uploaded when submitting payments.',
    img: '/modal-info.png'
  }
};

const SubscriptionInfoModal = ({ isOpen, onClose, infoKey }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const getDefaultImage = () => {
    return infoKey && MAP[infoKey] ? MAP[infoKey].img : '';
  };

  const getSavedImage = () => {
    if (!infoKey) return '';
    const savedImage = localStorage.getItem(`subscription-image-${infoKey}`);
    return savedImage || (MAP[infoKey] ? MAP[infoKey].img : '');
  };
  
  const [imgSrc, setImgSrc] = useState(getSavedImage());
  const [originalImgSrc, setOriginalImgSrc] = useState(getSavedImage());
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (infoKey && MAP[infoKey]) {
      const savedImage = getSavedImage();
      setImgSrc(savedImage);
      setOriginalImgSrc(savedImage);
    }
  }, [infoKey]);

  const openUpload = () => setUploadOpen(true);
  const closeUpload = () => setUploadOpen(false);
  
  const handleUploaded = (dataUrl) => {
    if (dataUrl) {
      setImgSrc(dataUrl);
      // TODO BACKEND: POST /api/subscription/resources (upload)
      // TODO BACKEND: Replace Data URL with remote URL from the server response
    }
    closeUpload();
  };

  const hasUnsavedChanges = () => {
    return isAdmin && imgSrc !== originalImgSrc;
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges()) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (infoKey && imgSrc) {
      localStorage.setItem(`subscription-image-${infoKey}`, imgSrc);
    }
    // TODO BACKEND: Save the changes here
    setOriginalImgSrc(imgSrc);
    setConfirmOpen(false);
    onClose();
  };

  const handleDiscard = () => {
    if (infoKey) {
      localStorage.removeItem(`subscription-image-${infoKey}`);
    }
    const defaultImg = MAP[infoKey] ? MAP[infoKey].img : '';
    setImgSrc(defaultImg);
    setOriginalImgSrc(defaultImg);
    setConfirmOpen(false);
    onClose();
  };

  const modalBackdropClose = useModalBackdropClose(handleCloseAttempt);

  if (!isOpen || !infoKey || !MAP[infoKey]) return null;

  const { title, subtitle } = MAP[infoKey];

  return (
    <div
      className="subscription-info-modal-overlay"
      role="presentation"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <div
        className="subscription-info-modal"
        role="dialog"
        aria-modal="true"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
      >
        <button
          type="button"
          className="subscription-info-modal__close"
          aria-label="Close"
          onClick={handleCloseAttempt}
        >
          <i className="bi bi-x" aria-hidden="true"></i>
        </button>

        <header className={`subscription-info-modal__header ${isAdmin ? 'admin' : 'user'}`}>
          <div className="subscription-info-modal__titles">
            <h2 className="subscription-info-modal__title">{title}</h2>
            <p className="subscription-info-modal__subtitle">{subtitle}</p>
          </div>
          {isAdmin && (
            <div className="subscription-info-modal__actions">
              <button
                type="button"
                className="subscription-info-modal__update-btn"
                onClick={openUpload}
              >
                <i className="bi bi-plus" aria-hidden="true"></i> Update Now
              </button>
            </div>
          )}
        </header>

        <div className="subscription-info-modal__body">
          {imgSrc && (
            <img 
              className="subscription-info-modal__image" 
              src={imgSrc} 
              alt="" 
            />
          )}
        </div>
      </div>

      {isUploadOpen && (
        <SubscriptionUploadModal
          isOpen={isUploadOpen}
          onClose={closeUpload}
          onConfirm={handleUploaded}
        />
      )}

      {isConfirmOpen && (
        <SubscriptionConfirmModal
          isOpen={isConfirmOpen}
          onClose={() => setConfirmOpen(false)}
          onSave={handleSave}
          onDiscard={handleDiscard}
        />
      )}
    </div>
  );
};

export default SubscriptionInfoModal;
