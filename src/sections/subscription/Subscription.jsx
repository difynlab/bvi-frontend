import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/sections/Subscription.scss';
import SubscriptionInfoModal from '../../components/modals/SubscriptionInfoModal';
import SubscriptionTabPicker from '../../components/modals/SubscriptionTabPicker';
import { useSubscriptionWizard } from '../../hooks/useSubscriptionWizard';
import GeneralDetailsForm from './GeneralDetailsForm';
import MembershipDetailsForm from './MembershipDetailsForm';
import CompanyDetailsForm from './CompanyDetailsForm';
import MembershipLicenseOfficerForm from './MembershipLicenseOfficerForm';
import MembershipPlans from './MembershipPlans';
import ContactPersonDetails from './ContactPersonDetails';
import importantInfoService from '../../services/importantInfoService';
import ImportantInfoSkeleton from '../../components/subscription/ImportantInfoSkeleton';

const IMPORTANT_INFO_DEFAULTS = {
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

const Subscription = () => {
  const [openInfo, setOpenInfo] = useState(null); // 'eligibility' | 'benefits' | 'payment' | null
  const [pickerOpen, setPickerOpen] = useState(false);
  const [importantInfoData, setImportantInfoData] = useState(null);
  const [importantInfoError, setImportantInfoError] = useState('');
  const [importantInfoLoading, setImportantInfoLoading] = useState(false);
  
  const handleOpen = (key) => {
    if (importantInfoLoading || !importantInfoData) return;
    setOpenInfo(key);
  };
  const handleClose = () => setOpenInfo(null);

  const getInitialTab = () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    return tabParam || 'Important Info';
  };

  const { activeTab, values, errors, setField, setOfficer, toggleArray, goNext, setTab } = useSubscriptionWizard(getInitialTab());

  const loadImportantInfo = useCallback(async () => {
    setImportantInfoLoading(true);
    setImportantInfoError('');

    try {
      const response = await importantInfoService.getImportantInfo();
      if (response?.data) {
        setImportantInfoData(response.data);
      } else {
        setImportantInfoData(null);
      }
    } catch (error) {
      console.error('Error fetching important info:', error);
      setImportantInfoError(error.message || 'Failed to load important info.');
      setImportantInfoData(null);
    } finally {
      setImportantInfoLoading(false);
    }
  }, []);

  useEffect(() => {
    loadImportantInfo();
  }, [loadImportantInfo]);

  const getCardData = (key) => {
    const defaults = IMPORTANT_INFO_DEFAULTS[key] || {};
    const fromApi = importantInfoData?.[key] || {};

    return {
      title: fromApi.title || defaults.title || '',
      subtitle: fromApi.subtitle || defaults.subtitle || '',
      img: fromApi.img || defaults.img || ''
    };
  };

  // Define the subscription tabs (static list)
  const subscriptionTabs = [
    'Important Info',
    'General Details', 
    'Membership Details',
    'Company Details',
    'Contact Person Details',
    'Membership License Officer',
    'Membership Plans'
  ];

  return (
    <div className="subscription-container">
      {/* Header */}
      <div className="subscription-header-title">
        <h1>Membership Subscription</h1>
        <p>Manage membership Subscription</p>
      </div>

      {/* Mobile Header */}
      <div className="subscription-mobile-header" role="region" aria-label="Subscription steps">
        <div className="subscription-tab-title">
          <button
            type="button"
            className="subscription-tab-picker-btn"
            onClick={() => setPickerOpen(true)}
            aria-haspopup="dialog"
            aria-controls="subscriptionTabPicker">
            <h2>
              {activeTab}
            </h2>
            <i className="bi bi-chevron-down" aria-hidden="true"></i>
          </button>
          
          {/* Subscription Tab Picker Dropdown */}
          <SubscriptionTabPicker
            open={pickerOpen}
            onClose={() => setPickerOpen(false)}
            tabs={subscriptionTabs}
            activeTab={activeTab}
            onSelect={setTab}
          />
        </div>
      </div>

      {/* Dropdown Overlay */}
      {pickerOpen && (
        <div 
          className="subscription-dropdown-overlay" 
          onClick={() => setPickerOpen(false)}
        />
      )}

      {/* Tabs Strip */}
      <div className="subscription-tabs subscription-tabs-desktop" role="tablist">
        <button 
          className={`subscription-tab ${activeTab === 'Important Info' ? 'active' : ''}`}
          onClick={() => setTab('Important Info')}
          role="tab"
          aria-selected={activeTab === 'Important Info'}
        >
          Important Info
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'General Details' ? 'active' : ''}`}
          onClick={() => setTab('General Details')}
          role="tab"
          aria-selected={activeTab === 'General Details'}
        >
          General Details
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'Membership Details' ? 'active' : ''}`}
          onClick={() => setTab('Membership Details')}
          role="tab"
          aria-selected={activeTab === 'Membership Details'}
        >
          Membership Details
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'Company Details' ? 'active' : ''}`}
          onClick={() => setTab('Company Details')}
          role="tab"
          aria-selected={activeTab === 'Company Details'}
        >
          Company Details
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'Contact Person Details' ? 'active' : ''}`}
          onClick={() => setTab('Contact Person Details')}
          role="tab"
          aria-selected={activeTab === 'Contact Person Details'}
        >
          Contact Person Details
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'Membership License Officer' ? 'active' : ''}`}
          onClick={() => setTab('Membership License Officer')}
          role="tab"
          aria-selected={activeTab === 'Membership License Officer'}
        >
          Membership License Officer
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'Membership Plans' ? 'active' : ''}`}
          onClick={() => setTab('Membership Plans')}
          role="tab"
          aria-selected={activeTab === 'Membership Plans'}
        >
          Membership Plans
        </button>
      </div>

      {/* Dynamic Panel */}
      <div className="subscription-tab-container">
        {activeTab === 'Important Info' && (
          <section key="important-info" className="subscription-panel subscription-panel--important">
            {importantInfoError && (
              <div className="app-form__error-banner" role="alert" aria-live="assertive">
                <strong>Error:</strong> {importantInfoError}
              </div>
            )}
            {importantInfoLoading && !importantInfoError ? (
              <ImportantInfoSkeleton className="subscription-cards" />
            ) : (
            <div className="subscription-cards">
              {/* Membership Eligibility Card */}
              <div className="subscription-card" onClick={() => handleOpen('eligibility')}>
                <div className="subscription-card__icon" aria-hidden="true"><i className="bi bi-people"></i></div>
                <h3 className="subscription-card__title">{getCardData('eligibility').title}</h3>
                <p className="subscription-card__text">
                  {getCardData('eligibility').subtitle}
                </p>
                <a href="#" className="subscription-card__link">View Details</a>
              </div>

              {/* Membership Benefits Card */}
              <div className="subscription-card" onClick={() => handleOpen('benefits')}>
                <div className="subscription-card__icon" aria-hidden="true"><i className="bi bi-patch-check"></i></div>
                <h3 className="subscription-card__title">{getCardData('benefits').title}</h3>
                <p className="subscription-card__text">
                  {getCardData('benefits').subtitle}
                </p>
                <a href="#" className="subscription-card__link">View Details</a>
              </div>

              {/* Payment Details Card */}
              <div className="subscription-card" onClick={() => handleOpen('payment')}>
                <div className="subscription-card__icon" aria-hidden="true"><i className="bi bi-credit-card"></i></div>
                <h3 className="subscription-card__title">{getCardData('payment').title}</h3>
                <p className="subscription-card__text">
                  {getCardData('payment').subtitle}
                </p>
                <a href="#" className="subscription-card__link">View Details</a>
              </div>
            </div>
            )}
          </section>
        )}

        {activeTab === 'General Details' && (
          <section key="general-details" className="subscription-panel subscription-panel--general">
            <GeneralDetailsForm
              key="general-form"
              values={values.generalDetails || {}}
              errors={errors}
              setField={(name, value) => setField('generalDetails', name, value)}
              onNext={goNext}
            />
          </section>
        )}

        {activeTab === 'Membership Details' && (
          <section key="membership-details" className="subscription-panel subscription-panel--membership">
            <MembershipDetailsForm
              key="membership-form"
              values={values}
              errors={errors}
              setField={setField}
              onNext={goNext}
            />
          </section>
        )}

        {activeTab === 'Company Details' && (
          <section key="company-details" className="subscription-panel subscription-panel--company">
            <CompanyDetailsForm
              key="company-form"
              values={values}
              errors={errors}
              setField={setField}
              toggleArray={toggleArray}
              onNext={goNext}
            />
          </section>
        )}

        {activeTab === 'Contact Person Details' && (
          <section key="contact-person-details" className="subscription-panel subscription-panel--contact">
            <ContactPersonDetails key="contact-form" onNext={goNext} />
          </section>
        )}

        {activeTab === 'Membership License Officer' && (
          <section key="membership-license-officer" className="subscription-panel subscription-panel--officer">
            <MembershipLicenseOfficerForm
              key="officer-form"
              values={values}
              errors={errors}
              setOfficer={setOfficer}
              onSave={() => {
                const isValid = goNext();
                return isValid;
              }}
            />
          </section>
        )}

        {activeTab === 'Membership Plans' && (
          <section key="membership-plans" className="subscription-panel subscription-panel--plans">
            <MembershipPlans key="plans-component" />
          </section>
        )}

        {activeTab !== 'Important Info' && activeTab !== 'General Details' && activeTab !== 'Membership Details' && activeTab !== 'Company Details' && activeTab !== 'Contact Person Details' && activeTab !== 'Membership License Officer' && activeTab !== 'Membership Plans' && (
          <section key={`placeholder-${activeTab.toLowerCase().replace(/\s+/g, '-')}`} className={`subscription-panel subscription-panel--${activeTab.toLowerCase().replace(/\s+/g, '-')}`}>
            <h2 className="subscription-panel__title">{activeTab}</h2>
          </section>
        )}
      </div>

      {/* Subscription Info Modal */}
      <SubscriptionInfoModal
        isOpen={!!openInfo}
        onClose={handleClose}
        infoKey={openInfo}
        data={importantInfoData}
        onUpdated={(data) => {
          setImportantInfoData(data);
          setImportantInfoError('');
        }}
      />
    </div>
  );
};

export default Subscription;
