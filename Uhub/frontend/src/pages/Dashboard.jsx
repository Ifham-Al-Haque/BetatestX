// src/pages/Dashboard.jsx
import React, { useState, useMemo, Suspense } from 'react';
import * as LucideIcons from 'lucide-react';
import {
  LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
  BarChart, Bar, LabelList
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useExpenseStats } from '../hooks/useExpenseStats';
import { usePaymentEvents } from '../hooks/usePaymentEvents';
import { useQueryClient } from '@tanstack/react-query';
import GlobalFilter from '../components/GlobalFilter';
import UpcomingPaymentEvents from '../components/UpcomingPaymentEvents';
import PaymentCalendar from '../components/PaymentCalendar';

import ScrollableExpenseTable from '../components/ScrollableExpenseTable';
import LoadingSpinner from '../components/LoadingSpinner';

// Import components directly instead of lazy loading
import InteractiveExpenseChart from '../components/InteractiveExpenseChart';
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

// Enhanced Departmental Expenses Chart Component
const DepartmentalExpensesLineChart = ({ data }) => {
  const [filterType, setFilterType] = useState('monthly');

  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  if (!data || data.length === 0) {
    const LineChartIcon = LucideIcons.LineChart;
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          {LineChartIcon && <LineChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />}
          <p className="text-lg font-medium text-gray-400">No departmental expense data available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear here once expenses are added</p>
        </div>
      </div>
    );
  }

  const processData = () => {
    const deptData = {};

    data.forEach(expense => {
      // Try different possible field names for department and amount
      const dept = (expense.department || expense.dept || expense.division || 'Unknown Department')?.trim();
      const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
      
      if (!dept || !amount || amount <= 0) return;

      if (!deptData[dept]) {
        deptData[dept] = { monthly: {}, yearly: {} };
      }

      const date =
        parseDate(expense.date_paid) ||
        parseDate(expense.date) ||
        parseDate(expense.created_at) ||
        parseDate(expense.updated_at);

      if (date) {
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        deptData[dept].monthly[monthKey] =
          (deptData[dept].monthly[monthKey] || 0) + parseFloat(amount);

        const yearKey = date.getFullYear().toString();
        deptData[dept].yearly[yearKey] =
          (deptData[dept].yearly[yearKey] || 0) + parseFloat(amount);
      }
    });

    return deptData;
  };

  const deptData = processData();
  const departments = Object.keys(deptData);

  const getChartData = () => {
    if (filterType === 'monthly') {
      const allMonths = new Set();
      departments.forEach(dept => {
        Object.keys(deptData[dept].monthly).forEach(month => allMonths.add(month));
      });
      const sortedMonths = Array.from(allMonths).sort();

      // Generate sample data if no real data exists
      if (sortedMonths.length === 0) {
        const sampleMonths = [];
        const currentDate = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          sampleMonths.push(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`);
        }
        return sampleMonths.map(month => {
          const row = { period: month };
          departments.forEach(dept => {
            row[dept] = Math.random() * 10000 + 1000;
          });
          return row;
        });
      }

      return sortedMonths.map(month => {
        const row = { period: month };
        departments.forEach(dept => {
          row[dept] = deptData[dept].monthly[month] || 0;
        });
        return row;
      });
    }

    if (filterType === 'yearly') {
      const allYears = new Set();
      departments.forEach(dept => {
        Object.keys(deptData[dept].yearly).forEach(year => allYears.add(year));
      });
      const sortedYears = Array.from(allYears).sort();

      // Generate sample data if no real data exists
      if (sortedYears.length === 0) {
        const sampleYears = [];
        const currentDate = new Date();
        for (let i = 2; i >= 0; i--) {
          sampleYears.push(currentDate.getFullYear() - i);
        }
        return sampleYears.map(year => {
          const row = { period: year.toString() };
          departments.forEach(dept => {
            row[dept] = Math.random() * 100000 + 10000;
          });
          return row;
        });
      }

      return sortedYears.map(year => {
        const row = { period: year.toString() };
        departments.forEach(dept => {
          row[dept] = deptData[dept].yearly[year] || 0;
        });
        return row;
      });
    }

    return [];
  };

  const chartData = getChartData();

  return (
    <div className="space-y-6">
      {/* Enhanced filter buttons */}
      <div className="flex justify-center">
        <div className="inline-flex bg-gray-100 rounded-xl p-1 shadow-inner">
          <button
            onClick={() => setFilterType('monthly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filterType === 'monthly'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            Monthly View
          </button>
          <button
            onClick={() => setFilterType('yearly')}
            className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
              filterType === 'yearly'
                ? 'bg-white text-blue-600 shadow-md'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-200'
            }`}
          >
            Yearly View
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <RechartsLineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="period" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => {
              if (filterType === 'monthly') {
                const [year, month] = value.split('-');
                return `${month}/${year.slice(2)}`;
              }
              return value;
            }}
          />
          <YAxis 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #E5E7EB',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
            }}
            formatter={(value, name) => [
              `${(value / 1000).toFixed(1)}k AED`,
              name
            ]}
            labelFormatter={(label) => {
              if (filterType === 'monthly') {
                const [year, month] = label.split('-');
                const monthNames = [
                  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                ];
                return `${monthNames[parseInt(month) - 1]} ${year}`;
              }
              return `Year ${label}`;
            }}
          />
          <Legend />
          {departments.map((dept, index) => (
            <Line
              key={dept}
              type="monotone"
              dataKey={dept}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={3}
              dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 5 }}
              activeDot={{ r: 8, strokeWidth: 2, stroke: 'white' }}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Average Spending Chart Component
const AverageSpendingChart = ({ data }) => {
  // Debug: Log the data structure to see what fields are available
  console.log('AverageSpendingChart data:', data);
  if (data && data.length > 0) {
    console.log('Sample expense object:', data[0]);
    console.log('Available fields:', Object.keys(data[0]));
  }

  if (!data || data.length === 0) {
    const BarChartIcon = LucideIcons.BarChart3;
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          {BarChartIcon && <BarChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />}
          <p className="text-lg font-medium text-gray-400">No expense data available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear here once expenses are added</p>
        </div>
      </div>
    );
  }

  // Calculate average spending by service - try different possible field names
  const serviceStats = {};
  data.forEach(expense => {
    // Try different possible field names for service and amount
    const serviceName = expense.service_name || expense.service || expense.category || expense.description || 'Unknown Service';
    const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
    
    if (!serviceName || !amount || amount <= 0) return;
    
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = {
        total: 0,
        count: 0
      };
    }
    serviceStats[serviceName].total += parseFloat(amount);
    serviceStats[serviceName].count += 1;
  });

  console.log('Processed service stats:', serviceStats);

  const chartData = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service: service.length > 20 ? service.substring(0, 20) + '...' : service,
      average: stats.total / stats.count,
      count: stats.count
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8); // Top 8 services

  console.log('Chart data:', chartData);

  // If no valid data, show empty state
  if (chartData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <span className="text-4xl mb-4">📊</span>
          <p className="text-lg font-medium text-gray-400">No spending data available</p>
          <p className="text-sm text-gray-400 mt-1">Check if expense data has service names and amounts</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData} layout="horizontal" margin={{ left: 20, right: 20 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          type="number" 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          tickFormatter={(value) => {
            if (value === 0) return '0';
            if (value < 1000) return `${value.toFixed(0)}`;
            return `${(value / 1000).toFixed(1)}k`;
          }}
        />
        <YAxis 
          type="category" 
          dataKey="service" 
          tick={{ fontSize: 12, fill: '#6B7280' }}
          width={120}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value, name) => [
            `${value.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}`,
            name === 'average' ? 'Average' : name
          ]}
        />
        <Bar 
          dataKey="average" 
          fill="url(#gradient)"
          radius={[0, 6, 6, 0]}
        />
        <defs>
          <linearGradient id="gradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#3B82F6" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>
        </defs>
      </BarChart>
    </ResponsiveContainer>
  );
};

