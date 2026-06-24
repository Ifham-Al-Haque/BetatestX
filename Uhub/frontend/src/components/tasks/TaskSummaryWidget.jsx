import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  ClipboardList,
  AlertTriangle,
  ArrowRight,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { hasFeatureAccess } from '../RoleBasedRoute';
import { taskApi } from '../../services/taskApi';
import { supabase } from '../../supabaseClient';

const PRIORITY_ORDER = { urgent: 0, high: 1, medium: 2, low: 3 };

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  review: 'Review',
  completed: 'Done'
};

const PRIORITY_STYLES = {
  urgent: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
  high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300',
  low: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
};

async function fetchOpenTasks(userId) {
  const {
    data: { user: authUser }
  } = await supabase.auth.getUser();
  if (!authUser) return { openTasks: [], openCount: 0, overdue: 0 };

  const { data: profile } = await supabase
    .from('users')
    .select('id')
    .eq('auth_user_id', authUser.id)
    .single();

  const response = await taskApi.getAll({}, 1, 100);
  const tasks = response?.data || [];
  const profileId = profile?.id;
  const now = new Date();

  const myOpen = tasks.filter(
    (t) =>
      t.assigned_to === profileId &&
      !['completed', 'cancelled'].includes(t.status)
  );

  const sorted = [...myOpen].sort((a, b) => {
    const aOverdue = a.due_date && new Date(a.due_date) < now;
    const bOverdue = b.due_date && new Date(b.due_date) < now;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    const pA = PRIORITY_ORDER[a.priority] ?? 2;
    const pB = PRIORITY_ORDER[b.priority] ?? 2;
    if (pA !== pB) return pA - pB;
    if (a.due_date && b.due_date) return new Date(a.due_date) - new Date(b.due_date);
    return 0;
  });

  return {
    openTasks: sorted.slice(0, 5),
    openCount: myOpen.length,
    overdue: myOpen.filter((t) => t.due_date && new Date(t.due_date) < now).length
  };
}

/**
 * Compact open-task summary for home and user dashboard.
 * @param {'dark' | 'light'} variant
 */
const TaskSummaryWidget = ({ variant = 'dark', className = '' }) => {
  const { user, userProfile } = useAuth();
  const role = userProfile?.role || user?.role;
  const enabled =
    !!role &&
    (hasFeatureAccess(role, 'my_tasks') || hasFeatureAccess(role, 'task_management'));

  const { data, isLoading } = useQuery({
    queryKey: ['taskSummaryWidget', user?.id],
    queryFn: () => fetchOpenTasks(user?.id),
    enabled: !!user?.id && enabled,
    staleTime: 60 * 1000
  });

  if (!enabled) return null;

  const isDark = variant === 'dark';
  const shell = isDark
    ? 'bg-white/[0.07] border-white/12 backdrop-blur-md'
    : 'bg-white border-gray-200 shadow-sm';
  const titleClass = isDark ? 'text-white' : 'text-gray-900';
  const subClass = isDark ? 'text-blue-200/70' : 'text-gray-500';
  const itemShell = isDark
    ? 'bg-white/5 border-white/10 hover:bg-white/10'
    : 'bg-gray-50 border-gray-100 hover:bg-purple-50';

  if (isLoading) {
    return (
      <div className={`rounded-2xl border p-5 animate-pulse ${shell} ${className}`}>
        <div className={`h-5 w-40 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'} mb-4`} />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className={`h-12 rounded-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`} />
          ))}
        </div>
      </div>
    );
  }

  const { openTasks = [], openCount = 0, overdue = 0 } = data || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border p-5 sm:p-6 ${shell} ${className}`}
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 shadow-lg">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className={`font-semibold ${titleClass}`}>Your open tasks</h3>
            <p className={`text-sm ${subClass}`}>
              {openCount === 0
                ? 'All caught up'
                : `${openCount} open${overdue > 0 ? ` · ${overdue} overdue` : ''}`}
            </p>
          </div>
        </div>
        <Link
          to="/task-management?tab=my-tasks"
          className={`inline-flex items-center gap-1 text-sm font-medium shrink-0 ${
            isDark ? 'text-purple-300 hover:text-white' : 'text-purple-600 hover:text-purple-800'
          }`}
        >
          View all
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {openCount === 0 ? (
        <div
          className={`flex items-center gap-3 rounded-xl border p-4 ${itemShell}`}
        >
          <CheckCircle2 className={`w-8 h-8 ${isDark ? 'text-emerald-400' : 'text-emerald-500'}`} />
          <div>
            <p className={`font-medium ${titleClass}`}>Nothing pending</p>
            <p className={`text-sm ${subClass}`}>You're up to date on assigned work.</p>
          </div>
        </div>
      ) : (
        <ul className="space-y-2">
          {openTasks.map((task) => {
            const overdueTask =
              task.due_date && new Date(task.due_date) < new Date();
            return (
              <li key={task.id}>
                <Link
                  to={`/task-management?tab=my-tasks&task=${task.id}`}
                  className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${itemShell}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className={`font-medium truncate text-sm ${titleClass}`}>{task.title}</p>
                    <div className={`flex items-center gap-2 mt-1 text-xs ${subClass}`}>
                      <span>{STATUS_LABELS[task.status] || task.status}</span>
                      {task.due_date && (
                        <span
                          className={`inline-flex items-center gap-1 ${
                            overdueTask ? 'text-red-500 font-medium' : ''
                          }`}
                        >
                          {overdueTask ? (
                            <AlertTriangle className="w-3 h-3" />
                          ) : (
                            <Clock className="w-3 h-3" />
                          )}
                          {new Date(task.due_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      PRIORITY_STYLES[task.priority] || PRIORITY_STYLES.medium
                    }`}
                  >
                    {task.priority}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </motion.div>
  );
};

export default TaskSummaryWidget;
