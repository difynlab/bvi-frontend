import React, { useState, useEffect, useCallback, useMemo } from 'react';
import '../../styles/sections/FindExpert.scss';
import CustomDropdown from '../../components/CustomDropdown';
import ExpertFirmsList from '../../components/expert-firms/ExpertFirmsList';
import ExpertFirmModal from '../../components/expert-firms/ExpertFirmModal';
import { useAuth } from '../../context/useAuth';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import specializationsService from '../../services/specializationsService';
import memberFirmsService from '../../services/memberFirmsService';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';

const FindExpert = () => {
  const { user } = useAuth() || {};
  const [firmsData, setFirmsData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [firmsError, setFirmsError] = useState('');
  const [isAddingFirm, setIsAddingFirm] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [specializationsData, setSpecializationsData] = useState([]);
  const [specializationsLoading, setSpecializationsLoading] = useState(false);
  const [specializationsError, setSpecializationsError] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [selectedFirm, setSelectedFirm] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortOrder, setSortOrder] = useState('asc');
  const [infoModalOpen, setInfoModalOpen] = useState(false);
  const [editInfoModalOpen, setEditInfoModalOpen] = useState(false);
  const [editSpecializationsModalOpen, setEditSpecializationsModalOpen] = useState(false);
  const [addSpecializationModalOpen, setAddSpecializationModalOpen] = useState(false);
  const [editSpecializationModalOpen, setEditSpecializationModalOpen] = useState(false);
  const [editingSpecialization, setEditingSpecialization] = useState(null);
  const [newSpecializationName, setNewSpecializationName] = useState('');
  const [newSpecializationStatus, setNewSpecializationStatus] = useState(1);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [specializationToDelete, setSpecializationToDelete] = useState(null);
  const [isAddingSpecialization, setIsAddingSpecialization] = useState(false);
  const [isConfirmDeleteFirmOpen, setIsConfirmDeleteFirmOpen] = useState(false);
  const [isSuccessDeleteFirmOpen, setIsSuccessDeleteFirmOpen] = useState(false);
  const [isDeletingFirm, setIsDeletingFirm] = useState(false);
  const [firmToDelete, setFirmToDelete] = useState(null);
  const [expertInfoContent, setExpertInfoContent] = useState(
    'The BVI has a robust network of outstanding, experienced, and trusted members based around the world. A number of BVI specialists and member firms have developed to help service the needs of those looking to carry out cross-border trade and investment and want the comfort of the jurisdiction\'s well-regarded company law.\n\nThese members come from the world\'s leading corporate firms, trust companies, law firms, and accounting firms, as well as others involved in the financial services sector. They offer a sophisticated array of corporate services, transactions, litigation, as well as wealth management solutions in trust and estate planning, funds and investment business, captive insurance and ship and aircraft registration services.\n\nOur members are supported by a mature regulatory infrastructure, a well-developed financial services industry and a flexible, creditor-friendly jurisdiction.'
  );
  const [specializationSearch, setSpecializationSearch] = useState('');
  const [addFirmModalOpen, setAddFirmModalOpen] = useState(false);
  const [firmFormData, setFirmFormData] = useState({
    name: '',
    specialization: '',
    description: '',
    website_link: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    country: '',
    postal_code: '',
    contact_numbers: [''],
    emails: [''],
    button_text: ''
  });
  const [firmImageFile, setFirmImageFile] = useState(null);
  const [firmImagePreview, setFirmImagePreview] = useState('');
  const [firmImageDragActive, setFirmImageDragActive] = useState(false);
  const firmImageInputRef = React.useRef(null);

  const isAdmin = user?.role === 'admin';

  const loadFirmsData = useCallback(async () => {
    setFirmsLoading(true);
    setFirmsError('');
    try {
      // Load all firms with a high pagination limit
      const response = await memberFirmsService.getAll(1000, 1);
      const firms = response.data?.data || [];
      
      // Load specializations to map specialization_id to specialization name
      const specsResult = await specializationsService.getSpecializations(100, 1);
      const specs = specsResult.data || [];
      const specializationMap = {};
      specs.forEach(spec => {
        specializationMap[spec.id] = spec.name;
      });
      
      // Map API data to component expected format
      const mappedFirms = firms.map(firm => {
        // Parse JSON strings
        let parsedAddress = null;
        let parsedPhone = null;
        let parsedEmail = null;
        let parsedContactNumbers = [];
        let parsedEmails = [];
        
        try {
          if (firm.address) {
            parsedAddress = JSON.parse(firm.address);
          }
        } catch (e) {
          console.warn('Error parsing address:', e);
        }
        
        try {
          if (firm.contact_number) {
            const parsed = JSON.parse(firm.contact_number);
            parsedContactNumbers = Array.isArray(parsed) ? parsed : [parsed];
            // For display, take the first one
            parsedPhone = parsedContactNumbers[0] || null;
          }
        } catch (e) {
          console.warn('Error parsing contact_number:', e);
        }
        
        try {
          if (firm.email) {
            const parsed = JSON.parse(firm.email);
            parsedEmails = Array.isArray(parsed) ? parsed : [parsed];
            // For display, take the first one
            parsedEmail = parsedEmails[0] || null;
          }
        } catch (e) {
          console.warn('Error parsing email:', e);
        }
        
        return {
          id: firm.id,
          name: firm.name,
          description: firm.description,
          image: firm.image || null,
          specialization: specializationMap[firm.specialization_id] || 'Others',
          website: firm.website_link || null,
          phone: parsedPhone,
          email: parsedEmail,
          address: parsedAddress,
          // Keep parsed arrays for editing
          contact_numbers: parsedContactNumbers,
          emails: parsedEmails,
          specialization_id: firm.specialization_id,
          status: firm.status
        };
      });
      
      setFirmsData(mappedFirms);
    } catch (error) {
      console.error('Error fetching firms data:', error);
      setFirmsError(error.message || 'Failed to load firms data.');
      setFirmsData([]);
    } finally {
      setFirmsLoading(false);
    }
  }, []);

  const loadSpecializations = useCallback(async () => {
    setSpecializationsLoading(true);
    setSpecializationsError('');
    try {
      const result = await specializationsService.getSpecializations(100, 1);
      const specs = result.data || [];
      const userIsAdmin = user?.role === 'admin';
      const filteredSpecs = specs.filter(spec => userIsAdmin ? true : spec.status === 1);
      setSpecializationsData(filteredSpecs);
      const specNames = filteredSpecs
        .map(spec => spec.name)
        .sort((a, b) => a.localeCompare(b));
      setSpecializations(specNames);
    } catch (error) {
      console.error('Error fetching specializations:', error);
      setSpecializationsError(error.message || 'Failed to load specializations.');
      setSpecializations([]);
      setSpecializationsData([]);
    } finally {
      setSpecializationsLoading(false);
    }
  }, [user?.role]);

  useEffect(() => {
    loadFirmsData();
    loadSpecializations();
  }, [loadFirmsData, loadSpecializations]);

  const specializationOptions = useMemo(() => {
    return [
      { value: '', label: 'All member firms' },
      ...specializations.map(spec => ({
        value: spec,
        label: spec
      }))
    ];
  }, [specializations]);

  const handleSpecializationChange = useCallback((event) => {
    setSelectedSpecialization(event.target.value);
  }, []);

  const handleEditInfoSubmit = useCallback((e) => {
    e.preventDefault();
    // TODO: Save to backend
    setEditInfoModalOpen(false);
  }, []);

  const modalBackdropClose = useModalBackdropClose(() => setEditInfoModalOpen(false));
  const specializationModalBackdropClose = useModalBackdropClose(() => setEditSpecializationsModalOpen(false));
  const addSpecializationModalBackdropClose = useModalBackdropClose(() => {
    if (!isAddingSpecialization) {
      setAddSpecializationModalOpen(false);
      setSpecializationsError('');
      setIsAddingSpecialization(false);
    }
  });
  const editSpecializationModalBackdropClose = useModalBackdropClose(() => {
    setEditSpecializationModalOpen(false);
    setEditingSpecialization(null);
    setNewSpecializationName('');
    setNewSpecializationStatus(1);
  });
  const addFirmModalBackdropClose = useModalBackdropClose(() => {
    if (!isAddingFirm) {
      setAddFirmModalOpen(false);
      setFirmsError('');
      setIsAddingFirm(false);
    }
  });
  useBodyScrollLock(isModalOpen);
  useBodyScrollLock(editInfoModalOpen);
  useBodyScrollLock(editSpecializationsModalOpen);
  useBodyScrollLock(addSpecializationModalOpen);
  useBodyScrollLock(editSpecializationModalOpen);
  useBodyScrollLock(addFirmModalOpen);
  useBodyScrollLock(isConfirmDeleteOpen);
  useBodyScrollLock(isSuccessDeleteOpen);
  useBodyScrollLock(isConfirmDeleteFirmOpen);
  useBodyScrollLock(isSuccessDeleteFirmOpen);

  const filteredSpecializations = useMemo(() => {
    if (specializationSearch.length < 3) {
      return specializations;
    }
    return specializations.filter(spec =>
      spec.toLowerCase().includes(specializationSearch.toLowerCase())
    );
  }, [specializations, specializationSearch]);

  const handleSpecializationSubmit = useCallback((e) => {
    e.preventDefault();
  }, []);

  const handleAddSpecializationSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!newSpecializationName.trim() || newSpecializationName.trim().length < 3) {
      setSpecializationsError('Specialization name must be at least 3 characters.');
      return;
    }

    try {
      setSpecializationsError('');
      setIsAddingSpecialization(true);
      await specializationsService.createSpecialization(
        newSpecializationName.trim(),
        1
      );
      setIsAddingSpecialization(false);
      setAddSpecializationModalOpen(false);
      setNewSpecializationName('');
      setNewSpecializationStatus(1);
      await loadSpecializations();
    } catch (error) {
      setIsAddingSpecialization(false);
      setSpecializationsError(error.message || 'Failed to create specialization.');
    }
  }, [newSpecializationName, loadSpecializations]);

  const handleOpenAddSpecializationModal = useCallback(() => {
    setAddSpecializationModalOpen(true);
    setNewSpecializationName('');
    setNewSpecializationStatus(1);
    setSpecializationsError('');
    setIsAddingSpecialization(false);
  }, []);

  const handleEditSpecialization = useCallback((specializationName) => {
    setSpecializationsError('');
    const spec = specializationsData.find(s => s.name === specializationName);
    if (spec) {
      setEditingSpecialization(spec);
      setNewSpecializationName(spec.name);
      setNewSpecializationStatus(spec.status);
      setEditSpecializationModalOpen(true);
    } else {
      setSpecializationsError('Specialization not found.');
    }
  }, [specializationsData]);

  const handleUpdateSpecializationSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!editingSpecialization) return;
    if (!newSpecializationName.trim() || newSpecializationName.trim().length < 3) {
      setSpecializationsError('Specialization name must be at least 3 characters.');
      return;
    }

    try {
      setSpecializationsError('');
      await specializationsService.updateSpecialization(
        editingSpecialization.id,
        newSpecializationName.trim(),
        editingSpecialization.status
      );
      setEditSpecializationModalOpen(false);
      setEditingSpecialization(null);
      setNewSpecializationName('');
      setNewSpecializationStatus(1);
      await loadSpecializations();
    } catch (error) {
      setSpecializationsError(error.message || 'Failed to update specialization.');
    }
  }, [editingSpecialization, newSpecializationName, loadSpecializations]);

  const handleDeleteSpecialization = useCallback((specializationName) => {
    setSpecializationsError('');
    const spec = specializationsData.find(s => s.name === specializationName);
    if (spec) {
      setSpecializationToDelete(spec);
      setIsDeleting(false);
      setIsConfirmDeleteOpen(true);
    } else {
      setSpecializationsError('Specialization not found.');
    }
  }, [specializationsData]);

  const handleConfirmDeleteSpecialization = useCallback(async () => {
    try {
      if (specializationToDelete) {
        setIsDeleting(true);
        setSpecializationsError('');
        
        await specializationsService.deleteSpecialization(specializationToDelete.id);
        
        setIsConfirmDeleteOpen(false);
        setSpecializationToDelete(null);
        setIsDeleting(false);
        
        setIsSuccessDeleteOpen(true);
        await loadSpecializations();
      }
    } catch (error) {
      console.error('Error in handleConfirmDeleteSpecialization:', error);
      setSpecializationsError(error.message || 'Failed to delete specialization.');
      setIsDeleting(false);
    }
  }, [specializationToDelete, loadSpecializations]);

  // Add Firm Modal handlers
  const handleFirmFormChange = useCallback((field, value) => {
    setFirmFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleAddPhone = useCallback(() => {
    setFirmFormData(prev => {
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
    setFirmFormData(prev => {
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

  const handlePhoneChange = useCallback((index, value) => {
    setFirmFormData(prev => {
      const newNumbers = [...prev.contact_numbers];
      newNumbers[index] = value;
      return { ...prev, contact_numbers: newNumbers };
    });
  }, []);

  const handleEmailChange = useCallback((index, value) => {
    setFirmFormData(prev => {
      const newEmails = [...prev.emails];
      newEmails[index] = value;
      return { ...prev, emails: newEmails };
    });
  }, []);

  const handleRemovePhone = useCallback((index) => {
    setFirmFormData(prev => {
      if (prev.contact_numbers.length === 1) {
        const resetValue = index === 0 ? [''] : prev.contact_numbers;
        return { ...prev, contact_numbers: resetValue };
      }

      const newNumbers = prev.contact_numbers.filter((_, i) => i !== index);
      return { ...prev, contact_numbers: newNumbers.length ? newNumbers : [''] };
    });
  }, []);

  const handleRemoveEmail = useCallback((index) => {
    setFirmFormData(prev => {
      if (prev.emails.length === 1) {
        const resetValue = index === 0 ? [''] : prev.emails;
        return { ...prev, emails: resetValue };
      }

      const newEmails = prev.emails.filter((_, i) => i !== index);
      return { ...prev, emails: newEmails.length ? newEmails : [''] };
    });
  }, []);

  const handleFirmImageDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFirmImageDragIn = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setFirmImageDragActive(true);
    }
  }, []);

  const handleFirmImageDragOut = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setFirmImageDragActive(false);
  }, []);

  const handleFirmImageDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setFirmImageDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFirmImageFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleFirmImageFile = useCallback((file) => {
    if (file && file.type.startsWith('image/')) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      
      if (file.size > maxSize) {
        // TODO: Show error message
        return;
      }
      
      const reader = new FileReader();
      reader.onload = () => {
        setFirmImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setFirmImageFile(file);
    }
  }, []);

  const handleFirmImageInput = useCallback((e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFirmImageFile(file);
    }
  }, [handleFirmImageFile]);

  const handleFirmImageBrowse = useCallback(() => {
    firmImageInputRef.current?.click();
  }, []);

  const handleAddFirmSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    try {
      setIsAddingFirm(true);
      setFirmsError('');
      
      // Get specialization_id from specialization name
      const selectedSpec = specializationsData.find(
        spec => spec.name === firmFormData.specialization
      );
      
      if (!selectedSpec) {
        setFirmsError('Please select a valid specialization.');
        setIsAddingFirm(false);
        return;
      }
      
      // Validate image
      if (!firmImageFile) {
        setFirmsError('Please upload an image.');
        setIsAddingFirm(false);
        return;
      }
      
      // Filter empty contact numbers and emails
      const validContactNumbers = firmFormData.contact_numbers.filter(num => num.trim());
      const validEmails = firmFormData.emails.filter(email => email.trim());
      
      if (validContactNumbers.length === 0) {
        setFirmsError('Please provide at least one contact number.');
        setIsAddingFirm(false);
        return;
      }
      
      if (validEmails.length === 0) {
        setFirmsError('Please provide at least one email.');
        setIsAddingFirm(false);
        return;
      }
      
      // Build address object and stringify
      const addressObject = {
        address_line_1: firmFormData.address_line_1 || '',
        address_line_2: firmFormData.address_line_2 || '',
        city: firmFormData.city || '',
        country: firmFormData.country || '',
        postal_code: firmFormData.postal_code || ''
      };
      
      // Validate that at least one address field has a value
      const hasAddressValue = Object.values(addressObject).some(value => value.trim().length > 0);
      if (!hasAddressValue) {
        setFirmsError('Please provide at least one address field.');
        setIsAddingFirm(false);
        return;
      }
      
      // Prepare data for API
      const memberFirmData = {
        name: firmFormData.name.trim(),
        description: firmFormData.description.trim(),
        image: firmImageFile,
        website_link: firmFormData.website_link.trim(),
        address: JSON.stringify(addressObject),
        contact_number: JSON.stringify(validContactNumbers),
        email: JSON.stringify(validEmails),
        specialization_id: selectedSpec.id,
        status: 1 // Always set to active by default
      };
      
      // Submit to backend
      await memberFirmsService.create(memberFirmData);
      
      setIsAddingFirm(false);
      
      // Close modal and reset form
      setAddFirmModalOpen(false);
      setFirmsError('');
      setFirmFormData({
        name: '',
        specialization: '',
        description: '',
        website_link: '',
        address_line_1: '',
        address_line_2: '',
        city: '',
        country: '',
        postal_code: '',
        contact_numbers: [''],
        emails: [''],
        button_text: ''
      });
      setFirmImageFile(null);
      setFirmImagePreview('');
      
      // Reload firms data
      await loadFirmsData();
    } catch (error) {
      console.error('Error creating firm:', error);
      setFirmsError(error.message || 'Failed to create firm.');
      setIsAddingFirm(false);
    }
  }, [firmFormData, firmImageFile, specializationsData, loadFirmsData]);

  const handleUpdateFirm = useCallback(async (firmId, memberFirmData) => {
    try {
      await memberFirmsService.update(firmId, memberFirmData);
      await loadFirmsData();
    } catch (error) {
      console.error('Error updating firm:', error);
      throw error;
    }
  }, [loadFirmsData]);

  const handleDeleteFirm = useCallback((firm) => {
    setFirmToDelete(firm);
    setIsDeletingFirm(false);
    setIsConfirmDeleteFirmOpen(true);
  }, []);

  const handleConfirmDeleteFirm = useCallback(async () => {
    try {
      if (firmToDelete) {
        setIsDeletingFirm(true);
        setFirmsError('');
        
        await memberFirmsService.delete(firmToDelete.id);
        
        setIsConfirmDeleteFirmOpen(false);
        setFirmToDelete(null);
        setIsDeletingFirm(false);
        
        // Close edit modal
        setIsModalOpen(false);
        setSelectedFirm(null);
        
        setIsSuccessDeleteFirmOpen(true);
        await loadFirmsData();
      }
    } catch (error) {
      console.error('Error in handleConfirmDeleteFirm:', error);
      setFirmsError(error.message || 'Failed to delete firm.');
      setIsDeletingFirm(false);
    }
  }, [firmToDelete, loadFirmsData]);

  const handleOpenAddFirmModal = useCallback(() => {
    setAddFirmModalOpen(true);
    // Reset form
    setFirmFormData({
      name: '',
      specialization: '',
      description: '',
      website_link: '',
      address_line_1: '',
      address_line_2: '',
      city: '',
      country: '',
      postal_code: '',
      contact_numbers: [''],
      emails: [''],
      button_text: ''
    });
    setFirmImageFile(null);
    setFirmImagePreview('');
  }, []);

  return (
    <div className="find-expert-page">
      <div className="find-expert-container">
        {/* Header */}
        <div className="find-expert-header">
          <div className="find-expert-header-title">
            <h1>BVI Finance Members</h1>
            <p>Browse and find yout BVI Finance member</p>
          </div>
        </div>


        {/* Sub-header with List title and info button */}
        <div className="find-expert-sub-header">
          <div className="find-expert-title">
            <h2>List of Member Firms</h2>
            <div className="find-expert-info-wrapper">
              <button
                type="button"
                className="find-expert-info-btn"
                onClick={() => setInfoModalOpen(true)}
                aria-label="Show information"
              >
                <i className="bi bi-info-circle" aria-hidden="true"></i>
              </button>
              {isAdmin && (
                <button
                  type="button"
                  className="find-expert-edit-info-btn"
                  onClick={() => setEditInfoModalOpen(true)}
                  aria-label="Edit member information"
                >
                  <i className="bi bi-pencil-square" aria-hidden="true"></i>
                  <span>Edit info</span>
                </button>
              )}
              {/* Desktop Tooltip */}
              <div className="find-expert-info-tooltip">
                {expertInfoContent.split('\n\n').map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Info Modal */}
        <div className={`find-expert-info-modal ${infoModalOpen ? 'open' : ''}`}>
          <div className="find-expert-info-modal-content">
            <button
              className="find-expert-info-modal-close"
              onClick={() => setInfoModalOpen(false)}
              aria-label="Close information"
            >
              <i className="bi bi-x" aria-hidden="true"></i>
            </button>
            <div className="find-expert-info-modal-text">
              {expertInfoContent.split('\n\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="find-expert-controls">
          <div className="find-expert-filter">
            <CustomDropdown
              id="specialisation-filter"
              name="specialisation"
              value={selectedSpecialization}
              onChange={handleSpecializationChange}
              options={specializationOptions}
              placeholder="Member By Specialization"
              disabled={firmsLoading || specializationOptions.length === 0}
            />
          </div>

          {isAdmin && (
            <button
              type="button"
              className="find-expert-edit-specialization-btn"
              onClick={() => setEditSpecializationsModalOpen(true)}
              aria-label="Edit Specialization"
            >
              <i className="bi bi-pencil-square" aria-hidden="true"></i>
              <span>Edit Specializations</span>
            </button>
          )}

          <div className="find-expert-sort">
            <span className="find-expert-sort-label">Sort By:</span>
            <button
              type="button"
              className="find-expert-sort-btn"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              aria-label={sortOrder === 'asc' ? 'Sort A to Z' : 'Sort Z to A'}
            >
              <div className="sort-icon-container">
                <span className="sort-letter">{sortOrder === 'asc' ? 'A' : 'Z'}</span>
                <i className="bi bi-arrow-down" aria-hidden="true"></i>
                <span className="sort-letter">{sortOrder === 'asc' ? 'Z' : 'A'}</span>
              </div>
            </button>
          </div>

          <div className="find-expert-search">
            <input
              type="text"
              className="find-expert-search-input"
              placeholder="Search firms by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && searchTerm.length >= 3) {
                }
              }}
            />
            <button
              type="button"
              className="find-expert-search-btn"
              onClick={() => {
              }}
              disabled={searchTerm.length < 3}
              aria-label="Search firms"
            >
              <i className="bi bi-search" aria-hidden="true"></i>
            </button>
          </div>
        </div>

        {isAdmin && (
          <div className="find-expert-add-firm-wrapper">
            <button
              type="button"
              className="find-expert-add-firm-btn find-expert-add-firm-btn--desktop"
              onClick={handleOpenAddFirmModal}
              aria-label="Add new member firm"
            >
              <i className="bi bi-plus-lg" aria-hidden="true"></i>
              <span>Add New</span>
            </button>

            <button
              type="button"
              className="find-expert-add-firm-btn find-expert-add-firm-btn--mobile"
              onClick={handleOpenAddFirmModal}
              aria-label="Add new member firm"
            >
              <i className="bi bi-plus" aria-hidden="true"></i>
            </button>
          </div>
        )}

        <ExpertFirmsList
          firms={firmsData}
          loading={firmsLoading}
          error={firmsError}
          selectedSpecialization={selectedSpecialization}
          sortOrder={sortOrder}
          searchTerm={searchTerm}
          isAdmin={isAdmin}
          onViewMore={(firm) => {
            setSelectedFirm(firm);
            setIsModalOpen(true);
          }}
        />

        {/* Expert Firm Modal */}
        <ExpertFirmModal
          firm={selectedFirm}
          isOpen={isModalOpen}
          isAdmin={isAdmin}
          specializationOptions={specializationOptions}
          specializationsData={specializationsData}
          onSave={handleUpdateFirm}
          onDelete={isAdmin ? handleDeleteFirm : null}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedFirm(null);
          }}
        />

        {/* Edit Expert Information Modal */}
        {editInfoModalOpen && (
          <div 
            className="find-expert-edit-modal-overlay"
            onPointerDown={modalBackdropClose.onBackdropPointerDown}
            onPointerUp={modalBackdropClose.onBackdropPointerUp}
            onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
          >
            <div 
              className="find-expert-edit-modal"
              onPointerDown={modalBackdropClose.stopInsidePointer}
              onClick={modalBackdropClose.stopInsidePointer}
            >
              <button
                type="button"
                className="find-expert-edit-modal-close"
                onClick={() => setEditInfoModalOpen(false)}
                aria-label="Close edit modal"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              
              <h2 className="find-expert-edit-modal-title">Edit Member Information</h2>
              
              <form onSubmit={handleEditInfoSubmit}>
                <div className="form-group">
                  <label htmlFor="expert-info-content">Information Content</label>
                  <textarea
                    id="expert-info-content"
                    className="find-expert-edit-modal-textarea"
                    value={expertInfoContent}
                    onChange={(e) => setExpertInfoContent(e.target.value)}
                    rows={10}
                  />
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="find-expert-edit-modal-submit"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Specializations Modal */}
        {editSpecializationsModalOpen && (
          <div 
            className="find-expert-edit-modal-overlay"
            onPointerDown={specializationModalBackdropClose.onBackdropPointerDown}
            onPointerUp={specializationModalBackdropClose.onBackdropPointerUp}
            onPointerCancel={specializationModalBackdropClose.onBackdropPointerCancel}
          >
            <div 
              className="find-expert-edit-modal find-expert-specializations-modal"
              onPointerDown={specializationModalBackdropClose.stopInsidePointer}
              onClick={specializationModalBackdropClose.stopInsidePointer}
            >
              <button
                type="button"
                className="find-expert-edit-modal-close"
                onClick={() => setEditSpecializationsModalOpen(false)}
                aria-label="Close specializations modal"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              
              <div className="find-expert-admin-section">
                <div className="find-expert-admin-header">
                  <h2 className="find-expert-admin-title">Manage Specialization Details</h2>
                </div>
                
                <div className="find-expert-admin-content">
                  <div className="find-expert-admin-subheader">
                    <h3 className="find-expert-admin-subtitle">Specialization list</h3>
                    <button
                      type="button"
                      className="find-expert-admin-add-btn"
                      onClick={handleOpenAddSpecializationModal}
                      aria-label="Add new Specialization"
                    >
                      <i className="bi bi-plus-lg" aria-hidden="true"></i>
                      <span>Add New Specialization</span>
                    </button>
                  </div>

                  <div className="find-expert-admin-search">
                    <i className="bi bi-search" aria-hidden="true"></i>
                    <input
                      type="text"
                      className="find-expert-admin-search-input"
                      placeholder="Search Specialization"
                      value={specializationSearch}
                      onChange={(e) => setSpecializationSearch(e.target.value)}
                    />
                  </div>

                  <form onSubmit={handleSpecializationSubmit}>
                    {specializationsError && (
                      <div className="find-expert-admin-error" style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
                        {specializationsError}
                      </div>
                    )}
                    <div className="find-expert-admin-list">
                      {filteredSpecializations.length === 0 ? (
                        <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                          {specializationSearch.length >= 3 ? 'No specializations found' : 'No specializations available'}
                        </div>
                      ) : (
                        filteredSpecializations.map((specialization, index) => (
                          <div key={index} className="find-expert-admin-list-item">
                            <span className="find-expert-admin-list-item-text">{specialization}</span>
                            <div className="find-expert-admin-list-item-actions">
                              <button
                                type="button"
                                className="find-expert-admin-edit-btn"
                                aria-label={`Edit ${specialization}`}
                                onClick={() => handleEditSpecialization(specialization)}
                              >
                                <i className="bi bi-pencil-square" aria-hidden="true"></i>
                              </button>
                              <button
                                type="button"
                                className="find-expert-admin-delete-btn"
                                aria-label={`Delete ${specialization}`}
                                onClick={() => handleDeleteSpecialization(specialization)}
                              >
                                <i className="bi bi-trash" aria-hidden="true"></i>
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Specialization Modal */}
        {addSpecializationModalOpen && (
          <div 
            className="find-expert-edit-modal-overlay"
            onPointerDown={addSpecializationModalBackdropClose.onBackdropPointerDown}
            onPointerUp={addSpecializationModalBackdropClose.onBackdropPointerUp}
            onPointerCancel={addSpecializationModalBackdropClose.onBackdropPointerCancel}
          >
            <div 
              className="find-expert-edit-modal find-expert-add-specialization-modal"
              onPointerDown={addSpecializationModalBackdropClose.stopInsidePointer}
              onClick={addSpecializationModalBackdropClose.stopInsidePointer}
            >
              <button
                type="button"
                className="find-expert-edit-modal-close"
                onClick={() => {
                  setAddSpecializationModalOpen(false);
                  setSpecializationsError('');
                  setIsAddingSpecialization(false);
                }}
                aria-label="Close add specialization modal"
                disabled={isAddingSpecialization}
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              
              <h2 className="find-expert-add-specialization-modal-title">Add New Specialization</h2>
              <p className="find-expert-add-specialization-modal-description">Please add new specialization category details</p>
              
              <form onSubmit={handleAddSpecializationSubmit}>
                {specializationsError && (
                  <div
                    className="app-form__error-banner"
                    role="alert"
                    aria-live="assertive"
                    tabIndex={-1}
                  >
                    <strong>Error:</strong> {specializationsError}
                  </div>
                )}
                
                <div className="form-group">
                  <label htmlFor="new-specialization-name">
                    Enter the Specialization Category<span className="req-star" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="new-specialization-name"
                    type="text"
                    className="find-expert-add-specialization-input"
                    placeholder="Please mention the Specialization which you want to create"
                    value={newSpecializationName}
                    onChange={(e) => setNewSpecializationName(e.target.value)}
                    required
                    minLength={3}
                    disabled={isAddingSpecialization}
                  />
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="find-expert-edit-modal-submit"
                    disabled={isAddingSpecialization}
                  >
                    {isAddingSpecialization ? 'Loading...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Specialization Modal */}
        {editSpecializationModalOpen && editingSpecialization && (
          <div 
            className="find-expert-edit-modal-overlay"
            onPointerDown={editSpecializationModalBackdropClose.onBackdropPointerDown}
            onPointerUp={editSpecializationModalBackdropClose.onBackdropPointerUp}
            onPointerCancel={editSpecializationModalBackdropClose.onBackdropPointerCancel}
          >
            <div 
              className="find-expert-edit-modal find-expert-add-specialization-modal"
              onPointerDown={editSpecializationModalBackdropClose.stopInsidePointer}
              onClick={editSpecializationModalBackdropClose.stopInsidePointer}
            >
              <button
                type="button"
                className="find-expert-edit-modal-close"
                onClick={() => {
                  setEditSpecializationModalOpen(false);
                  setEditingSpecialization(null);
                  setNewSpecializationName('');
                  setNewSpecializationStatus(1);
                  setSpecializationsError('');
                }}
                aria-label="Close edit specialization modal"
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              
              <h2 className="find-expert-add-specialization-modal-title">Edit Specialization</h2>
              <p className="find-expert-add-specialization-modal-description">Please update the specialization category details</p>
              
              {specializationsError && (
                <div style={{ color: '#dc2626', marginBottom: '16px', padding: '12px', background: '#fee2e2', borderRadius: '8px' }}>
                  {specializationsError}
                </div>
              )}
              
              <form onSubmit={handleUpdateSpecializationSubmit}>
                <div className="form-group">
                  <label htmlFor="edit-specialization-name">
                    Enter the Specialization Category<span className="req-star" aria-hidden="true">*</span>
                  </label>
                  <input
                    id="edit-specialization-name"
                    type="text"
                    className="find-expert-add-specialization-input"
                    placeholder="Please mention the Specialization which you want to update"
                    value={newSpecializationName}
                    onChange={(e) => setNewSpecializationName(e.target.value)}
                    required
                    minLength={3}
                  />
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="find-expert-edit-modal-submit"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add New Member Firm Modal */}
        {addFirmModalOpen && (
          <div 
            className="find-expert-edit-modal-overlay"
            onPointerDown={addFirmModalBackdropClose.onBackdropPointerDown}
            onPointerUp={addFirmModalBackdropClose.onBackdropPointerUp}
            onPointerCancel={addFirmModalBackdropClose.onBackdropPointerCancel}
          >
            <div 
              className="find-expert-edit-modal find-expert-add-firm-modal"
              onPointerDown={addFirmModalBackdropClose.stopInsidePointer}
              onClick={addFirmModalBackdropClose.stopInsidePointer}
            >
              <button
                type="button"
                className="find-expert-edit-modal-close"
                onClick={() => {
                  if (!isAddingFirm) {
                    setAddFirmModalOpen(false);
                    setFirmsError('');
                    setIsAddingFirm(false);
                  }
                }}
                aria-label="Close add firm modal"
                disabled={isAddingFirm}
              >
                <i className="bi bi-x-lg" aria-hidden="true"></i>
              </button>
              
              <h2 className="find-expert-add-firm-modal-title">Add New Member Firm</h2>
              <p className="find-expert-add-firm-modal-description">
                Please fill in the details to create new member firm you'd like to store or manage in your account.
              </p>
              
              <form onSubmit={handleAddFirmSubmit}>
                {firmsError && (
                  <div
                    className="app-form__error-banner"
                    role="alert"
                    aria-live="assertive"
                    tabIndex={-1}
                  >
                    <strong>Error:</strong> {firmsError}
                  </div>
                )}
                {/* First Section */}
                <div className="find-expert-add-firm-form-section">
                  <div className="form-group">
                    <label htmlFor="firm-name">
                      Firm Name<span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="firm-name"
                      type="text"
                      className="find-expert-add-firm-input"
                      placeholder="Please mention the name of the firm"
                      value={firmFormData.name}
                      onChange={(e) => handleFirmFormChange('name', e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="firm-specialization">
                      Choose Specialization<span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <CustomDropdown
                      id="firm-specialization"
                      name="specialization"
                      value={firmFormData.specialization}
                      onChange={(e) => handleFirmFormChange('specialization', e.target.value)}
                      options={specializationOptions.filter(opt => opt.value !== '')}
                      placeholder="Choose"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="firm-description">
                      Description<span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <textarea
                      id="firm-description"
                      className="find-expert-add-firm-textarea"
                      placeholder="Please share the info or specification about the firm"
                      value={firmFormData.description}
                      onChange={(e) => handleFirmFormChange('description', e.target.value)}
                      rows={4}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="firm-image">
                      Upload Logo<span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <p className="find-expert-add-firm-file-hint">
                      PNG, JPG and JPEG files are supported. Maximum file size: 5 MB.
                    </p>
                    <div className="find-expert-add-firm-file-upload">
                      <button
                        type="button"
                        className="find-expert-add-firm-choose-file-btn"
                        onClick={handleFirmImageBrowse}
                      >
                        Choose File
                      </button>
                      <span className="find-expert-add-firm-file-name">
                        {firmImageFile ? firmImageFile.name : 'No File Chosen'}
                      </span>
                    </div>
                    {firmImagePreview ? (
                      <div className="find-expert-add-firm-image-preview">
                        <img 
                          src={firmImagePreview} 
                          alt="Preview" 
                          className="find-expert-add-firm-preview-image"
                        />
                        <button
                          type="button"
                          className="find-expert-add-firm-remove-preview"
                          onClick={() => {
                            setFirmImagePreview('');
                            setFirmImageFile(null);
                            if (firmImageInputRef.current) {
                              firmImageInputRef.current.value = '';
                            }
                          }}
                          aria-label="Remove preview"
                        >
                          <i className="bi bi-x" aria-hidden="true"></i>
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`find-expert-add-firm-dropzone ${firmImageDragActive ? 'active' : ''}`}
                        onDragEnter={handleFirmImageDragIn}
                        onDragLeave={handleFirmImageDragOut}
                        onDragOver={handleFirmImageDrag}
                        onDrop={handleFirmImageDrop}
                        onClick={handleFirmImageBrowse}
                      >
                        <div className="find-expert-add-firm-dropzone-content">
                          <i className="bi bi-cloud-upload find-expert-add-firm-dropzone-icon" aria-hidden="true"></i>
                          <p className="find-expert-add-firm-dropzone-label">Drag and drop files here</p>
                          <p className="find-expert-add-firm-dropzone-separator">or</p>
                          <button
                            type="button"
                            className="find-expert-add-firm-dropzone-browse"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleFirmImageBrowse();
                            }}
                          >
                            Browse File
                          </button>
                        </div>
                      </div>
                    )}
                    <input
                      ref={firmImageInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={handleFirmImageInput}
                      className="find-expert-add-firm-file-input"
                      aria-hidden="true"
                      required={!firmImagePreview}
                    />
                  </div>
                </div>

                {/* Second Section */}
                <div className="find-expert-add-firm-form-section">
                  <div className="form-group">
                    <label htmlFor="firm-website">
                      Website Link<span className="req-star" aria-hidden="true">*</span>
                    </label>
                    <input
                      id="firm-website"
                      type="text"
                      className="find-expert-add-firm-input"
                      placeholder="Please mention the link"
                      value={firmFormData.website_link}
                      onChange={(e) => handleFirmFormChange('website_link', e.target.value)}
                      required
                    />
                  </div>

                  <div className="find-expert-add-firm-address-form">
                    <div className="find-expert-add-firm-address-lines">
                      <div className="form-group">
                        <label htmlFor="firm-address-line-1">Address Line 1</label>
                        <input
                          id="firm-address-line-1"
                          type="text"
                          className="find-expert-add-firm-input"
                          placeholder="Please mention the address line 1"
                          value={firmFormData.address_line_1}
                          onChange={(e) => handleFirmFormChange('address_line_1', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="firm-address-line-2">Address Line 2</label>
                        <input
                          id="firm-address-line-2"
                          type="text"
                          className="find-expert-add-firm-input"
                          placeholder="Please mention the address line 2"
                          value={firmFormData.address_line_2}
                          onChange={(e) => handleFirmFormChange('address_line_2', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="find-expert-add-firm-address-row">
                      <div className="form-group">
                        <label htmlFor="firm-city">City</label>
                        <input
                          id="firm-city"
                          type="text"
                          className="find-expert-add-firm-input"
                          placeholder="Please mention the city"
                          value={firmFormData.city}
                          onChange={(e) => handleFirmFormChange('city', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="firm-country">Country</label>
                        <input
                          id="firm-country"
                          type="text"
                          className="find-expert-add-firm-input"
                          placeholder="Please mention the country"
                          value={firmFormData.country}
                          onChange={(e) => handleFirmFormChange('country', e.target.value)}
                        />
                      </div>

                      <div className="form-group">
                        <label htmlFor="firm-postal-code">Postal Code</label>
                        <input
                          id="firm-postal-code"
                          type="text"
                          className="find-expert-add-firm-input"
                          placeholder="Please mention the postal code"
                          value={firmFormData.postal_code}
                          onChange={(e) => handleFirmFormChange('postal_code', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="find-expert-add-firm-two-columns">
                    <div className="form-group">
                      <label htmlFor="firm-contact-0">Contact Number</label>
                      {firmFormData.contact_numbers.map((number, index) => {
                        const isLast = index === firmFormData.contact_numbers.length - 1;
                        const isAddButtonDisabled = !((number || '').trim());

                        return (
                          <div key={index} className="find-expert-add-firm-input-with-action">
                            <div className="find-expert-add-firm-input-row">
                              <input
                                id={`firm-contact-${index}`}
                                type="text"
                                className="find-expert-add-firm-input"
                                placeholder="Ex: +1 (284) 494-1134"
                                value={number}
                                onChange={(e) => handlePhoneChange(index, e.target.value)}
                              />
                              <button
                                type="button"
                                className="find-expert-add-firm-remove-field"
                                aria-label="Remove phone number"
                                onClick={() => handleRemovePhone(index)}
                              >
                                <i className="bi bi-trash" aria-hidden="true"></i>
                              </button>
                            </div>
                            {isLast && (
                              <button
                                type="button"
                                className="find-expert-add-firm-add-more"
                                onClick={handleAddPhone}
                                disabled={isAddButtonDisabled}
                                aria-disabled={isAddButtonDisabled}
                              >
                                <i className="bi bi-plus-lg" aria-hidden="true"></i>
                                <span>Add More Phone</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div className="form-group">
                      <label htmlFor="firm-email-0">Email</label>
                      {firmFormData.emails.map((email, index) => {
                        const isLast = index === firmFormData.emails.length - 1;
                        const isAddButtonDisabled = !((email || '').trim());

                        return (
                          <div key={index} className="find-expert-add-firm-input-with-action">
                            <div className="find-expert-add-firm-input-row">
                              <input
                                id={`firm-email-${index}`}
                                type="email"
                                className="find-expert-add-firm-input"
                                placeholder="Ex: email@example.com"
                                value={email}
                                onChange={(e) => handleEmailChange(index, e.target.value)}
                              />
                              <button
                                type="button"
                                className="find-expert-add-firm-remove-field"
                                aria-label="Remove email"
                                onClick={() => handleRemoveEmail(index)}
                              >
                                <i className="bi bi-trash" aria-hidden="true"></i>
                              </button>
                            </div>
                            {isLast && (
                              <button
                                type="button"
                                className="find-expert-add-firm-add-more"
                                onClick={handleAddEmail}
                                disabled={isAddButtonDisabled}
                                aria-disabled={isAddButtonDisabled}
                              >
                                <i className="bi bi-plus-lg" aria-hidden="true"></i>
                                <span>Add More Email</span>
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                
                <div className="form-actions">
                  <button
                    type="submit"
                    className="find-expert-edit-modal-submit"
                    disabled={isAddingFirm}
                  >
                    {isAddingFirm ? 'Loading...' : 'Submit'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirm Delete Specialization Modal */}
        <ConfirmDeleteModal
          isOpen={isConfirmDeleteOpen}
          onClose={() => {
            setIsConfirmDeleteOpen(false);
            setSpecializationToDelete(null);
            setIsDeleting(false);
            setSpecializationsError('');
          }}
          onConfirm={handleConfirmDeleteSpecialization}
          message={specializationToDelete ? `Are you sure you want to delete "${specializationToDelete.name}"? This will also delete all member firms associated with this specialization.` : 'Are you sure you want to delete this specialization? This will also delete all member firms associated with this specialization.'}
          isDeleting={isDeleting}
          errorMessage={specializationsError}
        />

        {/* Success Delete Modal */}
        <SuccessDeleteModal
          isOpen={isSuccessDeleteOpen}
          onClose={() => setIsSuccessDeleteOpen(false)}
        />

        {/* Confirm Delete Firm Modal */}
        <ConfirmDeleteModal
          isOpen={isConfirmDeleteFirmOpen}
          onClose={() => {
            setIsConfirmDeleteFirmOpen(false);
            setFirmToDelete(null);
            setIsDeletingFirm(false);
            setFirmsError('');
          }}
          onConfirm={handleConfirmDeleteFirm}
          message={firmToDelete ? `Are you sure you want to delete "${firmToDelete.name}"? This action cannot be reversed.` : 'Are you sure you want to delete this firm? This action cannot be reversed.'}
          isDeleting={isDeletingFirm}
          errorMessage={firmsError}
        />

        {/* Success Delete Firm Modal */}
        <SuccessDeleteModal
          isOpen={isSuccessDeleteFirmOpen}
          onClose={() => setIsSuccessDeleteFirmOpen(false)}
        />
      </div>
    </div>
  );
};

export default FindExpert;
