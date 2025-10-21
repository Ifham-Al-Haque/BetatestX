import { useQuery } from '@tanstack/react-query';
import { supabase } from '../supabaseClient';

export const useEmployees = () => {
  return useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select(`
          id,
          full_name,
          employee_id,
          department,
          position,
          profile_picture,
          photo_url,
          reporting_manager_id,
          reporting_manager:reporting_manager_id (
            id,
            full_name,
            employee_id,
            department,
            position
          )
        `)
        .eq('status', 'active')
        .order('full_name');

      if (error) throw error;
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
