import React, { useState, useEffect } from 'react';
import '../../styles/sections/ContactPersonDetails.scss';
import { getContactPersonDetails } from '../../helpers/subscriptionStorage';

const ContactPersonDetails = ({ onNext = () => {}, initialData = null, onDataChange = null }) => {
  const normalizeToFormFormat = (data) => {
    if (!data) {
      return {
        lead: { name: '', title: '', phone: '', email: '' },
        contact2: { name: '', title: '', phone: '', email: '' },
        contact3: { name: '', title: '', phone: '', email: '' },
        contact4: { name: '', title: '', phone: '', email: '' },
        contact5: { name: '', title: '', phone: '', email: '' }
      };
    }

    return {
      lead: { name: '', title: '', phone: '', email: '', ...(data.lead || {}) },
      contact2: { name: '', title: '', phone: '', email: '', ...(data.contacts?.[0] || {}) },
      contact3: { name: '', title: '', phone: '', email: '', ...(data.contacts?.[1] || {}) },
      contact4: { name: '', title: '', phone: '', email: '', ...(data.contacts?.[2] || {}) },
      contact5: { name: '', title: '', phone: '', email: '', ...(data.contacts?.[3] || {}) }
    };
  };

  const [contacts, setContacts] = useState(() => {
    if (initialData) {
      return normalizeToFormFormat(initialData);
    }
    const savedData = getContactPersonDetails();
    return normalizeToFormFormat(savedData);
  });
  const [errors, setErrors] = useState({});
  const [isLoaded, setIsLoaded] = useState(true);

  useEffect(() => {
    if (initialData) {
      setContacts(normalizeToFormFormat(initialData));
    }
  }, [initialData]);

  const isComplete = (contact) => {
    return contact.name.trim() && contact.title.trim() && contact.phone.trim() && contact.email.trim();
  };

  const isEmpty = (contact) => {
    return !contact.name.trim() && !contact.title.trim() && !contact.phone.trim() && !contact.email.trim();
  };

  const validateAll = () => {
    const newErrors = {};

    if (!isComplete(contacts.lead)) {
      newErrors.lead = 'Lead Contact is incomplete. Complete all fields.';
    }

    const optionalContacts = ['contact2', 'contact3', 'contact4', 'contact5'];
    const incompleteContacts = [];

    optionalContacts.forEach(contactKey => {
      const contact = contacts[contactKey];
      if (!isEmpty(contact) && !isComplete(contact)) {
        const contactNumber = contactKey.replace('contact', '');
        incompleteContacts.push(`Contact ${contactNumber}`);
      }
    });

    if (incompleteContacts.length > 0) {
      newErrors.optional = `${incompleteContacts.join(', ')} ${incompleteContacts.length === 1 ? 'is' : 'are'} incomplete. Complete all fields or clear them.`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleFieldChange = (contactKey, field, value) => {
    setContacts(prev => {
      const updated = {
        ...prev,
        [contactKey]: {
          ...prev[contactKey],
          [field]: value
        }
      };
      
      if (onDataChange) {
        const normalized = normalizeContacts(updated);
        onDataChange(normalized);
      }
      
      return updated;
    });

    if (errors[contactKey] || errors.optional) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[contactKey];
        delete newErrors.optional;
        return newErrors;
      });
    }
  };

  const normalizeContacts = (contactsData) => {
    return {
      lead: {
        name: contactsData.lead.name.trim(),
        title: contactsData.lead.title.trim(),
        phone: contactsData.lead.phone.trim(),
        email: contactsData.lead.email.trim()
      },
      contacts: [
        isEmpty(contactsData.contact2) ? null : {
          name: contactsData.contact2.name.trim(),
          title: contactsData.contact2.title.trim(),
          phone: contactsData.contact2.phone.trim(),
          email: contactsData.contact2.email.trim()
        },
        isEmpty(contactsData.contact3) ? null : {
          name: contactsData.contact3.name.trim(),
          title: contactsData.contact3.title.trim(),
          phone: contactsData.contact3.phone.trim(),
          email: contactsData.contact3.email.trim()
        },
        isEmpty(contactsData.contact4) ? null : {
          name: contactsData.contact4.name.trim(),
          title: contactsData.contact4.title.trim(),
          phone: contactsData.contact4.phone.trim(),
          email: contactsData.contact4.email.trim()
        },
        isEmpty(contactsData.contact5) ? null : {
          name: contactsData.contact5.name.trim(),
          title: contactsData.contact5.title.trim(),
          phone: contactsData.contact5.phone.trim(),
          email: contactsData.contact5.email.trim()
        }
      ]
    };
  };

  const handlePhoneChange = (contactKey, value) => {
    const digitsOnly = value.replace(/\D/g, '');
    handleFieldChange(contactKey, 'phone', digitsOnly);
  };

  const handleSubmit = () => {
    if (validateAll()) {
      const normalizedData = normalizeContacts(contacts);
      if (onDataChange) {
        onDataChange(normalizedData);
      }
      onNext(normalizedData);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const renderContactBlock = (contactKey, title, isRequired = false) => {
    const contact = contacts[contactKey] || { name: '', title: '', phone: '', email: '' };
    const hasError = errors[contactKey] || errors.optional;

    return (
      <div key={contactKey} className="contact-block">
        <h3 className="contact-block-title">
          {title}
          {isRequired && <span className="req-star">*</span>}
        </h3>
        
        <div className="contact-row">
          <div className="contact-field">
            <label htmlFor={`${contactKey}-name`}>Name</label>
            <input
              id={`${contactKey}-name`}
              type="text"
              value={contact.name}
              onChange={(e) => handleFieldChange(contactKey, 'name', e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              placeholder="Enter full name"
            />
          </div>
          
          <div className="contact-field">
            <label htmlFor={`${contactKey}-title`}>Title</label>
            <input
              id={`${contactKey}-title`}
              type="text"
              value={contact.title}
              onChange={(e) => handleFieldChange(contactKey, 'title', e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              placeholder="Enter job title or position"
            />
          </div>
        </div>

        <div className="contact-row">
          <div className="contact-field">
            <label htmlFor={`${contactKey}-phone`}>Direct line and/or mobile number</label>
            <input
              id={`${contactKey}-phone`}
              type="number"
              value={contact.phone}
              onChange={(e) => handlePhoneChange(contactKey, e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              placeholder="Enter phone number"
            />
          </div>
          
          <div className="contact-field">
            <label htmlFor={`${contactKey}-email`}>Email Address</label>
            <input
              id={`${contactKey}-email`}
              type="email"
              value={contact.email}
              onChange={(e) => handleFieldChange(contactKey, 'email', e.target.value)}
              onKeyDown={handleKeyDown}
              aria-invalid={hasError ? 'true' : 'false'}
              placeholder="Enter email address"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="contact-person-details">
      {!isLoaded ? (
        <div>Loading...</div>
      ) : (
        <>
          {renderContactBlock('lead', 'Lead Contact', true)}
          {renderContactBlock('contact2', 'Contact 2')}
          {renderContactBlock('contact3', 'Contact 3')}
          {renderContactBlock('contact4', 'Contact 4')}
          {renderContactBlock('contact5', 'Contact 5')}

          {/* Error Messages */}
          {errors.lead && (
            <div className="error-message">
              {errors.lead}
            </div>
          )}
          {errors.optional && (
            <div className="error-message">
              {errors.optional}
            </div>
          )}

          {/* Submit Button */}
          <div className="actions">
            <button
              type="button"
              className="next-button"
              onClick={handleSubmit}
            >
              Move to next page
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactPersonDetails;
