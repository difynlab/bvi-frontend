import React, { useState, useEffect } from 'react';
import '../../styles/sections/ContactPersonDetails.scss';

const ContactPersonDetails = ({ onNext = () => {} }) => {
  const [contacts, setContacts] = useState({
    lead: { name: '', title: '', phone: '', email: '' },
    contact2: { name: '', title: '', phone: '', email: '' },
    contact3: { name: '', title: '', phone: '', email: '' },
    contact4: { name: '', title: '', phone: '', email: '' },
    contact5: { name: '', title: '', phone: '', email: '' }
  });
  const [errors, setErrors] = useState({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const savedData = localStorage.getItem('membership.contactPersons');
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        const normalizedData = {
          lead: { name: '', title: '', phone: '', email: '', ...parsedData.lead },
          contact2: { name: '', title: '', phone: '', email: '', ...parsedData.contacts?.[0] },
          contact3: { name: '', title: '', phone: '', email: '', ...parsedData.contacts?.[1] },
          contact4: { name: '', title: '', phone: '', email: '', ...parsedData.contacts?.[2] },
          contact5: { name: '', title: '', phone: '', email: '', ...parsedData.contacts?.[3] }
        };
        setContacts(normalizedData);
      } catch (error) {
      }
    }
    setIsLoaded(true);
  }, []);

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

  const normalizeContacts = () => {
    return {
      lead: {
        name: contacts.lead.name.trim(),
        title: contacts.lead.title.trim(),
        phone: contacts.lead.phone.trim(),
        email: contacts.lead.email.trim()
      },
      contacts: [
        isEmpty(contacts.contact2) ? null : {
          name: contacts.contact2.name.trim(),
          title: contacts.contact2.title.trim(),
          phone: contacts.contact2.phone.trim(),
          email: contacts.contact2.email.trim()
        },
        isEmpty(contacts.contact3) ? null : {
          name: contacts.contact3.name.trim(),
          title: contacts.contact3.title.trim(),
          phone: contacts.contact3.phone.trim(),
          email: contacts.contact3.email.trim()
        },
        isEmpty(contacts.contact4) ? null : {
          name: contacts.contact4.name.trim(),
          title: contacts.contact4.title.trim(),
          phone: contacts.contact4.phone.trim(),
          email: contacts.contact4.email.trim()
        },
        isEmpty(contacts.contact5) ? null : {
          name: contacts.contact5.name.trim(),
          title: contacts.contact5.title.trim(),
          phone: contacts.contact5.phone.trim(),
          email: contacts.contact5.email.trim()
        }
      ]
    };
  };

  const handleFieldChange = (contactKey, field, value) => {
    setContacts(prev => ({
      ...prev,
      [contactKey]: {
        ...prev[contactKey],
        [field]: value
      }
    }));

    if (errors[contactKey] || errors.optional) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[contactKey];
        delete newErrors.optional;
        return newErrors;
      });
    }
  };

  const handlePhoneChange = (contactKey, value) => {
    const digitsOnly = value.replace(/\D/g, '');
    handleFieldChange(contactKey, 'phone', digitsOnly);
  };

  const handleSubmit = () => {
    if (validateAll()) {
      const normalizedData = normalizeContacts();
      localStorage.setItem('membership.contactPersons', JSON.stringify(normalizedData));
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
