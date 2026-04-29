import React, { useState, useEffect, useMemo } from 'react';
import PaymentCalendar from '../components/PaymentCalendar';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';


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

  const stats = useMemo(() => {
    const total = events.length;
    const pending = events.filter((e) => e.status === 'pending').length;
    const paid = events.filter((e) => e.status === 'paid').length;
    const overdue = events.filter((e) => e.status === 'overdue').length;
    const totalAmount = events.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    return { total, pending, paid, overdue, totalAmount };
  }, [events]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-300">Loading payment calendar...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <div className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
          >
            <div className="flex items-center justify-end gap-4 mb-6">
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.02 }}
                onClick={fetchPaymentEvents}
                disabled={loading}
                className="shrink-0 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                Refresh
              </motion.button>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900/30">
                <div className="text-sm text-blue-700 dark:text-blue-200 font-medium">Total events</div>
                <div className="text-2xl font-bold text-blue-900 dark:text-white">{stats.total}</div>
              </div>
              <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/30">
                <div className="text-sm text-yellow-700 dark:text-yellow-200 font-medium">Pending</div>
                <div className="text-2xl font-bold text-yellow-900 dark:text-white">{stats.pending}</div>
              </div>
              <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-900/30">
                <div className="text-sm text-green-700 dark:text-green-200 font-medium">Paid</div>
                <div className="text-2xl font-bold text-green-900 dark:text-white">{stats.paid}</div>
              </div>
              <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/30">
                <div className="text-sm text-red-700 dark:text-red-200 font-medium">Overdue</div>
                <div className="text-2xl font-bold text-red-900 dark:text-white">{stats.overdue}</div>
              </div>
            </div>

            <PaymentCalendar
              events={events}
              onDateClick={handleDateClick}
              onEventsUpdate={handleEventsUpdate}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCalendarPage;
