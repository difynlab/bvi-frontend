// TODO BACKEND: Replace localStorage with API calls for persistence

export const SUB_KEYS = {
  general: 'bvi.subscription.generalDetails',
  membership: 'bvi.subscription.membershipDetails',
  company: 'bvi.subscription.companyDetails',
  membershipOfficers: 'bvi.subscription.membershipLicenseOfficers',
  contactPersons: 'bvi.subscription.contactPersonDetails'
};

export function getGeneralDetails() {
  try {
    const stored = localStorage.getItem(SUB_KEYS.general);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading general details:', error);
    return null;
  }
}

export function setGeneralDetails(obj) {
  try {
    localStorage.setItem(SUB_KEYS.general, JSON.stringify(obj));
    return true;
  } catch (error) {
    console.error('Error saving general details:', error);
    return false;
  }
}

export function getMembershipDetails() {
  try {
    const stored = localStorage.getItem(SUB_KEYS.membership);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading membership details:', error);
    return null;
  }
}

export function setMembershipDetails(obj) {
  try {
    localStorage.setItem(SUB_KEYS.membership, JSON.stringify(obj));
    return true;
  } catch (error) {
    console.error('Error saving membership details:', error);
    return false;
  }
}

export function getCompanyDetails() {
  try {
    const stored = localStorage.getItem(SUB_KEYS.company);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading company details:', error);
    return null;
  }
}

export function setCompanyDetails(obj) {
  try {
    localStorage.setItem(SUB_KEYS.company, JSON.stringify(obj));
    return true;
  } catch (error) {
    console.error('Error saving company details:', error);
    return false;
  }
}

export function getMembershipLicenseOfficers() {
  try {
    const stored = localStorage.getItem(SUB_KEYS.membershipOfficers);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading membership license officers:', error);
    return null;
  }
}

export function setMembershipLicenseOfficers(obj) {
  try {
    localStorage.setItem(SUB_KEYS.membershipOfficers, JSON.stringify(obj));
    return true;
  } catch (error) {
    console.error('Error saving membership license officers:', error);
    return false;
  }
}

export function getContactPersonDetails() {
  try {
    const stored = localStorage.getItem(SUB_KEYS.contactPersons);
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    console.error('Error loading contact person details:', error);
    return null;
  }
}

export function setContactPersonDetails(obj) {
  try {
    localStorage.setItem(SUB_KEYS.contactPersons, JSON.stringify(obj));
    return true;
  } catch (error) {
    console.error('Error saving contact person details:', error);
    return false;
  }
}

export function clearAllSubscriptionStorage() {
  try {
    Object.values(SUB_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
    return true;
  } catch (error) {
    console.error('Error clearing subscription storage:', error);
    return false;
  }
}
