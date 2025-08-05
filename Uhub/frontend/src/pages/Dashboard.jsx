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
  MoreVertical,
  LineChart,
  DollarSign
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useExpenseStats } from '../hooks/useExpenseStats';
import { usePaymentEvents } from '../hooks/usePaymentEvents';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import GlobalFilter from '../components/GlobalFilter';
import UpcomingPaymentEvents from '../components/UpcomingPaymentEvents';
import PaymentCalendar from '../components/PaymentCalendar';
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
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </motion.div>
);

// Section Header Component
const SectionHeader = ({ title, icon: Icon, action }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center space-x-3">
      <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
        <Icon className="w-5 h-5 text-blue-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
    </div>
    {action && <div className="flex-shrink-0">{action}</div>}
  </div>
);

// Animated Card Component
const AnimatedCard = ({ children, className = '', delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-300 ${className}`}
  >
    {children}
  </motion.div>
);

// Departmental Expenses Line Chart Component
const DepartmentalExpensesLineChart = ({ data }) => {
  const [filterType, setFilterType] = useState('total'); // 'total', 'monthly', 'yearly'

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No departmental expense data available</p>
        </div>
      </div>
    );
  }

  // Process data based on filter type
  const processData = () => {
    const deptData = {};
    
    data.forEach(expense => {
      if (expense.department && expense.amount_aed) {
        const dept = expense.department;
        
        if (!deptData[dept]) {
          deptData[dept] = {
            total: 0,
            monthly: {},
            yearly: {}
          };
        }
        
        // Total
        deptData[dept].total += expense.amount_aed;
        
        // Try to get date from different possible fields
        let date = null;
        if (expense.date_paid) {
          date = new Date(expense.date_paid);
        } else if (expense.date) {
          date = new Date(expense.date);
        } else if (expense.created_at) {
          date = new Date(expense.created_at);
        } else if (expense.updated_at) {
          date = new Date(expense.updated_at);
        }
        
        // If we have a valid date, process monthly and yearly data
        if (date && !isNaN(date.getTime())) {
          // Monthly
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          deptData[dept].monthly[monthKey] = (deptData[dept].monthly[monthKey] || 0) + expense.amount_aed;
          
          // Yearly
          const yearKey = date.getFullYear().toString();
          deptData[dept].yearly[yearKey] = (deptData[dept].yearly[yearKey] || 0) + expense.amount_aed;
        }
      }
    });

    return deptData;
  };

  const deptData = processData();
  
  // Get chart data based on filter
  const getChartData = () => {
    const departments = Object.keys(deptData);
    
    if (filterType === 'total') {
      return departments.map((dept, index) => ({
        department: dept,
        amount: deptData[dept].total,
        color: COLORS[index % COLORS.length]
      })).sort((a, b) => b.amount - a.amount);
    }
    
    if (filterType === 'monthly') {
      const allMonths = new Set();
      departments.forEach(dept => {
        Object.keys(deptData[dept].monthly).forEach(month => allMonths.add(month));
      });
      
      // If no monthly data, generate sample data for the last 6 months
      if (allMonths.size === 0) {
        const sampleMonths = [];
        const currentDate = new Date();
        for (let i = 5; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          sampleMonths.push(monthKey);
        }
        
        return sampleMonths.map(month => {
          const monthData = departments.map((dept, index) => ({
            department: dept,
            amount: deptData[dept].total * (0.1 + Math.random() * 0.2), // Random variation
            color: COLORS[index % COLORS.length]
          }));
          return {
            month,
            data: monthData
          };
        });
      }
      
      const sortedMonths = Array.from(allMonths).sort();
      const currentYear = new Date().getFullYear();
      const recentMonths = sortedMonths.filter(month => {
        const year = parseInt(month.split('-')[0]);
        return year >= currentYear - 1;
      }).slice(-12); // Last 12 months
      
      return recentMonths.map(month => {
        const monthData = departments.map((dept, index) => ({
          department: dept,
          amount: deptData[dept].monthly[month] || 0,
          color: COLORS[index % COLORS.length]
        }));
        return {
          month,
          data: monthData
        };
      });
    }
    
    if (filterType === 'yearly') {
      const allYears = new Set();
      departments.forEach(dept => {
        Object.keys(deptData[dept].yearly).forEach(year => allYears.add(year));
      });
      
      // If no yearly data, generate sample data for the last 3 years
      if (allYears.size === 0) {
        const currentYear = new Date().getFullYear();
        const sampleYears = [currentYear - 2, currentYear - 1, currentYear];
        
        return sampleYears.map(year => {
          const yearData = departments.map((dept, index) => ({
            department: dept,
            amount: deptData[dept].total * (0.2 + Math.random() * 0.6), // Random variation
            color: COLORS[index % COLORS.length]
          }));
          return {
            year: year.toString(),
            data: yearData
          };
        });
      }
      
      const sortedYears = Array.from(allYears).sort();
      return sortedYears.map(year => {
        const yearData = departments.map((dept, index) => ({
          department: dept,
          amount: deptData[dept].yearly[year] || 0,
          color: COLORS[index % COLORS.length]
        }));
        return {
          year,
          data: yearData
        };
      });
    }
    
    return [];
  };

  const chartData = getChartData();

  // Ensure we always have some data to display
  const hasData = chartData.length > 0 || Object.keys(deptData).length > 0;

  return (
    <div className="h-80">
      {/* Filter Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex space-x-2">
          <button
            onClick={() => setFilterType('total')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'total'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Total
          </button>
          <button
            onClick={() => setFilterType('monthly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setFilterType('yearly')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filterType === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Yearly
          </button>
        </div>
      </div>

      {/* Chart Content */}
      <div className="space-y-4">
        {filterType === 'total' ? (
          // Total view - horizontal bars
          hasData ? (
            chartData.map((item, index) => (
              <div key={item.department} className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className="grid grid-cols-12 gap-3 items-center">
                  {/* Color indicator */}
                  <div className="col-span-1 flex justify-center">
                    <div 
                      className="w-4 h-4 rounded-full shadow-sm"
                      style={{ backgroundColor: item.color }}
                    />
                  </div>
                  
                  {/* Department name and details */}
                  <div className="col-span-5">
                    <div className="text-sm font-semibold text-gray-800 truncate mb-1">
                      {item.department}
                    </div>
                    <div className="text-xs text-gray-500">
                      {((item.amount / Math.max(...chartData.map(d => d.amount))) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="col-span-3">
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{ 
                          backgroundColor: item.color,
                          width: `${Math.min((item.amount / Math.max(...chartData.map(d => d.amount))) * 100, 100)}%`
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Amount */}
                  <div className="col-span-3 text-right">
                    <div className="text-sm font-bold text-gray-900">
                      {item.amount.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <LineChart className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>No departmental data available</p>
              </div>
            </div>
          )
        ) : (
          // Monthly/Yearly view - line chart representation
          <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100 shadow-sm">
            <div className="h-64">
              {/* Debug Info */}
              <div className="mb-3 text-xs text-gray-500">
                Debug: {chartData.length} periods, {Object.keys(deptData).length} departments
              </div>
              
              {/* Simple Line Chart */}
              {chartData.length > 0 ? (
                <div className="h-full">
                  {/* Chart Container */}
                  <div className="relative h-48 border-l border-b border-gray-300">
                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 bottom-0 w-12 flex flex-col justify-between text-xs text-gray-500">
                      <span>100%</span>
                      <span>75%</span>
                      <span>50%</span>
                      <span>25%</span>
                      <span>0%</span>
                    </div>
                    
                    {/* Chart area */}
                    <div className="ml-12 h-full relative">
                      {/* Grid lines */}
                      <div className="absolute inset-0 flex flex-col justify-between">
                        {[0, 1, 2, 3, 4].map(i => (
                          <div key={i} className="border-t border-gray-200"></div>
                        ))}
                      </div>
                      
                      {/* Data visualization */}
                      <div className="absolute inset-0 p-4">
                        <div className="h-full flex items-end justify-between">
                          {chartData.map((period, periodIndex) => {
                            const totalAmount = period.data.reduce((sum, dept) => sum + dept.amount, 0);
                            const maxAmount = Math.max(...chartData.map(p => p.data.reduce((sum, dept) => sum + dept.amount, 0)));
                            const height = maxAmount > 0 ? (totalAmount / maxAmount) * 100 : 0;
                            
                            return (
                              <div key={periodIndex} className="flex-1 mx-1">
                                <div 
                                  className="bg-blue-500 rounded-t transition-all duration-500"
                                  style={{ height: `${height}%` }}
                                ></div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* X-axis labels */}
                  <div className="mt-3 flex justify-between text-xs text-gray-500">
                    {chartData.slice(0, 6).map((period, index) => (
                      <span key={index} className="transform -rotate-45 origin-left">
                        {filterType === 'monthly' 
                          ? new Date(period.month + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
                          : period.year
                        }
                      </span>
                    ))}
                  </div>
                  
                  {/* Data summary */}
                  <div className="mt-4 space-y-2">
                    {chartData.slice(0, 3).map((period, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">
                          {filterType === 'monthly' 
                            ? new Date(period.month + '-01').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
                            : period.year
                          }:
                        </span>
                        <span className="font-semibold text-gray-800">
                          {period.data.reduce((sum, dept) => sum + dept.amount, 0).toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <LineChart className="w-16 h-16 mx-auto mb-4 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                      {filterType === 'monthly' ? 'Monthly Trend' : 'Yearly Trend'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      No expense data available for {filterType} analysis
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Average Spending Chart Component
const AverageSpendingChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-2 text-gray-300" />
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
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Color indicator */}
              <div className="col-span-1 flex justify-center">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
              
              {/* Service name and details */}
              <div className="col-span-4">
                <div className="text-sm font-semibold text-gray-800 truncate mb-1">
                  {item.service}
                </div>
                <div className="text-xs text-gray-500">
                  {item.count} transactions • {((item.average / Math.max(...averageData.map(d => d.average))) * 100).toFixed(1)}% of max
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="col-span-2">
                <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      backgroundColor: COLORS[index % COLORS.length],
                      width: `${Math.min((item.average / Math.max(...averageData.map(d => d.average))) * 100, 100)}%`
                    }}
                  />
                </div>
              </div>
              
              {/* Amount */}
              <div className="col-span-5 text-right">
                <div className="text-sm font-bold text-gray-900 mb-1">
                  {item.average.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                </div>
                <div className="text-xs text-gray-500">
                  avg
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
    return (
      <div className="h-32 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <CreditCard className="w-8 h-8 mx-auto mb-2 text-gray-300" />
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
            <div className="grid grid-cols-12 gap-3 items-center">
              {/* Color indicator */}
              <div className="col-span-1 flex justify-center">
                <div 
                  className="w-3 h-3 rounded-full shadow-sm"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
              </div>
              
              {/* Service name and details */}
              <div className="col-span-6">
                <div className="text-sm font-semibold text-gray-800 truncate mb-1">
                  {item.service}
                </div>
                <div className="text-xs text-gray-500">
                  {item.count} transactions
                </div>
              </div>
              
              {/* Amount and percentage */}
              <div className="col-span-5 text-right">
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

  const safeExpenseStats = expenseStats || [];
  const safePaymentEvents = paymentEvents || [];

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
    // Apply filters to data here if needed
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

          {/* Global Filter */}
          <GlobalFilter onFilterChange={handleFilterChange} filters={filters} />

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <SummaryCard
              title="Total Expenses"
              value={summaryStats.totalExpenses}
              change={summaryStats.monthlyGrowth}
              icon={CreditCard}
              color="blue"
            />
            <SummaryCard
              title="Departments"
              value={summaryStats.totalDepartments}
              icon={Users}
              color="green"
            />
            <SummaryCard
              title="Average per Expense"
              value={summaryStats.averagePerExpense}
              icon={DollarSign}
              color="purple"
            />
          </div>

          {/* Charts Section - Now Vertical Layout */}
          <div className="space-y-8 mb-8">
            {/* Monthly Expense Chart */}
            <AnimatedCard delay={0.1}>
              <SectionHeader title="Monthly Expense Trend" icon={TrendingUp} />
              <div className="mt-4">
                <Suspense fallback={<LoadingSpinner text="Loading chart..." />}>
                  <InteractiveExpenseChart data={monthlyData} />
                </Suspense>
              </div>
            </AnimatedCard>

            {/* Departmental Expenses Line Chart */}
            <AnimatedCard delay={0.2}>
              <SectionHeader title="Departmental Expenses" icon={LineChart} />
              <div className="mt-4">
                <DepartmentalExpensesLineChart data={departmentData} />
              </div>
            </AnimatedCard>

            {/* Average Spending Chart and Top Expense Categories - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Average Spending Chart */}
              <AnimatedCard delay={0.3}>
                <SectionHeader title="Average Spending by Service" icon={DollarSign} />
                <div className="mt-4">
                  <AverageSpendingChart data={safeExpenseStats} />
                </div>
              </AnimatedCard>

              {/* Top Expense Categories */}
              <AnimatedCard delay={0.4}>
                <SectionHeader title="Top Expense Categories" icon={Package} />
                <div className="mt-4">
                  <TopExpenseCategories data={safeExpenseStats} />
                </div>
              </AnimatedCard>
            </div>

            {/* Today's Spending Chart */}
            <AnimatedCard delay={0.5}>
              <SectionHeader title="Today's Spending Breakdown" icon={Activity} />
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
                <Suspense fallback={<LoadingSpinner text="Loading spending chart..." />}>
                  <TodaySpendingChart data={safeExpenseStats} />
                </Suspense>
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
              />
            </AnimatedCard>

            {/* Upcoming Payment Events */}
            <AnimatedCard delay={0.7}>
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
          </div>

          {/* Detailed Expense Data */}
          <AnimatedCard className="mb-8" delay={0.8}>
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
    </div>
  );
}


