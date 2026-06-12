// src/pages/Dashboard.jsx
import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenseStats } from '../hooks/useExpenseStats';
import { usePaymentEvents } from '../hooks/usePaymentEvents';
import { useQueryClient } from '@tanstack/react-query';
import GlobalFilter from '../components/GlobalFilter';
import PaymentCalendar from '../components/PaymentCalendar';
import ScrollableExpenseTable from '../components/ScrollableExpenseTable';
import LoadingSpinner from '../components/LoadingSpinner';
import TodaySpendingChart from '../components/TodaySpendingChart';
import { MonthlyTrendsChart, DepartmentSpendingChart } from '../components/TrendChart';
import DashboardNotification, { NotificationTypes } from '../components/DashboardNotification';

import './Dashboard.css';

const getExpenseAmount = (expense) =>
  parseFloat(expense.amount_aed || expense.amount || expense.value || expense.cost || 0);

const getExpenseDate = (expense) =>
  new Date(expense.date_paid || expense.date || expense.created_at);

const filterExpenses = (expenses, filters) => {
  if (!filters || !expenses?.length) return expenses || [];

  let result = [...expenses];

  if (filters.search?.trim()) {
    const q = filters.search.trim().toLowerCase();
    result = result.filter(
      (e) =>
        (e.service_name || '').toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q)
    );
  }

  if (filters.department && filters.department !== 'all') {
    result = result.filter((e) => (e.department || '') === filters.department);
  }

  if (filters.status && filters.status !== 'all') {
    result = result.filter((e) => (e.service_status || e.status || '') === filters.status);
  }

  if (filters.dateRange && filters.dateRange !== 'all') {
    const now = new Date();
    result = result.filter((e) => {
      const date = getExpenseDate(e);
      switch (filters.dateRange) {
        case 'today':
          return date.toDateString() === now.toDateString();
        case 'week': {
          const weekAgo = new Date(now);
          weekAgo.setDate(now.getDate() - 7);
          return date >= weekAgo;
        }
        case 'month':
          return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
        case 'quarter': {
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          return date >= quarterStart;
        }
        case 'year':
          return date.getFullYear() === now.getFullYear();
        default:
          return true;
      }
    });
  }

  if (filters.amountRange && filters.amountRange !== 'all') {
    result = result.filter((e) => {
      const amount = getExpenseAmount(e);
      switch (filters.amountRange) {
        case 'low':
          return amount < 1000;
        case 'medium':
          return amount >= 1000 && amount <= 10000;
        case 'high':
          return amount > 10000;
        default:
          return true;
      }
    });
  }

  return result;
};

const PERIOD_OPTIONS = [
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'Last 3 Months' },
  { value: 'ytd', label: 'YTD' },
  { value: 'all', label: 'All Time' },
];

const applyPeriodFilter = (expenses, period) => {
  if (!period || period === 'all' || !expenses?.length) return expenses || [];

  const now = new Date();
  return expenses.filter((expense) => {
    const date = getExpenseDate(expense);
    switch (period) {
      case 'month':
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      case 'quarter': {
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return date >= threeMonthsAgo;
      }
      case 'ytd':
        return date.getFullYear() === now.getFullYear();
      default:
        return true;
    }
  });
};

const COLLAPSED_STORAGE_KEY = 'uhub-dashboard-collapsed-sections';

const loadCollapsedSections = () => {
  try {
    const saved = localStorage.getItem(COLLAPSED_STORAGE_KEY);
    if (saved) {
      return { paymentCalendar: true, expenseData: true, ...JSON.parse(saved) };
    }
  } catch {
    /* ignore */
  }
  return { paymentCalendar: true, expenseData: true };
};

