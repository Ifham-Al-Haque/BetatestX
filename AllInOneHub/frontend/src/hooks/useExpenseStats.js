import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export const useExpenseStats = () => {
  return useQuery({
    queryKey: ['expenseStats'],
    queryFn: async () => {
      try {
        console.log('📊 Fetching expense stats...');
        
        const { data, error } = await supabase
          .from('expenses')
          .select('id, service_name, amount_aed, date_paid, department, service_status, currency, months, created_at')
          .order('date_paid', { ascending: false })
          .limit(1000); // Add limit to prevent large data loads

        if (error) {
          console.error('❌ Error fetching expense stats:', error);
          throw error;
        }

        console.log(`✅ Loaded ${data?.length || 0} expense records`);
        return data || [];
      } catch (error) {
        console.error('❌ Error in useExpenseStats:', error);
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