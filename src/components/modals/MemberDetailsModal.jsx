import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useModalBackdropClose } from '../../hooks/useModalBackdropClose';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import ModalLifecycleLock from './ModalLifecycleLock';
import membersService from '../../services/membersService';
import membershipPlansService from '../../services/membershipPlansService';
import memberFirmsService from '../../services/memberFirmsService';
import specializationsService from '../../services/specializationsService';
import CustomDropdown from '../CustomDropdown';
import { RenewMembershipModal } from './RenewMembershipModal';
import { buildMemberFirmImageUrl } from '../../utils/memberFirmTransformers';
import '../../styles/components/MemberDetailsModal.scss';

const extractPlanInfo = (planLike) => {
  if (!planLike) return { id: null, title: null };

  if (typeof planLike === 'string') {
    const trimmed = planLike.trim();
    return { id: null, title: trimmed || null };
  }

  if (typeof planLike === 'number') {
    return { id: String(planLike), title: null };
  }

  if (typeof planLike === 'object') {
    if (planLike.id !== undefined && planLike.id !== null) {
      const candidateTitle =
        planLike.title ||
        planLike.name ||
        planLike.plan_title ||
        planLike.plan_name ||
        planLike.membership_plan_title ||
        planLike.membership_plan_name ||
        null;

      return {
        id: String(planLike.id),
        title: candidateTitle ? String(candidateTitle).trim() || null : null
      };
    }

    const nestedSource =
      (planLike.membership_plan_id && planLike.membership_plan_id !== planLike
        ? planLike.membership_plan_id
        : null) ??
      (planLike.plan_id && planLike.plan_id !== planLike ? planLike.plan_id : null) ??
      (planLike.membershipPlanId && planLike.membershipPlanId !== planLike
        ? planLike.membershipPlanId
        : null) ??
      (planLike.planId && planLike.planId !== planLike ? planLike.planId : null) ??
      null;

    const nestedInfo = nestedSource ? extractPlanInfo(nestedSource) : { id: null, title: null };

    const candidateTitle =
      planLike.title ||
      planLike.name ||
      planLike.plan_title ||
      planLike.plan_name ||
      planLike.membership_plan_title ||
      planLike.membership_plan_name ||
      nestedInfo.title ||
      null;

    return {
      id: nestedInfo.id,
      title: candidateTitle ? String(candidateTitle).trim() || null : null
    };
  }

  return { id: null, title: null };
};

