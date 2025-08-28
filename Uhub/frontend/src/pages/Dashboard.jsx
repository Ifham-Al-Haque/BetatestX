// src/pages/Dashboard.jsx
import React, { useState, useMemo, Suspense, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenseStats } from '../hooks/useExpenseStats';
import { usePaymentEvents } from '../hooks/usePaymentEvents';
import { useQueryClient } from '@tanstack/react-query';
import GlobalFilter from '../components/GlobalFilter';

import PaymentCalendar from '../components/PaymentCalendar';

import ScrollableExpenseTable from '../components/ScrollableExpenseTable';
import LoadingSpinner from '../components/LoadingSpinner';

// Import components directly instead of lazy loading
import TodaySpendingChart from '../components/TodaySpendingChart';
import RoleDebug from '../components/RoleDebug';
import DashboardNotification, { NotificationTypes } from '../components/DashboardNotification';

// Import dashboard styles
import './Dashboard.css';

// Enhanced color scheme for charts and UI elements
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

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
      className={`summary-card group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorVariants[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="summary-card-content relative z-10 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-medium text-gray-600 mb-2 opacity-80">{title}</p>
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse mb-3"></div>
          ) : (
            <p className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{value}</p>
          )}
          {change !== undefined && !loading && (
            <div className="flex items-center flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold ${
                change >= 0 
                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                  : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
                <span className="mr-1">{change >= 0 ? '↗' : '↘'}</span>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-xs text-gray-500">vs last month</span>
            </div>
          )}
        </div>
        <div className={`summary-card-icon p-4 rounded-xl bg-gradient-to-br ${colorVariants[color]} shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
          {Icon && <Icon className="w-7 h-7 text-white" />}
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-10 translate-x-10" />
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
          : `border-2 ${outlineVariants[color]} bg-white`
      }`}
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
        <div className="section-header-icon">
          {Icon && <Icon className="w-6 h-6 text-white" />}
        </div>
        <div className="section-header-text">
          <h2 className="section-header-title">
            {title}
          </h2>
          {subtitle && (
            <p className="section-header-subtitle">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="section-header-actions">
        {action && <div className="section-header-action">{action}</div>}
        {collapsible && (
          <button
            onClick={onToggle}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronIcon className="w-5 h-5 text-gray-600" />
          </button>
        )}
      </div>
    </div>
  );
};

// Enhanced Animated Card Component
const AnimatedCard = ({ children, className = '', delay = 0, gradient = false, collapsible = false, isCollapsed = false }) => (
  <div className={`animated-card ${gradient ? 'gradient' : ''} ${className}`}>
    {/* Subtle border gradient */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    
    {/* Content */}
    <div className={`relative z-10 p-8 transition-all duration-300 ${isCollapsed ? 'max-h-0 overflow-hidden p-0' : ''}`}>
      {children}
    </div>
  </div>
);

// Trend Chart Component
const TrendChart = ({ data, title, subtitle }) => {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📊</span>
          </div>
          <p className="text-gray-500">No data available for {title}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h4 className="text-lg font-semibold text-gray-800">{title}</h4>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">📈</span>
          </div>
          <p className="text-gray-500">Chart visualization coming soon</p>
        </div>
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { data: expenseStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useExpenseStats();
  const { data: paymentEvents, refetch: refetchPayments } = usePaymentEvents();
  const safePaymentEvents = paymentEvents || [];
  const [filters, setFilters] = useState({});
  const [collapsedSections, setCollapsedSections] = useState({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: NotificationTypes.INFO,
      title: 'Dashboard Updated',
      message: 'New features and improvements have been added to your dashboard.',
      action: { label: 'Learn More', url: '/updates' }
    },
    {
      id: 2,
      type: NotificationTypes.WARNING,
      title: 'Payment Due Soon',
      message: 'You have 3 payments due in the next 7 days.',
      action: { label: 'View Payments', url: '/payments' }
    },
    {
      id: 3,
      type: NotificationTypes.SUCCESS,
      title: 'Monthly Report Ready',
      message: 'Your monthly expense report for November is now available.',
      action: { label: 'Download Report', url: '/reports' }
    }
  ]);
  const queryClient = useQueryClient();

  const safeExpenseStats = expenseStats || [];

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

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!safeExpenseStats.length) {
      return {
        totalExpenses: '0',
        totalDepartments: '0',
        averagePerExpense: '0',
        monthlyGrowth: 0,
        pendingPayments: '0',
        overduePayments: '0'
      };
    }

    const totalExpenses = safeExpenseStats.reduce((sum, expense) => {
      const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
      return sum + parseFloat(amount);
    }, 0);
    
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthExpenses = safeExpenseStats.filter(expense => {
      const expenseDate = new Date(expense.date_paid || expense.date || expense.created_at);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => {
      const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
      return sum + parseFloat(amount);
    }, 0);

    const lastMonthExpenses = safeExpenseStats.filter(expense => {
      const expenseDate = new Date(expense.date_paid || expense.date || expense.created_at);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
    }).reduce((sum, expense) => {
      const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
      return sum + parseFloat(amount);
    }, 0);

    const monthlyGrowth = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 
      : 0;

    const uniqueDepartments = new Set(safeExpenseStats.map(expense => 
      expense.department || expense.dept || expense.division
    ).filter(Boolean));
    const averagePerExpense = totalExpenses / safeExpenseStats.length;

    // Calculate payment status counts
    const pendingPayments = safePaymentEvents.filter(event => event.status === 'pending').length;
    const overduePayments = safePaymentEvents.filter(event => event.status === 'overdue').length;

    return {
      totalExpenses: totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      totalDepartments: uniqueDepartments.size.toString(),
      averagePerExpense: averagePerExpense.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      monthlyGrowth: Math.round(monthlyGrowth),
      pendingPayments: pendingPayments.toString(),
      overduePayments: overduePayments.toString()
    };
  }, [safeExpenseStats, safePaymentEvents]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // You can add a modal or navigation here
  };

  const handleDateClick = (date) => {
    // Handle date click from calendar
    console.log('Date clicked:', date);
  };

  // Quick action handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'addExpense':
        // Navigate to add expense page
        console.log('Navigate to add expense');
        break;
      case 'viewReports':
        // Navigate to reports page
        console.log('Navigate to reports');
        break;
      case 'exportData':
        // Export dashboard data
        console.log('Export data');
        break;
      case 'settings':
        // Navigate to settings
        console.log('Navigate to settings');
        break;
      default:
        break;
    }
  };

  // Notification handlers
  const handleNotificationDismiss = (notificationId) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const handleNotificationAction = (notification) => {
    if (notification.action?.url) {
      // Navigate to the specified URL
      console.log('Navigate to:', notification.action.url);
    }
  };

  // Show loading state only if both queries are loading and we have no cached data
  const isLoading = statsLoading && !safeExpenseStats.length && !safePaymentEvents.length;

  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
        <div className="page-content">
          <LoadingSpinner size="xl" text="Loading dashboard data..." />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30">
      <div className="page-content">
        {/* Enhanced Welcome Section */}
        <div className="welcome-section">
          <div className="welcome-icon">
            <span className="text-2xl">👋</span>
          </div>
          <h1 className="welcome-title">
            Welcome back, {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}!
          </h1>
          <p className="welcome-subtitle">
            Here's what's happening with your organization today. Track expenses, monitor trends, and stay on top of your financial data.
          </p>
        </div>

        {/* Quick Actions Bar */}
        <div className="quick-actions-bar">
          <div className="quick-actions-header">
            <h3 className="quick-actions-title">Quick Actions</h3>
            <button
              onClick={handleRefreshDashboard}
              disabled={isRefreshing}
              className="refresh-button"
            >
              <LucideIcons.RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
          <div className="quick-actions-grid">
            <QuickActionButton
              icon="Plus"
              label="Add Expense"
              onClick={() => handleQuickAction('addExpense')}
              color="blue"
            />
            <QuickActionButton
              icon="FileText"
              label="View Reports"
              onClick={() => handleQuickAction('viewReports')}
              color="green"
              variant="outline"
            />
            <QuickActionButton
              icon="Download"
              label="Export Data"
              onClick={() => handleQuickAction('exportData')}
              color="purple"
              variant="outline"
            />
            <QuickActionButton
              icon="Settings"
              label="Settings"
              onClick={() => handleQuickAction('settings')}
              color="indigo"
              variant="outline"
            />
          </div>
        </div>

        {/* Global Filter */}
        <div className="global-filter-container">
          <GlobalFilter onFilterChange={handleFilterChange} filters={filters} />
        </div>

        {/* Dashboard Notifications */}
        <div className="dashboard-grid cols-1">
          <DashboardNotification
            notifications={notifications}
            onDismiss={handleNotificationDismiss}
            onAction={handleNotificationAction}
            maxNotifications={3}
          />
        </div>

        {/* Enhanced Summary Cards */}
        <div className="dashboard-grid cols-3">
          <SummaryCard
            title="Total Expenses"
            value={summaryStats.totalExpenses}
            change={summaryStats.monthlyGrowth}
            iconName="DollarSign"
            color="blue"
            loading={statsLoading}
          />
          <SummaryCard
            title="Active Departments"
            value={summaryStats.totalDepartments}
            iconName="Users"
            color="green"
            loading={statsLoading}
          />
          <SummaryCard
            title="Average per Expense"
            value={summaryStats.averagePerExpense}
            iconName="TrendingUp"
            color="purple"
            loading={statsLoading}
          />
        </div>

        {/* Additional Summary Cards */}
        <div className="dashboard-grid cols-2">
          <SummaryCard
            title="Pending Payments"
            value={summaryStats.pendingPayments}
            iconName="Clock"
            color="orange"
            loading={statsLoading}
          />
          <SummaryCard
            title="Overdue Payments"
            value={summaryStats.overduePayments}
            iconName="AlertTriangle"
            color="red"
            loading={statsLoading}
          />
        </div>

        {/* Enhanced Charts Section */}
        <div className="dashboard-grid cols-1">
          {/* Today's Spending Chart */}
          <AnimatedCard delay={0.5} gradient={true}>
            <SectionHeader 
              title="Today's Spending Breakdown" 
              iconName="Activity"
              subtitle="Real-time spending analysis for today"
              collapsible={true}
              isCollapsed={collapsedSections.todaySpending}
              onToggle={() => toggleSection('todaySpending')}
            />
            <div className="mt-6">
              <div className="today-spending">
                <div className="today-spending-header">
                  <span className="today-spending-title">Today's Spending</span>
                  <span className="today-spending-date">
                    {new Date().toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                </div>
                <div className="today-spending-amount">
                  {(() => {
                    const today = new Date();
                    const todayExpenses = safeExpenseStats.filter(expense => {
                      const expenseDate = new Date(expense.date_paid || expense.date || expense.created_at);
                      return expenseDate.toDateString() === today.toDateString();
                    });
                    const totalToday = todayExpenses.reduce((sum, expense) => {
                      const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
                      return sum + parseFloat(amount);
                    }, 0);
                    return totalToday.toLocaleString('en-US', { style: 'currency', currency: 'AED' });
                  })()}
                </div>
                <div className="today-spending-stats">
                  <span className="mr-2">📊</span>
                  {(() => {
                    const today = new Date();
                    const todayExpenses = safeExpenseStats.filter(expense => {
                      const expenseDate = new Date(expense.date_paid || expense.date || expense.created_at);
                      return expenseDate.toDateString() === today.toDateString();
                    });
                    return `${todayExpenses.length} transactions today`;
                  })()}
                </div>
              </div>
              <TodaySpendingChart data={safeExpenseStats} />
            </div>
          </AnimatedCard>
        </div>

        {/* Trend Analysis Section */}
        <div className="dashboard-grid cols-2">
          <AnimatedCard delay={0.6}>
            <SectionHeader 
              title="Monthly Spending Trends" 
              iconName="TrendingUp"
              subtitle="Track spending patterns over time"
              collapsible={true}
              isCollapsed={collapsedSections.monthlyTrends}
              onToggle={() => toggleSection('monthlyTrends')}
            />
            <div className="mt-6">
              <TrendChart 
                data={safeExpenseStats} 
                title="Monthly Spending Trends"
                subtitle="Compare spending across months"
                type="monthly"
              />
            </div>
          </AnimatedCard>

          <AnimatedCard delay={0.7}>
            <SectionHeader 
              title="Department Analysis" 
              iconName="PieChart"
              subtitle="Spending breakdown by department"
              collapsible={true}
              isCollapsed={collapsedSections.departmentAnalysis}
              onToggle={() => toggleSection('departmentAnalysis')}
            />
            <div className="mt-6">
              <TrendChart 
                data={safeExpenseStats} 
                title="Department Spending"
                subtitle="Visualize spending by department"
              />
            </div>
          </AnimatedCard>
        </div>

        {/* Enhanced Payment Calendar */}
        <AnimatedCard delay={0.8}>
          <SectionHeader 
            title="Payment Calendar" 
            iconName="Calendar"
            subtitle="Schedule and track upcoming payments"
            collapsible={true}
            isCollapsed={collapsedSections.paymentCalendar}
            onToggle={() => toggleSection('paymentCalendar')}
          />
          <div className="mt-6">
            <PaymentCalendar 
              events={safePaymentEvents} 
              onDateClick={handleDateClick}
              onEventsUpdate={handleEventsUpdate}
            />
          </div>
        </AnimatedCard>

        {/* Enhanced Detailed Expense Data */}
        <AnimatedCard className="mb-12" delay={0.9}>
          <SectionHeader 
            title="Detailed Expense Data" 
            iconName="LineChart"
            subtitle="Comprehensive view of all expense transactions"
            collapsible={true}
            isCollapsed={collapsedSections.expenseData}
            onToggle={() => toggleSection('expenseData')}
          />
          {statsError ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
              <p className="text-red-600 mb-2 font-medium">Failed to load expense data</p>
              <p className="text-sm text-gray-500">{statsError.message}</p>
            </div>
          ) : (
            <div className="mt-6">
              <ScrollableExpenseTable data={safeExpenseStats} />
            </div>
          )}
        </AnimatedCard>
      </div>
    </div>
  );
}
