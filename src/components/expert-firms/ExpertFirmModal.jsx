import React, { useState, useEffect, useCallback, useRef } from 'react';
import CustomDropdown from '../CustomDropdown';
import '../../styles/components/ExpertFirmModal.scss';

const ExpertFirmModal = ({ firm, isOpen, onClose, isAdmin = false, specializationOptions = [], onSave, onDelete, specializationsData = [] }) => {
  const [isClosing, setIsClosing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    specialization: '',
    description: '',
    address: {
      addressLine1: '',
      addressLine2: '',
      city: '',
      country: '',
      postalCode: ''
    },
    contact_numbers: [''],
    emails: [''],
    website: ''
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageDragActive, setImageDragActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const imageInputRef = useRef(null);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 300); // Match animation duration
  };

  const filteredSpecializationOptions = specializationOptions.filter(
    (option) => option.value !== ''
  );

  useEffect(() => {
    if (firm) {
      // Load contact_numbers and emails arrays, or use single values as fallback
      const contactNumbers = (firm.contact_numbers && Array.isArray(firm.contact_numbers) && firm.contact_numbers.length > 0)
        ? firm.contact_numbers
        : (firm.phone ? [firm.phone] : ['']);
      
      const emails = (firm.emails && Array.isArray(firm.emails) && firm.emails.length > 0)
        ? firm.emails
        : (firm.email ? [firm.email] : ['']);
      
      setFormData({
        name: firm.name || '',
        specialization: firm.specialization || '',
        description: firm.description || '',
        address: {
          addressLine1: firm.address?.address_line_1 || firm.address?.addressLine1 || '',
          addressLine2: firm.address?.address_line_2 || firm.address?.addressLine2 || '',
          city: firm.address?.city || '',
          country: firm.address?.country || '',
          postalCode: firm.address?.postal_code || firm.address?.postalCode || ''
        },
        contact_numbers: contactNumbers,
        emails: emails,
        website: firm.website || ''
      });
      setImagePreview(firm.image ? (firm.image.startsWith('http') ? firm.image : `/${firm.image}`) : '');
      setImageFile(null);
    }
  }, [firm]);

  const handleFieldChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleAddressChange = useCallback((field, value) => {
    setFormData((prev) => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: value
      }
    }));
  }, []);

  const handleContactNumberChange = useCallback((index, value) => {
    setFormData((prev) => {
      const newNumbers = [...prev.contact_numbers];
      newNumbers[index] = value;
      return { ...prev, contact_numbers: newNumbers };
    });
  }, []);

  const handleEmailChange = useCallback((index, value) => {
    setFormData((prev) => {
      const newEmails = [...prev.emails];
      newEmails[index] = value;
      return { ...prev, emails: newEmails };
    });
  }, []);

  const handleAddContactNumber = useCallback(() => {
    setFormData((prev) => {
      const lastNumber = prev.contact_numbers[prev.contact_numbers.length - 1];
      if (!lastNumber || !lastNumber.trim()) {
        return prev;
      }
      return {
        ...prev,
        contact_numbers: [...prev.contact_numbers, '']
      };
    });
  }, []);

  const handleAddEmail = useCallback(() => {
    setFormData((prev) => {
      const lastEmail = prev.emails[prev.emails.length - 1];
      if (!lastEmail || !lastEmail.trim()) {
        return prev;
      }
      return {
        ...prev,
        emails: [...prev.emails, '']
      };
    });
  }, []);

  const handleRemoveContactNumber = useCallback((index) => {
    setFormData((prev) => {
      if (prev.contact_numbers.length === 1) {
        const resetValue = index === 0 ? [''] : prev.contact_numbers;
        return { ...prev, contact_numbers: resetValue };
      }
      const newNumbers = prev.contact_numbers.filter((_, i) => i !== index);
      return { ...prev, contact_numbers: newNumbers.length ? newNumbers : [''] };
    });
  }, []);

  const handleRemoveEmail = useCallback((index) => {
    setFormData((prev) => {
      if (prev.emails.length === 1) {
        const resetValue = index === 0 ? [''] : prev.emails;
        return { ...prev, emails: resetValue };
      }
      const newEmails = prev.emails.filter((_, i) => i !== index);
      return { ...prev, emails: newEmails.length ? newEmails : [''] };
    });
  }, []);

  const handleImageDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleImageDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setImageDragActive(true);
    }
  }, []);

  const handleImageDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
  }, []);

  const handleImageFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setImageFile(file);
    }
  }, []);

  const handleImageDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setImageDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  }, [handleImageFile]);

  const handleImageInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  }, [handleImageFile]);

  const handleImageBrowse = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleRemoveImage = useCallback(() => {
    setImagePreview('');
    setImageFile(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  }, []);

  const handleSaveChanges = useCallback(async (e) => {
    e.preventDefault();
    
    if (!onSave || !firm) return;
    
    try {
      setIsSaving(true);
      setSaveError('');
      
      // Get specialization_id from specialization name
      const selectedSpec = specializationsData.find(
        spec => spec.name === formData.specialization
      );
      
      if (!selectedSpec) {
        setSaveError('Please select a valid specialization.');
        setIsSaving(false);
        return;
      }
      
      // Build address object and stringify
      const addressObject = {
        address_line_1: formData.address.addressLine1 || '',
        address_line_2: formData.address.addressLine2 || '',
        city: formData.address.city || '',
        country: formData.address.country || '',
        postal_code: formData.address.postalCode || ''
      };
      
      // Validate that at least one address field has a value
      const hasAddressValue = Object.values(addressObject).some(value => value.trim().length > 0);
      if (!hasAddressValue) {
        setSaveError('Please provide at least one address field.');
        setIsSaving(false);
        return;
      }
      
      // Filter empty contact numbers and emails
      const validContactNumbers = formData.contact_numbers.filter(num => num.trim());
      const validEmails = formData.emails.filter(email => email.trim());
      
      if (validContactNumbers.length === 0) {
        setSaveError('Please provide at least one contact number.');
        setIsSaving(false);
        return;
      }
      
      if (validEmails.length === 0) {
        setSaveError('Please provide at least one email.');
        setIsSaving(false);
        return;
      }
      
      // Prepare data for API
      const memberFirmData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        website_link: formData.website.trim(),
        address: JSON.stringify(addressObject),
        contact_number: JSON.stringify(validContactNumbers),
        email: JSON.stringify(validEmails),
        specialization_id: selectedSpec.id,
        status: firm.status || 1
      };
      
      // Only include image if a new one was selected
      if (imageFile) {
        memberFirmData.image = imageFile;
      }
      
      // Call onSave callback with firm id and data
      await onSave(firm.id, memberFirmData);
      
      setIsSaving(false);
      handleClose();
    } catch (error) {
      console.error('Error saving firm:', error);
      setSaveError(error.message || 'Failed to save changes.');
      setIsSaving(false);
    }
  }, [formData, imageFile, firm, specializationsData, onSave, handleClose]);

  if (!isOpen || !firm) return null;

  // Get specialization color (same logic as in ExpertFirmCard)
  const getSpecializationColor = (specialization) => {
    const colorMap = {
      'Accountancy': '#000000',
      'Arbitration': '#464676',
      'Audit': '#000000',
      'Audit and Advisory': '#000000',
      'Authorised Fund and SIBA Rep': '#D35098',
      'Banking': '#489836',
      'Brokers': '#489836',
      'Broker': '#489836',
      'Business/Management Consultants': '#e62b1e',
      'Captive Insurance': '#FBB900',
      'Compliance and Risk': '#AD0703',
      'Corporate Advisory and Valuation': '#E62B1E',
      'Corporate Services': '#E62B1E',
      'Director Services': '#00338E',
      'Family Office': '#F07D00',
      'Financial Planning Services': '#E62B1E',
      'FinTech': '#000000',
      'Forensic Accounting': '#000000',
      'Fund Administration': '#d35098',
      'Fund Managers': '#D35098',
      'Hedge Fund Structuring': '#D35098',
      'ICT': '#000000',
      'Independent Financial Advisors': '#00338E',
      'Industry Body Assocation': '#00338e',
      'Insolvency': '#BFB4AB',
      'Insolvency and Restructuring': '#BFB4AB',
      'Insurance': '#fbb900',
      'Investment Banking': '#489836',
      'Investment Business Representatives': '#D35098',
      'Investment Consultants': '#D35098',
      'Investment Managers': '#d35098',
      'Law': '#464676',
      'Marine Services': '#94D3E2',
      'Marine/Aviation Services': '#94d3e2',
      'Others': '#6b7280',
      'Private Client Wealth Management': '#F07D00',
      'Professional Directorships': '#00338E',
      'Real Estate': '#F07D00',
      'Recovery and Reorganisation': '#BFB4AB',
      'Taxation Practitioners': '#489836',
      'Trust & Company Administration': '#F07D00',
      'Vessel Registrations': '#94d3e2',
      'Yacht Management': '#94d3e2'
    };
    return colorMap[specialization] || '#6b7280';
  };

  const specializationColor = getSpecializationColor(firm.specialization);
  const hasImage = firm.image !== null;
  const imagePath = firm.image ? `/${firm.image}` : null;

  // Format website URL
  const formatWebsite = (website) => {
    if (!website) return null;
    if (website.startsWith('http://') || website.startsWith('https://')) {
      return website;
    }
    return `https://${website}`;
  };

  const websiteUrl = formatWebsite(firm.website);

  // Helper to get address value or "Not specified"
  const getAddressValue = (value) => {
    return value || 'Not specified';
  };

  return (
    <>

      <div
        className={`expert-firm-modal__overlay ${isClosing ? 'expert-firm-modal__overlay--closing' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />


      <aside className={`expert-firm-modal ${isClosing ? 'expert-firm-modal--closing' : ''}`}>

        <button
          type="button"
          className="expert-firm-modal__close"
          onClick={handleClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x-lg" aria-hidden="true"></i>
        </button>

        {isAdmin ? (
          <div className="expert-firm-modal__content expert-firm-modal__content--admin">
            <form className="expert-firm-modal__form" onSubmit={handleSaveChanges}>
              {saveError && (
                <div
                  className="app-form__error-banner"
                  role="alert"
                  aria-live="assertive"
                  tabIndex={-1}
                >
                  <strong>Error:</strong> {saveError}
                </div>
              )}
              <div className="expert-firm-modal__media-section">
                <label className="expert-firm-modal__field-label">
                  Firm image
                </label>
                <p className="expert-firm-modal__field-hint">
                  PNG, JPG and JPEG files are supported. Maximum file size: 5 MB.
                </p>
                <div className="expert-firm-modal__upload-actions">
                  <button
                    type="button"
                    className="expert-firm-modal__choose-file-btn"
                    onClick={handleImageBrowse}
                  >
                    Choose File
                  </button>
                  <span className="expert-firm-modal__file-name">
                    {imageFile ? imageFile.name : 'No File Chosen'}
                  </span>
                </div>
                {imagePreview ? (
                  <div className="expert-firm-modal__image-preview">
                    <img src={imagePreview} alt={formData.name} />
                    <button
                      type="button"
                      className="expert-firm-modal__remove-image"
                      onClick={handleRemoveImage}
                      aria-label="Remove image"
                    >
                      <i className="bi bi-x" aria-hidden="true"></i>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`expert-firm-modal__dropzone ${imageDragActive ? 'active' : ''}`}
                    onDragEnter={handleImageDragIn}
                    onDragLeave={handleImageDragOut}
                    onDragOver={handleImageDrag}
                    onDrop={handleImageDrop}
                    onClick={handleImageBrowse}
                  >
                    <div className="expert-firm-modal__dropzone-content">
                      <i className="bi bi-cloud-upload" aria-hidden="true"></i>
                      <p>Drag and drop files here</p>
                      <span>or</span>
                      <button
                        type="button"
                        className="expert-firm-modal__dropzone-browse"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleImageBrowse();
                        }}
                      >
                        Browse File
                      </button>
                    </div>
                  </div>
                )}
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  className="expert-firm-modal__file-input"
                  onChange={handleImageInput}
                />
              </div>

              <div className="expert-firm-modal__field-group">
                <label className="expert-firm-modal__field-label" htmlFor="firm-specialization-edit">
                  Specialization
                </label>
                <CustomDropdown
                  id="firm-specialization-edit"
                  name="specialization"
                  value={formData.specialization}
                  onChange={(e) => handleFieldChange('specialization', e.target.value)}
                  options={filteredSpecializationOptions}
                  placeholder="Choose specialisation"
                />
              </div>

              <div className="expert-firm-modal__field-group">
                <label className="expert-firm-modal__field-label" htmlFor="firm-title-edit">
                  Title
                </label>
                <input
                  id="firm-title-edit"
                  type="text"
                  className="expert-firm-modal__input"
                  value={formData.name}
                  onChange={(e) => handleFieldChange('name', e.target.value)}
                />
              </div>

              <div className="expert-firm-modal__field-group">
                <label className="expert-firm-modal__field-label" htmlFor="firm-description-edit">
                  Description
                </label>
                <textarea
                  id="firm-description-edit"
                  className="expert-firm-modal__textarea"
                  rows={5}
                  value={formData.description}
                  onChange={(e) => handleFieldChange('description', e.target.value)}
                />
              </div>

              <div className="expert-firm-modal__section expert-firm-modal__section--form">
                <h3 className="expert-firm-modal__section-title">Address Information</h3>
                <div className="expert-firm-modal__address-form">
                  <div className="expert-firm-modal__address-lines">
                    <div className="expert-firm-modal__field-group">
                      <label className="expert-firm-modal__field-label" htmlFor="firm-addressLine1-edit">
                        Address Line 1
                      </label>
                      <input
                        id="firm-addressLine1-edit"
                        type="text"
                        className="expert-firm-modal__input"
                        value={formData.address.addressLine1}
                        onChange={(e) => handleAddressChange('addressLine1', e.target.value)}
                      />
                    </div>
                    <div className="expert-firm-modal__field-group">
                      <label className="expert-firm-modal__field-label" htmlFor="firm-addressLine2-edit">
                        Address Line 2
                      </label>
                      <input
                        id="firm-addressLine2-edit"
                        type="text"
                        className="expert-firm-modal__input"
                        value={formData.address.addressLine2}
                        onChange={(e) => handleAddressChange('addressLine2', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="expert-firm-modal__address-row">
                    <div className="expert-firm-modal__field-group">
                      <label className="expert-firm-modal__field-label" htmlFor="firm-city-edit">
                        City
                      </label>
                      <input
                        id="firm-city-edit"
                        type="text"
                        className="expert-firm-modal__input"
                        value={formData.address.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                      />
                    </div>
                    <div className="expert-firm-modal__field-group">
                      <label className="expert-firm-modal__field-label" htmlFor="firm-country-edit">
                        Country
                      </label>
                      <input
                        id="firm-country-edit"
                        type="text"
                        className="expert-firm-modal__input"
                        value={formData.address.country}
                        onChange={(e) => handleAddressChange('country', e.target.value)}
                      />
                    </div>
                    <div className="expert-firm-modal__field-group">
                      <label className="expert-firm-modal__field-label" htmlFor="firm-postal-edit">
                        Postal Code
                      </label>
                      <input
                        id="firm-postal-edit"
                        type="text"
                        className="expert-firm-modal__input"
                        value={formData.address.postalCode}
                        onChange={(e) => handleAddressChange('postalCode', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="expert-firm-modal__section expert-firm-modal__section--form">
                <h3 className="expert-firm-modal__section-title">Contact Information</h3>
                <div className="expert-firm-modal__grid">
                  <div className="expert-firm-modal__field-group">
                    <label className="expert-firm-modal__field-label" htmlFor="firm-contact-0-edit">
                      Phone Number
                    </label>
                    {formData.contact_numbers.map((number, index) => {
                      const isLast = index === formData.contact_numbers.length - 1;
                      const isAddButtonDisabled = !((number || '').trim());

                      return (
                        <div key={index} className="expert-firm-modal__input-with-action">
                          <div className="expert-firm-modal__input-row">
                            <input
                              id={`firm-contact-${index}-edit`}
                              type="tel"
                              className="expert-firm-modal__input"
                              placeholder="Ex: +1 (284) 494-1134"
                              value={number}
                              onChange={(e) => handleContactNumberChange(index, e.target.value)}
                              disabled={isSaving}
                            />
                            <button
                              type="button"
                              className="expert-firm-modal__remove-field"
                              aria-label="Remove phone number"
                              onClick={() => handleRemoveContactNumber(index)}
                              disabled={isSaving}
                            >
                              <i className="bi bi-trash" aria-hidden="true"></i>
                            </button>
                          </div>
                          {isLast && (
                            <button
                              type="button"
                              className="expert-firm-modal__add-more"
                              onClick={handleAddContactNumber}
                              disabled={isAddButtonDisabled || isSaving}
                              aria-disabled={isAddButtonDisabled || isSaving}
                            >
                              <i className="bi bi-plus-lg" aria-hidden="true"></i>
                              <span>Add More Phone</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="expert-firm-modal__field-group">
                    <label className="expert-firm-modal__field-label" htmlFor="firm-email-0-edit">
                      Email
                    </label>
                    {formData.emails.map((email, index) => {
                      const isLast = index === formData.emails.length - 1;
                      const isAddButtonDisabled = !((email || '').trim());

                      return (
                        <div key={index} className="expert-firm-modal__input-with-action">
                          <div className="expert-firm-modal__input-row">
                            <input
                              id={`firm-email-${index}-edit`}
                              type="email"
                              className="expert-firm-modal__input"
                              placeholder="Ex: email@example.com"
                              value={email}
                              onChange={(e) => handleEmailChange(index, e.target.value)}
                              disabled={isSaving}
                            />
                            <button
                              type="button"
                              className="expert-firm-modal__remove-field"
                              aria-label="Remove email"
                              onClick={() => handleRemoveEmail(index)}
                              disabled={isSaving}
                            >
                              <i className="bi bi-trash" aria-hidden="true"></i>
                            </button>
                          </div>
                          {isLast && (
                            <button
                              type="button"
                              className="expert-firm-modal__add-more"
                              onClick={handleAddEmail}
                              disabled={isAddButtonDisabled || isSaving}
                              aria-disabled={isAddButtonDisabled || isSaving}
                            >
                              <i className="bi bi-plus-lg" aria-hidden="true"></i>
                              <span>Add More Email</span>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="expert-firm-modal__field-group expert-firm-modal__field-group--full">
                    <label className="expert-firm-modal__field-label" htmlFor="firm-website-edit">
                      Website
                    </label>
                    <input
                      id="firm-website-edit"
                      type="text"
                      className="expert-firm-modal__input"
                      value={formData.website}
                      onChange={(e) => handleFieldChange('website', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexDirection: 'column' }}>
                <button 
                  type="submit" 
                  className="expert-firm-modal__save-btn"
                  disabled={isSaving}
                >
                  {isSaving ? 'Loading...' : 'Save changes'}
                </button>
                {onDelete && (
                  <button 
                    type="button" 
                    className="expert-firm-modal__delete-btn"
                    onClick={() => onDelete(firm)}
                    disabled={isSaving}
                    style={{
                      width: '100%',
                      padding: '14px 24px',
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '500',
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      opacity: isSaving ? 0.6 : 1,
                      transition: 'background 0.2s ease'
                    }}
                  >
                    <i className="bi bi-trash" style={{ marginRight: '8px' }}></i>
                    Delete Firm
                  </button>
                )}
              </div>
            </form>
          </div>
        ) : (
          <>
            {hasImage && (
              <div className="expert-firm-modal__image-container">
                <img
                  src={imagePath}
                  alt={firm.name}
                  className="expert-firm-modal__image"
                />
              </div>
            )}

            <div className="expert-firm-modal__content">

              <span
                className="expert-firm-modal__specialization"
                style={{
                  backgroundColor: `${specializationColor}20`,
                  color: specializationColor,
                  borderColor: specializationColor
                }}
              >
                {firm.specialization}
              </span>
              <h2 className="expert-firm-modal__name">{firm.name}</h2>
              <div className="expert-firm-modal__description">
                <p>
                  {firm.description || 'No description available'}
                </p>
              </div>

              <div className="expert-firm-modal__section">
                <h3 className="expert-firm-modal__section-title">Address Information</h3>
                <div className="expert-firm-modal__address">
                  <div className="expert-firm-modal__address-item">
                    <span className="expert-firm-modal__address-label">Address Line 1:</span>
                    <span className="expert-firm-modal__address-value">
                      {getAddressValue(firm.address?.addressLine1)}
                    </span>
                  </div>
                  <div className="expert-firm-modal__address-item">
                    <span className="expert-firm-modal__address-label">Address Line 2:</span>
                    <span className="expert-firm-modal__address-value">
                      {getAddressValue(firm.address?.addressLine2)}
                    </span>
                  </div>
                  <div className="expert-firm-modal__address-item">
                    <span className="expert-firm-modal__address-label">City:</span>
                    <span className="expert-firm-modal__address-value">
                      {getAddressValue(firm.address?.city)}
                    </span>
                  </div>
                  <div className="expert-firm-modal__address-item">
                    <span className="expert-firm-modal__address-label">Country:</span>
                    <span className="expert-firm-modal__address-value">
                      {getAddressValue(firm.address?.country)}
                    </span>
                  </div>
                  <div className="expert-firm-modal__address-item">
                    <span className="expert-firm-modal__address-label">Postal Code:</span>
                    <span className="expert-firm-modal__address-value">
                      {getAddressValue(firm.address?.postalCode)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="expert-firm-modal__section">
                <h3 className="expert-firm-modal__section-title">Contact Information</h3>
                <div className="expert-firm-modal__contact">
                  {/* Display all phone numbers */}
                  {firm.contact_numbers && Array.isArray(firm.contact_numbers) && firm.contact_numbers.length > 0 ? (
                    firm.contact_numbers.map((phone, index) => (
                      <div key={`phone-${index}`} className="expert-firm-modal__contact-item">
                        <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                        <span>
                          {phone || 'No available phone number'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="expert-firm-modal__contact-item">
                      <i className="bi bi-telephone-fill" aria-hidden="true"></i>
                      <span>
                        {firm.phone || 'No available phone number'}
                      </span>
                    </div>
                  )}
                  
                  {/* Display all emails */}
                  {firm.emails && Array.isArray(firm.emails) && firm.emails.length > 0 ? (
                    firm.emails.map((email, index) => (
                      <div key={`email-${index}`} className="expert-firm-modal__contact-item">
                        <i className="bi bi-envelope-fill" aria-hidden="true"></i>
                        <span>
                          {email || 'No available mail'}
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="expert-firm-modal__contact-item">
                      <i className="bi bi-envelope-fill" aria-hidden="true"></i>
                      <span>
                        {firm.email || 'No available mail'}
                      </span>
                    </div>
                  )}
                  
                  {websiteUrl ? (
                    <div className="expert-firm-modal__contact-item">
                      <i className="bi bi-globe" aria-hidden="true"></i>
                      <a
                        href={websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="expert-firm-modal__website-link"
                      >
                        {firm.website}
                      </a>
                    </div>
                  ) : (
                    <div className="expert-firm-modal__contact-item">
                      <i className="bi bi-globe" aria-hidden="true"></i>
                      <span className="expert-firm-modal__contact-disabled">
                        No available website
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

export default ExpertFirmModal;

