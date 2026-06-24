import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users, LogIn, TrendingUp, RefreshCw } from 'lucide-react';
import activityService from '../services/activityService';
import { useChartTheme, CHART_COLORS } from '../hooks/useChartTheme';

const PERIODS = [
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
];

export default function AdminUserActivityCharts({ refreshToken = 0 }) {
  const chartTheme = useChartTheme();
  const [period, setPeriod] = useState(30);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState({ dailyTrend: [], topUsers: [], summary: {} });

  const loadAnalytics = useCallback(async () => {
    setLoading(true);
    const result = await activityService.getUserActivityAnalytics(period);
    setAnalytics(result);
    setLoading(false);
  }, [period]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics, refreshToken]);

  const { dailyTrend, topUsers, summary } = analytics;
  const hasData = dailyTrend.some((d) => d.totalEvents > 0);

  return (
    <motion.div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--card-bg)', border: '1px solid var(--card-border)', boxShadow: 'var(--shadow-sm)' }}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            User Activity Analytics
          </h3>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Daily active users, logins, and top contributors
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="flex rounded-lg p-0.5"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
          >
            {PERIODS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPeriod(value)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
                style={{
                  background: period === value ? 'var(--card-bg)' : 'transparent',
                  color: period === value ? 'var(--text-primary)' : 'var(--text-muted)',
                  boxShadow: period === value ? 'var(--shadow-sm)' : 'none',
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="p-2 rounded-lg transition-colors disabled:opacity-50"
            style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
            title="Refresh charts"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Summary pills */}
      {!loading && hasData && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-5 pt-4">
          <SummaryPill
            icon={Users}
            label="Avg. daily active users"
            value={summary.avgDau ?? 0}
            color="#22c55e"
          />
          <SummaryPill
            icon={TrendingUp}
            label={`Peak day (${summary.peakDay})`}
            value={`${summary.peakUsers ?? 0} users`}
            color="#3b82f6"
          />
          <SummaryPill
            icon={LogIn}
            label="Most active user"
            value={summary.topUser?.split('@')[0] ?? '—'}
            color="#a855f7"
            truncate
          />
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
        </div>
      ) : !hasData ? (
        <div className="flex flex-col items-center justify-center h-64 px-4">
          <Users className="w-10 h-10 mb-3 opacity-30" style={{ color: 'var(--text-muted)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>No activity data yet</p>
          <p className="text-xs mt-1 text-center" style={{ color: 'var(--text-muted)' }}>
            Charts will populate as users log in and interact with UHub
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5 p-5">
          {/* DAU + logins trend */}
          <div className="xl:col-span-3">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Active Users &amp; Logins
            </p>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTrend} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <defs>
                    <linearGradient id="activeUsersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="loginsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} vertical={false} />
                  <XAxis
                    dataKey="label"
                    stroke={chartTheme.axis}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    interval={period === 30 ? 4 : 0}
                  />
                  <YAxis
                    stroke={chartTheme.axis}
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                    width={32}
                  />
                  <Tooltip
                    contentStyle={chartTheme.tooltip}
                    labelStyle={chartTheme.labelStyle}
                    formatter={(value, name) => [
                      value,
                      name === 'activeUsers' ? 'Active users' : 'Logins',
                    ]}
                  />
                  <Legend
                    formatter={(value) => (value === 'activeUsers' ? 'Active users' : 'Logins')}
                    wrapperStyle={{ fontSize: 12, color: chartTheme.axis }}
                  />
                  <Area
                    type="monotone"
                    dataKey="activeUsers"
                    stroke="#22c55e"
                    strokeWidth={2}
                    fill="url(#activeUsersGrad)"
                    dot={period <= 7}
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="logins"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fill="url(#loginsGrad)"
                    dot={period <= 7}
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top users */}
          <div className="xl:col-span-2">
            <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
              Top Active Users
            </p>
            <div className="h-64">
              {topUsers.length === 0 ? (
                <div className="flex items-center justify-center h-full text-sm" style={{ color: 'var(--text-muted)' }}>
                  No user data
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topUsers}
                    layout="vertical"
                    margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={chartTheme.grid} horizontal={false} />
                    <XAxis
                      type="number"
                      stroke={chartTheme.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      allowDecimals={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      stroke={chartTheme.axis}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={72}
                    />
                    <Tooltip
                      contentStyle={chartTheme.tooltip}
                      labelStyle={chartTheme.labelStyle}
                      formatter={(value, name) => [
                        value,
                        name === 'count' ? 'Total events' : name,
                      ]}
                      labelFormatter={(_, payload) => payload?.[0]?.payload?.email || ''}
                    />
                    <Bar
                      dataKey="count"
                      fill={CHART_COLORS[0]}
                      radius={[0, 4, 4, 0]}
                      maxBarSize={18}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}

function SummaryPill({ icon: Icon, label, value, color, truncate }) {
  return (
    <div
      className="flex items-center gap-3 rounded-xl px-3 py-2.5"
      style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
    >
      <div className="p-1.5 rounded-lg flex-shrink-0" style={{ background: `${color}18` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
        <p className={`text-sm font-semibold tabular-nums ${truncate ? 'truncate' : ''}`} style={{ color: 'var(--text-primary)' }}>
          {value}
        </p>
      </div>
    </div>
  );
}
