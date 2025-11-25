import React, { useState, useEffect, useCallback } from 'react';
import '../../styles/sections/Subscription.scss';
import SubscriptionInfoModal from '../../components/modals/SubscriptionInfoModal';
import SubscriptionTabPicker from '../../components/modals/SubscriptionTabPicker';
import { useSubscriptionWizard } from '../../hooks/useSubscriptionWizard';
import MembershipDetailsForm from './MembershipDetailsForm';
import CompanyDetailsForm from './CompanyDetailsForm';
import MembershipLicenseOfficerForm from './MembershipLicenseOfficerForm';
import MembershipPlans from './MembershipPlans';
import ContactPersonDetails from './ContactPersonDetails';
import importantInfoService from '../../services/importantInfoService';
import ImportantInfoSkeleton from '../../components/subscription/ImportantInfoSkeleton';
import { useAuth } from '../../context/useAuth';
import memberSubscriptionDetailsService from '../../services/memberSubscriptionDetailsService';
import { transformSubscriptionToBackend } from '../../utils/subscriptionTransformers';
import { clearAllSubscriptionStorage } from '../../helpers/subscriptionStorage';

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
  const { user } = useAuth();
  const [openInfo, setOpenInfo] = useState(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [importantInfoData, setImportantInfoData] = useState(null);
  const [importantInfoError, setImportantInfoError] = useState('');
  const [importantInfoLoading, setImportantInfoLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState(null);
  const [subscriptionLoading, setSubscriptionLoading] = useState(true);
  const [subscriptionError, setSubscriptionError] = useState('');
  const [subscriptionId, setSubscriptionId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  
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


  const loadSubscriptionData = useCallback(async () => {
    if (user?.role === 'admin') {
      setSubscriptionLoading(false);
      return;
    }

    setSubscriptionLoading(true);
    setSubscriptionError('');

    try {
      const response = await memberSubscriptionDetailsService.getAll(1, 1);
      
      if (response?.data?.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
        const userSubscription = response.data.data.find(sub => sub.user_id === user?.id) || response.data.data[0];
        
        setSubscriptionId(userSubscription.id);
        
        const membershipDetails = {
          membership_type: userSubscription.membership_type || '',
          ordinary_membership_plan: userSubscription.ordinary_membership_plan || '',
          payment_method: userSubscription.payment_method || '',
          membership_signature: userSubscription.membership_signature ? { name: userSubscription.membership_signature } : null
        };

        const companyDetails = {
          company_name: userSubscription.company_name || '',
          company_address: userSubscription.company_address || '',
          company_phone: userSubscription.company_phone || '',
          company_email: userSubscription.company_email || '',
          company_website: userSubscription.company_website || '',
          company_profile: userSubscription.company_profile || '',
          office_presence_regions: userSubscription.office_presence_regions ? 
            (typeof userSubscription.office_presence_regions === 'string' ? 
              JSON.parse(userSubscription.office_presence_regions) : 
              userSubscription.office_presence_regions) : [],
          business_categories: userSubscription.business_categories ? 
            (typeof userSubscription.business_categories === 'string' ? 
              JSON.parse(userSubscription.business_categories) : 
              userSubscription.business_categories) : [],
          other_business_category: userSubscription.other_business_category || '',
          director_name: userSubscription.director_name || '',
          director_signed_at: userSubscription.director_signed_at || '',
          signature: userSubscription.signature ? { name: userSubscription.signature } : null
        };

        const contactPersonDetails = {
          lead: {
            name: userSubscription.lead_contact_name || '',
            title: userSubscription.lead_contact_title || '',
            phone: userSubscription.lead_contact_phone || '',
            email: userSubscription.lead_contact_email || ''
          },
          contacts: [
            userSubscription.contact_2_name ? {
              name: userSubscription.contact_2_name || '',
              title: userSubscription.contact_2_title || '',
              phone: userSubscription.contact_2_phone || '',
              email: userSubscription.contact_2_email || ''
            } : null,
            userSubscription.contact_3_name ? {
              name: userSubscription.contact_3_name || '',
              title: userSubscription.contact_3_title || '',
              phone: userSubscription.contact_3_phone || '',
              email: userSubscription.contact_3_email || ''
            } : null,
            userSubscription.contact_4_name ? {
              name: userSubscription.contact_4_name || '',
              title: userSubscription.contact_4_title || '',
              phone: userSubscription.contact_4_phone || '',
              email: userSubscription.contact_4_email || ''
            } : null,
            userSubscription.contact_5_name ? {
              name: userSubscription.contact_5_name || '',
              title: userSubscription.contact_5_title || '',
              phone: userSubscription.contact_5_phone || '',
              email: userSubscription.contact_5_email || ''
            } : null
          ].filter(Boolean)
        };

        const membershipLicenseOfficers = {
          officers: [
            {
              name: userSubscription.license_officer_1_name || '',
              title: userSubscription.license_officer_1_title || '',
              phone: userSubscription.license_officer_1_phone || '',
              email: userSubscription.license_officer_1_email || ''
            },
            userSubscription.license_officer_2_name ? {
              name: userSubscription.license_officer_2_name || '',
              title: userSubscription.license_officer_2_title || '',
              phone: userSubscription.license_officer_2_phone || '',
              email: userSubscription.license_officer_2_email || ''
            } : { name: '', title: '', phone: '', email: '' }
          ]
        };

        setSubscriptionData({
          generalDetails: {},
          membershipDetails,
          companyDetails,
          contactPersonDetails,
          membershipLicenseOfficers
        });
      } else {
        setSubscriptionData(null);
      }
    } catch (error) {
      if (error.message && !error.message.includes('No data found')) {
        console.error('Error fetching subscription data:', error);
        setSubscriptionError(error.message);
      }
      setSubscriptionData(null);
    } finally {
      setSubscriptionLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadSubscriptionData();
  }, [loadSubscriptionData]);

  const { activeTab, values, errors, setField, setOfficer, toggleArray, goNext, setTab, setContactPersonDetails, isMembershipDetailsComplete, validateCurrent } = useSubscriptionWizard(getInitialTab(), subscriptionData, !!subscriptionId);

  const isAllDataComplete = useCallback(() => {
    const membership = values.membershipDetails || {};
    const company = values.companyDetails || {};
    const contacts = values.contactPersonDetails || {};
    const officers = values.membershipLicenseOfficers?.officers || [];

    const hasMembershipType = !!membership.membership_type;
    const hasPaymentMethod = !!membership.payment_method;
    const hasMembershipSignature = !!membership.membership_signature;
    const hasOrdinaryPlan = membership.membership_type !== 'Ordinary Member' || !!membership.ordinary_membership_plan;

    const hasCompanyName = !!company.company_name?.trim();
    const hasCompanyAddress = !!company.company_address?.trim();
    const hasCompanyPhone = !!company.company_phone?.trim();
    const hasCompanyEmail = !!company.company_email?.trim();
    const hasOfficePresence = company.office_presence_regions && company.office_presence_regions.length > 0;
    const hasBusinessCategories = company.business_categories && company.business_categories.length > 0;
    const hasDirectorName = !!company.director_name?.trim();
    const hasDirectorDate = !!company.director_signed_at;
    const hasCompanySignature = !!company.signature;

    const hasLeadContact = contacts.lead && 
      contacts.lead.name?.trim() && 
      contacts.lead.title?.trim() && 
      contacts.lead.phone?.trim() && 
      contacts.lead.email?.trim();

    const hasOfficer1 = officers[0] && 
      officers[0].name?.trim() && 
      officers[0].title?.trim() && 
      (officers[0].phone?.trim() || officers[0].email?.trim());

    return hasMembershipType && hasPaymentMethod && hasMembershipSignature && hasOrdinaryPlan &&
           hasCompanyName && hasCompanyAddress && hasCompanyPhone && hasCompanyEmail &&
           hasOfficePresence && hasBusinessCategories && hasDirectorName && hasDirectorDate && hasCompanySignature &&
           hasLeadContact && hasOfficer1;
  }, [values]);

  const handleSubmitData = useCallback(async () => {
    if (!isAllDataComplete()) {
      setSubmitError('Please complete all required fields before submitting.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');
    setSubmitSuccess(false);

    try {
      const formData = transformSubscriptionToBackend(values, user?.id);
      
      let response;
      const isFirstSubmit = !subscriptionId;
      
      if (subscriptionId) {
        response = await memberSubscriptionDetailsService.update(subscriptionId, formData);
      } else {
        response = await memberSubscriptionDetailsService.create(formData);
        if (response?.data?.id) {
          setSubscriptionId(response.data.id);
          clearAllSubscriptionStorage();
        }
      }
      
      setSubmitSuccess(true);
      await loadSubscriptionData();
      
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error submitting subscription data:', error);
      setSubmitError(error.message || 'Failed to submit subscription data. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [values, user, subscriptionId, isAllDataComplete, loadSubscriptionData]);

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
    'Membership Plans',
    'Membership Details',
    'Company Details',
    'Contact Person Details',
    'Membership License Officer'
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
            isMembershipDetailsComplete={isMembershipDetailsComplete}
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
          className={`subscription-tab ${activeTab === 'Membership Plans' ? 'active' : ''}`}
          onClick={() => setTab('Membership Plans')}
          role="tab"
          aria-selected={activeTab === 'Membership Plans'}
        >
          Membership Plans
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
          className={`subscription-tab ${activeTab === 'Company Details' ? 'active' : ''} ${!isMembershipDetailsComplete ? 'disabled' : ''}`}
          onClick={() => setTab('Company Details')}
          role="tab"
          aria-selected={activeTab === 'Company Details'}
          disabled={!isMembershipDetailsComplete}
          title={!isMembershipDetailsComplete ? 'Please complete Membership Details first' : ''}
        >
          Company Details
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'Contact Person Details' ? 'active' : ''} ${!isMembershipDetailsComplete ? 'disabled' : ''}`}
          onClick={() => setTab('Contact Person Details')}
          role="tab"
          aria-selected={activeTab === 'Contact Person Details'}
          disabled={!isMembershipDetailsComplete}
          title={!isMembershipDetailsComplete ? 'Please complete Membership Details first' : ''}
        >
          Contact Person Details
        </button>
        <button 
          className={`subscription-tab ${activeTab === 'Membership License Officer' ? 'active' : ''} ${!isMembershipDetailsComplete ? 'disabled' : ''}`}
          onClick={() => setTab('Membership License Officer')}
          role="tab"
          aria-selected={activeTab === 'Membership License Officer'}
          disabled={!isMembershipDetailsComplete}
          title={!isMembershipDetailsComplete ? 'Please complete Membership Details first' : ''}
        >
          Membership License Officer
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
            <ContactPersonDetails 
              key="contact-form" 
              onNext={goNext}
              initialData={values.contactPersonDetails}
              onDataChange={setContactPersonDetails}
            />
          </section>
        )}

        {activeTab === 'Membership License Officer' && (
          <section key="membership-license-officer" className="subscription-panel subscription-panel--officer">
            {submitError && (
              <div className="app-form__error-banner" role="alert" aria-live="assertive">
                <strong>Error:</strong> {submitError}
              </div>
            )}
            {submitSuccess && (
              <div className="app-form__success-banner" role="alert" aria-live="assertive">
                <strong>Success:</strong> Subscription data has been {subscriptionId ? 'updated' : 'submitted'} successfully!
              </div>
            )}
            <MembershipLicenseOfficerForm
              key="officer-form"
              values={values}
              errors={errors}
              setOfficer={setOfficer}
              onSave={async () => {
                const isValid = goNext();
                if (isValid && user?.role !== 'admin') {
                  await handleSubmitData();
                }
                return isValid;
              }}
              isSubmitting={isSubmitting}
              isAllDataComplete={isAllDataComplete()}
            />
          </section>
        )}

        {activeTab === 'Membership Plans' && (
          <section key="membership-plans" className="subscription-panel subscription-panel--plans">
            <MembershipPlans key="plans-component" isAdmin={user?.role === 'admin'} />
          </section>
        )}

        {activeTab !== 'Important Info' && activeTab !== 'Membership Details' && activeTab !== 'Company Details' && activeTab !== 'Contact Person Details' && activeTab !== 'Membership License Officer' && activeTab !== 'Membership Plans' && (
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
