import React, { useState, useEffect } from 'react';
import PaymentCalendar from '../components/PaymentCalendar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';


const PaymentCalendarPage = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPaymentEvents();
    
    // Subscribe to real-time changes
    const subscription = supabase
      .channel('payment_events_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'payment_events' },
        (payload) => {
          console.log('Payment event change:', payload);
          // Refresh data when changes occur
          fetchPaymentEvents();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const fetchPaymentEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('payment_events')
        .select('id, user_id, amount, currency, status, description, due_date, created_at, updated_at')
        .order('due_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching payment events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = (date) => {
    console.log('Date clicked:', date);
  };

  const handleEventsUpdate = (updatedEvents) => {
    setEvents(updatedEvents);
    // Update query cache for synchronization with other components
    queryClient.setQueryData(['paymentEvents'], updatedEvents);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment calendar...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Payment Calendar - Financial Section</h1>
              <button
                onClick={fetchPaymentEvents}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {loading ? 'Refreshing...' : 'Refresh Data'}
              </button>
            </div>
            <PaymentCalendar 
              events={events} 
              onDateClick={handleDateClick}
              onEventsUpdate={handleEventsUpdate}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCalendarPage;
