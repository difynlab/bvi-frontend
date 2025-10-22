import { useState, useEffect, useCallback } from 'react';
import { mockPaymentHistory, mockMemberDetails } from '../helpers/membershipMocks';
import eventsService from '../services/eventsService';
import { transformFromBackend } from '../utils/eventTransformers';

export function useMembershipData() {
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [memberDetails, setMemberDetails] = useState([]);
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadPaymentHistory = useCallback(async () => {
    try {
      // TODO BACKEND: replace with real API
      // const res = await fetch('/api/membership/payment-history');
      // const data = await res.json();
      // setPaymentHistory(data);
      
      // TEMPORARY: using mock data
      const mockData = mockPaymentHistory();
      setPaymentHistory(mockData);
    } catch (error) {
      console.error('Error loading payment history:', error);
      setPaymentHistory([]);
    }
  }, []);

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
    memberDetails,
    upcomingEvents,
    loading,
    reload
  };
}