const exportExpensesCsv = (expenses) => {
  if (!expenses.length) return;

  const headers = ['Service', 'Department', 'Amount (AED)', 'Date Paid', 'Status'];
  const rows = expenses.map((e) => [
    e.service_name || '',
    e.department || '',
    getExpenseAmount(e),
    e.date_paid || e.date || '',
    e.service_status || '',
  ]);

  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `expenses-export-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
};

// Enhanced Summary Card Component
const SummaryCard = ({ title, value, change, iconName, color = 'blue', onClick, loading = false }) => {
  const Icon = LucideIcons[iconName];
  const colorVariants = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    indigo: 'from-indigo-500 to-indigo-600'
  };
  
  return (
    <div 
      className={`summary-card group relative overflow-hidden rounded-2xl shadow-lg border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      style={{
        background: 'var(--card-bg)',
        borderColor: 'var(--card-border)',
        boxShadow: 'var(--shadow-md)'
      }}
      onClick={onClick}
    >
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorVariants[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="summary-card-content relative z-10 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-6">
          <p 
            className="text-sm font-medium mb-2 opacity-80"
            style={{ color: 'var(--text-muted)' }}
          >
            {title}
          </p>
          {loading ? (
            <div 
              className="h-8 rounded animate-pulse mb-3"
              style={{ background: 'var(--bg-tertiary)' }}
            ></div>
          ) : (
            <p 
              className="text-3xl font-bold mb-3 leading-tight"
              style={{ color: 'var(--text-primary)' }}
            >
              {value}
            </p>
          )}
          {change !== undefined && !loading && (
            <div className="flex items-center flex-wrap gap-2">
              <span 
                className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold"
                style={{
                  background: change >= 0 ? 'var(--accent-success)' : 'var(--accent-danger)',
                  color: 'white'
                }}
              >
                <span className="mr-1">{change >= 0 ? '↗' : '↘'}</span>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span 
                className="text-xs"
                style={{ color: 'var(--text-muted)' }}
              >
                vs last month
              </span>
            </div>
          )}
        </div>
        <div className={`summary-card-icon p-4 rounded-xl bg-gradient-to-br ${colorVariants[color]} shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon className="w-7 h-7 text-white" />}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div 
        className="absolute top-0 right-0 w-20 h-20 rounded-full -translate-y-10 translate-x-10"
        style={{
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.1) 0%, transparent 100%)'
        }}
      />
    </div>
  );
};

// Quick Action Button Component
const QuickActionButton = ({ icon, label, onClick, color = 'blue', variant = 'primary' }) => {
  const Icon = LucideIcons[icon];
  const colorVariants = {
    blue: 'bg-blue-500 hover:bg-blue-600 text-white',
    green: 'bg-green-500 hover:bg-green-600 text-white',
    purple: 'bg-purple-500 hover:bg-purple-600 text-white',
    orange: 'bg-orange-500 hover:bg-orange-600 text-white',
    red: 'bg-red-500 hover:bg-red-600 text-white',
    indigo: 'bg-indigo-500 hover:bg-indigo-600 text-white'
  };
  
  const outlineVariants = {
    blue: 'border-blue-500 text-blue-600 hover:bg-blue-50',
    green: 'border-green-500 text-green-600 hover:bg-green-50',
    purple: 'border-purple-500 text-purple-600 hover:bg-purple-50',
    orange: 'border-orange-500 text-orange-600 hover:bg-orange-50',
    red: 'border-red-500 text-red-600 hover:bg-red-50',
    indigo: 'border-indigo-500 text-indigo-600 hover:bg-indigo-50'
  };
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all duration-200 ${
        variant === 'primary' 
          ? `${colorVariants[color]} shadow-md hover:shadow-lg` 
          : `border-2 ${outlineVariants[color]}`
      }`}
      style={variant === 'outline' ? {
        background: 'var(--card-bg)',
        borderColor: 'var(--border-primary)',
        color: 'var(--text-primary)'
      } : {}}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{label}</span>
    </button>
  );
};

