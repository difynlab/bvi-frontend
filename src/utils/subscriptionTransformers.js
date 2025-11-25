const MAX_FILE_SIZE = 5 * 1024 * 1024;

const validateFile = (file, fieldName) => {
  if (!file) return null;
  if (!(file instanceof File)) return null;
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`${fieldName} file size must not exceed 5MB`);
  }
  return file;
};

export const transformSubscriptionToBackend = (wizardValues, userId) => {
  const formData = new FormData();

  if (userId) {
    formData.append('user_id', userId);
  }

  formData.append('status', '1');

  const membership = wizardValues.membershipDetails || {};
  if (membership.membership_type && membership.membership_type.trim()) {
    formData.append('membership_type', membership.membership_type);
  }
  if (membership.ordinary_membership_plan && membership.ordinary_membership_plan.trim()) {
    formData.append('ordinary_membership_plan', membership.ordinary_membership_plan);
  }
  if (membership.payment_method && membership.payment_method.trim()) {
    formData.append('payment_method', membership.payment_method);
  }
  const membershipSignature = validateFile(membership.membership_signature, 'Membership signature');
  if (membershipSignature) {
    formData.append('membership_signature', membershipSignature);
  }

  const company = wizardValues.companyDetails || {};
  if (company.company_name && company.company_name.trim()) {
    formData.append('company_name', company.company_name.trim());
  }
  if (company.company_address && company.company_address.trim()) {
    formData.append('company_address', company.company_address.trim());
  }
  if (company.company_phone && company.company_phone.trim()) {
    formData.append('company_phone', company.company_phone.trim());
  }
  if (company.company_email && company.company_email.trim()) {
    formData.append('company_email', company.company_email.trim());
  }
  if (company.company_website && company.company_website.trim()) {
    formData.append('company_website', company.company_website.trim());
  }
  if (company.company_profile && company.company_profile.trim()) {
    formData.append('company_profile', company.company_profile.trim());
  }
  if (company.office_presence_regions && Array.isArray(company.office_presence_regions) && company.office_presence_regions.length > 0) {
    formData.append('office_presence_regions', JSON.stringify(company.office_presence_regions));
  }
  if (company.business_categories && Array.isArray(company.business_categories) && company.business_categories.length > 0) {
    formData.append('business_categories', JSON.stringify(company.business_categories));
  }
  if (company.other_business_category && company.other_business_category.trim()) {
    formData.append('other_business_category', company.other_business_category.trim());
  }
  if (company.director_name && company.director_name.trim()) {
    formData.append('director_name', company.director_name.trim());
  }
  if (company.director_signed_at && company.director_signed_at.trim()) {
    formData.append('director_signed_at', company.director_signed_at.trim());
  }
  const companySignature = validateFile(company.signature, 'Company signature');
  if (companySignature) {
    formData.append('signature', companySignature);
  }

  const contacts = wizardValues.contactPersonDetails || {};
  if (contacts.lead) {
    if (contacts.lead.name && contacts.lead.name.trim()) {
      formData.append('lead_contact_name', contacts.lead.name.trim());
    }
    if (contacts.lead.title && contacts.lead.title.trim()) {
      formData.append('lead_contact_title', contacts.lead.title.trim());
    }
    if (contacts.lead.phone && contacts.lead.phone.trim()) {
      formData.append('lead_contact_phone', contacts.lead.phone.trim());
    }
    if (contacts.lead.email && contacts.lead.email.trim()) {
      formData.append('lead_contact_email', contacts.lead.email.trim());
    }
  }

  if (contacts.contacts && Array.isArray(contacts.contacts)) {
    contacts.contacts.forEach((contact, index) => {
      if (contact) {
        const contactNum = index + 2;
        if (contact.name && contact.name.trim()) {
          formData.append(`contact_${contactNum}_name`, contact.name.trim());
        }
        if (contact.title && contact.title.trim()) {
          formData.append(`contact_${contactNum}_title`, contact.title.trim());
        }
        if (contact.phone && contact.phone.trim()) {
          formData.append(`contact_${contactNum}_phone`, contact.phone.trim());
        }
        if (contact.email && contact.email.trim()) {
          formData.append(`contact_${contactNum}_email`, contact.email.trim());
        }
      }
    });
  }

  const officers = wizardValues.membershipLicenseOfficers?.officers || [];
  if (officers[0]) {
    const officer1 = officers[0];
    if (officer1.name && officer1.name.trim()) {
      formData.append('license_officer_1_name', officer1.name.trim());
    }
    if (officer1.title && officer1.title.trim()) {
      formData.append('license_officer_1_title', officer1.title.trim());
    }
    if (officer1.phone && officer1.phone.trim()) {
      formData.append('license_officer_1_phone', officer1.phone.trim());
    }
    if (officer1.email && officer1.email.trim()) {
      formData.append('license_officer_1_email', officer1.email.trim());
    }
  }

  if (officers[1] && officers[1].name && officers[1].name.trim()) {
    const officer2 = officers[1];
    if (officer2.name && officer2.name.trim()) {
      formData.append('license_officer_2_name', officer2.name.trim());
    }
    if (officer2.title && officer2.title.trim()) {
      formData.append('license_officer_2_title', officer2.title.trim());
    }
    if (officer2.phone && officer2.phone.trim()) {
      formData.append('license_officer_2_phone', officer2.phone.trim());
    }
    if (officer2.email && officer2.email.trim()) {
      formData.append('license_officer_2_email', officer2.email.trim());
    }
  }

  return formData;
};


