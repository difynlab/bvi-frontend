import { useState, useEffect, useCallback } from 'react';
import { mockPaymentHistory, mockMemberDetails } from '../helpers/membershipMocks';
import { readEvents } from '../helpers/eventsStorage';

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

  const loadUpcomingEvents = useCallback(() => {
    try {
      // TODO BACKEND: GET /api/events?upcoming=true (or reuse Events list from server)
      const events = readEvents();
      
      // Filter for future events only
      const now = new Date();
      const futureEvents = events.items.filter(event => {
        const eventDate = new Date(event.date || event.dateISO || event.publishedAt);
        return eventDate > now;
      });
      
      // Sort ascending by date
      futureEvents.sort((a, b) => {
        const dateA = new Date(a.date || a.dateISO || a.publishedAt);
        const dateB = new Date(b.date || b.dateISO || b.publishedAt);
        return dateA - dateB;
      });
      
      setUpcomingEvents(futureEvents);
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
