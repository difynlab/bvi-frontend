import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Card from '../../components/Card';
import '../../styles/sections/Membership.scss';
import { NavLink } from 'react-router-dom';
import { useCurrentUser } from '../../hooks/useCurrentUser';
import { useAuth } from '../../context/useAuth';
import { isAdmin } from '../../auth/acl';
import { useMembershipData } from '../../hooks/useMembershipData';
import membersService from '../../services/membersService';
import importantInfoService from '../../services/importantInfoService';
import ImportantInfoSkeleton from '../../components/subscription/ImportantInfoSkeleton';

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
import { MemberDetailsModal } from '../../components/modals/MemberDetailsModal';
import { ConfirmDeleteModal } from '../../components/modals/ConfirmDeleteModal';
import { SuccessDeleteModal } from '../../components/modals/SuccessDeleteModal';
import MembersTableSkeleton from '../../components/membership/MembersTableSkeleton';
import SubscriptionInfoModal from '../../components/modals/SubscriptionInfoModal';
import MembershipPlans from '../../sections/subscription/MembershipPlans';

// TODO BACKEND: Replace localStorage/context source with a secure API call:
// fetch('/api/me', { credentials: 'include' }).then(res => res.json())...

const Membership = () => {
  const { name, email } = useCurrentUser();
  const { user } = useAuth() || {};
  const { paymentHistory, memberDetails, upcomingEvents, loading } = useMembershipData();
  const safeName = name && name.trim() ? name : '—';
  const safeEmail = email && email.trim() ? email : '—';
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState('');
  const [adminMembers, setAdminMembers] = useState([]);
  const [pagination, setPagination] = useState({
    current_page: 1,
    last_page: 1,
    per_page: 10,
    total: 0
  });
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSuccessDeleteOpen, setIsSuccessDeleteOpen] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [expandedFilters, setExpandedFilters] = useState({
    status: false,
    role: false
  });
  const [activeFilters, setActiveFilters] = useState({
    status: [], // ['Active', 'Inactive']
    role: [] // ['Member', 'Admin']
  });
  
  // Search state
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  
  // Sorting state
  const [sortBy, setSortBy] = useState('updated'); // 'id' | 'name' | 'email' | 'created' | 'updated' | 'role' | 'status' | 'phone' | null
  const [sortOrder, setSortOrder] = useState('desc'); // 'desc' | 'asc' (desc = más recientes primero para dates)
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Track if page change was manual (to prevent useEffect from overriding)
  const manualPageChangeRef = useRef(false);
  
  // Admin tabs state
  const [adminActiveTab, setAdminActiveTab] = useState('Member List');
  const [openInfo, setOpenInfo] = useState(null); // 'eligibility' | 'benefits' | 'payment' | null
  const [cardDataRefresh, setCardDataRefresh] = useState(0); // Force re-render when data changes
  
  // Admin tabs definition
  const adminTabs = ['Member List', 'Important Info', 'Membership Plans'];

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

  const [importantInfoData, setImportantInfoData] = useState(null);
  const [importantInfoError, setImportantInfoError] = useState('');
  const [importantInfoLoading, setImportantInfoLoading] = useState(false);

  const getCardData = (key) => {
    const defaults = IMPORTANT_INFO_DEFAULTS[key] || {};
    const fromApi = importantInfoData?.[key] || {};

    return {
      title: fromApi.title || defaults.title || '',
      subtitle: fromApi.subtitle || defaults.subtitle || '',
      img: fromApi.img || defaults.img || ''
    };
  };

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
      setImportantInfoError(error.message || 'Failed to load important info data.');
      setImportantInfoData(null);
    } finally {
      setImportantInfoLoading(false);
    }
  }, []);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Close filter dropdown when clicking outside
  const filterRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
        setExpandedFilters({ status: false, role: false });
      }
    };

    if (isFilterOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isFilterOpen]);

  // Search input and dropdown refs
  const searchRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchDropdownOpen(false);
      }
    };

    if (isSearchDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isSearchDropdownOpen]);

  // Handle search input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
  };

  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearchDropdownOpen(false);
  };

  // Admin: fetch members list function - fetch ALL members at once
  const fetchMembers = async (forceRefresh = false) => {
    if (!isAdmin(user)) return;
    setAdminLoading(true);
    setAdminError('');
    try {
      // Fetch all members (use a high pagination limit to get all)
      const res = await membersService.getMembers({ pagination: 1000, page: 1 });
      if (res && res.http_status === 404) {
        setAdminMembers([]);
        setPagination({
          current_page: 1,
          last_page: 1,
          per_page: 10,
          total: 0
        });
        return;
      }
      const payload = res?.data || {};
      const list = Array.isArray(payload.data) ? payload.data : [];
      setAdminMembers(list);
      
      // Reset to first page when fetching all members
      setPagination(prev => ({
        ...prev,
        current_page: 1,
        total: list.length
      }));
    } catch (e) {
      setAdminError(e.message || 'Failed to load members');
      setAdminMembers([]);
      setPagination({
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0
      });
    } finally {
      setAdminLoading(false);
    }
  };

  // Handle page change (client-side pagination only)
  const changePage = (page) => {
    if (page >= 1) {
      manualPageChangeRef.current = true;
      setPagination(prev => ({
        ...prev,
        current_page: page
      }));
      // Reset flag after state update completes
      requestAnimationFrame(() => {
        setTimeout(() => {
          manualPageChangeRef.current = false;
        }, 0);
      });
    }
  };

  // Handle sort by ID
  const handleSortById = () => {
    if (sortBy === 'id') {
      // Toggle order if already sorting by ID
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // Start sorting by ID descending
      setSortBy('id');
      setSortOrder('desc');
    }
  };

  // Handle sort by Name
  const handleSortByName = () => {
    if (sortBy === 'name') {
      // Toggle order if already sorting by Name
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Start sorting by Name ascending (A-Z)
      setSortBy('name');
      setSortOrder('asc');
    }
  };

  // Handle sort by Email
  const handleSortByEmail = () => {
    if (sortBy === 'email') {
      // Toggle order if already sorting by Email
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Start sorting by Email ascending (A-Z)
      setSortBy('email');
      setSortOrder('asc');
    }
  };

  // Handle sort by Created
  const handleSortByCreated = () => {
    if (sortBy === 'created') {
      // Toggle order if already sorting by Created
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // Start sorting by Created descending (más reciente primero)
      setSortBy('created');
      setSortOrder('desc');
    }
  };

  // Handle sort by Updated
  const handleSortByUpdated = () => {
    if (sortBy === 'updated') {
      // Toggle order if already sorting by Updated
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // Start sorting by Updated descending (más reciente primero)
      setSortBy('updated');
      setSortOrder('desc');
    }
  };

  // Handle sort by Role
  const handleSortByRole = () => {
    if (sortBy === 'role') {
      // Toggle order if already sorting by Role
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Start sorting by Role ascending (Admin primero)
      setSortBy('role');
      setSortOrder('asc');
    }
  };

  // Handle sort by Status
  const handleSortByStatus = () => {
    if (sortBy === 'status') {
      // Toggle order if already sorting by Status
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Start sorting by Status ascending (Active primero)
      setSortBy('status');
      setSortOrder('asc');
    }
  };

  // Handle sort by Phone
  const handleSortByPhone = () => {
    if (sortBy === 'phone') {
      // Toggle order if already sorting by Phone
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      // Start sorting by Phone descending (mayor a menor)
      setSortBy('phone');
      setSortOrder('desc');
    }
  };

  // Admin: load members list on mount
  useEffect(() => {
    fetchMembers();
  }, [user]);

  useEffect(() => {
    loadImportantInfo();
  }, [cardDataRefresh, loadImportantInfo]);

  const handleOpenImportantInfo = (key) => {
    if (importantInfoLoading || !importantInfoData) return;
    setOpenInfo(key);
  };

  // Filter and search members
  const filteredMembers = useMemo(() => {
    if (!adminMembers.length) return [];
    
    let members = adminMembers;
    
    // Apply filters first
    if (activeFilters.status.length > 0 || activeFilters.role.length > 0) {
      members = members.filter((member) => {
        // Filter by status
        if (activeFilters.status.length > 0) {
          const memberStatus = member.status !== undefined && member.status !== null 
            ? (Number(member.status) === 1 ? 'Active' : 'Inactive')
            : null;
          
          if (memberStatus === null || !activeFilters.status.includes(memberStatus)) {
            return false;
          }
        }
        
        // Filter by role
        if (activeFilters.role.length > 0) {
          const memberRole = member.role || '';
          const normalizedRole = memberRole.toString().toLowerCase();
          const normalizedFilters = activeFilters.role.map(r => r.toLowerCase());
          
          if (!normalizedFilters.includes(normalizedRole)) {
            return false;
          }
        }
        
        return true;
      });
    }
    
    // Apply search
    if (searchTerm.trim()) {
      const trimmedSearch = searchTerm.trim().toLowerCase();
      const isNumeric = /^\d+$/.test(trimmedSearch);
      
      members = members.filter((member) => {
        if (isNumeric) {
          // Search by ID
          const memberId = member.id ? member.id.toString().toLowerCase() : '';
          return memberId.includes(trimmedSearch);
        } else {
          // Search by name or email
          const fullName = `${member.first_name || ''} ${member.last_name || ''}`.trim().toLowerCase();
          const email = (member.email || '').trim().toLowerCase();
          return fullName.includes(trimmedSearch) || email.includes(trimmedSearch);
        }
      });
    }
    
    // Apply sorting
    if (sortBy === 'id') {
      members = [...members].sort((a, b) => {
        const idA = a.id || 0;
        const idB = b.id || 0;
        return sortOrder === 'desc' ? idB - idA : idA - idB;
      });
    } else if (sortBy === 'name') {
      members = [...members].sort((a, b) => {
        const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim().toLowerCase();
        const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim().toLowerCase();
        
        if (nameA < nameB) {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (nameA > nameB) {
          return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else if (sortBy === 'email') {
      members = [...members].sort((a, b) => {
        const emailA = (a.email || '').trim().toLowerCase();
        const emailB = (b.email || '').trim().toLowerCase();
        
        if (emailA < emailB) {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (emailA > emailB) {
          return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else if (sortBy === 'created') {
      members = [...members].sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        
        // 'desc' = más reciente primero (mayor fecha), 'asc' = más lejana primero (menor fecha)
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === 'updated') {
      members = [...members].sort((a, b) => {
        const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
        const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
        
        // 'desc' = más reciente primero (mayor fecha), 'asc' = más lejana primero (menor fecha)
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === 'role') {
      members = [...members].sort((a, b) => {
        const roleA = (a.role || '').toString().toLowerCase();
        const roleB = (b.role || '').toString().toLowerCase();
        
        // 'asc' = Admin primero, 'desc' = Member primero
        // Admin < Member alfabéticamente, pero queremos Admin primero
        if (roleA === 'admin' && roleB === 'member') {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (roleA === 'member' && roleB === 'admin') {
          return sortOrder === 'asc' ? 1 : -1;
        }
        // Si son iguales, comparar alfabéticamente
        if (roleA < roleB) {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (roleA > roleB) {
          return sortOrder === 'asc' ? 1 : -1;
        }
        return 0;
      });
    } else if (sortBy === 'status') {
      members = [...members].sort((a, b) => {
        const statusA = a.status !== undefined && a.status !== null 
          ? (Number(a.status) === 1 ? 'active' : 'inactive')
          : '';
        const statusB = b.status !== undefined && b.status !== null 
          ? (Number(b.status) === 1 ? 'active' : 'inactive')
          : '';
        
        // 'asc' = Active primero, 'desc' = Inactive primero
        if (statusA === 'active' && statusB === 'inactive') {
          return sortOrder === 'asc' ? -1 : 1;
        }
        if (statusA === 'inactive' && statusB === 'active') {
          return sortOrder === 'asc' ? 1 : -1;
        }
        // Si son iguales, mantener orden
        return 0;
      });
    } else if (sortBy === 'phone') {
      members = [...members].sort((a, b) => {
        // Extraer números del teléfono (remover caracteres no numéricos)
        const phoneA = (a.phone || '').replace(/\D/g, '');
        const phoneB = (b.phone || '').replace(/\D/g, '');
        
        const numA = phoneA ? parseInt(phoneA, 10) : 0;
        const numB = phoneB ? parseInt(phoneB, 10) : 0;
        
        // 'desc' = mayor a menor, 'asc' = menor a mayor
        return sortOrder === 'desc' ? numB - numA : numA - numB;
      });
    }
    
    return members;
  }, [adminMembers, activeFilters, searchTerm, sortBy, sortOrder]);
  
  // Client-side pagination: paginate filtered members
  const paginatedMembers = useMemo(() => {
    const perPage = 10;
    const startIndex = (pagination.current_page - 1) * perPage;
    const endIndex = startIndex + perPage;
    return filteredMembers.slice(startIndex, endIndex);
  }, [filteredMembers, pagination.current_page]);
  
  // Update pagination state based on filtered members
  useEffect(() => {
    // Don't update if user just manually changed the page
    if (manualPageChangeRef.current) {
      return;
    }
    
    const perPage = 10;
    const totalFiltered = filteredMembers.length;
    const lastPage = Math.max(1, Math.ceil(totalFiltered / perPage));
    
    setPagination(prev => {
      // Only update if last_page or total changed, or if current page is beyond last page
      if (prev.last_page === lastPage && prev.total === totalFiltered && prev.current_page <= lastPage) {
        return prev; // No change needed
      }
      
      // Reset to page 1 if current page is beyond last page
      const currentPage = prev.current_page > lastPage ? 1 : prev.current_page;
      
      return {
        ...prev,
        current_page: currentPage,
        last_page: lastPage,
        per_page: perPage,
        total: totalFiltered
      };
    });
  }, [filteredMembers.length]);
  
  // Check if search has no results
  const hasSearchNoResults = searchTerm.trim() && filteredMembers.length === 0;

  // Handle search button click
  const handleSearchClick = () => {
    // Toggle dropdown if there are no results
    if (searchTerm.trim() && hasSearchNoResults) {
      setIsSearchDropdownOpen(!isSearchDropdownOpen);
    } else {
      setIsSearchDropdownOpen(false);
    }
  };

  // Update search dropdown visibility when filteredMembers changes
  useEffect(() => {
    if (searchTerm.trim()) {
      if (hasSearchNoResults) {
        setIsSearchDropdownOpen(true);
      } else {
        setIsSearchDropdownOpen(false);
      }
    } else {
      setIsSearchDropdownOpen(false);
    }
  }, [searchTerm, hasSearchNoResults, filteredMembers.length]);

  // Toggle filter dropdown
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
    if (!isFilterOpen) {
      setExpandedFilters({ status: false, role: false });
    }
  };

  // Toggle submenu expansion
  const toggleSubmenu = (filterType) => {
    setExpandedFilters(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  // Handle checkbox change (single selection per filter type)
  const handleFilterChange = (filterType, value) => {
    setActiveFilters(prev => {
      const currentValues = prev[filterType] || [];
      
      // If clicking the same value, deselect it
      if (currentValues.includes(value)) {
        return {
          ...prev,
          [filterType]: []
        };
      } else {
        // Otherwise, select only this value (replace any previous selection)
        return {
          ...prev,
          [filterType]: [value]
        };
      }
    });
  };

  // Remove individual filter tag
  const removeFilter = (filterType, value) => {
    setActiveFilters(prev => ({
      ...prev,
      [filterType]: prev[filterType].filter(v => v !== value)
    }));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters({
      status: [],
      role: []
    });
  };

  // Get active filter count
  const activeFilterCount = activeFilters.status.length + activeFilters.role.length;

  // Handle open delete confirmation from table or modal
  const handleOpenDeleteConfirm = (member) => {
    setMemberToDelete(member);
    setIsDeleteConfirmOpen(true);
    setDeleteError('');
    // Close details modal if open
    if (isDetailsModalOpen) {
      setIsDetailsModalOpen(false);
      setSelectedMember(null);
    }
  };

  // Handle delete member
  const handleDeleteMember = async () => {
    if (!memberToDelete || !memberToDelete.id || isDeleting) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      await membersService.deleteMember(memberToDelete.id);
      
      // Success - close confirmation modal and show success modal
      setIsDeleteConfirmOpen(false);
      setIsSuccessDeleteOpen(true);
      
      // Refresh members list after showing success
      await fetchMembers(true);
      
      // Clear member to delete after a delay
      setTimeout(() => {
        setMemberToDelete(null);
        setIsDeleting(false);
      }, 100);
    } catch (error) {
      console.error('Error deleting member:', error);
      setDeleteError(error.message || 'Failed to delete member. Please try again.');
      setIsDeleting(false);
    }
  };
  return (
    <div className={`membership-page ${isAdmin(user) ? 'admin-view-page' : ''}`}>
      <div className="membership-container">
        <div className="membership-header">
          <div className="membership-header-title">
            <h1>Membership</h1>
            <p>Manage membership details</p>
          </div>
        </div>

        {isAdmin(user) ? (
          <div className="membership admin-view">
            {/* Tabs Strip */}
            <div className="membership-admin-tabs" role="tablist">
              <button 
                className={`membership-admin-tab ${adminActiveTab === 'Member List' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('Member List')}
                role="tab"
                aria-selected={adminActiveTab === 'Member List'}
              >
                Member List
              </button>
              <button 
                className={`membership-admin-tab ${adminActiveTab === 'Important Info' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('Important Info')}
                role="tab"
                aria-selected={adminActiveTab === 'Important Info'}
              >
                Important Info
              </button>
              <button 
                className={`membership-admin-tab ${adminActiveTab === 'Membership Plans' ? 'active' : ''}`}
                onClick={() => setAdminActiveTab('Membership Plans')}
                role="tab"
                aria-selected={adminActiveTab === 'Membership Plans'}
              >
                Membership Plans
              </button>
            </div>

            {/* Dynamic Panel */}
            <div className="membership-admin-tab-container">
              {adminActiveTab === 'Member List' && (
                <section key="member-list" className="membership-admin-panel membership-admin-panel--member-list">
                  <Card 
                title="List of all members" 
                className="member-details-section"
                headerActions={
                  <div className="members-table-filters" ref={filterRef}>
                    <div className="filter-controls">
                    <div className="filter-btn-wrapper">
                      <button
                        className="filter-btn"
                        onClick={toggleFilter}
                        aria-expanded={isFilterOpen}
                        aria-haspopup="true"
                      >
                        <i className="bi bi-filter"></i>
                        Filter
                      </button>
                      
                      {/* Filter Dropdown */}
                      {isFilterOpen && (
                        <div className="filter-dropdown">
                        {/* Status Filter */}
                        <div className="filter-submenu">
                          <button
                            type="button"
                            className="filter-submenu-header"
                            onClick={() => toggleSubmenu('status')}
                          >
                            <span>STATUS</span>
                            <i className={`bi bi-chevron-${expandedFilters.status ? 'up' : 'down'}`}></i>
                          </button>
                          {expandedFilters.status && (
                            <div className="filter-submenu-content">
                              <label className="filter-checkbox">
                                <input
                                  type="checkbox"
                                  checked={activeFilters.status.includes('Active')}
                                  onChange={() => handleFilterChange('status', 'Active')}
                                />
                                <span>Active</span>
                              </label>
                              <label className="filter-checkbox">
                                <input
                                  type="checkbox"
                                  checked={activeFilters.status.includes('Inactive')}
                                  onChange={() => handleFilterChange('status', 'Inactive')}
                                />
                                <span>Inactive</span>
                              </label>
                            </div>
                          )}
                        </div>
                        
                        {/* Role Filter */}
                        <div className="filter-submenu">
                          <button
                            type="button"
                            className="filter-submenu-header"
                            onClick={() => toggleSubmenu('role')}
                          >
                            <span>ROLE</span>
                            <i className={`bi bi-chevron-${expandedFilters.role ? 'up' : 'down'}`}></i>
                          </button>
                          {expandedFilters.role && (
                            <div className="filter-submenu-content">
                              <label className="filter-checkbox">
                                <input
                                  type="checkbox"
                                  checked={activeFilters.role.includes('Member')}
                                  onChange={() => handleFilterChange('role', 'Member')}
                                />
                                <span>Member</span>
                              </label>
                              <label className="filter-checkbox">
                                <input
                                  type="checkbox"
                                  checked={activeFilters.role.includes('Admin')}
                                  onChange={() => handleFilterChange('role', 'Admin')}
                                />
                                <span>Admin</span>
                              </label>
                            </div>
                          )}
                        </div>
                      </div>
                      )}
                    </div>
                    
                    {/* Filter Tags */}
                    {activeFilterCount > 0 && (
                      <div className="filter-tags">
                        {activeFilters.status.length > 0 && (
                          <span className="filter-tag">
                            Status: {activeFilters.status.join(', ')}
                            <button
                              type="button"
                              className="filter-tag-remove"
                              onClick={() => {
                                // Remove all status filters
                                setActiveFilters(prev => ({
                                  ...prev,
                                  status: []
                                }));
                              }}
                              aria-label="Remove status filters"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </span>
                        )}
                        {activeFilters.role.length > 0 && (
                          <span className="filter-tag">
                            Role: {activeFilters.role.join(', ')}
                            <button
                              type="button"
                              className="filter-tag-remove"
                              onClick={() => {
                                // Remove all role filters
                                setActiveFilters(prev => ({
                                  ...prev,
                                  role: []
                                }));
                              }}
                              aria-label="Remove role filters"
                            >
                              <i className="bi bi-x"></i>
                            </button>
                          </span>
                        )}
                        {activeFilterCount > 0 && (
                          <button
                            type="button"
                            className="filter-clear-all"
                            onClick={clearAllFilters}
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    )}
                    
                    {/* Search Input */}
                    <div className="search-input-wrapper" ref={searchRef}>
                      <input
                        type="text"
                        className="search-input"
                        placeholder="Search by ID, name, or email..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        onFocus={() => {
                          if (searchTerm.trim() && hasSearchNoResults) {
                            setIsSearchDropdownOpen(true);
                          }
                        }}
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          className="search-clear-btn"
                          onClick={clearSearch}
                          aria-label="Clear search"
                        >
                          <i className="bi bi-x-lg"></i>
                        </button>
                      )}
                      <button
                        type="button"
                        className="search-btn"
                        onClick={handleSearchClick}
                        aria-label="Search"
                      >
                        <i className="bi bi-search"></i>
                      </button>
                      {hasSearchNoResults && (
                        <div className="search-dropdown">
                          <div className="search-no-results">No members found</div>
                        </div>
                      )}
                    </div>
                    </div>
                  </div>
                }
              >
                {adminError && (
                  <div className="app-form__error-banner" role="alert" aria-live="assertive">
                    <strong>Error:</strong> {adminError}
                  </div>
                )}
                
                <div className="table-container">
                  <table className="data-table admin-table">
                    <thead>
                      <tr>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortById}
                          style={{ cursor: 'pointer' }}
                        >
                          ID
                          <i 
                            className={`bi bi-chevron-${sortBy === 'id' ? (sortOrder === 'desc' ? 'down' : 'up') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'id' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortByName}
                          style={{ cursor: 'pointer' }}
                        >
                          Name
                          <i 
                            className={`bi bi-chevron-${sortBy === 'name' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'name' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortByEmail}
                          style={{ cursor: 'pointer' }}
                        >
                          Email
                          <i 
                            className={`bi bi-chevron-${sortBy === 'email' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'email' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortByPhone}
                          style={{ cursor: 'pointer' }}
                        >
                          Phone
                          <i 
                            className={`bi bi-chevron-${sortBy === 'phone' ? (sortOrder === 'desc' ? 'down' : 'up') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'phone' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortByRole}
                          style={{ cursor: 'pointer' }}
                        >
                          Role
                          <i 
                            className={`bi bi-chevron-${sortBy === 'role' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'role' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortByStatus}
                          style={{ cursor: 'pointer' }}
                        >
                          Status
                          <i 
                            className={`bi bi-chevron-${sortBy === 'status' ? (sortOrder === 'asc' ? 'up' : 'down') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'status' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortByCreated}
                          style={{ cursor: 'pointer' }}
                        >
                          Created
                          <i 
                            className={`bi bi-chevron-${sortBy === 'created' ? (sortOrder === 'desc' ? 'down' : 'up') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'created' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th 
                          scope="col"
                          className="sortable"
                          onClick={handleSortByUpdated}
                          style={{ cursor: 'pointer' }}
                        >
                          Updated
                          <i 
                            className={`bi bi-chevron-${sortBy === 'updated' ? (sortOrder === 'desc' ? 'down' : 'up') : 'down'}`} 
                            style={{ marginLeft: '4px', opacity: sortBy === 'updated' ? 1 : 0 }}
                          ></i>
                        </th>
                        <th scope="col"></th>
                      </tr>
                    </thead>
                    {adminLoading && adminMembers.length === 0 ? (
                      <MembersTableSkeleton rows={10} />
                    ) : filteredMembers.length === 0 ? (
                      <tbody>
                        <tr>
                          <td colSpan="9">No users found</td>
                        </tr>
                      </tbody>
                    ) : (
                      <tbody>
                        {paginatedMembers.map((m) => {
                          const fullName = `${m.first_name || ''} ${m.last_name || ''}`.trim() || '—';
                          const email = m.email || '—';
                          const phone = m.phone || '—';
                          return (
                            <tr key={m.id}>
                              <td>{m.id || '—'}</td>
                              <td title={fullName}>{fullName}</td>
                              <td title={email}>{email}</td>
                              <td title={phone}>{phone}</td>
                              <td>{m.role || '—'}</td>
                              <td>{m.status !== undefined && m.status !== null ? (Number(m.status) === 1 ? 'Active' : 'Inactive') : '—'}</td>
                              <td>{m.created_at ? new Date(m.created_at).toLocaleDateString('en-US') : '—'}</td>
                              <td>{m.updated_at ? new Date(m.updated_at).toLocaleDateString('en-US') : '—'}</td>
                              <td>
                              <div className="table-actions">
                                <button
                                  className="action-btn action-btn--edit"
                                  onClick={() => {
                                    setSelectedMember(m);
                                    setIsDetailsModalOpen(true);
                                  }}
                                  aria-label="Edit user"
                                >
                                  <i className="bi bi-pencil-square"></i>
                                </button>
                                <button
                                  className="action-btn action-btn--delete"
                                  onClick={() => handleOpenDeleteConfirm(m)}
                                  aria-label="Delete user"
                                >
                                  <i className="bi bi-trash"></i>
                                </button>
                                <button
                                  className="action-btn action-btn--details"
                                  onClick={() => {
                                    setSelectedMember(m);
                                    setIsDetailsModalOpen(true);
                                  }}
                                >
                                  Details
                                </button>
                              </div>
                            </td>
                          </tr>
                          );
                        })}
                      </tbody>
                    )}
                  </table>
                </div>
                
                {/* Pagination - identical to Events, positioned bottom right */}
                {!adminLoading && filteredMembers.length > 0 && pagination.last_page > 1 && (
                  <div className="events-pagination">
                    <button 
                      className="prev-btn"
                      onClick={() => changePage(pagination.current_page - 1)}
                      disabled={pagination.current_page <= 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                    <div className="page-counter">
                      <span>{pagination.current_page} / {pagination.last_page}</span>
                    </div>
                    <button 
                      className="next-btn"
                      onClick={() => changePage(pagination.current_page + 1)}
                      disabled={pagination.current_page >= pagination.last_page}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </div>
                )}
                  </Card>
                </section>
              )}

              {adminActiveTab === 'Important Info' && (
                <section key={`important-info-${cardDataRefresh}`} className="membership-admin-panel membership-admin-panel--important">
                  {importantInfoError && (
                    <div className="app-form__error-banner" role="alert" aria-live="assertive">
                      <strong>Error:</strong> {importantInfoError}
                    </div>
                  )}
                  {importantInfoLoading && !importantInfoError ? (
                    <ImportantInfoSkeleton className="membership-admin-cards" />
                  ) : (
                  <div className="membership-admin-cards">
                    {/* Membership Eligibility Card */}
                    <div className="membership-admin-card" onClick={() => handleOpenImportantInfo('eligibility')}>
                      <div className="membership-admin-card__icon" aria-hidden="true"><i className="bi bi-people"></i></div>
                      <h3 className="membership-admin-card__title">{getCardData('eligibility').title}</h3>
                      <p className="membership-admin-card__text">
                        {getCardData('eligibility').subtitle}
                      </p>
                      <a href="#" className="membership-admin-card__link">Edit Details</a>
                    </div>

                    {/* Membership Benefits Card */}
                    <div className="membership-admin-card" onClick={() => handleOpenImportantInfo('benefits')}>
                      <div className="membership-admin-card__icon" aria-hidden="true"><i className="bi bi-patch-check"></i></div>
                      <h3 className="membership-admin-card__title">{getCardData('benefits').title}</h3>
                      <p className="membership-admin-card__text">
                        {getCardData('benefits').subtitle}
                      </p>
                      <a href="#" className="membership-admin-card__link">Edit Details</a>
                    </div>

                    {/* Payment Details Card */}
                    <div className="membership-admin-card" onClick={() => handleOpenImportantInfo('payment')}>
                      <div className="membership-admin-card__icon" aria-hidden="true"><i className="bi bi-credit-card"></i></div>
                      <h3 className="membership-admin-card__title">{getCardData('payment').title}</h3>
                      <p className="membership-admin-card__text">
                        {getCardData('payment').subtitle}
                      </p>
                      <a href="#" className="membership-admin-card__link">Edit Details</a>
                    </div>
                  </div>
                  )}
                </section>
              )}

              {adminActiveTab === 'Membership Plans' && (
                <section key="membership-plans" className="membership-admin-panel membership-admin-panel--plans">
                  <MembershipPlans key="plans-component" isAdmin={true} />
                </section>
              )}
            </div>
          </div>
        ) : (
        <div className="membership">
          <div className="membership-left">
            <Card title="My Profile" className="profile-section">
              <div className="profile-info">
                <div className="profile-field">
                  <label>Name:</label>
                  <span>{safeName}</span>
                </div>
                <div className="profile-field">
                  <label>Email:</label>
                  <span>{safeEmail}</span>
                </div>
                <div className="profile-field">
                  <label>Lorem:</label>
                  <span>Lorem ipsum dolor sit amet</span>
                </div>
              </div>
              <div className="profile-actions">
                <NavLink to="/profile" className="edit-link">Edit Profile</NavLink>
              </div>
            </Card>

            <Card title="Payment History" className="payment-section">
              <div className="table-container">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th scope="col">Date</th>
                      <th scope="col">Amount</th>
                      <th scope="col">Status</th>
                      <th scope="col">Receipt</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((payment) => (
                      <tr key={payment.id}>
                        <td>{payment.dateISO}</td>
                        <td>${payment.amount.toFixed(2)}</td>
                        <td className={payment.status === 'Pending' ? 'status-pending' : ''}>
                          {payment.status === 'Pending' ? (
                            <span className="pending-text">Pending</span>
                          ) : (
                            payment.status
                          )}
                        </td>
                        <td>
                          {payment.status === 'Pending' ? (
                            <span className="processing-status">
                              {isMobile ? (
                                <i className="bi bi-hourglass-split"></i>
                              ) : (
                                <span>Processing</span>
                              )}
                              <i className="bi bi-arrow-repeat"></i>
                            </span>
                          ) : (
                            <a href={payment.receiptUrl} className="receipt-link">
                              {isMobile ? (
                                <i className="bi bi-download"></i>
                              ) : (
                                'Download'
                              )}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>


          </div>

          <div className="membership-right">
            <Card className="status-section">
              <div className="status-banner">
                <div className="status-header">
                  <div className="plan-image">
                    <img src='gold-plan.png' alt="logo" />
                  </div>
                  <div className="status-header-info">
                    <div className="status-title-row">
                      <h2 className="card-title">Membership Status</h2>
                      <div className="status-badge active">ACTIVE</div>
                    </div>
                    <p className="valid-until">Valid until: August 15, 2025</p>
                  </div>
                </div>
                <div className="status-actions">
                  <NavLink to="/subscription" className="btn btn-renew">Renew Membership</NavLink>
                  <NavLink to="/subscription" className="btn btn-upgrade">Upgrade</NavLink>
                </div>
                <div className="status-links">
                  <NavLink to="/subscription" className="subscription-link">Edit Membership Subscription</NavLink>
                </div>
              </div>
            </Card>

            <Card title="Membership Details" className="details-section">
              <ul className="benefits-list">
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Access to premium content and resources</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Priority customer support</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Exclusive member events and webinars</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Advanced analytics and reporting tools</span>
                </li>
                <li className="benefit-item">
                  <i className="bi bi-check-lg check-icon"></i>
                  <span className="benefit-text">Unlimited downloads and exports</span>
                </li>
              </ul>
              <NavLink to="/subscription?tab=Membership Plans" className="membership-plans-link">
                View all membership plans
              </NavLink>
            </Card>

            <Card title="Upcoming Events" className="membership-events-section">
              <ul className="membership-events-list">
                {upcomingEvents.length > 0 ? (
                  upcomingEvents.map((event) => (
                    <li key={event.id} className="membership-event-item">
                      <span className="membership-event-dot blue"></span>
                      <div className="membership-event-content">
                        <div className="membership-event-title">{event.title}</div>
                        <div className="membership-event-datetime">
                          {new Date(event.date || event.dateISO || event.publishedAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            timeZoneName: 'short'
                          })}
                        </div>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="membership-event-item">
                    <div className="membership-event-content">
                      <div className="membership-event-title">No upcoming events</div>
                    </div>
                  </li>
                )}
              </ul>
            </Card>
          </div>
        </div>
        )}
      </div>

      {isAdmin(user) && (
        <>
          <MemberDetailsModal
            isOpen={isDetailsModalOpen}
            onClose={() => {
              setIsDetailsModalOpen(false);
              setSelectedMember(null);
            }}
            member={selectedMember}
            onMemberUpdated={fetchMembers}
            onDeleteMember={handleOpenDeleteConfirm}
          />
          <ConfirmDeleteModal
            isOpen={isDeleteConfirmOpen}
            onClose={() => {
              if (!isDeleting) {
                setIsDeleteConfirmOpen(false);
                setMemberToDelete(null);
                setDeleteError('');
              }
            }}
            onConfirm={handleDeleteMember}
            message={memberToDelete ? `Are you sure you want to delete member #${memberToDelete.id} - Email: ${memberToDelete.email || 'N/A'}?` : 'Are you sure you want to delete this member?'}
            isDeleting={isDeleting}
            errorMessage={deleteError}
          />
          <SuccessDeleteModal
            isOpen={isSuccessDeleteOpen}
            onClose={() => {
              setIsSuccessDeleteOpen(false);
            }}
          />
          <SubscriptionInfoModal
            isOpen={!!openInfo}
            onClose={() => {
              setOpenInfo(null);
              setCardDataRefresh(prev => prev + 1); // Refresh card data
            }}
            infoKey={openInfo}
            data={importantInfoData}
            onUpdated={(data) => {
              setImportantInfoData(data);
              setImportantInfoError('');
            }}
          />
        </>
      )}
    </div>
  );
};

export default Membership;
