import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export const useExpenseStats = () => {
  return useQuery({
    queryKey: ['expenseStats'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from('expenses')
          .select('id, service_name, amount_aed, date_paid, department, service_status, currency, months, created_at')
          .order('date_paid', { ascending: false });

        if (error) {
          console.error('Error fetching expense stats:', error);
          throw error;
        }

        return data || [];
      } catch (error) {
        console.error('Error in useExpenseStats:', error);
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