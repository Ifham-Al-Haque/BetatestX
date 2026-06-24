import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { hasFeatureAccess } from '../components/RoleBasedRoute';
import { taskApi } from '../services/taskApi';
import { supabase } from '../supabaseClient';

export function useTaskSidebarCounts() {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role || user?.role;
  const hasTodoAccess =
    !!role &&
    (hasFeatureAccess(role, 'my_tasks') || hasFeatureAccess(role, 'task_management'));

  return useQuery({
    queryKey: ['taskSidebarCounts', user?.id],
    queryFn: async () => {
      const {
        data: { user: authUser }
      } = await supabase.auth.getUser();
      if (!authUser) return { myOpen: 0, overdue: 0 };

      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', authUser.id)
        .single();

      const response = await taskApi.getAll({}, 1, 200);
      const tasks = response?.data || [];
      const userId = profile?.id;
      const now = new Date();

      const isOpen = (t) => !['completed', 'cancelled'].includes(t.status);
      const isOverdue = (t) =>
        t.due_date && new Date(t.due_date) < now && isOpen(t);

      const myOpen = tasks.filter((t) => t.assigned_to === userId && isOpen(t)).length;
      const overdue = tasks.filter(
        (t) =>
          (t.assigned_to === userId || t.assigned_by === userId) && isOverdue(t)
      ).length;

      return { myOpen, overdue };
    },
    enabled: !!user?.id && hasTodoAccess,
    staleTime: 60 * 1000,
    refetchInterval: 2 * 60 * 1000,
    refetchOnWindowFocus: true
  });
}
