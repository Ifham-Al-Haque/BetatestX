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
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import GlobalFilter from '../components/GlobalFilter';
import UpcomingPaymentEvents from '../components/UpcomingPaymentEvents';
import PaymentCalendar from '../components/PaymentCalendar';

import ScrollableExpenseTable from '../components/ScrollableExpenseTable';
import LoadingSpinner from '../components/LoadingSpinner';

// Import components directly instead of lazy loading
import InteractiveExpenseChart from '../components/InteractiveExpenseChart';
import TodaySpendingChart from '../components/TodaySpendingChart';
import RoleDebug from '../components/RoleDebug';

// Color scheme for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

// Summary Card Component
const SummaryCard = ({ title, value, change, iconName, color = 'blue' }) => {
  const Icon = LucideIcons[iconName];
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
      <div className="flex items-center justify-between h-full">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mb-2">{value}</p>
          {change !== undefined && (
            <div className="flex items-center">
              <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {change >= 0 ? '+' : ''}{change}%
              </span>
              <span className="text-sm text-gray-500 ml-1">vs last month</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-lg bg-${color}-50 flex-shrink-0 ml-4`}>
          {Icon && <Icon className={`w-6 h-6 text-${color}-600`} />}
        </div>
      </div>
    </div>
  );
};

// Section Header Component
const SectionHeader = ({ title, iconName, action }) => {
  const Icon = LucideIcons[iconName];
  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
          {Icon && <Icon className="w-5 h-5 text-blue-600" />}
        </div>
        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
};

// Animated Card Component
const AnimatedCard = ({ children, className = '', delay = 0 }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300">
    {children}
  </div>
);

// Departmental Expenses Chart Component using Recharts
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
          {LineChartIcon && <LineChartIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />}
          <p>No departmental expense data available</p>
        </div>
      </div>
    );
  }

  const processData = () => {
    const deptData = {};

    data.forEach(expense => {
      const dept = expense.department?.trim();
      if (!dept || !expense.amount_aed) return;

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
          (deptData[dept].monthly[monthKey] || 0) + expense.amount_aed;

        const yearKey = date.getFullYear().toString();
        deptData[dept].yearly[yearKey] =
          (deptData[dept].yearly[yearKey] || 0) + expense.amount_aed;
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
        const currentYear = new Date().getFullYear();
        for (let i = 2; i >= 0; i--) {
          sampleYears.push((currentYear - i).toString());
        }
        return sampleYears.map(year => {
          const row = { period: year };
          let total = 0;
          departments.forEach(dept => {
            const value = Math.random() * 50000 + 10000;
            row[dept] = value;
            total += value;
          });
          row.total = total;
          return row;
        });
      }

      return sortedYears.map(year => {
        const row = { period: year };
        let total = 0;
        departments.forEach(dept => {
          const value = deptData[dept].yearly[year] || 0;
          row[dept] = value;
          total += value;
        });
        row.total = total;
        return row;
      });
    }
    return [];
  };

  const chartData = getChartData();

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-8 border border-gray-100 shadow-sm">
      {/* Filter Buttons */}
      <div className="flex space-x-3 mb-6">
        {['monthly', 'yearly'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-6 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
              filterType === type
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </button>
        ))}
      </div>

             {/* Chart */}
       <div className="h-[500px]">
         <ResponsiveContainer width="100%" height="100%">
           {filterType === 'monthly' ? (
             <RechartsLineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="period" angle={-45} textAnchor="end" height={70} />
               <YAxis tickFormatter={(v) => `AED ${v.toLocaleString()}`} />
               <Tooltip formatter={(v) => `AED ${v.toLocaleString()}`} />
               <Legend />
               {departments.map((dept, index) => (
                 <Line
                   key={dept}
                   type="monotone"
                   dataKey={dept}
                   stroke={COLORS[index % COLORS.length]}
                   strokeWidth={2}
                   dot={{ r: 4 }}
                   activeDot={{ r: 6 }}
                 />
               ))}
             </RechartsLineChart>
           ) : (
             <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 10 }}>
               <CartesianGrid strokeDasharray="3 3" />
               <XAxis dataKey="period" />
               <YAxis tickFormatter={(v) => `AED ${v.toLocaleString()}`} />
               <Tooltip formatter={(v) => `AED ${v.toLocaleString()}`} />
               <Legend />
               {departments.map((dept, index) => (
                 <Bar
                   key={dept}
                   dataKey={dept}
                   stackId="a"
                   fill={COLORS[index % COLORS.length]}
                 />
               ))}
               <Bar dataKey="total" fill="transparent">
                 <LabelList
                   dataKey="total"
                   position="top"
                   formatter={(v) => `AED ${v.toLocaleString()}`}
                 />
               </Bar>
             </BarChart>
           )}
         </ResponsiveContainer>
       </div>

      {/* Summary table for yearly view */}
      {filterType === 'yearly' && (
        <div className="mt-6 space-y-4">
          {chartData.map((period, index) => (
            <div key={index} className="p-3 bg-gray-50 rounded-lg">
              <div className="flex justify-between font-semibold text-gray-700 mb-2">
                <span>{period.period} Total:</span>
                <span>{period.total.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {departments.map((dept, i) => (
                  <div key={dept} className="flex items-center space-x-2">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="text-sm text-gray-600">{dept}:</span>
                    <span className="text-sm font-medium">
                      {period[dept]?.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Average Spending Chart Component
const AverageSpendingChart = ({ data }) => {
  if (!data || data.length === 0) {
    const DollarSignIcon = LucideIcons.DollarSign;
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          {DollarSignIcon && <DollarSignIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />}
          <p>No average spending data available</p>
        </div>
      </div>
    );
  }

  // Calculate average spending per service
  const serviceStats = {};
  data.forEach(expense => {
    if (expense.service_name && expense.amount_aed) {
      if (!serviceStats[expense.service_name]) {
        serviceStats[expense.service_name] = {
          total: 0,
          count: 0
        };
      }
      serviceStats[expense.service_name].total += expense.amount_aed;
      serviceStats[expense.service_name].count += 1;
    }
  });

  const averageData = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service,
      average: stats.total / stats.count,
      total: stats.total,
      count: stats.count
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 10); // Top 10 services by average spending

  return (
    <div className="h-80">
      <div className="h-full overflow-y-auto space-y-4 pr-2">
        {averageData.map((item, index) => (
          <div key={item.service} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between w-full">
              {/* Left side - Color and Service info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800 truncate mb-1">
                    {item.service}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.count} transactions • {((item.average / Math.max(...averageData.map(d => d.average))) * 100).toFixed(1)}% of max
                  </div>
                </div>
              </div>
              
              {/* Right side - Progress bar and Amount */}
              <div className="flex items-center space-x-4 ml-4">
                <div className="w-24 flex-shrink-0">
                  <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500 ease-out"
                      style={{ 
                        backgroundColor: COLORS[index % COLORS.length],
                        width: (() => {
                          const maxAverage = Math.max(...averageData.map(d => d.average));
                          const percentage = maxAverage > 0 ? (item.average / maxAverage) * 100 : 0;
                          return Math.min(percentage, 100) + '%';
                        })()
                      }}
                    />
                  </div>
                </div>
                <div className="text-right min-w-[140px] flex-shrink-0">
                  <div className="text-sm font-bold text-gray-900 mb-1">
                    {item.average.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                  </div>
                  <div className="text-xs text-gray-500">
                    avg
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Top Expense Categories Component
const TopExpenseCategories = ({ data }) => {
  if (!data || data.length === 0) {
    const DollarSignIcon = LucideIcons.DollarSign;
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          {DollarSignIcon && <DollarSignIcon className="w-12 h-12 mx-auto mb-2 text-gray-300" />}
          <p>No expense data available</p>
        </div>
      </div>
    );
  }

  // Calculate top expense categories by service
  const serviceStats = {};
  data.forEach(expense => {
    if (expense.service_name && expense.amount_aed) {
      if (!serviceStats[expense.service_name]) {
        serviceStats[expense.service_name] = {
          total: 0,
          count: 0
        };
      }
      serviceStats[expense.service_name].total += expense.amount_aed;
      serviceStats[expense.service_name].count += 1;
    }
  });

  const topCategories = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service,
      total: stats.total,
      count: stats.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5); // Top 5 categories

  return (
    <div className="h-80">
      <div className="h-full overflow-y-auto space-y-4 pr-2">
        {topCategories.map((item, index) => (
          <div key={item.service} className="bg-gradient-to-r from-white to-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="flex items-center justify-between w-full">
              {/* Left side - Color and Service info */}
              <div className="flex items-center space-x-3 min-w-0 flex-1">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm flex-shrink-0"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-gray-800 truncate mb-1">
                    {item.service}
                  </div>
                  <div className="text-xs text-gray-500">
                    {item.count} transactions
                  </div>
                </div>
              </div>
              
              {/* Right side - Amount and percentage */}
              <div className="text-right ml-4 min-w-[160px] flex-shrink-0">
                <div className="text-sm font-bold text-gray-900 mb-1">
                  {item.total.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                </div>
                <div className="text-xs text-gray-500">
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

    // Calculate unique departments
    const uniqueDepartments = new Set(safeExpenseStats.map(expense => expense.department).filter(Boolean));
    
    // Calculate average per expense
    const averagePerExpense = totalExpenses / safeExpenseStats.length;

    return {
      totalExpenses: totalExpenses.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
      totalDepartments: uniqueDepartments.size.toString(),
      averagePerExpense: averagePerExpense.toLocaleString('en-US', { style: 'currency', currency: 'AED' }),
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

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  const handleDateClick = (date, events) => {
    console.log('Date clicked:', date, 'Events:', events);
    // You can add a modal or navigation here
  };

  // Show loading state only if both queries are loading and we have no cached data
  const isLoading = (statsLoading || eventsLoading) && !safeExpenseStats.length && !safePaymentEvents.length;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 ml-80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSpinner size="xl" text="Loading dashboard data..." />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 ml-80">
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome Section */}
          <div
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {userProfile?.full_name || user?.email?.split('@')[0] || 'User'}! 👋
            </h1>
            <p className="text-gray-600 mt-2">
              Here's what's happening with your organization today.
            </p>
          </div>

          {/* Global Filter */}
          <GlobalFilter onFilterChange={handleFilterChange} filters={filters} />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard
              title="Total Expenses"
              value={summaryStats.totalExpenses}
              change={summaryStats.monthlyGrowth}
              iconName="DollarSign"
              color="blue"
            />
            <SummaryCard
              title="Departments"
              value={summaryStats.totalDepartments}
              iconName="Users"
              color="green"
            />
            <SummaryCard
              title="Average per Expense"
              value={summaryStats.averagePerExpense}
              iconName="DollarSign"
              color="purple"
            />
          </div>



          {/* Charts Section - Now Vertical Layout */}
          <div className="space-y-8 mb-8">
            {/* Monthly Expense Chart */}
            <AnimatedCard delay={0.1}>
              <SectionHeader title="Monthly Expense Trend" iconName="TrendingUp" />
              <div className="mt-4">
                <InteractiveExpenseChart data={monthlyData} />
              </div>
            </AnimatedCard>

            {/* Departmental Expenses Line Chart */}
            <AnimatedCard delay={0.2}>
              <SectionHeader title="Departmental Expenses" iconName="LineChart" />
              <div className="mt-4">
                <DepartmentalExpensesLineChart data={safeExpenseStats} />
              </div>
            </AnimatedCard>

            {/* Average Spending Chart and Top Expense Categories - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Average Spending Chart */}
              <AnimatedCard delay={0.3}>
                <SectionHeader title="Average Spending by Service" iconName="DollarSign" />
                <div className="mt-4">
                  <AverageSpendingChart data={safeExpenseStats} />
                </div>
              </AnimatedCard>

              {/* Top Expense Categories */}
              <AnimatedCard delay={0.4}>
                <SectionHeader title="Top Expense Categories" iconName="DollarSign" />
                <div className="mt-4">
                  <TopExpenseCategories data={safeExpenseStats} />
                </div>
              </AnimatedCard>
            </div>

            {/* Today's Spending Chart */}
            <AnimatedCard delay={0.5}>
              <SectionHeader title="Today's Spending Breakdown" iconName="Activity" />
              <div className="mt-4">
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-gray-600">Today's Spending</span>
                    <span className="text-sm text-gray-500">
                      {new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {(() => {
                      const today = new Date();
                      const todayExpenses = safeExpenseStats.filter(expense => {
                        const expenseDate = new Date(expense.date_paid);
                        return expenseDate.toDateString() === today.toDateString();
                      });
                      const totalToday = todayExpenses.reduce((sum, expense) => sum + (expense.amount_aed || 0), 0);
                      return totalToday.toLocaleString('en-US', { style: 'currency', currency: 'AED' });
                    })()}
                  </div>
                  <div className="text-sm text-gray-500">
                    {(() => {
                      const today = new Date();
                      const todayExpenses = safeExpenseStats.filter(expense => {
                        const expenseDate = new Date(expense.date_paid);
                        return expenseDate.toDateString() === today.toDateString();
                      });
                      return `${todayExpenses.length} transactions`;
                    })()}
                  </div>
                </div>
                <TodaySpendingChart data={safeExpenseStats} />
              </div>
            </AnimatedCard>
          </div>

          {/* Payment Calendar and Upcoming Events */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Payment Calendar */}
            <AnimatedCard delay={0.6}>
              <PaymentCalendar 
                events={safePaymentEvents} 
                onDateClick={handleDateClick}
                onEventsUpdate={handleEventsUpdate}
              />
            </AnimatedCard>

            {/* Upcoming Payment Events */}
            <AnimatedCard delay={0.7}>
              <SectionHeader 
                title="Upcoming Payment Events" 
                iconName="Calendar"
                action={
                  <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
                    {(() => {
                      const DollarSignIcon = LucideIcons.DollarSign;
                      return DollarSignIcon && <DollarSignIcon className="w-4 h-4" />;
                    })()}
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
          </div>

          {/* Detailed Expense Data */}
          <AnimatedCard className="mb-8" delay={0.8}>
                          <SectionHeader title="Detailed Expense Data" iconName="LineChart" />
            {statsError ? (
              <div className="text-center py-8">
                <p className="text-red-600 mb-2">Failed to load expense data</p>
                <p className="text-sm text-gray-500">{statsError.message}</p>
              </div>
            ) : (
              <ScrollableExpenseTable data={safeExpenseStats} />
            )}
          </AnimatedCard>

          {/* Role Debug Component - Temporary */}
          <RoleDebug />
        </main>
      </div>
    </div>
  );
}


