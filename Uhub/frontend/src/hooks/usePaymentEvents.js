import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export const usePaymentEvents = () => {
  return useQuery({
    queryKey: ['paymentEvents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('payment_events')
          .select('id, user_id, amount, currency, status, description, due_date, created_at, updated_at')
          .order('due_date', { ascending: true });

        if (error) {
          console.error('Error fetching payment events:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in usePaymentEvents:', error);
        throw error;
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
  });
}; 