import React, { useState } from 'react';
import '../../styles/sections/Subscription.scss';
import SubscriptionInfoModal from '../../components/modals/SubscriptionInfoModal';

const Subscription = () => {
  const [openInfo, setOpenInfo] = useState(null); // 'eligibility' | 'benefits' | 'payment' | null
  
  const handleOpen = (key) => setOpenInfo(key);
  const handleClose = () => setOpenInfo(null);

  return (
    <div className="subscription-container">
      {/* Header */}
      <div className="subscription-header-title">
        <h1>Membership Subscription</h1>
        <p>Manage membership Subscription</p>
      </div>

      {/* Tabs Strip */}
      <div className="subscription-tabs" role="tablist">
        <button 
          className="subscription-tab active" 
          role="tab" 
          aria-selected="true" 
          id="tab-important"
        >
          Important Info
        </button>
        <button 
          className="subscription-tab" 
          role="tab" 
          aria-selected="false"
        >
          General Details
        </button>
        <button 
          className="subscription-tab" 
          role="tab" 
          aria-selected="false"
        >
          Membership Details
        </button>
        <button 
          className="subscription-tab" 
          role="tab" 
          aria-selected="false"
        >
          Company Details
        </button>
        <button 
          className="subscription-tab" 
          role="tab" 
          aria-selected="false"
        >
          Contact Person Details
        </button>
        <button 
          className="subscription-tab" 
          role="tab" 
          aria-selected="false"
        >
          Membership License Officer
        </button>
        <button 
          className="subscription-tab" 
          role="tab" 
          aria-selected="false"
        >
          Membership Plans
        </button>
      </div>

      {/* Important Info Panel */}
      <section 
        className="subscription-panel subscription-panel--important" 
        role="tabpanel" 
        aria-labelledby="tab-important"
      >
        <div className="subscription-cards">
          {/* Membership Eligibility Card */}
          <div className="subscription-card" onClick={() => handleOpen('eligibility')}>
            <div className="subscription-card__icon" aria-hidden="true"><i className="bi bi-people"></i></div>
            <h3 className="subscription-card__title">Membership Eligibility</h3>
            <p className="subscription-card__text">
              Eligibility to membership of BVI Finance shall be limited to the companies, firms, entities, bodies and associations
            </p>
            <a href="#" className="subscription-card__link">View Details</a>
          </div>

          {/* Membership Benefits Card */}
          <div className="subscription-card" onClick={() => handleOpen('benefits')}>
            <div className="subscription-card__icon" aria-hidden="true"><i className="bi bi-patch-check"></i></div>
            <h3 className="subscription-card__title">Membership Benefits</h3>
            <p className="subscription-card__text">
              BVI Finance provides three membership benefit packages tailored to the specific needs of its various member categories.
            </p>
            <a href="#" className="subscription-card__link">View Details</a>
          </div>

          {/* Payment Details Card */}
          <div className="subscription-card" onClick={() => handleOpen('payment')}>
            <div className="subscription-card__icon" aria-hidden="true"><i className="bi bi-credit-card"></i></div>
            <h3 className="subscription-card__title">Payment Details</h3>
            <p className="subscription-card__text">
              View essential payment information, including account name, and required proof of payment to be uploaded when submitting payments.
            </p>
            <a href="#" className="subscription-card__link">View Details</a>
          </div>
        </div>

        {/* Centered Action Button */}
        <button type="button" className="subscription-edit-btn">
          Edit Membership Form
        </button>
      </section>

      {/* Subscription Info Modal */}
      <SubscriptionInfoModal
        isOpen={!!openInfo}
        onClose={handleClose}
        infoKey={openInfo}
      />
    </div>
  );
};

export default Subscription;
