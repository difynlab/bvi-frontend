import { useState, useCallback, useEffect } from 'react';
import { 
  getMembershipDetails, 
  setMembershipDetails,
  getCompanyDetails,
  setCompanyDetails,
  getMembershipLicenseOfficers,
  setMembershipLicenseOfficers,
  getContactPersonDetails,
  setContactPersonDetails
} from '../helpers/subscriptionStorage';

const TABS_ORDER = [
  "Important Info",
  "Membership Plans",
  "Membership Details", 
  "Company Details", 
  "Contact Person Details", 
  "Membership License Officer"
];

const MEMBERSHIP_DETAILS_TAB_INDEX = TABS_ORDER.indexOf('Membership Details');

export function useSubscriptionWizard(initialTab = 'Important Info', initialData = null, hasServerData = false) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [values, setValues] = useState(() => {
    if (initialData) {
      return initialData;
    }
    
    if (hasServerData) {
      return {
        generalDetails: {},
        membershipDetails: {},
        companyDetails: {},
        membershipLicenseOfficers: {
          officers: [
            { name: '', title: '', phone: '', email: '' },
            { name: '', title: '', phone: '', email: '' }
          ]
        },
        contactPersonDetails: null
      };
    }
    
    const membershipDetails = getMembershipDetails() || {};
    const companyDetails = getCompanyDetails() || {};
    const membershipLicenseOfficers = getMembershipLicenseOfficers() || {
      officers: [
        { name: '', title: '', phone: '', email: '' },
        { name: '', title: '', phone: '', email: '' }
      ]
    };
    const contactPersonDetails = getContactPersonDetails() || null;
    
    return {
      generalDetails: {},
      membershipDetails,
      companyDetails,
      membershipLicenseOfficers,
      contactPersonDetails
    };
  });
  const [errors, setErrors] = useState({});
  const [isMembershipDetailsComplete, setIsMembershipDetailsComplete] = useState(false);

  useEffect(() => {
    if (initialData && hasServerData) {
      setValues(initialData);
    }
  }, [initialData, hasServerData]);

  useEffect(() => {
    const membership = values.membershipDetails || {};
    const hasMembershipType = !!membership.membership_type;
    const hasPaymentMethod = !!membership.payment_method;
    const hasSignature = !!membership.membership_signature;
    const hasOrdinaryPlan = membership.membership_type !== 'Ordinary Member' || !!membership.ordinary_membership_plan;
    
    const isComplete = hasMembershipType && hasPaymentMethod && hasSignature && hasOrdinaryPlan;
    setIsMembershipDetailsComplete(isComplete);
  }, [values.membershipDetails]);

  useEffect(() => {
    if (!hasServerData && values.membershipDetails && Object.keys(values.membershipDetails).length > 0) {
      setMembershipDetails(values.membershipDetails);
    }
  }, [values.membershipDetails, hasServerData]);

  useEffect(() => {
    if (!hasServerData && values.companyDetails && Object.keys(values.companyDetails).length > 0) {
      setCompanyDetails(values.companyDetails);
    }
  }, [values.companyDetails, hasServerData]);

  useEffect(() => {
    if (!hasServerData && values.membershipLicenseOfficers && values.membershipLicenseOfficers.officers) {
      setMembershipLicenseOfficers(values.membershipLicenseOfficers);
    }
  }, [values.membershipLicenseOfficers, hasServerData]);

  useEffect(() => {
    if (!hasServerData && values.contactPersonDetails) {
      setContactPersonDetails(values.contactPersonDetails);
    }
  }, [values.contactPersonDetails, hasServerData]);

  const setField = useCallback((tab, name, value) => {
    setValues(prev => {
      const updated = {
        ...prev,
        [tab]: {
          ...prev[tab],
          [name]: value
        }
      };
      return updated;
    });
    
    const errorKey = `${tab}.${name}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  const setOfficer = useCallback((officerIndex, field, value) => {
    setValues(prev => ({
      ...prev,
      membershipLicenseOfficers: {
        ...prev.membershipLicenseOfficers,
        officers: prev.membershipLicenseOfficers.officers.map((officer, index) => 
          index === officerIndex 
            ? { ...officer, [field]: value }
            : officer
        )
      }
    }));
    
    // Clear error when field is updated
    const errorKey = `membershipLicenseOfficers.officer${officerIndex + 1}.${field}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  const toggleArray = useCallback((tab, name, item) => {
    setValues(prev => {
      const currentArray = prev[tab]?.[name] || [];
      const newArray = currentArray.includes(item)
        ? currentArray.filter(i => i !== item)
        : [...currentArray, item];
      
      return {
        ...prev,
        [tab]: {
          ...prev[tab],
          [name]: newArray
        }
      };
    });
    
    // Clear error when field is updated
    const errorKey = `${tab}.${name}`;
    if (errors[errorKey]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[errorKey];
        return newErrors;
      });
    }
  }, [errors]);

  const validateGeneralDetails = useCallback(() => {
    const newErrors = {};
    const general = values.generalDetails || {};
    
    // Company Name validation
    if (!general.companyName || !general.companyName.trim()) {
      newErrors['generalDetails.companyName'] = 'Company Name is required';
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const validateMembershipDetails = useCallback(() => {
    const newErrors = {};
    const membership = values.membershipDetails || {};
    
    if (!membership.membership_type) {
      newErrors['membershipDetails.membership_type'] = 'Membership Type is required';
    }
    
    if (membership.membership_type === 'Ordinary Member' && !membership.ordinary_membership_plan) {
      newErrors['membershipDetails.ordinary_membership_plan'] = 'Please choose your plan';
    }
    
    if (!membership.payment_method) {
      newErrors['membershipDetails.payment_method'] = 'Payment Method is required';
    }
    
    if (!membership.membership_signature) {
      newErrors['membershipDetails.membership_signature'] = 'Signature file is required';
    } else {
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!allowedTypes.includes(membership.membership_signature.type)) {
        newErrors['membershipDetails.membership_signature'] = 'File must be PNG, JPG, JPEG, or PDF';
      } else if (membership.membership_signature.size > maxSize) {
        newErrors['membershipDetails.membership_signature'] = 'File size must be 5MB or less';
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const validateCompanyDetails = useCallback(() => {
    const newErrors = {};
    const company = values.companyDetails || {};
    
    if (!company.company_name || !company.company_name.trim()) {
      newErrors['companyDetails.company_name'] = 'Company Name is required';
    }
    
    if (!company.company_address || !company.company_address.trim()) {
      newErrors['companyDetails.company_address'] = 'Company Address is required';
    }
    
    if (!company.company_phone || !company.company_phone.trim()) {
      newErrors['companyDetails.company_phone'] = 'Telephone is required';
    } else {
      const phoneDigits = company.company_phone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 20) {
        newErrors['companyDetails.company_phone'] = 'Telephone must be between 7 and 20 digits';
      }
    }
    
    if (!company.company_email || !company.company_email.trim()) {
      newErrors['companyDetails.company_email'] = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(company.company_email)) {
        newErrors['companyDetails.company_email'] = 'Please enter a valid email address';
      }
    }
    
    if (company.company_website && company.company_website.trim()) {
      try {
        new URL(company.company_website);
      } catch {
        newErrors['companyDetails.company_website'] = 'Please enter a valid URL';
      }
    }
    
    if (!company.office_presence_regions || company.office_presence_regions.length === 0) {
      newErrors['companyDetails.office_presence_regions'] = 'Please select at least one office presence option';
    }
    
    if (!company.business_categories || company.business_categories.length === 0) {
      newErrors['companyDetails.business_categories'] = 'Please select at least one business category';
    }
    
    if (company.business_categories && company.business_categories.includes('Other')) {
      if (!company.other_business_category || !company.other_business_category.trim()) {
        newErrors['companyDetails.other_business_category'] = 'Please specify the other business category';
      }
    } else {
      if (company.other_business_category) {
        setField('companyDetails', 'other_business_category', '');
      }
    }
    
    if (!company.director_name || !company.director_name.trim()) {
      newErrors['companyDetails.director_name'] = 'Director Name is required';
    }
    
    if (!company.director_signed_at) {
      newErrors['companyDetails.director_signed_at'] = 'Date is required';
    } else {
      const selectedDate = new Date(company.director_signed_at);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors['companyDetails.director_signed_at'] = 'Date must be today or in the future';
      }
    }
    
    if (!company.signature) {
      newErrors['companyDetails.signature'] = 'Signature file is required';
    } else {
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024;
      
      if (!allowedTypes.includes(company.signature.type)) {
        newErrors['companyDetails.signature'] = 'File must be PNG, JPG, JPEG, or PDF';
      } else if (company.signature.size > maxSize) {
        newErrors['companyDetails.signature'] = 'File size must be 5MB or less';
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [values, setField]);

  const validateMembershipLicenseOfficers = useCallback(() => {
    const newErrors = {};
    const officers = values.membershipLicenseOfficers?.officers || [];
    
    // Officer 1 validation (required)
    const officer1 = officers[0] || {};
    if (!officer1.name || !officer1.name.trim()) {
      newErrors['membershipLicenseOfficers.officer1.name'] = 'Officer 1 name is required';
    }
    if (!officer1.title || !officer1.title.trim()) {
      newErrors['membershipLicenseOfficers.officer1.title'] = 'Officer 1 title is required';
    }
    
    // Officer 1 contact validation (at least one valid contact)
    const officer1Phone = officer1.phone?.replace(/\D/g, '') || '';
    const officer1Email = officer1.email?.trim() || '';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (officer1Phone.length > 0 && (officer1Phone.length < 7 || officer1Phone.length > 20)) {
      newErrors['membershipLicenseOfficers.officer1.phone'] = 'Phone must be between 7 and 20 digits';
    }
    if (officer1Email.length > 0 && !emailRegex.test(officer1Email)) {
      newErrors['membershipLicenseOfficers.officer1.email'] = 'Please enter a valid email address';
    }
    
    // Officer 1 must have at least one valid contact
    const hasValidPhone = officer1Phone.length >= 7 && officer1Phone.length <= 20;
    const hasValidEmail = officer1Email.length > 0 && emailRegex.test(officer1Email);
    
    if (!hasValidPhone && !hasValidEmail) {
      newErrors['membershipLicenseOfficers.officer1.phone'] = 'At least one valid contact (phone or email) is required';
    }
    
    // Officer 2 validation (only if any field is filled)
    const officer2 = officers[1] || {};
    const officer2HasAnyField = officer2.name?.trim() || officer2.title?.trim() || officer2.phone?.trim() || officer2.email?.trim();
    
    if (officer2HasAnyField) {
      if (!officer2.name || !officer2.name.trim()) {
        newErrors['membershipLicenseOfficers.officer2.name'] = 'Officer 2 name is required';
      }
      if (!officer2.title || !officer2.title.trim()) {
        newErrors['membershipLicenseOfficers.officer2.title'] = 'Officer 2 title is required';
      }
      
      // Officer 2 contact validation
      const officer2Phone = officer2.phone?.replace(/\D/g, '') || '';
      const officer2Email = officer2.email?.trim() || '';
      
      if (officer2Phone.length > 0 && (officer2Phone.length < 7 || officer2Phone.length > 20)) {
        newErrors['membershipLicenseOfficers.officer2.phone'] = 'Phone must be between 7 and 20 digits';
      }
      if (officer2Email.length > 0 && !emailRegex.test(officer2Email)) {
        newErrors['membershipLicenseOfficers.officer2.email'] = 'Please enter a valid email address';
      }
      
      // Officer 2 must have at least one valid contact
      const hasValidPhone2 = officer2Phone.length >= 7 && officer2Phone.length <= 20;
      const hasValidEmail2 = officer2Email.length > 0 && emailRegex.test(officer2Email);
      
      if (!hasValidPhone2 && !hasValidEmail2) {
        newErrors['membershipLicenseOfficers.officer2.phone'] = 'At least one valid contact (phone or email) is required';
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const validateCurrent = useCallback(() => {
    switch (activeTab) {
      case 'General Details':
        return validateGeneralDetails();
      case 'Membership Details':
        return validateMembershipDetails();
      case 'Company Details':
        return validateCompanyDetails();
      case 'Membership License Officer':
        return validateMembershipLicenseOfficers();
      default:
        return true;
    }
  }, [activeTab, validateGeneralDetails, validateMembershipDetails, validateCompanyDetails, validateMembershipLicenseOfficers]);

  const goNext = useCallback(() => {
    if (validateCurrent()) {
      const currentIndex = TABS_ORDER.indexOf(activeTab);
      if (currentIndex < TABS_ORDER.length - 1) {
        setActiveTab(TABS_ORDER[currentIndex + 1]);
      }
      return true;
    }
    return false;
  }, [activeTab, validateCurrent]);

  const goPrev = useCallback(() => {
    const currentIndex = TABS_ORDER.indexOf(activeTab);
    if (currentIndex > 0) {
      setActiveTab(TABS_ORDER[currentIndex - 1]);
    }
  }, [activeTab]);

  const setTab = useCallback((tabName) => {
    if (!TABS_ORDER.includes(tabName)) {
      return;
    }

    const targetTabIndex = TABS_ORDER.indexOf(tabName);
    const currentTabIndex = TABS_ORDER.indexOf(activeTab);

    if (targetTabIndex > MEMBERSHIP_DETAILS_TAB_INDEX && !isMembershipDetailsComplete) {
      return;
    }

    if (targetTabIndex < currentTabIndex) {
      setActiveTab(tabName);
      return;
    }

    if (targetTabIndex === currentTabIndex) {
      return;
    }

    if (targetTabIndex > currentTabIndex) {
      if (currentTabIndex === MEMBERSHIP_DETAILS_TAB_INDEX && !isMembershipDetailsComplete) {
        return;
      }
    }

    setActiveTab(tabName);
  }, [activeTab, isMembershipDetailsComplete]);

  const setContactPersonDetails = useCallback((data) => {
    setValues(prev => ({
      ...prev,
      contactPersonDetails: data
    }));
  }, []);

  return {
    activeTab,
    values,
    errors,
    setField,
    setOfficer,
    toggleArray,
    validateCurrent,
    goNext,
    goPrev,
    setTab,
    setContactPersonDetails,
    isMembershipDetailsComplete
  };
}
