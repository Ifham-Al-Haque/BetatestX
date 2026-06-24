import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export const usePaymentEvents = () => {
  return useQuery({
    queryKey: ['paymentEvents'],
    queryFn: async () => {
      try {
        console.log('📅 Fetching payment events...');
        
        const { data, error } = await supabase
          .from('payment_events')
          .select('id, user_id, amount, currency, status, description, due_date, is_recurring, recurrence_frequency, recurrence_end_date, reminder_days_before, created_at, updated_at')
          .order('due_date', { ascending: true })
          .limit(500); // Add limit to prevent large data loads

        if (error) {
          console.error('❌ Error fetching payment events:', error);
          throw error;
        }

        console.log(`✅ Loaded ${data?.length || 0} payment events`);
        return data || [];
      } catch (error) {
        console.error('❌ Error in usePaymentEvents:', error);
        // Return empty array instead of throwing to prevent loading states
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error) => {
      if (error?.status >= 400 && error?.status < 500) {
        return false; // Don't retry on client errors
      }
      return failureCount < 2;
    },
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });
}; 