const FirmCard = ({ firm, imagePath, isLinked, onLink, onUnlink, disabled = false }) => {
  const [imageError, setImageError] = useState(false);
  const showPlaceholder = !imagePath || imageError;
  
  const getPlaceholderColor = (name) => {
    const colors = [
      '#FBB900',
      '#489836',
      '#464676',
      '#6b7280',
      '#D35098',
      '#E62B1E',
      '#00338E',
      '#F07D00',
      '#94D3E2',
      '#BFB4AB'
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };
  
  return (
    <div className="member-link-firm-card">
      <div className="member-link-firm-card-logo">
        {imagePath && !imageError ? (
          <img 
            src={imagePath} 
            alt={firm.name}
            className="member-link-firm-card-logo-img"
            onError={() => setImageError(true)}
          />
        ) : null}
        {showPlaceholder && (
          <div 
            className="member-link-firm-card-logo-placeholder"
            style={{ backgroundColor: getPlaceholderColor(firm.name) }}
          >
            {firm.name.substring(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="member-link-firm-card-content">
        <div className="member-link-firm-card-name">{firm.name}</div>
        <div className="member-link-firm-card-specialization">
          Specialisation: {firm.specialization}
        </div>
      </div>
      <button
        type="button"
        className={`member-link-firm-card-btn ${isLinked ? 'member-link-firm-card-btn--unlink' : 'member-link-firm-card-btn--link'}`}
        onClick={isLinked ? onUnlink : onLink}
        disabled={disabled}
      >
        <i className={isLinked ? 'bi bi-person-fill-dash' : 'bi bi-person-fill-check'}></i>
        <span>{disabled ? 'Updating...' : (isLinked ? 'Unlink Firm' : 'Link Firm')}</span>
      </button>
    </div>
  );
};

export const MemberDetailsModal = ({
  isOpen,
  onClose,
  member,
  onMemberUpdated,
  onDeleteMember
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMember, setIsLoadingMember] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [fetchError, setFetchError] = useState('');
  const [currentMember, setCurrentMember] = useState(member);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [plansById, setPlansById] = useState({});
  
  const [firmsData, setFirmsData] = useState([]);
  const [firmsLoading, setFirmsLoading] = useState(false);
  const [specializations, setSpecializations] = useState([]);
  const [specializationsData, setSpecializationsData] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [firmSearchTerm, setFirmSearchTerm] = useState('');
  const [firmSortOrder, setFirmSortOrder] = useState('asc');
  const [linkedFirmIds, setLinkedFirmIds] = useState(new Set());
  const [updatingFirms, setUpdatingFirms] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [editingPaymentStatus, setEditingPaymentStatus] = useState(null);
  const [originalPaymentStatus, setOriginalPaymentStatus] = useState(null);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);

  const modalBackdropClose = useModalBackdropClose(onClose);

  useBodyScrollLock(isOpen);

  // Initialize with prop data immediately, then fetch updated data in background
  useEffect(() => {
    if (isOpen && member) {
      // Set initial data immediately from prop (don't wait for API)
      setCurrentMember(member);
      // Initialize linkedFirmIds from member.member_firms if available
      if (member && member.member_firms && Array.isArray(member.member_firms)) {
        const firmIds = member.member_firms.map(firm => 
          typeof firm === 'object' ? firm.id : firm
        );
        setLinkedFirmIds(new Set(firmIds));
      } else {
        setLinkedFirmIds(new Set());
      }
      setFetchError('');
      
      // Then fetch latest data from API in background
      if (member.id) {
        setIsLoadingMember(true);
        const fetchMemberData = async () => {
          try {
            const memberResponse = await membersService.getMember(member.id);
            
            // Update currentMember with fresh data from API
            if (memberResponse && memberResponse.data) {
              setCurrentMember(memberResponse.data);
              // Initialize linkedFirmIds from member_firms
              if (memberResponse.data.member_firms && Array.isArray(memberResponse.data.member_firms)) {
                const firmIds = memberResponse.data.member_firms.map(firm => 
                  typeof firm === 'object' ? firm.id : firm
                );
                setLinkedFirmIds(new Set(firmIds));
              } else {
                setLinkedFirmIds(new Set());
              }
              setFetchError('');
            } else if (memberResponse && !memberResponse.data && memberResponse.id) {
              // If response structure is flat (data is the object itself)
              setCurrentMember(memberResponse);
              // Initialize linkedFirmIds from member_firms
              if (memberResponse.member_firms && Array.isArray(memberResponse.member_firms)) {
                const firmIds = memberResponse.member_firms.map(firm => 
                  typeof firm === 'object' ? firm.id : firm
                );
                setLinkedFirmIds(new Set(firmIds));
              } else {
                setLinkedFirmIds(new Set());
              }
              setFetchError('');
            } else {
              // Keep existing member data from prop
              setFetchError('Failed to load member details. Displaying cached data.');
            }
          } catch (error) {
            console.error('Error fetching member data:', error);
            setFetchError(error.message || 'Failed to load member details. Displaying cached data.');
            // Keep existing member data from prop
          } finally {
            setIsLoadingMember(false);
          }
        };
        fetchMemberData();
      }
    } else if (member) {
      // If modal is not open but member exists, use prop member
      setCurrentMember(member);
    }
  }, [isOpen, member]);

  const addPlansToMap = useCallback((plans) => {
    if (!Array.isArray(plans) || plans.length === 0) return;

    setPlansById((prev) => {
      const next = { ...prev };
      let changed = false;

      plans.forEach((plan) => {
        const { id, title } = extractPlanInfo(plan);
        if (!id) return;

        const trimmedTitle = title ? title.trim() : '';

        if (!next[id]) {
          next[id] = trimmedTitle;
          changed = true;
        } else if (trimmedTitle && next[id] !== trimmedTitle) {
          next[id] = trimmedTitle;
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, []);

  useEffect(() => {
    if (!currentMember) return;

    const possiblePlans = [];

    if (currentMember.membership_plan) {
      possiblePlans.push(currentMember.membership_plan);
    }

    if (Array.isArray(currentMember.membership_plans)) {
      possiblePlans.push(...currentMember.membership_plans);
    }

    if (
      currentMember.membership_plan_id !== undefined &&
      currentMember.membership_plan_id !== null
    ) {
      possiblePlans.push(currentMember.membership_plan_id);

      const memberPlanInfo = extractPlanInfo(currentMember.membership_plan_id);
      const memberPlanTitle =
        currentMember.membership_plan_title || currentMember.membership_plan_name || null;

      if (memberPlanInfo.id && memberPlanTitle) {
        possiblePlans.push({
          id: memberPlanInfo.id,
          title: memberPlanTitle
        });
      }
    }

    const paymentsSource = (() => {
      if (Array.isArray(currentMember.payments)) return currentMember.payments;
      if (Array.isArray(currentMember.payment_history)) return currentMember.payment_history;
      if (currentMember.payments && Array.isArray(currentMember.payments.data)) {
        return currentMember.payments.data;
      }
      return [];
    })();

    paymentsSource.forEach((payment) => {
      if (!payment) return;

      if (payment.membership_plan) {
        possiblePlans.push(payment.membership_plan);
      }
      if (payment.plan) {
        possiblePlans.push(payment.plan);
      }

      const paymentPlanId =
        payment.membership_plan_id ??
        payment.plan_id ??
        payment.membership_plan?.id ??
        payment.plan?.id ??
        null;

      if (paymentPlanId !== undefined && paymentPlanId !== null) {
        possiblePlans.push(paymentPlanId);

        const paymentPlanInfo = extractPlanInfo(payment.membership_plan_id || paymentPlanId);
        const indirectTitle =
          payment.plan_name ||
          payment.plan_title ||
          payment.membership_plan_name ||
          payment.membership_plan_title ||
          payment.membership_plan?.title ||
          payment.plan?.title ||
          payment.membership_plan?.name ||
          payment.plan?.name ||
          null;

        if (paymentPlanInfo.id && indirectTitle) {
          possiblePlans.push({
            id: paymentPlanInfo.id,
            title: indirectTitle
          });
        }
      }
    });

    addPlansToMap(possiblePlans);
  }, [currentMember, addPlansToMap]);

  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    const extractPlansArray = (payload) => {
      if (!payload) return [];
      if (Array.isArray(payload)) return payload;
      if (payload.data) return extractPlansArray(payload.data);
      if (payload.items) return extractPlansArray(payload.items);
      if (payload.plans) return extractPlansArray(payload.plans);
      return [];
    };

    const fetchPlans = async () => {
      try {
        const response = await membershipPlansService.getMembershipPlans({ pagination: 50, page: 1 });
        if (!isMounted) return;
        const plansArray = extractPlansArray(response);
        addPlansToMap(plansArray);
      } catch (error) {
        if (isMounted) {
          console.error('Error fetching membership plans:', error);
        }
      }
    };

    fetchPlans();

    return () => {
      isMounted = false;
    };
  }, [isOpen, addPlansToMap]);

  const loadFirmsData = useCallback(async () => {
    setFirmsLoading(true);
    try {
      const response = await memberFirmsService.getAll(1000, 1);
      const firms = response.data?.data || [];
      
      const specsResult = await specializationsService.getSpecializations(100, 1);
      const specs = specsResult.data || [];
      const specializationMap = {};
      specs.forEach(spec => {
        specializationMap[spec.id] = spec.name;
      });
      
      const mappedFirms = firms.map(firm => {
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
            parsedPhone = parsedContactNumbers[0] || null;
          }
        } catch (e) {
          console.warn('Error parsing contact_number:', e);
        }
        
        try {
          if (firm.email) {
            const parsed = JSON.parse(firm.email);
            parsedEmails = Array.isArray(parsed) ? parsed : [parsed];
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
          contact_numbers: parsedContactNumbers,
          emails: parsedEmails,
          specialization_id: firm.specialization_id,
          status: firm.status
        };
      });
      
      setFirmsData(mappedFirms);
    } catch (error) {
      console.error('Error fetching firms data:', error);
      setFirmsData([]);
    } finally {
      setFirmsLoading(false);
    }
  }, []);

  const loadSpecializations = useCallback(async () => {
    try {
      const result = await specializationsService.getSpecializations(100, 1);
      const specs = result.data || [];
      const filteredSpecs = specs.filter(spec => spec.status === 1);
      setSpecializationsData(filteredSpecs);
      const specNames = filteredSpecs
        .map(spec => spec.name)
        .sort((a, b) => a.localeCompare(b));
      setSpecializations(specNames);
    } catch (error) {
      console.error('Error fetching specializations:', error);
      setSpecializations([]);
      setSpecializationsData([]);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadFirmsData();
      loadSpecializations();
    }
  }, [isOpen, loadFirmsData, loadSpecializations]);

  // Initialize edit data when currentMember changes
  useEffect(() => {
    if (currentMember) {
      setEditData({
        firstName: currentMember.first_name || '',
        lastName: currentMember.last_name || '',
        email: currentMember.email || '',
        phone: currentMember.phone || '',
        status: currentMember.status !== undefined && currentMember.status !== null 
          ? (Number(currentMember.status) === 1 ? 'Active' : 'Inactive')
          : ''
      });
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [currentMember]);

  // Reset editing state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsEditing(false);
      setSuccessMessage('');
      setErrorMessage('');
    }
  }, [isOpen]);

  // Check if there are changes (dirty state)
  const hasChanges = useMemo(() => {
    if (!currentMember) return false;
    
    const currentFirstName = currentMember.first_name || '';
    const currentLastName = currentMember.last_name || '';
    const currentEmail = currentMember.email || '';
    const currentPhone = currentMember.phone || '';
    const currentStatus = currentMember.status !== undefined && currentMember.status !== null 
      ? (Number(currentMember.status) === 1 ? 'Active' : 'Inactive')
      : '';

    return (
      editData.firstName !== currentFirstName ||
      editData.lastName !== currentLastName ||
      editData.email !== currentEmail ||
      editData.phone !== currentPhone ||
      editData.status !== currentStatus
    );
  }, [currentMember, editData]);

  // Build full image URL from server
  const buildProfileImageUrl = useCallback((imagePath) => {
    if (!imagePath) return null;

    if (/^(https?:)?\/\//i.test(imagePath)) {
      return imagePath;
    }

    const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
    const apiBaseURL = baseURL.replace('/api', '');
    const normalizedPath = imagePath.replace(/^\/+/, '');
    const hasDirectory = normalizedPath.includes('/') || normalizedPath.toLowerCase().startsWith('storage/');
    const defaultDirectory = 'storage/users';
    const pathWithDirectory = hasDirectory ? normalizedPath : `${defaultDirectory}/${normalizedPath}`;

    return `${apiBaseURL}/${pathWithDirectory.replace(/^\/+/, '')}`;
  }, []);

  // Get profile image URL from member data (consumed from server)
  const profileImageUrl = useMemo(() => {
    if (!currentMember) return null;
    
    // Try different possible field names from backend
    const imagePath = currentMember.original_image ||
                     currentMember.profile_picture_url || 
                     currentMember.image_url || 
                     currentMember.profile_picture ||
                     currentMember.image ||
                     null;
    
    if (!imagePath) return null;
    
    return buildProfileImageUrl(imagePath);
  }, [currentMember, buildProfileImageUrl]);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      return () => document.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, onClose]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      const date = new Date(dateString);
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '—';
    }
  };

  const formatDateTooltip = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const month = date.toLocaleDateString('en-US', { month: 'long' });
      const year = date.getFullYear();
      return `${day}, ${month} ${year}`;
    } catch {
      return '';
    }
  };

  const formatPaymentDate = (dateString) => {
    if (!dateString) return '—';
    try {
      // Handle YYYY-MM-DD format by adding time to avoid timezone issues
      let date;
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString + 'T12:00:00');
      } else {
        date = new Date(dateString);
      }
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    } catch {
      return '—';
    }
  };

  const formatPaymentAmount = (amount) => {
    if (!amount && amount !== 0) return '—';
    try {
      const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
      return `$${numAmount.toFixed(2)}`;
    } catch {
      return '—';
    }
  };

  const formatPaymentStatus = (status) => {
    if (status === undefined || status === null) return '—';
    
    if (typeof status === 'number') {
      if (status === 0) return 'Fail';
      if (status === 1) return 'Pending';
      if (status === 2) return 'Paid';
      return '—';
    }
    
    if (typeof status === 'string') {
      const lowerStatus = status.toLowerCase();
      if (lowerStatus === 'fail' || lowerStatus === '0') return 'Fail';
      if (lowerStatus === 'pending' || lowerStatus === '1') return 'Pending';
      if (lowerStatus === 'paid' || lowerStatus === '2') return 'Paid';
      return status;
    }
    
    return '—';
  };

  const getPaymentPlanName = (payment) => {
    if (!payment) return '—';

    const directName =
      payment.plan_name ||
      payment.plan_title ||
      (typeof payment.plan === 'string' ? payment.plan : null) ||
      payment.membership_plan_name ||
      payment.membership_plan_title;

    if (typeof directName === 'string' && directName.trim() !== '') {
      return directName.trim();
    }

    const membershipPlanInfo = extractPlanInfo(payment.membership_plan);
    if (membershipPlanInfo.title) return membershipPlanInfo.title;

    const genericPlanInfo = extractPlanInfo(payment.plan);
    if (genericPlanInfo.title) return genericPlanInfo.title;

    const membershipPlanIdInfo = extractPlanInfo(payment.membership_plan_id);
    if (membershipPlanIdInfo.title) return membershipPlanIdInfo.title;

    const fallbackPlanId =
      membershipPlanIdInfo.id ||
      membershipPlanInfo.id ||
      genericPlanInfo.id ||
      (typeof payment.plan_id === 'number' || typeof payment.plan_id === 'string'
        ? String(payment.plan_id)
        : null);

    if (fallbackPlanId) {
      const mappedTitle = plansById[fallbackPlanId];
      if (mappedTitle && mappedTitle.trim() !== '') {
        return mappedTitle;
      }
      return `Plan ${fallbackPlanId}`;
    }

    return '—';
  };

  // Prepare payment data from API response
  const getPaymentHistory = () => {
    if (!currentMember) return [];

    const paymentsSource = (() => {
      if (Array.isArray(currentMember.payments)) return currentMember.payments;
      if (Array.isArray(currentMember.payment_history)) return currentMember.payment_history;
      if (currentMember.payments && Array.isArray(currentMember.payments.data)) {
        return currentMember.payments.data;
      }
      return [];
    })();

    if (paymentsSource.length === 0) return [];

    return paymentsSource.map((payment) => {
      const statusValue = payment?.status !== undefined && payment?.status !== null
        ? Number(payment.status) 
        : null;
      const formattedStatus = formatPaymentStatus(payment?.status);

      return {
        id: payment?.id || null,
        plan: getPaymentPlanName(payment),
        duration: '12 months',
        date: formatPaymentDate(payment?.date || payment?.created_at || payment?.payment_date),
        status: formattedStatus,
        amount: formatPaymentAmount(payment?.amount || payment?.total),
        isPending: statusValue === 1 || formattedStatus === 'Pending'
      };
    });
  };

  const paymentHistory = getPaymentHistory();

  const fullName = currentMember ? `${currentMember.first_name || ''} ${currentMember.last_name || ''}`.trim() || '—' : '—';
  const isActive = currentMember && currentMember.status !== undefined && currentMember.status !== null && Number(currentMember.status) === 1;

  const specializationOptions = useMemo(() => {
    return [
      { value: '', label: 'All member firms' },
      ...specializations.map(spec => ({
        value: spec,
        label: spec
      }))
    ];
  }, [specializations]);

  const filteredAndSortedFirms = useMemo(() => {
    if (!Array.isArray(firmsData) || firmsData.length === 0) {
      return [];
    }

    let filtered = firmsData;

    if (selectedSpecialization && selectedSpecialization !== '') {
      filtered = filtered.filter(firm => firm.specialization === selectedSpecialization);
    }

    if (firmSearchTerm && firmSearchTerm.length >= 3) {
      const searchLower = firmSearchTerm.toLowerCase();
      filtered = filtered.filter(firm => 
        firm.name.toLowerCase().includes(searchLower)
      );
    }

    const sorted = [...filtered].sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (firmSortOrder === 'asc') {
        return nameA.localeCompare(nameB);
      } else {
        return nameB.localeCompare(nameA);
      }
    });

    return sorted;
  }, [firmsData, selectedSpecialization, firmSortOrder, firmSearchTerm]);

  const handleSpecializationChange = useCallback((event) => {
    setSelectedSpecialization(event.target.value);
  }, []);

  const handleLinkFirm = useCallback(async (firmId) => {
    if (!currentMember || !currentMember.id || updatingFirms) return;

    // Update local state optimistically
    const newLinkedIds = new Set([...linkedFirmIds, firmId]);
    setLinkedFirmIds(newLinkedIds);
    setUpdatingFirms(true);

    try {
      // Get current member_firms IDs (handle both object and ID formats)
      const currentFirmIds = currentMember.member_firms && Array.isArray(currentMember.member_firms)
        ? currentMember.member_firms.map(firm => typeof firm === 'object' ? firm.id : firm)
        : [];

      // Create updated list
      const updatedFirmIds = [...currentFirmIds, firmId];

      // Prepare update data
      const updateData = {
        first_name: currentMember.first_name || '',
        last_name: currentMember.last_name || '',
        email: currentMember.email || '',
        phone: currentMember.phone || '',
        member_firms: updatedFirmIds
      };

      // Send update to API
      const response = await membersService.updateMember(currentMember.id, updateData);

      if (response && (response.http_status === 200 || !response.http_status)) {
        // Fetch updated member data
        const updatedMemberResponse = await membersService.getMember(currentMember.id);
        
        if (updatedMemberResponse && updatedMemberResponse.data) {
          setCurrentMember(updatedMemberResponse.data);
          // Update linkedFirmIds from response
          if (updatedMemberResponse.data.member_firms && Array.isArray(updatedMemberResponse.data.member_firms)) {
            const firmIds = updatedMemberResponse.data.member_firms.map(firm => 
              typeof firm === 'object' ? firm.id : firm
            );
            setLinkedFirmIds(new Set(firmIds));
          }
        } else if (updatedMemberResponse && !updatedMemberResponse.data && updatedMemberResponse.id) {
          setCurrentMember(updatedMemberResponse);
          if (updatedMemberResponse.member_firms && Array.isArray(updatedMemberResponse.member_firms)) {
            const firmIds = updatedMemberResponse.member_firms.map(firm => 
              typeof firm === 'object' ? firm.id : firm
            );
            setLinkedFirmIds(new Set(firmIds));
          }
        }

        if (onMemberUpdated) {
          onMemberUpdated();
        }
      } else {
        // Revert on error
        setLinkedFirmIds(new Set([...linkedFirmIds]));
        setErrorMessage('Failed to link firm. Please try again.');
      }
    } catch (error) {
      console.error('Error linking firm:', error);
      // Revert on error
      setLinkedFirmIds(new Set([...linkedFirmIds]));
      setErrorMessage(error.message || 'Failed to link firm. Please try again.');
    } finally {
      setUpdatingFirms(false);
    }
  }, [currentMember, linkedFirmIds, updatingFirms, onMemberUpdated]);

  const handleUnlinkFirm = useCallback(async (firmId) => {
    if (!currentMember || !currentMember.id || updatingFirms) return;

    // Update local state optimistically
    const newLinkedIds = new Set(linkedFirmIds);
    newLinkedIds.delete(firmId);
    setLinkedFirmIds(newLinkedIds);
    setUpdatingFirms(true);

    try {
      // Get current member_firms IDs (handle both object and ID formats)
      const currentFirmIds = currentMember.member_firms && Array.isArray(currentMember.member_firms)
        ? currentMember.member_firms.map(firm => typeof firm === 'object' ? firm.id : firm)
        : [];

      // Create updated list (remove the firmId)
      const updatedFirmIds = currentFirmIds.filter(id => id !== firmId);

      // Prepare update data
      const updateData = {
        first_name: currentMember.first_name || '',
        last_name: currentMember.last_name || '',
        email: currentMember.email || '',
        phone: currentMember.phone || '',
        member_firms: updatedFirmIds
      };

      // Send update to API
      const response = await membersService.updateMember(currentMember.id, updateData);

      if (response && (response.http_status === 200 || !response.http_status)) {
        // Fetch updated member data
        const updatedMemberResponse = await membersService.getMember(currentMember.id);
        
        if (updatedMemberResponse && updatedMemberResponse.data) {
          setCurrentMember(updatedMemberResponse.data);
          // Update linkedFirmIds from response
          if (updatedMemberResponse.data.member_firms && Array.isArray(updatedMemberResponse.data.member_firms)) {
            const firmIds = updatedMemberResponse.data.member_firms.map(firm => 
              typeof firm === 'object' ? firm.id : firm
            );
            setLinkedFirmIds(new Set(firmIds));
          } else {
            setLinkedFirmIds(new Set());
          }
        } else if (updatedMemberResponse && !updatedMemberResponse.data && updatedMemberResponse.id) {
          setCurrentMember(updatedMemberResponse);
          if (updatedMemberResponse.member_firms && Array.isArray(updatedMemberResponse.member_firms)) {
            const firmIds = updatedMemberResponse.member_firms.map(firm => 
              typeof firm === 'object' ? firm.id : firm
            );
            setLinkedFirmIds(new Set(firmIds));
          } else {
            setLinkedFirmIds(new Set());
          }
        }

        if (onMemberUpdated) {
          onMemberUpdated();
        }
      } else {
        // Revert on error
        setLinkedFirmIds(new Set([...linkedFirmIds]));
        setErrorMessage('Failed to unlink firm. Please try again.');
      }
    } catch (error) {
      console.error('Error unlinking firm:', error);
      // Revert on error
      setLinkedFirmIds(new Set([...linkedFirmIds]));
      setErrorMessage(error.message || 'Failed to unlink firm. Please try again.');
    } finally {
      setUpdatingFirms(false);
    }
  }, [currentMember, linkedFirmIds, updatingFirms, onMemberUpdated]);

  const getStatusValue = useCallback((statusText) => {
    if (!statusText) return null;
    const lowerStatus = statusText.toLowerCase();
    if (lowerStatus === 'pending' || lowerStatus === '1') return 1;
    if (lowerStatus === 'paid' || lowerStatus === '2') return 2;
    if (lowerStatus === 'fail' || lowerStatus === 'failed' || lowerStatus === '0') return 0;
    return null;
  }, []);

  const getStatusText = useCallback((statusValue) => {
    if (statusValue === 1) return 'Pending';
    if (statusValue === 2) return 'Paid';
    if (statusValue === 0) return 'Failed';
    return 'Pending';
  }, []);

  const handleEditPaymentStatus = useCallback((payment) => {
    const statusValue = getStatusValue(payment.status);
    setEditingPaymentId(payment.id);
    setEditingPaymentStatus(statusValue !== null ? statusValue : 1);
    setOriginalPaymentStatus(statusValue !== null ? statusValue : 1);
  }, [getStatusValue]);

  const handleCancelEditPaymentStatus = useCallback(() => {
    setEditingPaymentId(null);
    setEditingPaymentStatus(null);
    setOriginalPaymentStatus(null);
  }, []);

  const handleSavePaymentStatus = useCallback(async () => {
    if (!currentMember || !editingPaymentId || updatingPaymentStatus) return;
    
    if (editingPaymentStatus === originalPaymentStatus) {
      handleCancelEditPaymentStatus();
      return;
    }

    setUpdatingPaymentStatus(true);
    setErrorMessage('');

    try {
      const response = await membersService.updatePaymentStatus(
        currentMember.id,
        editingPaymentId,
        editingPaymentStatus
      );

      if (response && (response.http_status === 200 || !response.http_status)) {
        if (response.data) {
          setCurrentMember(response.data);
        }

        setSuccessMessage('Payment status updated successfully!');
        setEditingPaymentId(null);
        setEditingPaymentStatus(null);
        setOriginalPaymentStatus(null);
        
        if (onMemberUpdated && typeof onMemberUpdated === 'function') {
          onMemberUpdated();
        }
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        throw new Error(response?.message || 'Failed to update payment status');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while updating payment status');
      console.error('Error updating payment status:', error);
    } finally {
      setUpdatingPaymentStatus(false);
    }
  }, [currentMember, editingPaymentId, editingPaymentStatus, originalPaymentStatus, updatingPaymentStatus, onMemberUpdated, handleCancelEditPaymentStatus]);

  const getLinkedFirmsNames = useMemo(() => {
    // Use currentMember.member_firms if available (from API), otherwise use linkedFirmIds
    let firmIds = [];
    
    if (currentMember && currentMember.member_firms && Array.isArray(currentMember.member_firms)) {
      firmIds = currentMember.member_firms.map(firm => 
        typeof firm === 'object' ? firm.id : firm
      );
    } else if (linkedFirmIds.size > 0) {
      firmIds = Array.from(linkedFirmIds);
    }
    
    if (firmIds.length === 0) {
      return { text: 'No linked firms...', hasFirms: false };
    }
    
    const linkedFirms = firmIds
      .map(firmId => {
        // First try to get from currentMember.member_firms (has full data)
        if (currentMember && currentMember.member_firms && Array.isArray(currentMember.member_firms)) {
          const firmObj = currentMember.member_firms.find(f => 
            (typeof f === 'object' ? f.id : f) === firmId
          );
          if (firmObj && typeof firmObj === 'object') {
            return firmObj.name;
          }
        }
        // Fallback to firmsData
        const firm = firmsData.find(f => f.id === firmId);
        return firm ? firm.name : null;
      })
      .filter(name => name !== null);
    
    if (linkedFirms.length === 0) {
      return { text: 'No linked firms...', hasFirms: false };
    }
    
    return { text: linkedFirms.join(' - '), hasFirms: true };
  }, [linkedFirmIds, firmsData, currentMember]);

  const handleEditClick = () => {
    setIsEditing(!isEditing);
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleInputChange = (field, value) => {
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleSaveChanges = async () => {
    if (!currentMember || !hasChanges || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const statusValue = editData.status === 'Active' ? 1 : (editData.status === 'Inactive' ? 0 : null);
      
      const updateData = {
        first_name: editData.firstName,
        last_name: editData.lastName,
        email: editData.email,
        phone: editData.phone,
        status: statusValue
      };

      const response = await membersService.updateMember(currentMember.id, updateData);

      if (response && (response.http_status === 200 || !response.http_status)) {
        const updatedMemberResponse = await membersService.getMember(currentMember.id);
        
        if (updatedMemberResponse && updatedMemberResponse.data) {
          setCurrentMember(updatedMemberResponse.data);
        } else if (updatedMemberResponse && !updatedMemberResponse.data && updatedMemberResponse.id) {
          setCurrentMember(updatedMemberResponse);
        }

        setSuccessMessage('Member information updated successfully!');
        setIsEditing(false);
        
        if (onMemberUpdated && typeof onMemberUpdated === 'function') {
          onMemberUpdated();
        }
        
        setTimeout(() => {
          setSuccessMessage('');
        }, 5000);
      } else {
        throw new Error(response?.message || 'Failed to update member');
      }
    } catch (error) {
      setErrorMessage(error.message || 'An error occurred while updating member information');
      console.error('Error updating member:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !currentMember) return null;

  return (
    <div
      className="member-details-modal-overlay"
      onPointerDown={modalBackdropClose.onBackdropPointerDown}
      onPointerUp={modalBackdropClose.onBackdropPointerUp}
      onPointerCancel={modalBackdropClose.onBackdropPointerCancel}
    >
      <ModalLifecycleLock />
      <div
        className="member-details-modal"
        onPointerDown={modalBackdropClose.stopInsidePointer}
        onClick={modalBackdropClose.stopInsidePointer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="member-details-title"
      >
        <button
          className="close-btn"
          onClick={onClose}
          aria-label="Close modal"
        >
          <i className="bi bi-x"></i>
        </button>

        <div className="member-details-modal-header">
          <h2 id="member-details-title">
            Member Information <span className={`member-details-id ${isActive ? 'active' : 'inactive'}`}>ID#{currentMember.id || '—'}</span>
          </h2>
        </div>

        <div className="member-details-modal-content">
          {fetchError && (
            <div className="app-form__error-banner" role="alert" aria-live="assertive" style={{ marginBottom: '16px' }}>
              <strong>Warning:</strong> {fetchError}
            </div>
          )}
          {isLoadingMember && (
            <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <i className="bi bi-arrow-repeat" style={{ animation: 'spin 1s linear infinite' }}></i>
              Loading latest data...
            </div>
          )}
          <div className="member-details-columns">
            <div className="member-details-image-column">
              <div className="member-details-image-wrapper">
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt={fullName}
                    className="member-details-image"
                    onError={() => {
                      setCurrentMember(prev => prev ? {
                        ...prev,
                        original_image: null,
                        profile_picture_url: null,
                        image_url: null,
                        image: null,
                        profile_picture: null
                      } : prev);
                    }}
                  />
                ) : (
                  <div className="member-details-image-placeholder">
                    <i className="bi bi-person-fill"></i>
                  </div>
                )}
              </div>
            </div>

            <div className="member-details-column">
              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-person"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Name:</span>
                  <input
                    type="text"
                    className="member-detail-value"
                    value={isEditing ? `${editData.firstName || ''} ${editData.lastName || ''}` : fullName}
                    readOnly={!isEditing}
                    onChange={(e) => {
                      const fullValue = e.target.value;
                      // Find the first space to split firstName and lastName
                      const firstSpaceIndex = fullValue.indexOf(' ');
                      if (firstSpaceIndex === -1) {
                        // No space found, everything is firstName
                        handleInputChange('firstName', fullValue);
                        handleInputChange('lastName', '');
                      } else {
                        // Split at first space
                        handleInputChange('firstName', fullValue.substring(0, firstSpaceIndex));
                        handleInputChange('lastName', fullValue.substring(firstSpaceIndex + 1));
                      }
                    }}
                  />
                </div>
              </div>

              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-envelope"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Mail:</span>
                  <input
                    type="email"
                    className="member-detail-value"
                    value={isEditing ? editData.email : (currentMember.email || '—')}
                    readOnly={!isEditing}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                  />
                </div>
              </div>

              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-telephone"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Phone Number:</span>
                  <input
                    type="tel"
                    className="member-detail-value"
                    value={isEditing ? editData.phone : (currentMember.phone || '—')}
                    readOnly={!isEditing}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="member-details-column">
              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-person-badge"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Status:</span>
                  {isEditing ? (
                    <div style={{ width: '100%', maxWidth: '200px' }}>
                      <CustomDropdown
                        name="status"
                        value={editData.status}
                        onChange={(e) => handleInputChange('status', e.target.value)}
                        options={[
                          { value: 'Active', label: 'Active' },
                          { value: 'Inactive', label: 'Inactive' }
                        ]}
                        placeholder="Select Status"
                        className="member-detail-status-dropdown"
                      />
                    </div>
                  ) : (
                    <span className={`member-detail-status-badge ${isActive ? 'active' : 'inactive'}`}>
                      {currentMember.status !== undefined && currentMember.status !== null
                        ? (Number(currentMember.status) === 1 ? 'Active' : 'Inactive')
                        : '—'}
                    </span>
                  )}
                </div>
              </div>

              <div className="member-detail-row member-detail-row--dates">
                <div className="member-detail-dates-container">
                  <div className="member-detail-date-item">
                    <div className="member-detail-icon">
                      <i className="bi bi-calendar-event"></i>
                    </div>
                    <div className="member-detail-info">
                      <span className="member-detail-label">Created at:</span>
                      <input
                        type="text"
                        className="member-detail-value"
                        value={formatDate(currentMember.created_at)}
                        title={formatDateTooltip(currentMember.created_at)}
                        readOnly
                      />
                    </div>
                  </div>
                  <div className="member-detail-date-item">
                    <div className="member-detail-icon">
                      <i className="bi bi-calendar-check"></i>
                    </div>
                    <div className="member-detail-info">
                      <span className="member-detail-label">Updated at:</span>
                      <input
                        type="text"
                        className="member-detail-value"
                        value={formatDate(currentMember.updated_at)}
                        title={formatDateTooltip(currentMember.updated_at)}
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="member-detail-row">
                <div className="member-detail-icon">
                  <i className="bi bi-person-check"></i>
                </div>
                <div className="member-detail-info">
                  <span className="member-detail-label">Linked Firms:</span>
                  <span className={`member-detail-value ${getLinkedFirmsNames.hasFirms ? 'member-detail-value--linked-firms' : ''}`}>
                    {getLinkedFirmsNames.text}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="member-payment-history">
            <h3 className="member-payment-history-title">Payment History</h3>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th scope="col">Plan</th>
                    <th scope="col">Duration</th>
                    <th scope="col">Amount</th>
                    <th scope="col">Date</th>
                    <th scope="col">Status</th>
                    <th scope="col" style={{ width: '120px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ textAlign: 'center', padding: '20px' }}>
                        No payments yet
                      </td>
                    </tr>
                  ) : (
                    paymentHistory.map((payment, index) => {
                      const isEditing = editingPaymentId === payment.id;
                      const statusValue = getStatusValue(payment.status);
                      const hasChanges = isEditing && editingPaymentStatus !== originalPaymentStatus;
                      
                      return (
                        <tr key={payment.id || `mock-payment-${index}`}>
                          <td>{payment.plan || '—'}</td>
                          <td>{payment.duration || '—'}</td>
                          <td>{payment.amount || '—'}</td>
                          <td>{payment.date || '—'}</td>
                          <td style={{ verticalAlign: 'middle' }}>
                            {isEditing ? (
                              <CustomDropdown
                                name="payment-status"
                                value={getStatusText(editingPaymentStatus)}
                                onChange={(e) => {
                                  const newValue = getStatusValue(e.target.value);
                                  if (newValue !== null) {
                                    setEditingPaymentStatus(newValue);
                                  }
                                }}
                                options={[
                                  { value: 'Pending', label: 'Pending' },
                                  { value: 'Paid', label: 'Paid' },
                                  { value: 'Failed', label: 'Failed' }
                                ]}
                                placeholder="Select Status"
                                className="payment-status-dropdown"
                              />
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {payment.isPending ? (
                                  <span className="pending-text">{payment.status}</span>
                                ) : (
                                  <span className={(payment.status && (payment.status.toLowerCase() === 'fail' || payment.status.toLowerCase() === 'failed')) ? 'payment-status-fail' : ''}>
                                    {payment.status || '—'}
                                  </span>
                                )}
                                {(payment.status && (payment.status.toLowerCase() === 'fail' || payment.status.toLowerCase() === 'failed')) && (
                                  <i className="bi bi-x-lg payment-status-fail-icon"></i>
                                )}
                              </div>
                            )}
                          </td>
                          <td style={{ verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                            {isEditing ? (
                              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'nowrap' }}>
                                {hasChanges ? (
                                  <button
                                    type="button"
                                    className="payment-status-action-btn payment-status-action-btn--save"
                                    onClick={handleSavePaymentStatus}
                                    disabled={updatingPaymentStatus}
                                  >
                                    <i className="bi bi-floppy"></i>
                                    <span>Save</span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    className="payment-status-action-btn payment-status-action-btn--cancel"
                                    onClick={handleCancelEditPaymentStatus}
                                    disabled={updatingPaymentStatus}
                                  >
                                    <i className="bi bi-x-lg"></i>
                                    <span>Cancel</span>
                                  </button>
                                )}
                              </div>
                            ) : (
                              <button
                                type="button"
                                className="payment-status-edit-btn"
                                onClick={() => handleEditPaymentStatus(payment)}
                              >
                                <i className="bi bi-pencil-square"></i>
                                <span>Edit</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="member-link-firm-section">
            <label className="member-link-firm-label">Link Member With Firm</label>
            
            <div className="member-link-firm-controls">
              <div className="member-link-firm-filter">
                <CustomDropdown
                  id="member-firm-specialisation-filter"
                  name="specialisation"
                  value={selectedSpecialization}
                  onChange={handleSpecializationChange}
                  options={specializationOptions}
                  placeholder="All member firms"
                  disabled={firmsLoading || specializationOptions.length === 0}
                />
              </div>

              <div className="member-link-firm-sort">
                <span className="member-link-firm-sort-label">Sort By:</span>
                <button
                  type="button"
                  className="member-link-firm-sort-btn"
                  onClick={() => setFirmSortOrder(firmSortOrder === 'asc' ? 'desc' : 'asc')}
                  aria-label={firmSortOrder === 'asc' ? 'Sort A to Z' : 'Sort Z to A'}
                >
                  <div className="sort-icon-container">
                    <span className="sort-letter">{firmSortOrder === 'asc' ? 'A' : 'Z'}</span>
                    <i className="bi bi-arrow-down" aria-hidden="true"></i>
                    <span className="sort-letter">{firmSortOrder === 'asc' ? 'Z' : 'A'}</span>
                  </div>
                </button>
              </div>

              <div className="member-link-firm-search">
                <input
                  type="text"
                  className="member-link-firm-search-input"
                  placeholder="Search firms by name..."
                  value={firmSearchTerm}
                  onChange={(e) => setFirmSearchTerm(e.target.value)}
                />
                <button
                  type="button"
                  className="member-link-firm-search-btn"
                  aria-label="Search firms"
                >
                  <i className="bi bi-search" aria-hidden="true"></i>
                </button>
              </div>
            </div>

            <div className={`member-link-firm-list-container ${selectedSpecialization === '' ? 'member-link-firm-list-container--scrollable' : ''}`}>
              {firmsLoading ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  Loading firms...
                </div>
              ) : filteredAndSortedFirms.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  No firms found
                </div>
              ) : (
                filteredAndSortedFirms.map((firm) => {
                  const isLinked = linkedFirmIds.has(firm.id);
                  const imagePath = firm.image ? buildMemberFirmImageUrl(firm.image) : null;
                  
                  return (
                    <FirmCard 
                      key={firm.id}
                      firm={firm}
                      imagePath={imagePath}
                      isLinked={isLinked}
                      onLink={() => handleLinkFirm(firm.id)}
                      onUnlink={() => handleUnlinkFirm(firm.id)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </div>

        <div className="member-details-modal-footer">
          {errorMessage && (
            <div
              className="app-form__error-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <strong>Error:</strong> {errorMessage}
            </div>
          )}
          {successMessage && (
            <div
              className="app-form__success-banner"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
            >
              <strong>Success:</strong> {successMessage}
            </div>
          )}
          
          <button
            className="member-details-btn member-details-btn--delete"
            onClick={() => {
              if (onDeleteMember && currentMember) {
                onDeleteMember(currentMember);
              }
            }}
          >
            <i className="bi bi-exclamation-triangle"></i>
            Delete Member
          </button>
          <button
            className="member-details-btn member-details-btn--renew"
            onClick={() => {
              setIsRenewModalOpen(true);
            }}
          >
            <i className="bi bi-arrow-repeat"></i>
            Renew Membership
          </button>
          <button
            className="member-details-btn member-details-btn--edit"
            onClick={isEditing ? handleSaveChanges : handleEditClick}
            disabled={isEditing && (!hasChanges || isLoading)}
          >
            <i className="bi bi-pencil-square"></i>
            {isLoading ? 'Loading...' : (isEditing ? 'Save Changes' : 'Edit Info')}
          </button>
        </div>
      </div>

      <RenewMembershipModal
        isOpen={isRenewModalOpen}
        onClose={() => setIsRenewModalOpen(false)}
        member={currentMember}
        onRenewed={async () => {
          // Refresh member data after renewal
          if (currentMember && currentMember.id) {
            try {
              const updatedMemberResponse = await membersService.getMember(currentMember.id);
              if (updatedMemberResponse && updatedMemberResponse.data) {
                setCurrentMember(updatedMemberResponse.data);
              } else if (updatedMemberResponse && !updatedMemberResponse.data && updatedMemberResponse.id) {
                setCurrentMember(updatedMemberResponse);
              }
            } catch (fetchError) {
              console.error('Error fetching updated member:', fetchError);
            }
          }
          
          // Refresh members list in parent component if callback provided
          if (onMemberUpdated && typeof onMemberUpdated === 'function') {
            onMemberUpdated();
          }
        }}
      />
    </div>
  );
};
