import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/useAuth';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import SubscriptionUploadModal from './SubscriptionUploadModal';
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

const getDefaultData = (key) => {
  if (!key || !MAP[key]) {
    return { title: '', subtitle: '', img: '' };
  }
  return MAP[key];
};

const SubscriptionInfoModal = ({ isOpen, onClose, infoKey, data, onUpdated }) => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [imgSrc, setImgSrc] = useState('');
  const [isUploadOpen, setUploadOpen] = useState(false);
  const [allData, setAllData] = useState(data || null);

  useBodyScrollLock(isOpen);

  useEffect(() => {
    if (data) {
      setAllData(data);
    }
  }, [data]);

  useEffect(() => {
    if (!isOpen || !infoKey || !MAP[infoKey]) return;
    const defaults = getDefaultData(infoKey);
    const source = (data || allData || {})[infoKey] || {};

    const nextTitle = source.title ?? defaults.title ?? '';
    const nextSubtitle = source.subtitle ?? defaults.subtitle ?? '';
    const nextImg = source.img ?? defaults.img ?? '';

    setTitle(nextTitle);
    setSubtitle(nextSubtitle);
    setImgSrc(nextImg);
  }, [isOpen, infoKey, data, allData]);

  const openUpload = () => setUploadOpen(true);
  const closeUpload = () => setUploadOpen(false);

  const handleUploadSuccess = (updatedData) => {
    if (!updatedData) {
      return;
    }

    setAllData(updatedData);

    const defaults = getDefaultData(infoKey);
    const current = updatedData[infoKey] || {};

    const nextTitle = current.title ?? defaults.title ?? '';
    const nextSubtitle = current.subtitle ?? defaults.subtitle ?? '';
    const nextImg = current.img ?? defaults.img ?? '';

    setTitle(nextTitle);
    setSubtitle(nextSubtitle);
    setImgSrc(nextImg);

    if (typeof onUpdated === 'function') {
      onUpdated(updatedData);
    }

    closeUpload();
  };

  const handleClose = () => {
    onClose();
  };

  const modalBackdropClose = useModalBackdropClose(handleClose);

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
          onClick={handleClose}
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
          </>
        )}
      </div>

      {isUploadOpen && (
        <SubscriptionUploadModal
          isOpen={isUploadOpen}
          onClose={closeUpload}
          infoKey={infoKey}
          initialTitle={title}
          initialDescription={subtitle}
          initialImage={imgSrc}
          allData={allData}
          defaultsMap={MAP}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
};

SubscriptionInfoModal.defaultProps = {
  data: null,
  onUpdated: null
};

export default SubscriptionInfoModal;
