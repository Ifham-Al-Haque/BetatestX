import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
          designation,
          email,
          phone,
          location,
          hire_date,
          profile_picture,
          photo_url,
          reporting_manager_id,
          reporting_manager:reporting_manager_id (
            id,
            full_name,
            employee_id,
            department,
            position,
            email,
            phone
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

// Update which UDrive employee a given employee reports to (employees.reporting_manager_id).
// Pass managerId = null to make the employee a top-level node (no manager).
// Uses optimistic cache updates so the org chart reflects the change instantly.
export const useUpdateReportingManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ employeeId, managerId }) => {
      const { data, error } = await supabase
        .from('employees')
        .update({ reporting_manager_id: managerId })
        .eq('id', employeeId)
        .select('id, reporting_manager_id')
        .single();

      if (error) throw error;
      return data;
    },
    onMutate: async ({ employeeId, managerId }) => {
      await queryClient.cancelQueries({ queryKey: ['employees'] });
      const previous = queryClient.getQueryData(['employees']);

      queryClient.setQueryData(['employees'], (old) => {
        if (!Array.isArray(old)) return old;
        const manager = managerId ? old.find((e) => String(e.id) === String(managerId)) : null;
        return old.map((emp) =>
          String(emp.id) === String(employeeId)
            ? {
                ...emp,
                reporting_manager_id: managerId,
                reporting_manager: manager
                  ? {
                      id: manager.id,
                      full_name: manager.full_name,
                      employee_id: manager.employee_id,
                      department: manager.department,
                      position: manager.position,
                      email: manager.email,
                      phone: manager.phone,
                    }
                  : null,
              }
            : emp
        );
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['employees'], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
    },
  });
};
