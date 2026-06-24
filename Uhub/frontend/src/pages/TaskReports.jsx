import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart3,
  ClipboardList,
  Target,
  Timer,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  TrendingUp,
  Users
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { CSVLink } from 'react-csv';
import { useAuth } from '../context/AuthContext';
import { taskApi } from '../services/taskApi';
import { supabase } from '../supabaseClient';
import { CardSkeleton } from '../components/LoadingSkeleton';
import EnhancedButton from '../components/ui/EnhancedButton';
import { useChartTheme, CHART_COLORS } from '../hooks/useChartTheme';

const STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  review: 'Under Review',
  completed: 'Completed',
  cancelled: 'Cancelled'
};

const PRIORITY_LABELS = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent'
};

const TaskReports = () => {
  const { user } = useAuth();
  const chartTheme = useChartTheme();

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['taskReports', user?.id],
    queryFn: async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return { tasks: [], stats: null };

      const [tasksResponse, stats] = await Promise.all([
        taskApi.getAll({}, 1, 500),
        taskApi.getStats(authUser.id)
      ]);

      return {
        tasks: tasksResponse?.data || [],
        stats
      };
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const tasks = data?.tasks || [];
  const stats = data?.stats;

  const computedStats = useMemo(() => {
    const now = new Date();
    const overdue = tasks.filter(
      (t) => t.due_date && new Date(t.due_date) < now && !['completed', 'cancelled'].includes(t.status)
    ).length;

    return {
      total: tasks.length,
      pending: tasks.filter((t) => t.status === 'pending').length,
      inProgress: tasks.filter((t) => t.status === 'in_progress').length,
      completed: tasks.filter((t) => t.status === 'completed').length,
      overdue,
      completionRate: tasks.length
        ? Math.round((tasks.filter((t) => t.status === 'completed').length / tasks.length) * 100)
        : 0
    };
  }, [tasks]);

  const statusChartData = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      counts[t.status] = (counts[t.status] || 0) + 1;
    });
    return Object.entries(counts).map(([status, count], i) => ({
      name: STATUS_LABELS[status] || status,
      value: count,
      fill: CHART_COLORS[i % CHART_COLORS.length]
    }));
  }, [tasks]);

  const priorityChartData = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      counts[t.priority] = (counts[t.priority] || 0) + 1;
    });
    return Object.entries(counts).map(([priority, count]) => ({
      name: PRIORITY_LABELS[priority] || priority,
      count
    }));
  }, [tasks]);

  const departmentChartData = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const dept = t.department || 'Unassigned';
      counts[dept] = (counts[dept] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [tasks]);

  const assigneeChartData = useMemo(() => {
    const counts = {};
    tasks.forEach((t) => {
      const name = t.assigned_to_name || 'Unassigned';
      counts[name] = (counts[name] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [tasks]);

  const csvData = useMemo(
    () =>
      tasks.map((t) => ({
        Title: t.title,
        Status: STATUS_LABELS[t.status] || t.status,
        Priority: PRIORITY_LABELS[t.priority] || t.priority,
        Department: t.department || '',
        Assignee: t.assigned_to_name || '',
        'Assigned By': t.assigned_by_name || '',
        'Due Date': t.due_date ? new Date(t.due_date).toLocaleDateString() : '',
        'Created At': t.created_at ? new Date(t.created_at).toLocaleDateString() : ''
      })),
    [tasks]
  );

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats?.total_tasks ?? computedStats.total,
      icon: ClipboardList,
      color: 'from-purple-500 to-pink-600'
    },
    {
      label: 'In Progress',
      value: stats?.in_progress_tasks ?? computedStats.inProgress,
      icon: Timer,
      color: 'from-amber-500 to-orange-600'
    },
    {
      label: 'Completed',
      value: stats?.completed_tasks ?? computedStats.completed,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600'
    },
    {
      label: 'Overdue',
      value: stats?.overdue_tasks ?? computedStats.overdue,
      icon: AlertTriangle,
      color: 'from-red-500 to-rose-600'
    },
    {
      label: 'Completion Rate',
      value: `${computedStats.completionRate}%`,
      icon: TrendingUp,
      color: 'from-blue-500 to-indigo-600'
    },
    {
      label: 'My Tasks',
      value: stats?.my_tasks ?? '—',
      icon: Target,
      color: 'from-violet-500 to-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900 p-8">
        <CardSkeleton cards={4} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-slate-900 dark:to-gray-900">
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-indigo-600 text-white shadow-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
                <BarChart3 className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Task Reports</h1>
                <p className="text-purple-100 mt-1">
                  Analytics and insights across your to-do list
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <EnhancedButton
                onClick={() => refetch()}
                disabled={isRefetching}
                variant="secondary"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/20 border-white/30 text-white hover:bg-white/30"
              >
                <RefreshCw className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} />
                Refresh
              </EnhancedButton>
              {csvData.length > 0 && (
                <CSVLink
                  data={csvData}
                  filename={`task-report-${new Date().toISOString().slice(0, 10)}.csv`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white text-purple-700 font-medium hover:bg-purple-50 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </CSVLink>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <motion.div
                key={card.label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700"
              >
                <div className={`inline-flex p-2 rounded-lg bg-gradient-to-r ${card.color} mb-3`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{card.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
              </motion.div>
            );
          })}
        </div>

        {tasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-16 text-center border border-gray-200 dark:border-gray-700">
            <ClipboardList className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No task data yet</h3>
            <p className="text-gray-500 dark:text-gray-400">
              Create tasks in Task Management to see reports and analytics here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Tasks by Status
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusChartData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.fill || CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                Tasks by Priority
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={priorityChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis dataKey="name" stroke={chartTheme.axis} fontSize={12} tickLine={false} />
                    <YAxis stroke={chartTheme.axis} fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Bar dataKey="count" fill="#8B5CF6" radius={[6, 6, 0, 0]} maxBarSize={48} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                Tasks by Department
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={departmentChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis type="number" stroke={chartTheme.axis} fontSize={12} allowDecimals={false} />
                    <YAxis type="category" dataKey="department" stroke={chartTheme.axis} fontSize={11} width={100} tickLine={false} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Bar dataKey="count" fill="#EC4899" radius={[0, 6, 6, 0]} maxBarSize={28} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-500" />
                Top Assignees
              </h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={assigneeChartData} margin={{ top: 10, right: 10, left: 0, bottom: 40 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} />
                    <XAxis
                      dataKey="name"
                      stroke={chartTheme.axis}
                      fontSize={11}
                      tickLine={false}
                      angle={-25}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis stroke={chartTheme.axis} fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={chartTheme.tooltip} />
                    <Bar dataKey="count" fill="#6366F1" radius={[6, 6, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TaskReports;
