import { useState, useEffect, useCallback } from 'react';
import { mockPaymentHistory, mockMemberDetails } from '../helpers/membershipMocks';
import eventsService from '../services/eventsService';
import membersService from '../services/membersService';
import membershipPlansService from '../services/membershipPlansService';
import { getProfile } from '../services/profileService';
import { transformFromBackend } from '../utils/eventTransformers';
import { useAuth } from '../context/useAuth';
import { isAdmin } from '../auth/acl';

export function useMembershipData() {
  const { user } = useAuth() || {};
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(true); // Start as true to show loading initially
  const [memberDetails, setMemberDetails] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [plansById, setPlansById] = useState({});

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

  // Same formatPaymentDate function as in MemberDetailsModal
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
      return `${year}-${month}-${day}`;
    } catch {
      return '—';
    }
  };

  const formatDateToISO = (dateString) => {
    if (!dateString) return '';
    try {
      // Handle YYYY-MM-DD format by adding time to avoid timezone issues
      let date;
      if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        date = new Date(dateString + 'T12:00:00');
      } else {
        date = new Date(dateString);
      }
      if (isNaN(date.getTime())) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch {
      return '';
    }
  };

  const getReceiptUrl = (payment) => {
    if (payment?.receipt_url) return payment.receipt_url;
    if (payment?.receipt) return payment.receipt;
    if (payment?.proof_of_payment) return payment.proof_of_payment;
    if (payment?.file_url) return payment.file_url;
    return null;
  };

  // Same logic as MemberDetailsModal to get payments from member object
  const loadPaymentHistory = useCallback(async (plansMap = {}) => {
    setPaymentLoading(true);
    try {
      if (!user?.id) {
        setPaymentHistory([]);
        return;
      }

      let currentMember = null;
      
      if (isAdmin(user)) {
        const memberResponse = await membersService.getMember(user.id);
        if (memberResponse && memberResponse.data) {
          currentMember = memberResponse.data;
        }
      } else {
        try {
          const profileResponse = await getProfile();
          if (profileResponse) {
            currentMember = profileResponse;
          }
        } catch (error) {
          console.error('Error loading profile for payment history:', error);
          setPaymentHistory([]);
          return;
        }
      }
      
      if (!currentMember) {
        setPaymentHistory([]);
        return;
      }

      // Extract payments source (same logic as MemberDetailsModal)
      const paymentsSource = (() => {
        if (Array.isArray(currentMember.payments)) return currentMember.payments;
        if (Array.isArray(currentMember.payment_history)) return currentMember.payment_history;
        if (currentMember.payments && Array.isArray(currentMember.payments.data)) {
          return currentMember.payments.data;
        }
        return [];
      })();

      if (paymentsSource.length === 0) {
        setPaymentHistory([]);
        return;
      }

      // Transform payments (same format as MemberDetailsModal but adapted for table)
      const transformedPayments = paymentsSource.map((payment) => {
        const statusValue = payment?.status !== undefined && payment?.status !== null
          ? Number(payment.status) 
          : null;
        const formattedStatus = formatPaymentStatus(payment?.status);
        const dateISO = formatDateToISO(
          payment?.date || payment?.created_at || payment?.payment_date
        );
        const amount = parseFloat(payment?.amount || payment?.total || 0);
        const receiptUrl = getReceiptUrl(payment);
        const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';
        const fullReceiptUrl = receiptUrl 
          ? (receiptUrl.startsWith('http') ? receiptUrl : `${baseURL}/${receiptUrl.replace(/^\//, '')}`)
          : null;

        const planId = payment?.membership_plan_id || payment?.plan_id || null;
        let planName = payment?.plan_name || payment?.plan_title || payment?.membership_plan_name || payment?.membership_plan_title || null;
        
        // If no plan name but we have planId, try to get it from plansMap
        if (!planName && planId && plansMap[planId]) {
          planName = plansMap[planId];
        }

        return {
          id: payment?.id || `payment-${Math.random()}`,
          dateISO: dateISO,
          amount: amount,
          status: formattedStatus,
          receiptUrl: fullReceiptUrl,
          membership_plan_id: planId,
          plan_name: planName || (planId ? `Plan ${planId}` : '—'),
          originalPayment: payment
        };
      });

      // Sort by date (most recent first)
      transformedPayments.sort((a, b) => {
        if (!a.dateISO || !b.dateISO) return 0;
        return new Date(b.dateISO) - new Date(a.dateISO);
      });

      setPaymentHistory(transformedPayments);
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPaymentHistory([]);
    } finally {
      setPaymentLoading(false);
    }
  }, [user]);

  const loadMemberDetails = useCallback(async () => {
    try {
      // TODO BACKEND: replace with real API
      // const res = await fetch('/api/membership/details');
      // const data = await res.json();
      // setMemberDetails(data);
      
      // TEMPORARY: using mock data
      const mockData = mockMemberDetails();
      setMemberDetails(mockData);
    } catch (error) {
      console.error('Error loading member details:', error);
      setMemberDetails([]);
    }
  }, []);

  const loadUpcomingEvents = useCallback(async () => {
    try {
      if (!user) {
        setUpcomingEvents([]);
        return;
      }

      const response = await eventsService.getEvents(10, 1)
      
      if (response.http_status === 200 && response.data) {
        const transformedEvents = response.data.data.map(transformFromBackend)
        
        const now = new Date();
        const futureEvents = transformedEvents.filter(event => {
          const eventDate = new Date(event.date);
          return eventDate > now;
        });
        
        futureEvents.sort((a, b) => {
          const dateA = new Date(a.date);
          const dateB = new Date(b.date);
          return dateA - dateB;
        });
        
        setUpcomingEvents(futureEvents.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading upcoming events:', error);
      setUpcomingEvents([]);
    }
  }, [user]);

  const loadPlans = useCallback(async () => {
    try {
      const response = await membershipPlansService.getMembershipPlans({ pagination: 100, page: 1 });
      const extractPlansArray = (payload) => {
        if (!payload) return [];
        if (Array.isArray(payload)) return payload;
        if (payload.data) return extractPlansArray(payload.data);
        if (payload.items) return extractPlansArray(payload.items);
        return [];
      };
      const plansArray = extractPlansArray(response);
      const plansMap = {};
      plansArray.forEach(plan => {
        if (plan.id !== undefined && plan.id !== null) {
          plansMap[plan.id] = plan.title || plan.name || `Plan ${plan.id}`;
        }
      });
      setPlansById(plansMap);
    } catch (error) {
      console.error('Error loading membership plans:', error);
    }
  }, []);

  // Load data on mount and when user changes
  useEffect(() => {
    if (!user?.id) return;

    let isMounted = true;
    let hasLoaded = false;

    const loadData = async () => {
      if (hasLoaded) return;
      hasLoaded = true;
      
      setLoading(true);
      try {
        // Load plans first and wait for them to be set
        const plansResponse = await membershipPlansService.getMembershipPlans({ pagination: 100, page: 1 });
        const extractPlansArray = (payload) => {
          if (!payload) return [];
          if (Array.isArray(payload)) return payload;
          if (payload.data) return extractPlansArray(payload.data);
          if (payload.items) return extractPlansArray(payload.items);
          return [];
        };
        const plansArray = extractPlansArray(plansResponse);
        const plansMap = {};
        plansArray.forEach(plan => {
          if (plan.id !== undefined && plan.id !== null) {
            plansMap[plan.id] = plan.title || plan.name || `Plan ${plan.id}`;
          }
        });
        
        if (isMounted) {
          setPlansById(plansMap);
        }
        
        // Now load payments with the plans map
        if (isMounted) {
          await Promise.all([
            loadPaymentHistory(plansMap),
            loadMemberDetails(),
            loadUpcomingEvents()
          ]);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only depend on user.id

  // Update plan names in payment history when plansById changes (after initial load)
  useEffect(() => {
    if (Object.keys(plansById).length > 0 && paymentHistory.length > 0) {
      const needsUpdate = paymentHistory.some(payment => 
        !payment.plan_name && payment.membership_plan_id && plansById[payment.membership_plan_id]
      );
      
      if (needsUpdate) {
        setPaymentHistory(prevPayments => 
          prevPayments.map(payment => {
            if (!payment.plan_name && payment.membership_plan_id && plansById[payment.membership_plan_id]) {
              return {
                ...payment,
                plan_name: plansById[payment.membership_plan_id]
              };
            }
            return payment;
          })
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plansById]); // Only update when plansById changes

  const reload = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      // Load plans first
      await loadPlans();
      
      // Load everything in parallel with current plans map
      await Promise.all([
        loadPaymentHistory(plansById),
        loadMemberDetails(),
        loadUpcomingEvents()
      ]);
    } finally {
      setLoading(false);
    }
  }, [user?.id, loadPlans, loadPaymentHistory, loadMemberDetails, loadUpcomingEvents, plansById]);

  return {
    paymentHistory,
    paymentLoading,
    memberDetails,
    upcomingEvents,
    loading,
    reload
  };
}
