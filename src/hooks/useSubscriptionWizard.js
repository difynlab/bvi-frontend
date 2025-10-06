import { useState, useCallback } from 'react';

const TABS_ORDER = [
  "Important Info", 
  "General Details", 
  "Membership Details", 
  "Company Details", 
  "Contact Person Details", 
  "Membership License Officer", 
  "Membership Plans"
];

export function useSubscriptionWizard(initialTab = 'Important Info') {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [values, setValues] = useState({
    generalDetails: {},
    membershipDetails: {},
    companyDetails: {},
    membershipLicenseOfficers: {
      officers: [
        { name: '', title: '', phone: '', email: '' }, // Officer 1
        { name: '', title: '', phone: '', email: '' }  // Officer 2
      ]
    }
  });
  const [errors, setErrors] = useState({});

  const setField = useCallback((tab, name, value) => {
    setValues(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        [name]: value
      }
    }));
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
    
    // Director Name validation
    if (!general.directorName || !general.directorName.trim()) {
      newErrors['generalDetails.directorName'] = 'Director Name is required';
    }
    
    // Date validation
    if (!general.date) {
      newErrors['generalDetails.date'] = 'Date is required';
    } else {
      const selectedDate = new Date(general.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors['generalDetails.date'] = 'Date must be today or in the future';
      }
    }
    
    // Signature File validation
    if (!general.signatureFile) {
      newErrors['generalDetails.signatureFile'] = 'Signature file is required';
    } else {
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(general.signatureFile.type)) {
        newErrors['generalDetails.signatureFile'] = 'File must be PNG, JPG, JPEG, or PDF';
      } else if (general.signatureFile.size > maxSize) {
        newErrors['generalDetails.signatureFile'] = 'File size must be 5MB or less';
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const validateMembershipDetails = useCallback(() => {
    const newErrors = {};
    const membership = values.membershipDetails || {};
    
    // Membership Type validation
    if (!membership.membershipType) {
      newErrors['membershipDetails.membershipType'] = 'Membership Type is required';
    }
    
    // Ordinary Plan validation (only required if membershipType is "Ordinary Member")
    if (membership.membershipType === 'Ordinary Member' && !membership.ordinaryPlan) {
      newErrors['membershipDetails.ordinaryPlan'] = 'Please choose your plan';
    }
    
    // Payment Method validation
    if (!membership.paymentMethod) {
      newErrors['membershipDetails.paymentMethod'] = 'Payment Method is required';
    }
    
    // Signature File validation
    if (!membership.signatureFile) {
      newErrors['membershipDetails.signatureFile'] = 'Signature file is required';
    } else {
      const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (!allowedTypes.includes(membership.signatureFile.type)) {
        newErrors['membershipDetails.signatureFile'] = 'File must be PNG, JPG, JPEG, or PDF';
      } else if (membership.signatureFile.size > maxSize) {
        newErrors['membershipDetails.signatureFile'] = 'File size must be 5MB or less';
      }
    }
    
    setErrors(prev => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  }, [values]);

  const validateCompanyDetails = useCallback(() => {
    const newErrors = {};
    const company = values.companyDetails || {};
    
    // Company Name validation
    if (!company.companyName || !company.companyName.trim()) {
      newErrors['companyDetails.companyName'] = 'Company Name is required';
    }
    
    // Company Address validation
    if (!company.companyAddress || !company.companyAddress.trim()) {
      newErrors['companyDetails.companyAddress'] = 'Company Address is required';
    }
    
    // Telephone validation
    if (!company.telephone || !company.telephone.trim()) {
      newErrors['companyDetails.telephone'] = 'Telephone is required';
    } else {
      const phoneDigits = company.telephone.replace(/\D/g, '');
      if (phoneDigits.length < 7 || phoneDigits.length > 20) {
        newErrors['companyDetails.telephone'] = 'Telephone must be between 7 and 20 digits';
      }
    }
    
    // Email validation
    if (!company.email || !company.email.trim()) {
      newErrors['companyDetails.email'] = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(company.email)) {
        newErrors['companyDetails.email'] = 'Please enter a valid email address';
      }
    }
    
    // Website validation (optional)
    if (company.website && company.website.trim()) {
      try {
        new URL(company.website);
      } catch {
        newErrors['companyDetails.website'] = 'Please enter a valid URL';
      }
    }
    
    // Office Presence validation
    if (!company.officePresence || company.officePresence.length === 0) {
      newErrors['companyDetails.officePresence'] = 'Please select at least one office presence option';
    }
    
    // Business Categories validation
    if (!company.businessCategories || company.businessCategories.length === 0) {
      newErrors['companyDetails.businessCategories'] = 'Please select at least one business category';
    }
    
    // Other Category validation
    if (company.businessCategories && company.businessCategories.includes('Other')) {
      if (!company.otherCategory || !company.otherCategory.trim()) {
        newErrors['companyDetails.otherCategory'] = 'Please specify the other business category';
      }
    } else {
      // Clear otherCategory if Other is not selected
      if (company.otherCategory) {
        setField('companyDetails', 'otherCategory', '');
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
    if (TABS_ORDER.includes(tabName)) {
      setActiveTab(tabName);
    }
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
    setTab
  };
}
