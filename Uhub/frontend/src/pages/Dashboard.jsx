import React, { useState, useMemo, Suspense } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Users, 
  Package, 
  CreditCard, 
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Plus,
  MoreVertical
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenseStats } from '../hooks/useExpenseStats';
import { usePaymentEvents } from '../hooks/usePaymentEvents';
import Header from '../components/Header';
import UpcomingPaymentEvents from '../components/UpcomingPaymentEvents';
import ScrollableExpenseTable from '../components/ScrollableExpenseTable';
import LoadingSpinner from '../components/LoadingSpinner';

// Lazy load heavy components
const InteractiveExpenseChart = React.lazy(() => import('../components/InteractiveExpenseChart'));
const TodaySpendingChart = React.lazy(() => import('../components/TodaySpendingChart'));

// Color scheme for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// Summary Card Component
const SummaryCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {change && (
          <div className="flex items-center mt-2">
            <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? '+' : ''}{change}%
            </span>
            <span className="text-sm text-gray-500 ml-1">vs last month</span>
          </div>
        )}
      </div>
      <div className={`p-3 rounded-lg bg-${color}-50`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </motion.div>
);

// Section Header Component
const SectionHeader = ({ title, icon: Icon, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
    {action && action}
  </div>
);

// Animated Card Component
const AnimatedCard = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${className}`}
  >
    {children}
  </motion.div>
);

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { data: expenseStats, isLoading: statsLoading, error: statsError } = useExpenseStats();
  const { data: paymentEvents, isLoading: eventsLoading, error: eventsError } = usePaymentEvents();

  const safeExpenseStats = expenseStats || [];
  const safePaymentEvents = paymentEvents || [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!safeExpenseStats.length) {
      return {
        totalExpenses: '0',
        totalEmployees: '0',
        totalAssets: '0',
        monthlyGrowth: 0
      };
    }

    const totalExpenses = safeExpenseStats.reduce((sum, expense) => sum + (expense.amount_aed || 0), 0);
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    
    const currentMonthExpenses = safeExpenseStats.filter(expense => {
      const expenseDate = new Date(expense.date_paid);
      return expenseDate.getMonth() === currentMonth && expenseDate.getFullYear() === currentYear;
    }).reduce((sum, expense) => sum + (expense.amount_aed || 0), 0);

    const lastMonthExpenses = safeExpenseStats.filter(expense => {
      const expenseDate = new Date(expense.date_paid);
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return expenseDate.getMonth() === lastMonth && expenseDate.getFullYear() === lastMonthYear;
    }).reduce((sum, expense) => sum + (expense.amount_aed || 0), 0);

    const monthlyGrowth = lastMonthExpenses > 0 
      ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses * 100).toFixed(1)
      : 0;

    return {
      totalExpenses: totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      totalEmployees: '25', // This should come from employees data
      totalAssets: '150', // This should come from assets data
      monthlyGrowth: parseFloat(monthlyGrowth)
    };
  }, [safeExpenseStats]);

  // Process expense data for charts
  const monthlyData = useMemo(() => {
    if (!safeExpenseStats.length) return [];

    const monthlyExpenses = {};
    safeExpenseStats.forEach(expense => {
      if (expense.date_paid && expense.amount_aed) {
        const date = new Date(expense.date_paid);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyExpenses[monthKey] = (monthlyExpenses[monthKey] || 0) + expense.amount_aed;
      }
    });

    return Object.entries(monthlyExpenses)
      .map(([month, amount]) => ({ month, amount }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12); // Last 12 months
  }, [safeExpenseStats]);

  const departmentData = useMemo(() => {
    if (!safeExpenseStats.length) return [];

    const deptExpenses = {};
    safeExpenseStats.forEach(expense => {
      if (expense.department && expense.amount_aed) {
        deptExpenses[expense.department] = (deptExpenses[expense.department] || 0) + expense.amount_aed;
      }
    });

    return Object.entries(deptExpenses)
      .map(([department, amount]) => ({ department, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [safeExpenseStats]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-600 mt-2">
            Here's what's happening with your organization today.
          </p>
        </motion.div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <SummaryCard
            title="Total Expenses"
            value={summaryStats.totalExpenses}
            change={summaryStats.monthlyGrowth}
            icon={CreditCard}
            color="blue"
          />
          <SummaryCard
            title="Total Employees"
            value={summaryStats.totalEmployees}
            icon={Users}
            color="green"
          />
          <SummaryCard
            title="Total Assets"
            value={summaryStats.totalAssets}
            icon={Package}
            color="yellow"
          />
          <SummaryCard
            title="Active Projects"
            value="12"
            icon={Activity}
            color="purple"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Expense Chart */}
          <AnimatedCard delay={0.1}>
            <SectionHeader title="Monthly Expense Trend" icon={TrendingUp} />
            <Suspense fallback={<LoadingSpinner text="Loading chart..." />}>
              <InteractiveExpenseChart data={monthlyData} />
            </Suspense>
          </AnimatedCard>

          {/* Departmental Expenses */}
          <AnimatedCard delay={0.2}>
            <SectionHeader title="Departmental Expenses" icon={PieChart} />
            <div className="h-64 flex items-center justify-center">
              {departmentData.length > 0 ? (
                <div className="space-y-3 w-full">
                  {departmentData.slice(0, 5).map((dept, index) => (
                    <div key={dept.department} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium text-gray-700">{dept.department}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {dept.amount.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No expense data available</p>
                </div>
              )}
            </div>
          </AnimatedCard>
        </div>

        {/* Today's Spending Chart */}
        <AnimatedCard className="mb-8" delay={0.3}>
          <SectionHeader title="Today's Spending Breakdown" icon={Activity} />
          <Suspense fallback={<LoadingSpinner text="Loading spending chart..." />}>
            <TodaySpendingChart data={safeExpenseStats} />
          </Suspense>
        </AnimatedCard>

        {/* Upcoming Payment Events */}
        <AnimatedCard className="mb-8" delay={0.4}>
          <SectionHeader 
            title="Upcoming Payment Events" 
            icon={Calendar}
            action={
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                <Plus className="w-4 h-4" />
                <span>Add Event</span>
              </button>
            }
          />
          {eventsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load payment events</p>
              <p className="text-sm text-gray-500">{eventsError.message}</p>
            </div>
          ) : (
            <UpcomingPaymentEvents />
          )}
        </AnimatedCard>

        {/* Detailed Expense Data */}
        <AnimatedCard className="mb-8" delay={0.5}>
          <SectionHeader title="Detailed Expense Data" icon={BarChart3} />
          {statsError ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-2">Failed to load expense data</p>
              <p className="text-sm text-gray-500">{statsError.message}</p>
            </div>
          ) : (
            <ScrollableExpenseTable data={safeExpenseStats} />
          )}
        </AnimatedCard>
      </main>
    </div>
  );
}