// Enhanced Section Header Component
const SectionHeader = ({ title, iconName, action, subtitle, collapsible = false, isCollapsed = false, onToggle }) => {
  const Icon = LucideIcons[iconName];
  const ChevronIcon = LucideIcons[isCollapsed ? 'ChevronDown' : 'ChevronUp'];
  
  return (
    <div className="section-header">
      <div className="section-header-left">
        <div 
          className="section-header-icon"
          style={{
            background: 'var(--gradient-primary)',
            boxShadow: 'var(--shadow-md)'
          }}
        >
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        <div className="section-header-text">
          <h2 
            className="section-header-title"
            style={{ color: 'var(--text-primary)' }}
          >
            {title}
          </h2>
          {subtitle && (
            <p 
              className="section-header-subtitle"
              style={{ color: 'var(--text-muted)' }}
            >
              {subtitle}
            </p>
          )}
        </div>
      </div>
      <div className="section-header-actions">
        {action && <div className="section-header-action">{action}</div>}
        {collapsible && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg transition-colors duration-200"
            style={{
              background: 'transparent',
              color: 'var(--text-muted)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'var(--bg-tertiary)';
              e.target.style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = 'var(--text-muted)';
            }}
          >
            <ChevronIcon className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
};

const PeriodSelector = ({ value, onChange }) => (
  <div className="period-selector" role="group" aria-label="Time period">
    {PERIOD_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        className={`period-selector-btn${value === opt.value ? ' active' : ''}`}
        onClick={() => onChange(opt.value)}
        aria-pressed={value === opt.value}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// Enhanced Animated Card Component
const AnimatedCard = ({ children, className = '', gradient = false, id, compact = false }) => (
  <div 
    id={id}
    className={`animated-card ${gradient ? 'gradient' : ''} ${compact ? 'animated-card-compact' : ''} ${className}`}
    style={{
      background: 'var(--card-bg)',
      borderColor: 'var(--card-border)',
      boxShadow: 'var(--shadow-md)'
    }}
  >
    {/* Subtle border gradient */}
    <div 
      className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300"
      style={{
        background: 'var(--gradient-primary)',
        opacity: 0.1
      }}
    />
    
    {/* Content */}
    <div className="relative z-10 p-8 transition-all duration-300">
      {children}
    </div>
  </div>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const { data: expenseStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useExpenseStats();
  const { data: paymentEvents, refetch: refetchPayments } = usePaymentEvents();
  const safePaymentEvents = paymentEvents || [];
  const [period, setPeriod] = useState('month');
  const [filters, setFilters] = useState({});
  const [collapsedSections, setCollapsedSections] = useState(loadCollapsedSections);
  const [dismissedAlertIds, setDismissedAlertIds] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const queryClient = useQueryClient();

  const safeExpenseStats = expenseStats || [];
  const filteredExpenseStats = useMemo(() => {
    const periodFiltered = applyPeriodFilter(safeExpenseStats, period);
    return filterExpenses(periodFiltered, filters);
  }, [safeExpenseStats, period, filters]);

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, JSON.stringify(collapsedSections));
    } catch {
      /* ignore */
    }
  }, [collapsedSections]);

  const periodLabel = PERIOD_OPTIONS.find((p) => p.value === period)?.label || 'All Time';

  const displayName = userProfile?.full_name || user?.email?.split('@')?.[0] || 'User';

  // Handle events update from calendar
  const handleEventsUpdate = (updatedEvents) => {
    // Update the query cache with the new events
    queryClient.setQueryData(['paymentEvents'], updatedEvents);
  };

  // Handle refresh dashboard data
  const handleRefreshDashboard = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchStats(),
        refetchPayments()
      ]);
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Toggle section collapse
  const toggleSection = (sectionName) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  // Calculate summary statistics from filtered data
  const summaryStats = useMemo(() => {
    const expenses = filteredExpenseStats;

    if (!expenses.length) {
      return {
        totalExpenses: 'AED 0',
        currentMonthSpend: 'AED 0',
        totalDepartments: '0',
        averagePerExpense: 'AED 0',
        monthlyGrowth: 0,
        pendingPayments: safePaymentEvents.filter((e) => e.status === 'pending').length.toString(),
        overduePayments: safePaymentEvents.filter((e) => e.status === 'overdue').length.toString(),
      };
    }

    const totalExpenses = expenses.reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const currentMonthExpenses = expenses
      .filter((expense) => {
        const expenseDate = getExpenseDate(expense);
        return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
      })
      .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

    const lastMonthExpenses = expenses
      .filter((expense) => {
        const expenseDate = getExpenseDate(expense);
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
        return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
      })
      .reduce((sum, expense) => sum + getExpenseAmount(expense), 0);

    const monthlyGrowth =
      lastMonthExpenses > 0
        ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100
        : 0;

    const uniqueDepartments = new Set(
      expenses.map((expense) => expense.department || expense.dept || expense.division).filter(Boolean)
    );

    const pendingPayments = safePaymentEvents.filter((event) => event.status === 'pending').length;
    const overduePayments = safePaymentEvents.filter((event) => event.status === 'overdue').length;

    return {
      totalExpenses: totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      currentMonthSpend: currentMonthExpenses.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      totalDepartments: uniqueDepartments.size.toString(),
      averagePerExpense: (totalExpenses / expenses.length).toLocaleString('en-US', {
        style: 'currency',
        currency: 'AED',
      }),
      monthlyGrowth: Math.round(monthlyGrowth),
      pendingPayments: pendingPayments.toString(),
      overduePayments: overduePayments.toString(),
    };
  }, [filteredExpenseStats, safePaymentEvents]);

  const paymentAlerts = useMemo(() => {
    const alerts = [];
    const overdue = safePaymentEvents.filter((e) => e.status === 'overdue');
    const now = new Date();
    const weekFromNow = new Date(now);
    weekFromNow.setDate(now.getDate() + 7);

    const dueSoon = safePaymentEvents.filter((e) => {
      if (e.status !== 'pending' || !e.due_date) return false;
      const due = new Date(e.due_date);
      return due >= now && due <= weekFromNow;
    });

    if (overdue.length > 0) {
      alerts.push({
        id: 'overdue',
        type: NotificationTypes.ERROR,
        title: `${overdue.length} overdue payment${overdue.length === 1 ? '' : 's'}`,
        message: 'These payments are past due. Review and action them first.',
        action: { label: 'View payments', url: '/upcoming-payments' },
      });
    }

    if (dueSoon.length > 0) {
      alerts.push({
        id: 'due-soon',
        type: NotificationTypes.WARNING,
        title: `${dueSoon.length} payment${dueSoon.length === 1 ? '' : 's'} due within 7 days`,
        message: 'Upcoming payments need your attention.',
        action: { label: 'View calendar', url: '/payment-calendar' },
      });
    }

    return alerts;
  }, [safePaymentEvents]);

  const visibleNotifications = paymentAlerts.filter((n) => !dismissedAlertIds.includes(n.id));

  const hasActiveFilters = useMemo(
    () => period !== 'all' || Object.values(filters).some((value) => value && value !== 'all'),
    [filters, period]
  );

  const dashboardInsights = useMemo(() => {
    const pending = Number(summaryStats.pendingPayments || 0);
    const overdue = Number(summaryStats.overduePayments || 0);
    const growth = Number(summaryStats.monthlyGrowth || 0);
    const hasData = filteredExpenseStats.length > 0;

    if (!hasData) {
      return [
        { icon: 'Sparkles', title: 'Get started', message: 'Add your first expense to unlock trends and insights.', tone: 'neutral' },
        { icon: 'Calendar', title: 'Plan ahead', message: 'Add upcoming payments to see them on your calendar.', tone: 'neutral' },
        { icon: 'ShieldCheck', title: 'Stay in control', message: 'Track spend by department and keep approvals tight.', tone: 'neutral' },
      ];
    }

    return [
      overdue > 0
        ? { icon: 'AlertTriangle', title: 'Overdue items', message: `${overdue} payment${overdue === 1 ? '' : 's'} overdue. Prioritize these first.`, tone: 'danger' }
        : { icon: 'CheckCircle2', title: 'On track', message: 'No overdue payments right now.', tone: 'success' },
      pending > 0
        ? { icon: 'Clock', title: 'Upcoming', message: `${pending} payment${pending === 1 ? '' : 's'} pending. Review and confirm dates.`, tone: 'warning' }
        : { icon: 'CalendarCheck2', title: 'Clear calendar', message: 'No pending payments scheduled yet.', tone: 'neutral' },
      growth >= 0
        ? { icon: 'TrendingUp', title: 'MoM change', message: `Spending is up ${Math.abs(growth)}% vs last month.`, tone: growth >= 15 ? 'warning' : 'neutral' }
        : { icon: 'TrendingDown', title: 'MoM change', message: `Spending is down ${Math.abs(growth)}% vs last month.`, tone: 'success' },
    ];
  }, [summaryStats, filteredExpenseStats.length]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDateClick = (date) => {
    navigate('/payment-calendar', { state: { selectedDate: date } });
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addExpense':
        navigate('/expenses');
        break;
      case 'analytics':
        navigate('/analytics');
        break;
      case 'exportData':
        exportExpensesCsv(filteredExpenseStats);
        break;
      case 'paymentCalendar':
        navigate('/payment-calendar');
        break;
      default:
        break;
    }
  };

  const handleNotificationDismiss = (notificationId) => {
    setDismissedAlertIds((prev) => [...prev, notificationId]);
  };

  const handleNotificationAction = (notification) => {
    if (notification.action?.url) {
      navigate(notification.action.url);
    }
  };

  const scrollToSection = (sectionId, expandSectionKey) => {
    if (expandSectionKey) {
      setCollapsedSections((prev) => ({ ...prev, [expandSectionKey]: false }));
    }
    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, expandSectionKey ? 80 : 0);
  };

  // Show loading state only if both queries are loading and we have no cached data
  const isLoading = statsLoading && !safeExpenseStats.length && !safePaymentEvents.length;

  if (isLoading) {
    return (
      <div 
        className="min-h-screen transition-all duration-500"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="page-content">
          <LoadingSpinner size="xl" text="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen transition-all duration-500"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="page-content">
        {/* Header */}
        <div className="welcome-section">
          <div className="welcome-hero">
            <div className="welcome-hero-top">
              <div className="welcome-hero-left">
                <div className="welcome-icon flex items-center justify-center">
                  <LucideIcons.BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div className="welcome-hero-text">
                  <h1 className="welcome-title">Financial Dashboard</h1>
                  <p className="welcome-subtitle">
                    {displayName} — {periodLabel} overview
                    {hasActiveFilters && (
                      <span className="block mt-1 text-sm opacity-80">
                        Showing {filteredExpenseStats.length} of {safeExpenseStats.length} expenses
                        {period !== 'all' ? ` (${periodLabel.toLowerCase()})` : ''}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <div className="welcome-hero-actions">
                <PeriodSelector value={period} onChange={setPeriod} />
                <button
                onClick={handleRefreshDashboard}
                disabled={isRefreshing}
                className="refresh-button"
                type="button"
              >
                <LucideIcons.RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
              </button>
              </div>
            </div>
            <div className="welcome-hero-insights">
              {dashboardInsights.map((insight) => {
                const Icon = LucideIcons[insight.icon] || LucideIcons.Sparkles;
                return (
                  <div key={insight.title} className={`insight-card ${insight.tone}`}>
                    <div className="insight-icon">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="insight-text">
                      <div className="insight-title">{insight.title}</div>
                      <div className="insight-message">{insight.message}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-bar">
          <div className="quick-actions-header">
            <h3 className="quick-actions-title">Quick Actions</h3>
          </div>
          <div className="quick-actions-grid">
            <QuickActionButton
              icon="Plus"
              label="Add Expense"
              onClick={() => handleQuickAction('addExpense')}
              color="blue"
            />
            <QuickActionButton
              icon="BarChart3"
              label="Analytics"
              onClick={() => handleQuickAction('analytics')}
              color="green"
              variant="outline"
            />
            <QuickActionButton
              icon="Download"
              label="Export CSV"
              onClick={() => handleQuickAction('exportData')}
              color="purple"
              variant="outline"
            />
            <QuickActionButton
              icon="Calendar"
              label="Payment Calendar"
              onClick={() => handleQuickAction('paymentCalendar')}
              color="indigo"
              variant="outline"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="global-filter-container">
          <GlobalFilter onFilterChange={handleFilterChange} filters={filters} />
        </div>

        {/* Payment alerts (derived from real data) */}
        {visibleNotifications.length > 0 && (
          <div className="dashboard-grid cols-1">
            <DashboardNotification
              notifications={visibleNotifications}
              onDismiss={handleNotificationDismiss}
              onAction={handleNotificationAction}
              maxNotifications={3}
            />
          </div>
        )}

        {/* KPI summary — single row */}
        <div className="dashboard-grid cols-4">
          <SummaryCard
            title="Total Expenses"
            value={summaryStats.totalExpenses}
            change={summaryStats.monthlyGrowth}
            iconName="DollarSign"
            color="blue"
            loading={statsLoading}
            onClick={() => scrollToSection('charts-section', 'monthlyTrends')}
          />
          <SummaryCard
            title="This Month"
            value={summaryStats.currentMonthSpend}
            iconName="Calendar"
            color="green"
            loading={statsLoading}
            onClick={() => scrollToSection('today-spending-section', 'todaySpending')}
          />
          <SummaryCard
            title="Pending Payments"
            value={summaryStats.pendingPayments}
            iconName="Clock"
            color="orange"
            loading={statsLoading}
            onClick={() => scrollToSection('payment-calendar-section', 'paymentCalendar')}
          />
          <SummaryCard
            title="Overdue Payments"
            value={summaryStats.overduePayments}
            iconName="AlertTriangle"
            color="red"
            loading={statsLoading}
            onClick={() => scrollToSection('payment-calendar-section', 'paymentCalendar')}
          />
        </div>

        {/* Today's spending */}
        <div id="today-spending-section" className="dashboard-grid cols-1">
          <AnimatedCard gradient={true}>
            <SectionHeader
              title="Today's Spending"
              iconName="Activity"
              subtitle="Spending breakdown by department for today"
              collapsible={true}
              isCollapsed={collapsedSections.todaySpending}
              onToggle={() => toggleSection('todaySpending')}
            />
            {!collapsedSections.todaySpending && (
              <div className="mt-6">
                <TodaySpendingChart data={filteredExpenseStats} />
              </div>
            )}
          </AnimatedCard>
        </div>

        {/* Trend charts */}
        <div id="charts-section" className="dashboard-grid cols-2">
          <AnimatedCard>
            <SectionHeader
              title="Monthly Spending Trends"
              iconName="TrendingUp"
              subtitle="Last 6 months"
              collapsible={true}
              isCollapsed={collapsedSections.monthlyTrends}
              onToggle={() => toggleSection('monthlyTrends')}
            />
            {!collapsedSections.monthlyTrends && (
              <div className="mt-6">
                <MonthlyTrendsChart data={filteredExpenseStats} />
              </div>
            )}
          </AnimatedCard>

          <AnimatedCard>
            <SectionHeader
              title="Department Analysis"
              iconName="PieChart"
              subtitle="Top departments by spend"
              collapsible={true}
              isCollapsed={collapsedSections.departmentAnalysis}
              onToggle={() => toggleSection('departmentAnalysis')}
            />
            {!collapsedSections.departmentAnalysis && (
              <div className="mt-6">
                <DepartmentSpendingChart data={filteredExpenseStats} />
              </div>
            )}
          </AnimatedCard>
        </div>

        {/* Payment calendar — collapsed by default */}
        <AnimatedCard id="payment-calendar-section" compact={collapsedSections.paymentCalendar}>
          <SectionHeader
            title="Payment Calendar"
            iconName="Calendar"
            subtitle="Schedule and track upcoming payments"
            collapsible={true}
            isCollapsed={collapsedSections.paymentCalendar}
            onToggle={() => toggleSection('paymentCalendar')}
          />
          {!collapsedSections.paymentCalendar && (
            <div className="mt-6">
              <PaymentCalendar
                events={safePaymentEvents}
                onDateClick={handleDateClick}
                onEventsUpdate={handleEventsUpdate}
              />
            </div>
          )}
        </AnimatedCard>

        {/* Expense table — collapsed by default */}
        <AnimatedCard className="mb-12" compact={collapsedSections.expenseData}>
          <SectionHeader
            title="Detailed Expense Data"
            iconName="LineChart"
            subtitle={`${filteredExpenseStats.length} transaction${filteredExpenseStats.length === 1 ? '' : 's'}`}
            collapsible={true}
            isCollapsed={collapsedSections.expenseData}
            onToggle={() => toggleSection('expenseData')}
          />
          {!collapsedSections.expenseData && (
            statsError ? (
              <div className="dashboard-error">
                <div className="error-icon">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="error-title">Failed to load expense data</p>
                <p className="error-message">{statsError.message}</p>
              </div>
            ) : (
              <div className="mt-6">
                <ScrollableExpenseTable data={filteredExpenseStats} />
              </div>
            )
          )}
        </AnimatedCard>
      </div>

    </div>
  );
}
