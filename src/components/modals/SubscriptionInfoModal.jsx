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
    img: '/images/membership-elegibility.png'
  },
  benefits: {
    title: 'Membership Benefits',
    subtitle: 'BVI Finance provides three membership benefit packages tailored to the specific needs of its various member categories.',
    img: '/images/membership-benefits.png'
  },
  payment: {
    title: 'Payment Details',
    subtitle: 'View essential payment information, including account name, and required proof of payment to be uploaded when submitting payments.',
    img: '/images/payment-details.png'
  }
};

const SubscriptionInfoModal = ({ isOpen, onClose, infoKey }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const getDefaultData = () => {
    if (!infoKey || !MAP[infoKey]) return { title: '', subtitle: '', img: '' };
    return MAP[infoKey];
  };

  const getSavedData = () => {
    if (!infoKey) return getDefaultData();
    try {
      const savedData = localStorage.getItem(`subscription-data-${infoKey}`);
      if (savedData) {
        return JSON.parse(savedData);
      }
    } catch (e) {
      console.error('Error parsing saved data:', e);
    }
    return getDefaultData();
  };
  
  const savedData = getSavedData();
  const [title, setTitle] = useState(savedData.title);
  const [subtitle, setSubtitle] = useState(savedData.subtitle);
  const [imgSrc, setImgSrc] = useState(savedData.img);
  const [originalTitle, setOriginalTitle] = useState(savedData.title);
  const [originalSubtitle, setOriginalSubtitle] = useState(savedData.subtitle);
  const [originalImgSrc, setOriginalImgSrc] = useState(savedData.img);
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [isConfirmOpen, setConfirmOpen] = useState(false);
  
  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (infoKey && MAP[infoKey]) {
      const data = getSavedData();
      setTitle(data.title);
      setSubtitle(data.subtitle);
      setImgSrc(data.img);
      setOriginalTitle(data.title);
      setOriginalSubtitle(data.subtitle);
      setOriginalImgSrc(data.img);
    }
  }, [infoKey]);

  const openUpload = () => setUploadOpen(true);
  const closeUpload = () => setUploadOpen(false);
  
  const handleUploaded = (data) => {
    if (data) {
      // data can be either the old format (just a string) or the new format (object)
      if (typeof data === 'string') {
        // Old format - just image
        setImgSrc(data);
        setOriginalImgSrc(data);
        if (infoKey && data) {
          localStorage.setItem(`subscription-image-${infoKey}`, data);
        }
      } else {
        // New format - object with title, description, image
        const newTitle = data.title || title;
        const newSubtitle = data.description || subtitle;
        const newImage = data.image || imgSrc;
        
        setTitle(newTitle);
        setSubtitle(newSubtitle);
        setImgSrc(newImage);
        setOriginalTitle(newTitle);
        setOriginalSubtitle(newSubtitle);
        setOriginalImgSrc(newImage);
        
        // Save to localStorage
        if (infoKey) {
          const dataToSave = {
            title: newTitle,
            subtitle: newSubtitle,
            img: newImage
          };
          localStorage.setItem(`subscription-data-${infoKey}`, JSON.stringify(dataToSave));
          // Also keep the old format for backward compatibility
          if (newImage) {
            localStorage.setItem(`subscription-image-${infoKey}`, newImage);
          }
        }
      }
    }
    closeUpload();
  };

  const hasUnsavedChanges = () => {
    return isAdmin && (
      imgSrc !== originalImgSrc ||
      title !== originalTitle ||
      subtitle !== originalSubtitle
    );
  };

  const handleCloseAttempt = () => {
    if (hasUnsavedChanges()) {
      setConfirmOpen(true);
    } else {
      onClose();
    }
  };

  const handleSave = () => {
    if (infoKey) {
      const dataToSave = {
        title,
        subtitle,
        img: imgSrc
      };
      localStorage.setItem(`subscription-data-${infoKey}`, JSON.stringify(dataToSave));
      // Also keep the old format for backward compatibility
      if (imgSrc) {
        localStorage.setItem(`subscription-image-${infoKey}`, imgSrc);
      }
    }
    setOriginalTitle(title);
    setOriginalSubtitle(subtitle);
    setOriginalImgSrc(imgSrc);
    setConfirmOpen(false);
    onClose();
  };

  const handleSaveDirect = () => {
    if (infoKey) {
      const dataToSave = {
        title,
        subtitle,
        img: imgSrc
      };
      localStorage.setItem(`subscription-data-${infoKey}`, JSON.stringify(dataToSave));
      // Also keep the old format for backward compatibility
      if (imgSrc) {
        localStorage.setItem(`subscription-image-${infoKey}`, imgSrc);
      }
    }
    setOriginalTitle(title);
    setOriginalSubtitle(subtitle);
    setOriginalImgSrc(imgSrc);
  };

  const handleDiscard = () => {
    if (infoKey) {
      localStorage.removeItem(`subscription-data-${infoKey}`);
      localStorage.removeItem(`subscription-image-${infoKey}`);
    }
    const defaultData = getDefaultData();
    setTitle(defaultData.title);
    setSubtitle(defaultData.subtitle);
    setImgSrc(defaultData.img);
    setOriginalTitle(defaultData.title);
    setOriginalSubtitle(defaultData.subtitle);
    setOriginalImgSrc(defaultData.img);
    setConfirmOpen(false);
    onClose();
  };

  const handleDiscardDirect = () => {
    if (infoKey) {
      localStorage.removeItem(`subscription-data-${infoKey}`);
      localStorage.removeItem(`subscription-image-${infoKey}`);
    }
    const defaultData = getDefaultData();
    setTitle(defaultData.title);
    setSubtitle(defaultData.subtitle);
    setImgSrc(defaultData.img);
    setOriginalTitle(defaultData.title);
    setOriginalSubtitle(defaultData.subtitle);
    setOriginalImgSrc(defaultData.img);
  };

  const modalBackdropClose = useModalBackdropClose(handleCloseAttempt);

  if (!isOpen || !infoKey || !MAP[infoKey]) return null;

  return (
    <div
      className="subscription-info-modal-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          handleCloseAttempt();
        }
        e.preventDefault();
        e.stopPropagation();
      }}
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

        <header className={`subscription-info-modal__header ${isAdmin ? 'admin' : 'member'}`}>
          <div className="subscription-info-modal__titles">
            <h2 className="subscription-info-modal__title">{title}</h2>
            <p className="subscription-info-modal__subtitle">{subtitle}</p>
          </div>
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

        {isAdmin && (
          <>
            <div className="subscription-info-modal__actions">
              <button
                type="button"
                className="subscription-info-modal__update-btn"
                onClick={openUpload}
              >
                <i className="bi bi-pencil-square" aria-hidden="true"></i> Edit
              </button>
            </div>
            
            {hasUnsavedChanges() && (
              <div className="subscription-info-modal__save-actions">
                <button
                  type="button"
                  className="subscription-info-modal__discard-btn"
                  onClick={handleDiscardDirect}
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  className="subscription-info-modal__save-btn"
                  onClick={handleSaveDirect}
                >
                  Save Changes
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {isUploadOpen && (
        <SubscriptionUploadModal
          isOpen={isUploadOpen}
          onClose={closeUpload}
          onConfirm={handleUploaded}
          initialTitle={title}
          initialDescription={subtitle}
          initialImage={imgSrc}
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