// Enhanced Top Expense Categories Component
const TopExpenseCategories = ({ data }) => {
  if (!data || data.length === 0) {
    const TrendingUpIcon = LucideIcons.TrendingUp;
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          {TrendingUpIcon && <TrendingUpIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />}
          <p className="text-lg font-medium text-gray-400">No expense data available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear here once expenses are added</p>
        </div>
      </div>
    );
  }

  // Calculate total spending by service - try different possible field names
  const serviceStats = {};
  data.forEach(expense => {
    // Try different possible field names for service and amount
    const serviceName = expense.service_name || expense.service || expense.category || expense.description || 'Unknown Service';
    const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
    
    if (!serviceName || !amount || amount <= 0) return;
    
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = {
        total: 0,
        count: 0
      };
    }
    serviceStats[serviceName].total += parseFloat(amount);
    serviceStats[serviceName].count += 1;
  });

  const topCategories = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service,
      total: stats.total,
      count: stats.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5 categories

  // If no valid data, show empty state
  if (topCategories.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <span className="text-4xl mb-4">📊</span>
          <p className="text-lg font-medium text-gray-400">No spending data available</p>
          <p className="text-sm text-gray-400 mt-1">Check if expense data has service names and amounts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-80">
      <div className="h-full overflow-y-auto space-y-4 pr-2">
        {topCategories.map((item, index) => (
          <div key={item.service} className="group bg-gradient-to-r from-white to-gray-50 rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-blue-200">
            <div className="flex items-center justify-between w-full">
              {/* Left side - Color and Service info */}
              <div className="flex items-center space-x-4 min-w-0 flex-1">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm flex-shrink-0 ring-2 ring-white"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800 truncate mb-1 group-hover:text-blue-600 transition-colors">
                    {item.service}
                  </div>
                  <div className="text-xs text-gray-500 flex items-center">
                    <span className="mr-2">📊</span>
                    {item.count} transactions
                  </div>
                </div>
              </div>
              
              {/* Right side - Amount and percentage */}
              <div className="text-right ml-4 min-w-[160px] flex-shrink-0">
                <div className="text-sm font-bold text-gray-900 mb-1">
                  {item.total.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                </div>
                <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {((item.total / Math.max(...topCategories.map(d => d.total))) * 100).toFixed(1)}% of total
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function Dashboard() {
  const { user, userProfile } = useAuth();
  const { data: expenseStats, isLoading: statsLoading, error: statsError } = useExpenseStats();
  const { data: paymentEvents, isLoading: eventsLoading, error: eventsError } = usePaymentEvents();
  const [filters, setFilters] = useState({});
  const queryClient = useQueryClient();

  const safeExpenseStats = expenseStats || [];
  const safePaymentEvents = paymentEvents || [];

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

  // Process monthly data for charts
  const monthlyData = useMemo(() => {
    if (!safeExpenseStats.length) return [];

    const monthlyStats = {};
    safeExpenseStats.forEach(expense => {
      const date = expense.date_paid || expense.date || expense.created_at;
      const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
      
      if (!date || !amount || amount <= 0) return;
      
      const expenseDate = new Date(date);
      const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = 0;
      }
      monthlyStats[monthKey] += parseFloat(amount);
    });

    return Object.entries(monthlyStats)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
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
  const isLoading = (statsLoading || eventsLoading) && !safeExpenseStats.length && !safePaymentEvents.length;

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
          {/* Monthly Expense Chart */}
          <AnimatedCard delay={0.1} gradient={true}>
            <SectionHeader 
              title="Monthly Expense Trend" 
              iconName="TrendingUp"
              subtitle="Track your spending patterns over time"
            />
            <div className="mt-6">
              <InteractiveExpenseChart data={monthlyData} />
            </div>
          </AnimatedCard>

          {/* Departmental Expenses Line Chart */}
          <AnimatedCard delay={0.2}>
            <SectionHeader 
              title="Departmental Expenses" 
              iconName="LineChart"
              subtitle="Compare spending across different departments"
            />
            <div className="mt-6">
              <DepartmentalExpensesLineChart data={safeExpenseStats} />
            </div>
          </AnimatedCard>

          {/* Average Spending Chart and Top Expense Categories - Side by Side */}
          <div className="dashboard-grid cols-2">
            {/* Average Spending Chart */}
            <AnimatedCard delay={0.3}>
              <SectionHeader 
                title="Average Spending by Service" 
                iconName="DollarSign"
                subtitle="Top services by average transaction value"
              />
              <div className="mt-6">
                <AverageSpendingChart data={safeExpenseStats} />
              </div>
            </AnimatedCard>

            {/* Top Expense Categories */}
            <AnimatedCard delay={0.4}>
              <SectionHeader 
                title="Top Expense Categories" 
                iconName="BarChart3"
                subtitle="Highest spending categories overview"
              />
              <div className="mt-6">
                <TopExpenseCategories data={safeExpenseStats} />
              </div>
            </AnimatedCard>
          </div>

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

        {/* Enhanced Payment Calendar and Upcoming Events */}
        <div className="dashboard-grid cols-2">
          {/* Payment Calendar */}
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

          {/* Upcoming Payment Events */}
          <AnimatedCard delay={0.7}>
            <SectionHeader 
              title="Upcoming Payment Events" 
              iconName="Clock"
              subtitle="Stay on top of your payment schedule"
              action={
                <button className="flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium">
                  {(() => {
                    const PlusIcon = LucideIcons.Plus;
                    return PlusIcon && <PlusIcon className="w-4 h-4" />;
                  })()}
                  <span>Add Event</span>
                </button>
              }
            />
            {eventsError ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⚠️</span>
                </div>
                <p className="text-red-600 mb-2 font-medium">Failed to load payment events</p>
                <p className="text-sm text-gray-500">{eventsError.message}</p>
              </div>
            ) : (
              <div className="mt-6">
                <UpcomingPaymentEvents />
              </div>
            )}
          </AnimatedCard>
        </div>

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
