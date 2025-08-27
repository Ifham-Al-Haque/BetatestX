// src/pages/Dashboard.jsx
import React, { useState, useMemo, Suspense } from 'react';
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

// Import dashboard styles
import './Dashboard.css';

// Enhanced color scheme for charts and UI elements
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#EC4899', '#14B8A6'];

// Enhanced Summary Card Component
const SummaryCard = ({ title, value, change, iconName, color = 'blue' }) => {
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
    <div className="summary-card group relative overflow-hidden bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      {/* Gradient background overlay */}
      <div className={`absolute inset-0 bg-gradient-to-br ${colorVariants[color]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`} />
      
      <div className="summary-card-content relative z-10 flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-6">
          <p className="text-sm font-medium text-gray-600 mb-2 opacity-80">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{value}</p>
          {change !== undefined && (
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

// Enhanced Section Header Component
const SectionHeader = ({ title, iconName, action, subtitle }) => {
  const Icon = LucideIcons[iconName];
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
      {action && <div className="section-header-action">{action}</div>}
    </div>
  );
};

// Enhanced Animated Card Component
const AnimatedCard = ({ children, className = '', delay = 0, gradient = false }) => (
  <div className={`animated-card ${gradient ? 'gradient' : ''} ${className}`}>
    {/* Subtle border gradient */}
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 opacity-0 hover:opacity-100 transition-opacity duration-300" />
    
    {/* Content */}
    <div className="relative z-10 p-8">
      {children}
    </div>
  </div>
);

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { data: expenseStats, isLoading: statsLoading, error: statsError } = useExpenseStats();
  const { data: paymentEvents } = usePaymentEvents();
  const safePaymentEvents = paymentEvents || [];
  const [filters, setFilters] = useState({});
  const queryClient = useQueryClient();

  const safeExpenseStats = expenseStats || [];

  // Handle events update from calendar
  const handleEventsUpdate = (updatedEvents) => {
    // Update the query cache with the new events
    queryClient.setQueryData(['paymentEvents'], updatedEvents);
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!safeExpenseStats.length) {
      return {
        totalExpenses: '0',
        totalDepartments: '0',
        averagePerExpense: '0',
        monthlyGrowth: 0
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

    return {
      totalExpenses: totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      totalDepartments: uniqueDepartments.size.toString(),
      averagePerExpense: averagePerExpense.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      monthlyGrowth: Math.round(monthlyGrowth)
    };
  }, [safeExpenseStats]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    // You can add a modal or navigation here
  };

  const handleDateClick = (date) => {
    // Handle date click from calendar
    console.log('Date clicked:', date);
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

        {/* Global Filter */}
        <div className="global-filter-container">
          <GlobalFilter onFilterChange={handleFilterChange} filters={filters} />
        </div>

        {/* Enhanced Summary Cards */}
        <div className="dashboard-grid cols-3">
          <SummaryCard
            title="Total Expenses"
            value={summaryStats.totalExpenses}
            change={summaryStats.monthlyGrowth}
            iconName="DollarSign"
            color="blue"
          />
          <SummaryCard
            title="Active Departments"
            value={summaryStats.totalDepartments}
            iconName="Users"
            color="green"
          />
          <SummaryCard
            title="Average per Expense"
            value={summaryStats.averagePerExpense}
            iconName="TrendingUp"
            color="purple"
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

        {/* Enhanced Payment Calendar */}
        <AnimatedCard delay={0.6}>
          <SectionHeader 
            title="Payment Calendar" 
            iconName="Calendar"
            subtitle="Schedule and track upcoming payments"
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
        <AnimatedCard className="mb-12" delay={0.8}>
          <SectionHeader 
            title="Detailed Expense Data" 
            iconName="LineChart"
            subtitle="Comprehensive view of all expense transactions"
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
