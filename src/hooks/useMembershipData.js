import { useState, useEffect, useCallback } from 'react';
import { mockPaymentHistory, mockMemberDetails } from '../helpers/membershipMocks';
import eventsService from '../services/eventsService';
import membersService from '../services/membersService';
import { transformFromBackend } from '../utils/eventTransformers';
import { useAuth } from '../context/useAuth';

export function useMembershipData() {
  const { user } = useAuth() || {};
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [memberDetails, setMemberDetails] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(false);

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
      const date = new Date(dateString);
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
      const date = new Date(dateString);
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
  const loadPaymentHistory = useCallback(async () => {
    setPaymentLoading(true);
    try {
      if (!user?.id) {
        setPaymentHistory([]);
        return;
      }

      // Get member data (same way as MemberDetailsModal does)
      const memberResponse = await membersService.getMember(user.id);
      
      if (!memberResponse || !memberResponse.data) {
        setPaymentHistory([]);
        return;
      }

      const currentMember = memberResponse.data;

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

        return {
          id: payment?.id || `payment-${Math.random()}`,
          dateISO: dateISO,
          amount: amount,
          status: formattedStatus,
          receiptUrl: fullReceiptUrl,
          membership_plan_id: payment?.membership_plan_id || payment?.plan_id || null,
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
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadPaymentHistory(),
        loadMemberDetails(),
        loadUpcomingEvents()
      ]);
    } finally {
      setLoading(false);
    }
  }, [loadPaymentHistory, loadMemberDetails, loadUpcomingEvents]);

  useEffect(() => {
    reload();
  }, [reload]);

  return {
    paymentHistory,
    paymentLoading,
    memberDetails,
    upcomingEvents,
    loading,
    reload
  };
}
