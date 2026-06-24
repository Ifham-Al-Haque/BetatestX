import { supabase } from '../supabaseClient';
import { hasFeatureAccess } from '../components/RoleBasedRoute';
import { taskApi } from './taskApi';
import { itServicesApi } from './itServicesApi';
import operationService from './operationService';
import notificationService from './notificationService';

const safeCount = async (queryPromise) => {
  try {
    const { count, error } = await queryPromise;
    if (error) return null;
    return count ?? 0;
  } catch {
    return null;
  }
};

export const getHomeStats = async ({ userId, role }) => {
  if (!role) return [];

  const cards = [];
  const tasks = [];

  if (hasFeatureAccess(role, 'my_tasks') || hasFeatureAccess(role, 'task_management')) {
    tasks.push(
      (async () => {
        const stats = await taskApi.getStats(userId);
        if (!stats) return;

        const response = await taskApi.getAll({}, 1, 100);
        const taskList = response?.data || [];
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', userId)
          .maybeSingle();

        const openCount = taskList.filter(
          (t) =>
            t.assigned_to === profile?.id &&
            !['completed', 'cancelled'].includes(t.status)
        ).length;

        const overdue = taskList.filter((t) => {
          if (!t.due_date || ['completed', 'cancelled'].includes(t.status)) return false;
          if (t.assigned_to !== profile?.id) return false;
          return new Date(t.due_date) < new Date();
        }).length;

        cards.push({
          key: 'tasks',
          label: 'Open tasks',
          value: openCount,
          sub: overdue > 0 ? `${overdue} overdue` : openCount > 0 ? 'Needs attention' : 'All caught up',
          subTone: overdue > 0 ? 'warning' : openCount > 0 ? 'info' : 'success',
          path: '/task-management?tab=my-tasks',
          color: 'from-purple-500 to-pink-600'
        });
      })()
    );
  }

  if (hasFeatureAccess(role, 'it_requests') || hasFeatureAccess(role, 'request_inbox')) {
    tasks.push(
      itServicesApi.requests.getStats(userId, role, {
        scope: hasFeatureAccess(role, 'request_inbox') ? 'queue' : 'mine',
      }).then((stats) => {
        if (!stats) return;
        const isQueueView = hasFeatureAccess(role, 'request_inbox');
        const open = isQueueView
          ? (stats.open_requests ?? 0) + (stats.in_progress_requests ?? 0) + (stats.assigned_requests ?? 0)
          : (stats.my_requests ?? stats.open_requests ?? 0);
        const unassigned = isQueueView ? (stats.unassigned_requests ?? 0) : 0;
        cards.push({
          key: 'it',
          label: isQueueView ? 'IT request queue' : 'My IT requests',
          value: open,
          sub: isQueueView
            ? (unassigned > 0 ? `${unassigned} unassigned` : 'Queue clear')
            : 'Your tickets',
          subTone: unassigned > 0 ? 'info' : 'neutral',
          path: isQueueView ? '/request-inbox' : '/it-requests',
          color: 'from-teal-500 to-cyan-600'
        });
      })
    );
  }

  if (hasFeatureAccess(role, 'user_management')) {
    tasks.push(
      safeCount(
        supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'active')
      ).then((count) => {
        if (count === null) return;
        cards.push({
          key: 'users',
          label: 'Active users',
          value: count,
          sub: 'UHub accounts',
          subTone: 'neutral',
          path: '/user-management',
          color: 'from-blue-500 to-indigo-600'
        });
      })
    );
  }

  if (hasFeatureAccess(role, 'employees')) {
    tasks.push(
      safeCount(
        supabase.from('employees').select('id', { count: 'exact', head: true })
      ).then((count) => {
        if (count === null) return;
        cards.push({
          key: 'employees',
          label: 'Employees',
          value: count,
          sub: 'UDrive staff',
          subTone: 'neutral',
          path: '/employees',
          color: 'from-indigo-500 to-purple-600'
        });
      })
    );
  }

  if (
    hasFeatureAccess(role, 'fleet_records') ||
    hasFeatureAccess(role, 'breakdowns') ||
    hasFeatureAccess(role, 'udrive_fleetio')
  ) {
    tasks.push(
      operationService.getOverviewStats().then((stats) => {
        if (!stats) return;
        const breakdowns = stats.activeBreakdowns ?? 0;
        cards.push({
          key: 'fleet',
          label: 'Fleet vehicles',
          value: stats.totalVehicles ?? 0,
          sub: breakdowns > 0 ? `${breakdowns} active breakdowns` : 'All clear',
          subTone: breakdowns > 0 ? 'warning' : 'neutral',
          path: '/operation/fleet-records',
          color: 'from-slate-600 to-blue-600'
        });
      })
    );
  }

  if (hasFeatureAccess(role, 'assets')) {
    tasks.push(
      safeCount(
        supabase.from('assets').select('id', { count: 'exact', head: true })
      ).then((count) => {
        if (count === null) return;
        cards.push({
          key: 'assets',
          label: 'Assets',
          value: count,
          sub: 'Registered items',
          subTone: 'neutral',
          path: '/assets',
          color: 'from-amber-500 to-yellow-600'
        });
      })
    );
  }

  tasks.push(
    notificationService
      .getUnreadCount()
      .then((count) => {
        if (count === null || count === undefined) return;
        cards.push({
          key: 'notifications',
          label: 'Notifications',
          value: count,
          sub: count > 0 ? 'Unread alerts' : 'All caught up',
          subTone: count > 0 ? 'info' : 'success',
          path: '/profile',
          color: 'from-cyan-500 to-blue-600'
        });
      })
      .catch(() => null)
  );

  await Promise.allSettled(tasks);

  const priority = ['tasks', 'it', 'notifications', 'users', 'employees', 'fleet', 'assets'];
  return cards
    .sort((a, b) => priority.indexOf(a.key) - priority.indexOf(b.key))
    .slice(0, 4);
};
