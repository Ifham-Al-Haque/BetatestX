import React, { useMemo, useState } from "react"; // Analytics component with real expense data
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Shield, X,
  BarChart3, ArrowLeft, PieChart as PieChartIcon,
  Filter, Download, RefreshCw, ChevronDown, ChevronUp,
  Clock, Target, Zap, Star
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useExpenses } from "../hooks/useApi";
import LoadingSpinner from "../components/LoadingSpinner";

// Enhanced color scheme for charts with gradients
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];
const GRADIENT_COLORS = [
  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
  'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
  'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
  'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
  'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
  'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)',
  'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)'
];

// Filter options
const FILTER_OPTIONS = {
  timeRange: [
    { value: 'current-month', label: 'Current Month', icon: Calendar },
    { value: 'last-3-months', label: 'Last 3 Months', icon: Clock },
    { value: 'last-6-months', label: 'Last 6 Months', icon: Target },
    { value: 'last-year', label: 'Last Year', icon: Calendar },
    { value: 'all-time', label: 'All Time', icon: Zap }
  ],
  comparison: [
    { value: 'none', label: 'No Comparison', icon: BarChart3 },
    { value: 'previous-period', label: 'Previous Period', icon: TrendingUp },
    { value: 'year-over-year', label: 'Year over Year', icon: Star }
  ]
};

// Enhanced Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl backdrop-blur-sm">
        <p className="font-bold text-gray-800 dark:text-white text-lg mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center space-x-2 mb-1">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            ></div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {entry.name}: <span className="font-bold text-blue-600 dark:text-blue-400">
                {entry.value?.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
              </span>
            </p>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// Enhanced Filter Component
const AnalyticsFilter = ({ filters, onFilterChange, isExpanded, onToggle }) => {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: isExpanded ? 'auto' : 0 }}
      exit={{ opacity: 0, height: 0 }}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 overflow-hidden"
    >
      <div className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Time Range Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <Clock className="w-4 h-4 inline mr-2" />
              Time Range
            </label>
            <div className="space-y-2">
              {FILTER_OPTIONS.timeRange.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange('timeRange', option.value)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      filters.timeRange === option.value
                        ? 'bg-blue-50 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-2 border-blue-200 dark:border-blue-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              <TrendingUp className="w-4 h-4 inline mr-2" />
              Comparison
            </label>
            <div className="space-y-2">
              {FILTER_OPTIONS.comparison.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => onFilterChange('comparison', option.value)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-all duration-200 ${
                      filters.comparison === option.value
                        ? 'bg-green-50 dark:bg-green-900 text-green-700 dark:text-green-300 border-2 border-green-200 dark:border-green-700'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// Monthly Breakdown Charts Component
const MonthlyBreakdownCharts = ({ expenses }) => {
  const [expandedService, setExpandedService] = useState(null);
  const [zoomedMonth, setZoomedMonth] = useState(null);
  const [zoomedService, setZoomedService] = useState(null);

  const handleServiceClick = (serviceName) => {
    setExpandedService(expandedService === serviceName ? null : serviceName);
    setZoomedMonth(null);
    setZoomedService(null);
  };

  const handleMonthClick = (month, service) => {
    if (zoomedMonth === month && zoomedService === service.service_name) {
      // If already zoomed, zoom out
      setZoomedMonth(null);
      setZoomedService(null);
    } else {
      // Zoom in to the clicked month
      setZoomedMonth(month);
      setZoomedService(service.service_name);
    }
  };

  // Generate services data from real expense data
  const services = useMemo(() => {
    if (!expenses.length) return [];

    const serviceMap = {};
    expenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed && expense.date_paid) {
        const service = expense.service_name.trim();
        const date = new Date(expense.date_paid);
        const monthKey = `${date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`;
        
        if (!serviceMap[service]) {
          serviceMap[service] = {
            id: Date.now() + Math.random(), // Generate unique ID
            service_name: service,
            category: expense.department || 'Uncategorized',
            service_status: expense.service_status || 'Active',
            monthly_spending: {}
          };
        }
        
        if (!serviceMap[service].monthly_spending[monthKey]) {
          serviceMap[service].monthly_spending[monthKey] = 0;
        }
        serviceMap[service].monthly_spending[monthKey] += parseFloat(expense.amount_aed) || 0;
      }
    });

    return Object.values(serviceMap);
  }, [expenses]);

  // Get payment details from real expense data
  const getPaymentDetails = (serviceName, month) => {
    if (!expenses.length) return [];

    const monthYear = month.split('-');
    if (monthYear.length !== 2) return [];

    const monthNum = new Date(Date.parse(monthYear[0] + " 1, 2000")).getMonth();
    const year = monthYear[1];

    return expenses
      .filter(expense => {
        if (expense.service_name?.trim() !== serviceName) return false;
        
        const expenseDate = new Date(expense.date_paid);
        return expenseDate.getMonth() === monthNum && 
               expenseDate.getFullYear().toString().slice(-2) === year;
      })
      .map(expense => ({
        payment_date: expense.date_paid,
        due_date: expense.invoice_due_date || expense.date_paid,
        invoice_date: expense.invoice_generation_date || expense.date_paid,
        amount: parseFloat(expense.amount_aed) || 0,
        invoice_number: expense.invoice_number || `INV-${expense.id}`
      }));
  };

  return (
    <div className="space-y-8">
      {services.map((service, serviceIndex) => (
        <div key={service.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
          {/* Service Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[serviceIndex % COLORS.length] }}></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {service.service_name}
              </h3>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm rounded-full">
                {service.category || 'Uncategorized'}
              </span>
            </div>
            <button
              onClick={() => handleServiceClick(service.service_name)}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
            >
              {expandedService === service.service_name ? 'Collapse' : 'Expand'}
            </button>
          </div>

          {/* Service Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                AED {Object.values(service.monthly_spending || {}).reduce((sum, amount) => sum + (amount || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Months</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {Object.keys(service.monthly_spending || {}).length}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
              <p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {service.service_status}
              </p>
            </div>
          </div>

          {/* Monthly Breakdown Chart */}
          {expandedService === service.service_name && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-6"
            >
              <div className="h-80 bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={Object.entries(service.monthly_spending || {}).map(([month, amount]) => ({
                      month,
                      amount: amount || 0
                    }))}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis 
                      dataKey="month" 
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#D1D5DB' }}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      tick={{ fontSize: 12, fill: '#6B7280' }}
                      axisLine={{ stroke: '#D1D5DB' }}
                    />
                    <Tooltip 
                      content={({ active, payload, label }) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
                              <p className="font-semibold text-gray-800 dark:text-white">{label}</p>
                              <p className="text-sm text-blue-600">
                                AED {payload[0].value?.toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                                         <Bar 
                       dataKey="amount" 
                       fill={COLORS[serviceIndex % COLORS.length]}
                       onClick={(data) => handleMonthClick(data.month, service)}
                       style={{ cursor: 'pointer' }}
                       radius={[4, 4, 0, 0]}
                     />
                  </BarChart>
                </ResponsiveContainer>
                             </div>

               {/* Zoomed Month View */}
               {zoomedMonth && zoomedService === service.service_name && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-xl p-6 border-2 border-blue-200 dark:border-blue-700"
                 >
                   <div className="flex items-center justify-between mb-4">
                     <div>
                       <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                         {zoomedMonth} - {service.service_name}
                       </h4>
                       <p className="text-blue-700 dark:text-blue-300">
                         Detailed breakdown for this month
                       </p>
                     </div>
                     <button
                       onClick={() => {
                         setZoomedMonth(null);
                         setZoomedService(null);
                       }}
                       className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
                     >
                       <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                       </svg>
                     </button>
                   </div>

                   {/* Month Statistics */}
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                       <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Amount</p>
                       <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                         AED {service.monthly_spending[zoomedMonth]?.toLocaleString()}
                       </p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                       <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Service Category</p>
                       <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                         {service.category || 'Uncategorized'}
                       </p>
                     </div>
                     <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-blue-600">
                       <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Service Status</p>
                       <p className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                         {service.service_status}
                       </p>
                     </div>
                   </div>

                   {/* Payment Details */}
                   <div className="bg-white dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-blue-600 overflow-hidden">
                     <div className="bg-blue-50 dark:bg-blue-900 px-4 py-3 border-b border-blue-200 dark:border-blue-600">
                       <h5 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                         Payment Details for {zoomedMonth}
                       </h5>
                     </div>
                     <div className="p-4">
                       {(() => {
                         const paymentDetails = getPaymentDetails(service.service_name, zoomedMonth);
                         if (paymentDetails.length > 0) {
                           return (
                             <div className="space-y-4">
                               {paymentDetails.map((payment, index) => (
                                 <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-sm">
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Invoice #</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">{payment.invoice_number}</p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Amount</p>
                                       <p className="font-semibold text-blue-600 dark:text-blue-400">
                                         AED {payment.amount?.toLocaleString()}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Invoice Date</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">
                                         {new Date(payment.invoice_date).toLocaleDateString()}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Due Date</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">
                                         {new Date(payment.due_date).toLocaleDateString()}
                                       </p>
                                     </div>
                                     <div>
                                       <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Payment Date</p>
                                       <p className="font-semibold text-gray-900 dark:text-white">
                                         {new Date(payment.payment_date).toLocaleDateString()}
                                       </p>
                                     </div>
                                   </div>
                                 </div>
                               ))}
                             </div>
                           );
                         } else {
                           return (
                             <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                               <div className="w-16 h-16 mx-auto mb-4 text-blue-300 dark:text-blue-600">
                                 <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                 </svg>
                               </div>
                               <p className="text-lg font-medium">No payment details available</p>
                               <p className="text-sm mt-1">Add payment information to see detailed breakdown</p>
                             </div>
                           );
                         }
                       })()}
                     </div>
                   </div>
                 </motion.div>
               )}

               {/* Monthly Details */}
               <div className="space-y-4">
                {Object.entries(service.monthly_spending || {}).map(([month, amount]) => {
                  const paymentDetails = getPaymentDetails(service.service_name, month);
                  const isZoomed = zoomedMonth === month && zoomedService === service.service_name;
                  
                  return (
                    <div key={month} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 overflow-hidden">
                      <div 
                        className={`p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                          isZoomed ? 'bg-blue-50 dark:bg-blue-900 border-l-4 border-l-blue-500' : ''
                        }`}
                        onClick={() => handleMonthClick(month, service)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <span className="text-lg font-semibold text-gray-900 dark:text-white">
                              {month}
                            </span>
                            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                              AED {amount?.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {paymentDetails.length} payment{paymentDetails.length !== 1 ? 's' : ''}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              isZoomed 
                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-200' 
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                            }`}>
                              {isZoomed ? 'Zoomed' : 'Click to zoom'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      ))}
    </div>
  );
};

// Service Breakdown Bar Chart Component
const ServiceBreakdownChart = ({ expenses }) => {
  const serviceData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by service and calculate totals
    const serviceStats = {};
    expenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed) {
        // Clean and normalize service names for consistency
        let service = expense.service_name.trim();
        
        // Handle common variations and typos
        if (service.includes('ATLASSIAN') && service.includes('JIRA')) {
          service = 'ATLASSIAN [JIRA & CONFLUENCE]';
        } else if (service.includes('AUTOMATION')) {
          service = 'AUTOMATION';
        } else if (service.includes('AWS') && service.includes('BESPIN')) {
          service = 'AWS[BESPIN]';
        } else if (service.includes('ELEVEN') && service.includes('LABS')) {
          service = 'ELEVEN LABS';
        } else if (service.includes('ZAPIER') || service.includes('ZAIPER')) {
          service = 'ZAPIER';
        } else if (service.includes('IDWISE') || service.includes('ID WISE')) {
          service = 'IDWISE';
        } else if (service.includes('MO ENGAGE')) {
          service = 'MO ENGAGE';
        }
        
        if (!serviceStats[service]) {
          serviceStats[service] = {
            total: 0,
            count: 0,
            months: new Set()
          };
        }
        serviceStats[service].total += parseFloat(expense.amount_aed) || 0;
        serviceStats[service].count += 1;
        
        if (expense.date_paid) {
          const date = new Date(expense.date_paid);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          serviceStats[service].months.add(monthKey);
        }
      }
    });

    // Convert to array format
    const result = Object.entries(serviceStats).map(([service, stats], index) => ({
      service,
      total: stats.total,
      count: stats.count,
      months: stats.months.size,
      color: COLORS[index % COLORS.length]
    }));

    return result
      .filter(item => item.total > 0) // Only show services with spending
      .sort((a, b) => b.total - a.total);
  }, [expenses]);

  if (!expenses || expenses.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 font-medium">No expense data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some expenses to see analytics</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 dark:from-gray-800 dark:via-blue-900/20 dark:to-indigo-900/30 rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-xl backdrop-blur-sm">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={serviceData} margin={{ top: 20, right: 30, left: 60, bottom: 120 }}>
          <defs>
            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9} />
              <stop offset="100%" stopColor="#1D4ED8" stopOpacity={0.7} />
            </linearGradient>
            <filter id="barShadow">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.15"/>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.3} />
          <XAxis 
            dataKey="service" 
            angle={-45}
            textAnchor="end"
            height={120}
            interval={0}
            tick={{ 
              fontSize: 11, 
              fill: '#374151',
              fontWeight: '500',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickMargin={8}
          />
          <YAxis 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            tick={{ 
              fontSize: 12, 
              fill: '#6B7280',
              fontWeight: '500'
            }}
            axisLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickLine={{ stroke: '#D1D5DB', strokeWidth: 1 }}
            tickMargin={8}
          />
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 border border-gray-200/60 dark:border-gray-600/60 rounded-xl shadow-2xl">
                    <div className="flex items-center space-x-3 mb-2">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm" 
                        style={{ backgroundColor: data.color }}
                      ></div>
                      <p className="font-bold text-gray-900 dark:text-white text-lg">{data.service}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-semibold">Total:</span> AED {data.total.toLocaleString()}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-semibold">Records:</span> {data.count} transactions
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        <span className="font-semibold">Months:</span> {data.months} months
                      </p>
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="total" 
            radius={[6, 6, 0, 0]}
            stroke="#fff"
            strokeWidth={2}
            filter="url(#barShadow)"
          >
            {serviceData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={entry.color}
                className="hover:opacity-80 transition-opacity duration-200"
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};



// Enhanced Individual Service Line Charts Component with Filtering
const IndividualServiceCharts = ({ expenses, filters = { timeRange: 'all-time', comparison: 'none' } }) => {
  const [serviceFilters, setServiceFilters] = useState({
    selectedYear: 'all',
    duration: 'all' // months - changed default to 'all' to show all data
  });

  // Get available years from expenses
  const availableYears = useMemo(() => {
    if (!expenses.length) return [];
    const years = new Set();
    expenses.forEach(expense => {
      if (expense.date_paid) {
        const year = new Date(expense.date_paid).getFullYear();
        years.add(year);
      }
    });
    return Array.from(years).sort((a, b) => b - a); // Sort descending
  }, [expenses]);

  // Group expenses by service and month with filtering
  const serviceData = useMemo(() => {
    if (!expenses.length) return {};

    const now = new Date();
    let filteredExpenses = expenses;

    // Apply filters with priority: Year filter takes precedence over duration filter
    if (serviceFilters.selectedYear !== 'all') {
      const targetYear = parseInt(serviceFilters.selectedYear);
      console.log('📊 Filter Debug - Year filter applied:', {
        selectedYear: serviceFilters.selectedYear,
        targetYear,
        note: 'Year filter takes precedence over duration filter'
      });
      
      filteredExpenses = filteredExpenses.filter(expense => {
        if (!expense.date_paid) return false;
        const expenseYear = new Date(expense.date_paid).getFullYear();
        const isIncluded = expenseYear === targetYear;
        
        // Debug AWS[BESPIN] year filtering
        if (expense.service_name && expense.service_name.toLowerCase().includes('aws') && 
            expense.service_name.toLowerCase().includes('bespin')) {
          console.log('📊 AWS[BESPIN] Year Filter Debug:', {
            service: expense.service_name,
            date: expense.date_paid,
            expenseYear,
            targetYear,
            isIncluded
          });
        }
        
        return isIncluded;
      });
    } else if (serviceFilters.duration !== 'all') {
      // Only apply duration filter if no year filter is selected
      const monthsBack = parseInt(serviceFilters.duration);
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);
      
      console.log('📊 Filter Debug - Duration filter applied:', {
        duration: serviceFilters.duration,
        monthsBack,
        cutoffDate: cutoffDate.toISOString(),
        note: 'Duration filter only applied when no year filter is selected'
      });
      
      filteredExpenses = filteredExpenses.filter(expense => {
        if (!expense.date_paid) return false;
        const expenseDate = new Date(expense.date_paid);
        const isIncluded = expenseDate >= cutoffDate;
        
        // Debug AWS[BESPIN] filtering
        if (expense.service_name && expense.service_name.toLowerCase().includes('aws') && 
            expense.service_name.toLowerCase().includes('bespin')) {
          console.log('📊 AWS[BESPIN] Duration Filter Debug:', {
            service: expense.service_name,
            date: expense.date_paid,
            expenseDate: expenseDate.toISOString(),
            cutoffDate: cutoffDate.toISOString(),
            isIncluded
          });
        }
        
        return isIncluded;
      });
    }

    // Apply original time range filter as fallback
    if (filters.timeRange !== 'all-time') {
      const cutoffDate = new Date();
      switch (filters.timeRange) {
        case 'current-month':
          cutoffDate.setMonth(now.getMonth() - 1);
          break;
        case 'last-3-months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'last-6-months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case 'last-year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
      }
      filteredExpenses = filteredExpenses.filter(expense => {
        const expenseDate = new Date(expense.date_paid);
        return expenseDate >= cutoffDate;
      });
    }

    const grouped = {};
    
    // Debug: Log all unique service names to identify duplicates
    const uniqueServices = new Set();
    filteredExpenses.forEach(expense => {
      if (expense.service_name) {
        uniqueServices.add(expense.service_name);
      }
    });
    console.log('📊 Individual Service Trends - All unique service names:', Array.from(uniqueServices));
    
    // Debug: Check specifically for AWS[BESPIN] data
    const awsBespinExpenses = filteredExpenses.filter(expense => 
      expense.service_name && expense.service_name.toLowerCase().includes('aws') && 
      expense.service_name.toLowerCase().includes('bespin')
    );
    console.log('📊 AWS[BESPIN] Debug - Found expenses:', awsBespinExpenses.length);
    console.log('📊 AWS[BESPIN] Debug - Service names:', awsBespinExpenses.map(e => e.service_name));
    console.log('📊 AWS[BESPIN] Debug - Date range:', {
      earliest: awsBespinExpenses.length > 0 ? Math.min(...awsBespinExpenses.map(e => new Date(e.date_paid))) : 'No data',
      latest: awsBespinExpenses.length > 0 ? Math.max(...awsBespinExpenses.map(e => new Date(e.date_paid))) : 'No data'
    });
    
    // Function to normalize service names and merge similar ones
    const normalizeServiceName = (name) => {
      return name
        .trim()                    // Remove leading/trailing spaces
        .replace(/\s+/g, ' ')      // Replace multiple spaces with single space
        .toLowerCase()             // Convert to lowercase for consistent grouping
        .replace(/[^\w\s]/g, '')   // Remove special characters except spaces and alphanumeric
        .replace(/\b(the|a|an|and|or|of|in|on|at|to|for|with|by)\b/g, '') // Remove common words
        .trim();                   // Trim again after removing words
    };
    
    filteredExpenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed && expense.date_paid) {
        // Normalize service name to prevent duplicates
        const service = normalizeServiceName(expense.service_name);
        
        const date = new Date(expense.date_paid);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        if (!grouped[service]) {
          grouped[service] = {
            displayName: expense.service_name.trim(), // Keep original name for display
            data: {}
          };
        }
        if (!grouped[service].data[monthKey]) {
          grouped[service].data[monthKey] = {
            monthName,
            monthKey,
            total: 0,
            count: 0,
            year: date.getFullYear(),
            month: date.getMonth() + 1
          };
        }
        grouped[service].data[monthKey].total += parseFloat(expense.amount_aed) || 0;
        grouped[service].data[monthKey].count += 1;
      }
    });

    // Convert to array format for charts with proper chronological sorting
    const result = {};
    Object.keys(grouped).forEach(service => {
      const months = Object.values(grouped[service].data);
      result[service] = {
        displayName: grouped[service].displayName,
        data: months.sort((a, b) => {
          // Sort by year first, then by month
          if (a.year !== b.year) {
            return a.year - b.year;
          }
          return a.month - b.month;
        })
      };
    });

    console.log('📊 Individual Service Trends - Processed service data:', Object.keys(result));
    
    // Debug: Check AWS[BESPIN] after processing
    const awsBespinKey = Object.keys(result).find(key => 
      key.toLowerCase().includes('aws') && key.toLowerCase().includes('bespin')
    );
    if (awsBespinKey) {
      console.log('📊 AWS[BESPIN] Debug - Normalized key:', awsBespinKey);
      console.log('📊 AWS[BESPIN] Debug - Display name:', result[awsBespinKey].displayName);
      console.log('📊 AWS[BESPIN] Debug - Data points:', result[awsBespinKey].data.length);
      console.log('📊 AWS[BESPIN] Debug - Monthly data:', result[awsBespinKey].data.map(d => ({
        month: d.monthName,
        year: d.year,
        total: d.total
      })));
    } else {
      console.log('📊 AWS[BESPIN] Debug - No matching service found after processing');
      console.log('📊 AWS[BESPIN] Debug - Available keys:', Object.keys(result));
    }
    
    return result;
  }, [expenses, filters, serviceFilters]);

  if (!expenses.length) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
        <p className="text-lg font-medium">No expense data available</p>
        <p className="text-sm mt-1">Add some expenses to see individual service trends</p>
      </div>
    );
  }

  const services = Object.keys(serviceData);
  if (services.length === 0) return null;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Individual Service Trends
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Track spending patterns for each service over time
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:space-x-4 space-y-4 lg:space-y-0">
          {/* Filter Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
            {/* Year Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Year:
              </label>
              <select
                value={serviceFilters.selectedYear}
                onChange={(e) => setServiceFilters(prev => ({ ...prev, selectedYear: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[100px]"
              >
                <option value="all">All Years</option>
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            {/* Duration Filter */}
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                Duration:
              </label>
              <select
                value={serviceFilters.duration}
                onChange={(e) => setServiceFilters(prev => ({ ...prev, duration: e.target.value }))}
                className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent min-w-[120px]"
              >
                <option value="all">All Time</option>
                <option value="3">Last 3 Months</option>
                <option value="6">Last 6 Months</option>
                <option value="12">Last 12 Months</option>
              </select>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {services.length} services tracked
            </span>
          </div>
          
          {/* Debug Info - Temporary */}
          <div className="text-xs text-gray-400 mt-2">
            <div>Year: {serviceFilters.selectedYear} | Duration: {serviceFilters.duration} months</div>
            <div>Global Filter: {filters.timeRange}</div>
            <div className="text-yellow-600 mt-1">
              {serviceFilters.selectedYear !== 'all' 
                ? 'Note: Year filter takes precedence over duration filter'
                : serviceFilters.duration !== 'all'
                ? 'Note: Showing last ' + serviceFilters.duration + ' months from today'
                : 'Note: Showing all available data'
              }
            </div>
          </div>
        </div>
      </div>
      
      {services.map((serviceKey, index) => {
        const serviceInfo = serviceData[serviceKey];
        if (!serviceInfo || !serviceInfo.data || serviceInfo.data.length === 0) return null;

        const data = serviceInfo.data;
        const displayName = serviceInfo.displayName;
        const totalSpent = data.reduce((sum, item) => sum + item.total, 0);
        const peakMonth = data.reduce((max, item) => item.total > max.total ? item : max, data[0]);
        const averageMonthly = totalSpent / data.length;
        const activeMonths = data.filter(item => item.total > 0).length;

        return (
          <motion.div
            key={serviceKey}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm ring-2 ring-white dark:ring-gray-800"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                ></div>
                <div>
                  <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                    {displayName}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {data.length} months • Total: AED {totalSpent.toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Active Months</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {activeMonths}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="h-80 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <defs>
                    <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={COLORS[index % COLORS.length]} stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
                  <XAxis 
                    dataKey="monthName" 
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#D1D5DB' }}
                    tickLine={{ stroke: '#D1D5DB' }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                    tick={{ fontSize: 12, fill: '#6B7280' }}
                    axisLine={{ stroke: '#D1D5DB' }}
                    tickLine={{ stroke: '#D1D5DB' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={4}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 5 }}
                    activeDot={{ r: 8, stroke: COLORS[index % COLORS.length], strokeWidth: 3, fill: 'white' }}
                    fill={`url(#gradient-${index})`}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Enhanced Service Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-xl border border-blue-200 dark:border-blue-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Peak Month</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-100">
                      {peakMonth.monthName}
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      AED {peakMonth.total.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-xl border border-green-200 dark:border-green-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Average Monthly</p>
                    <p className="text-lg font-bold text-green-900 dark:text-green-100">
                      AED {averageMonthly.toFixed(0)}
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      Per month
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-xl border border-purple-200 dark:border-purple-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-lg flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Total Transactions</p>
                    <p className="text-lg font-bold text-purple-900 dark:text-purple-100">
                      {data.reduce((sum, item) => sum + item.count, 0)}
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-300">
                      All time
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Service Distribution Pie Chart Component
const ServiceDistributionChart = ({ expenses }) => {
  const pieData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];

    // Group expenses by service and calculate totals
    const serviceStats = {};
    expenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed) {
        // Clean and normalize service names for consistency
        let service = expense.service_name.trim();
        
        // Handle common variations and typos
        if (service.includes('ATLASSIAN') && service.includes('JIRA')) {
          service = 'ATLASSIAN [JIRA & CONFLUENCE]';
        } else if (service.includes('AUTOMATION')) {
          service = 'AUTOMATION';
        } else if (service.includes('AWS') && service.includes('BESPIN')) {
          service = 'AWS[BESPIN]';
        } else if (service.includes('ELEVEN') && service.includes('LABS')) {
          service = 'ELEVEN LABS';
        } else if (service.includes('ZAPIER') || service.includes('ZAIPER')) {
          service = 'ZAPIER';
        } else if (service.includes('IDWISE') || service.includes('ID WISE')) {
          service = 'IDWISE';
        } else if (service.includes('MO ENGAGE')) {
          service = 'MO ENGAGE';
        }
        
        if (!serviceStats[service]) {
          serviceStats[service] = {
            total: 0,
            category: expense.department || 'Uncategorized'
          };
        }
        serviceStats[service].total += parseFloat(expense.amount_aed) || 0;
      }
    });

    // Convert to array format and filter services with spending
    const servicesWithSpending = Object.entries(serviceStats)
      .map(([name, stats]) => ({
        name,
        value: stats.total,
        category: stats.category
      }))
      .filter(service => service.value > 0);

    const totalSpending = servicesWithSpending.reduce((sum, service) => sum + service.value, 0);
    
    return servicesWithSpending
      .map((service, index) => ({
        ...service,
        percentage: ((service.value / totalSpending) * 100).toFixed(1),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 services
  }, [expenses]);

  if (!expenses || expenses.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <PieChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 font-medium">No expense data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some expenses to see distribution</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[500px] bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 dark:from-gray-800 dark:via-green-900/20 dark:to-emerald-900/30 rounded-2xl p-6 border border-gray-200/60 dark:border-gray-700/60 shadow-xl backdrop-blur-sm">
      <div className="flex h-full">
        {/* Pie Chart */}
        <div className="flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <defs>
                <filter id="pieGlow">
                  <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                  <feMerge> 
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="pieShadow">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2"/>
                </filter>
              </defs>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={false}
                outerRadius={100}
                innerRadius={35}
                fill="#8884d8"
                dataKey="value"
                stroke="#fff"
                strokeWidth={3}
                filter="url(#pieShadow)"
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                    className="hover:opacity-80 transition-opacity duration-200"
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl p-4 border border-gray-200/60 dark:border-gray-600/60 rounded-xl shadow-2xl">
                        <div className="flex items-center space-x-3 mb-2">
                          <div 
                            className="w-4 h-4 rounded-full shadow-sm" 
                            style={{ backgroundColor: data.color }}
                          ></div>
                          <p className="font-bold text-gray-900 dark:text-white text-lg">{data.name}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-gray-700 dark:text-gray-300">
                            <span className="font-semibold">Amount:</span> AED {data.value.toLocaleString()}
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <span className="font-semibold">Percentage:</span> {data.percentage}%
                          </p>
                          <p className="text-gray-600 dark:text-gray-400 text-sm">
                            <span className="font-semibold">Category:</span> {data.category}
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        
        {/* Legend */}
        <div className="w-48 pl-6 flex flex-col justify-center">
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {pieData.map((entry, index) => (
              <div key={`legend-${index}`} className="flex items-center space-x-3 group">
                <div 
                  className="w-4 h-4 rounded-full shadow-sm flex-shrink-0" 
                  style={{ backgroundColor: entry.color }}
                ></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {entry.name}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {entry.percentage}% • AED {entry.value.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Monthly Expense Trend Chart Component
const MonthlyExpenseTrendChart = ({ data, filters = { timeRange: 'all-time' } }) => {
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [monthBreakdown, setMonthBreakdown] = useState([]);
  const [timeFilter, setTimeFilter] = useState('all-time');

  // Process monthly data for charts with filtering
  const monthlyData = useMemo(() => {
    console.log('📊 MonthlyExpenseTrendChart - Processing data:', { 
      dataLength: data?.length, 
      data: data,
      timeFilter 
    });
    
    if (!data || !data.length) {
      console.log('❌ No data available for MonthlyExpenseTrendChart');
      return [];
    }

    const monthlyStats = {};
    const now = new Date();
    let filteredData = data;

    // Apply time range filter
    if (timeFilter !== 'all-time') {
      const cutoffDate = new Date();
      switch (timeFilter) {
        case 'current-month':
          cutoffDate.setMonth(now.getMonth());
          cutoffDate.setDate(1);
          break;
        case 'last-3-months':
          cutoffDate.setMonth(now.getMonth() - 3);
          break;
        case 'last-6-months':
          cutoffDate.setMonth(now.getMonth() - 6);
          break;
        case 'last-year':
          cutoffDate.setFullYear(now.getFullYear() - 1);
          break;
        default:
          break;
      }
      
      filteredData = data.filter(expense => {
        const expenseDate = new Date(expense.date_paid || expense.date || expense.created_at);
        return expenseDate >= cutoffDate;
      });
    }

    filteredData.forEach(expense => {
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

    const processedData = Object.entries(monthlyStats)
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));
    
    console.log('📊 MonthlyExpenseTrendChart - Processed monthly data:', processedData);
    return processedData;
  }, [data, timeFilter]);

  // Handle bar click to show expense breakdown
  const handleBarClick = (barData) => {
    if (!barData || !barData.month) return;
    
    setSelectedMonth(barData.month);
    
    // Get expenses for the selected month
    const monthExpenses = data.filter(expense => {
      const date = expense.date_paid || expense.date || expense.created_at;
      if (!date) return false;
      
      const expenseDate = new Date(date);
      const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
      return monthKey === barData.month;
    });

    // Group by service for breakdown
    const breakdown = {};
    monthExpenses.forEach(expense => {
      const service = expense.service_name || 'Unknown Service';
      const amount = parseFloat(expense.amount_aed || expense.amount || expense.value || expense.cost || 0);
      
      if (!breakdown[service]) {
        breakdown[service] = {
          service,
          total: 0,
          count: 0,
          expenses: []
        };
      }
      
      breakdown[service].total += amount;
      breakdown[service].count += 1;
      breakdown[service].expenses.push({
        id: expense.id,
        amount,
        date: expense.date_paid || expense.date || expense.created_at,
        invoice_number: expense.invoice_number || `INV-${expense.id}`,
        description: expense.description || 'No description'
      });
    });

    setMonthBreakdown(Object.values(breakdown).sort((a, b) => b.total - a.total));
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium text-gray-400">No expense data available</p>
          <p className="text-sm text-gray-400 mt-1">Data will appear here once expenses are added</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chart Header with Filter and Stats */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between space-y-4 lg:space-y-0">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Expense Trend</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {monthlyData.length} months of data • Total: AED {monthlyData.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
          </p>
        </div>
        
        {/* Summary Stats */}
        <div className="flex items-center space-x-4">
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Peak Month</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {monthlyData.length > 0 ? 
                monthlyData.reduce((max, item) => item.total > max.total ? item : max, monthlyData[0]).month : 
                'N/A'
              }
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-medium">Average</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              AED {monthlyData.length > 0 ? 
                Math.round(monthlyData.reduce((sum, item) => sum + item.total, 0) / monthlyData.length).toLocaleString() : 
                '0'
              }
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all-time">All Time</option>
              <option value="last-year">Last Year</option>
              <option value="last-6-months">Last 6 Months</option>
              <option value="last-3-months">Last 3 Months</option>
              <option value="current-month">Current Month</option>
            </select>
          </div>
        </div>
      </div>

      <div className="h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
        {monthlyData.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">📊</span>
              </div>
              <p className="text-gray-500">No data available for monthly trends</p>
              <p className="text-sm text-gray-400 mt-2">
                {data?.length === 0 ? 'No expense data found' : 'No data matches the selected time range'}
              </p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full">
            {console.log('📊 Rendering chart with data:', monthlyData)}
            <div className="h-full w-full min-h-[300px]">
              {/* Test if recharts is working */}
              {(() => {
                try {
                  return (
                    <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={monthlyData} 
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              width={800}
              height={300}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
                tickFormatter={(value) => {
                  const [year, month] = value.split('-');
                  const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ];
                  return `${monthNames[parseInt(month) - 1]} ${year}`;
                }}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: '#6B7280' }}
                axisLine={{ stroke: '#D1D5DB' }}
                tickLine={{ stroke: '#D1D5DB' }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '12px',
                  boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                }}
                formatter={(value) => [`AED ${value.toLocaleString()}`, 'Amount']}
                labelFormatter={(label) => {
                  const [year, month] = label.split('-');
                  const monthNames = [
                    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
                  ];
                  return `${monthNames[parseInt(month) - 1]} ${year}`;
                }}
              />
              <Bar 
                dataKey="total" 
                fill="#3B82F6"
                radius={[8, 8, 0, 0]}
                stroke="#1D4ED8"
                strokeWidth={1}
                onClick={handleBarClick}
                style={{ cursor: 'pointer' }}
              />
            </BarChart>
                    </ResponsiveContainer>
                  );
                } catch (error) {
                  console.error('❌ Chart rendering error:', error);
                  // Fallback to simple CSS bar chart
                  const maxValue = Math.max(...monthlyData.map(d => d.total));
                  return (
                    <div className="h-full w-full">
                      <div className="text-center mb-4">
                        <p className="text-sm text-gray-500">Fallback Chart (Recharts Error)</p>
                      </div>
                      <div className="flex items-end justify-around h-64 px-4">
                        {monthlyData.map((item, index) => {
                          const height = (item.total / maxValue) * 200;
                          const [year, month] = item.month.split('-');
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          return (
                            <div key={index} className="flex flex-col items-center">
                              <div 
                                className="bg-blue-500 rounded-t w-8 mb-2 transition-all duration-300 hover:bg-blue-600"
                                style={{ height: `${height}px` }}
                                title={`${monthNames[parseInt(month) - 1]} ${year}: AED ${item.total.toLocaleString()}`}
                              ></div>
                              <span className="text-xs text-gray-500 transform -rotate-45 origin-left">
                                {monthNames[parseInt(month) - 1]}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      <div className="text-center mt-2">
                        <p className="text-xs text-gray-400">Error: {error.message}</p>
                      </div>
                    </div>
                  );
                }
              })()}
            </div>
          </div>
        )}
      </div>

      {/* Month Breakdown Modal */}
      {selectedMonth && monthBreakdown.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-900 dark:to-indigo-800 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-700 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h4 className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                Expense Breakdown - {selectedMonth}
              </h4>
              <p className="text-blue-700 dark:text-blue-300">
                Click on any bar above to see detailed expense breakdown
              </p>
            </div>
            <button
              onClick={() => {
                setSelectedMonth(null);
                setMonthBreakdown([]);
              }}
              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-200 dark:hover:bg-blue-700 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Service Breakdown */}
          <div className="space-y-4">
            {monthBreakdown.map((service, index) => (
              <div key={service.service} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-blue-200 dark:border-blue-600 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></div>
                    <h5 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {service.service}
                    </h5>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                      AED {service.total.toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {service.count} transaction{service.count !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>

                {/* Individual Expenses */}
                <div className="space-y-2">
                  {service.expenses.map((expense, expIndex) => (
                    <div key={expIndex} className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Invoice #</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{expense.invoice_number}</p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Amount</p>
                          <p className="font-semibold text-blue-600 dark:text-blue-400">
                            AED {expense.amount.toLocaleString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Date</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(expense.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 text-xs uppercase font-medium">Description</p>
                          <p className="font-semibold text-gray-900 dark:text-white truncate">
                            {expense.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

// Enhanced Departmental Expenses Chart Component
const DepartmentalExpensesLineChart = ({ data }) => {
  const [filterType, setFilterType] = useState('monthly');

  const parseDate = (val) => {
    if (!val) return null;
    const d = new Date(val);
    return isNaN(d.getTime()) ? null : d;
  };

  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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
        <LineChart data={chartData}>
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Average Spending Chart Component
const AverageSpendingChart = ({ data }) => {
  // Debug logging for AverageSpendingChart
  console.log('📊 AverageSpendingChart - Processing', data?.length, 'expenses');

  if (!data || data.length === 0) {
    console.log('📊 AverageSpendingChart - No data available, showing empty state');
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No expense data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Add some expenses to see average spending by service</p>
        </div>
      </div>
    );
  }

  // Calculate average spending by service - try different possible field names
  const serviceStats = {};
  let processedCount = 0;
  let skippedCount = 0;
  
  data.forEach(expense => {
    // Try different possible field names for service and amount
    const serviceName = expense.service_name || expense.service || expense.category || expense.description || 'Unknown Service';
    const amount = expense.amount_aed || expense.amount || expense.value || expense.cost || 0;
    
    if (!serviceName || !amount || amount <= 0) {
      skippedCount++;
      return;
    }
    
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = {
        total: 0,
        count: 0
      };
    }
    serviceStats[serviceName].total += parseFloat(amount);
    serviceStats[serviceName].count += 1;
    processedCount++;
  });
  
  console.log('📊 Service stats processing complete:', {
    servicesFound: Object.keys(serviceStats).length,
    processedCount,
    skippedCount,
    totalExpenses: data.length
  });

  const chartData = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service: service.length > 20 ? service.substring(0, 20) + '...' : service,
      average: stats.total / stats.count,
      count: stats.count
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8); // Top 8 services

  console.log('📊 Chart data created:', chartData.length, 'services with data');

  // If no valid data, show empty state
  if (chartData.length === 0) {
    console.log('📊 No chart data available, showing empty state');
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Target className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
          </div>
          <p className="text-lg font-medium text-gray-500 dark:text-gray-400">No spending data available</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Check if expense data has service names and amounts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-96 bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-lg">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} layout="horizontal" margin={{ left: 20, right: 20, top: 20, bottom: 20 }}>
          <defs>
            <linearGradient id="averageGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.8} />
              <stop offset="50%" stopColor="#8B5CF6" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#EC4899" stopOpacity={0.8} />
            </linearGradient>
            <filter id="barGlow">
              <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
              <feMerge> 
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" opacity={0.5} />
          <XAxis 
            type="number" 
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={{ stroke: '#D1D5DB' }}
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
            axisLine={{ stroke: '#D1D5DB' }}
            tickLine={{ stroke: '#D1D5DB' }}
            width={120}
          />
          <Tooltip 
            content={({ active, payload, label }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl backdrop-blur-sm">
                    <div className="flex items-center space-x-2 mb-2">
                      <div className="w-3 h-3 rounded-full bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <p className="font-bold text-gray-800 dark:text-white text-lg">{label}</p>
                    </div>
                    <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                      {data.average.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Average per transaction ({data.count} transactions)
                    </p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Bar 
            dataKey="average" 
            fill="url(#averageGradient)"
            radius={[0, 8, 8, 0]}
            stroke="#1D4ED8"
            strokeWidth={1}
            filter="url(#barGlow)"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

// Enhanced Top Expense Categories Component
const TopExpenseCategories = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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

export default function Analytics() {
  const { user } = useAuth();
  const { data: expensesResponse, isLoading, error } = useExpenses(1, 1000, { userId: user?.id });
  const expenses = expensesResponse?.data || [];
  
  // Debug logging for expenses data
  console.log('📊 Analytics - Expenses data:', {
    expensesResponse,
    expensesLength: expenses.length,
    expenses: expenses,
    isLoading,
    error
  });
  
  // Test recharts components
  console.log('📊 Recharts components test:', {
    BarChart: typeof BarChart,
    ResponsiveContainer: typeof ResponsiveContainer,
    Bar: typeof Bar,
    XAxis: typeof XAxis,
    YAxis: typeof YAxis,
    CartesianGrid: typeof CartesianGrid,
    Tooltip: typeof Tooltip
  });
  
  // State
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    timeRange: 'all-time',
    comparison: 'none'
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  const handleFilterChange = (filterType, value) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };



  // Calculate summary statistics from real expense data
  const summaryStats = useMemo(() => {
    if (!expenses.length) {
      return {
        totalServices: 0,
        totalSpent: 0,
        averagePerService: 0
      };
    }

    const serviceStats = {};
    expenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed) {
        const service = expense.service_name.trim();
        if (!serviceStats[service]) {
          serviceStats[service] = 0;
        }
        serviceStats[service] += parseFloat(expense.amount_aed) || 0;
      }
    });

    const totalSpent = Object.values(serviceStats).reduce((sum, val) => sum + val, 0);
    const totalServices = Object.keys(serviceStats).length;

    return {
      totalServices,
      totalSpent,
      averagePerService: totalServices > 0 ? totalSpent / totalServices : 0
    };
  }, [expenses]);





  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 transition-all duration-300 ease-in-out">
          <div className="p-6">
            <LoadingSpinner size="xl" text="Loading analytics data..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <div className="flex-1 transition-all duration-300 ease-in-out">
          <div className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-2 text-lg">Error loading analytics data</p>
              <p className="text-gray-600">{error.message || 'Please try again later'}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
      {/* Enhanced Header Section */}
      <div className="bg-gradient-to-r from-white via-blue-50 to-indigo-50 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg">
                <BarChart3 className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Track and analyze your service spending and expenses with advanced insights</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsFilterExpanded(!isFilterExpanded)}
                className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
                {isFilterExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                <Download className="w-4 h-4" />
                <span className="text-sm font-medium">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <AnalyticsFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          isExpanded={isFilterExpanded}
          onToggle={() => setIsFilterExpanded(!isFilterExpanded)}
        />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl shadow-sm p-1 mb-8"
        >
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'overview'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Overview
            </button>
            
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'breakdown'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Service Breakdown
            </button>
            <button
              onClick={() => setActiveTab('distribution')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'distribution'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Distribution
            </button>
            <button
              onClick={() => setActiveTab('monthly-breakdown')}
              className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'monthly-breakdown'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Monthly Breakdown
            </button>
          </div>
        </motion.div>

        {/* Content based on active tab */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Enhanced Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl shadow-lg border border-blue-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-blue-600">Total Services</p>
                          <p className="text-3xl font-bold text-blue-900">{summaryStats.totalServices}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-2xl shadow-lg border border-green-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-xl shadow-lg">
                          <TrendingUp className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-green-600">Total Spent</p>
                          <p className="text-3xl font-bold text-green-900">
                            AED {summaryStats.totalSpent.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-2xl shadow-lg border border-yellow-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-yellow-500 to-yellow-600 rounded-xl shadow-lg">
                          <Calendar className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-yellow-600">Average Per Service</p>
                          <p className="text-3xl font-bold text-yellow-900">
                            AED {summaryStats.averagePerService.toFixed(0)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-2xl shadow-lg border border-purple-200 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                          <Shield className="w-6 h-6 text-white" />
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-purple-600">Total Transactions</p>
                          <p className="text-3xl font-bold text-purple-900">{expenses.length}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Enhanced Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Service Breakdown</h3>
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <ServiceBreakdownChart expenses={expenses} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Service Distribution</h3>
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <PieChartIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <ServiceDistributionChart expenses={expenses} />
                  </motion.div>
                </div>

                {/* Additional Enhanced Charts - Stacked Vertically */}
                <div className="grid grid-cols-1 gap-6">
                  {/* Monthly Expense Trend Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Monthly Expense Trend</h3>
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      </div>
                    </div>
                    <MonthlyExpenseTrendChart data={expenses} filters={filters} />
                  </motion.div>

                  {/* Departmental Expenses Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Departmental Expenses</h3>
                      <div className="w-8 h-8 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                      </div>
                    </div>
                    <DepartmentalExpensesLineChart data={expenses} />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Average Spending by Service Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Average Spending by Service</h3>
                      <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                        <Target className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <AverageSpendingChart data={expenses} />
                  </motion.div>

                  {/* Top Expense Categories Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                  >
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">Top Expense Categories</h3>
                      <div className="w-8 h-8 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center">
                        <Star className="w-4 h-4 text-pink-600 dark:text-pink-400" />
                      </div>
                    </div>
                    <TopExpenseCategories data={expenses} />
                  </motion.div>
                </div>

                {/* Individual Service Line Charts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
                >
                  <IndividualServiceCharts expenses={expenses} filters={filters} />
                </motion.div>
              </div>
            )}

            {activeTab === 'breakdown' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Service Breakdown</h3>
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <ServiceBreakdownChart expenses={expenses} />
                </div>
              </motion.div>
            )}

            {activeTab === 'distribution' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Service Distribution</h3>
                    <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                      <PieChartIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <ServiceDistributionChart expenses={expenses} />
                </div>
              </motion.div>
            )}

            {activeTab === 'monthly-breakdown' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Monthly Service Expense Breakdown</h3>
                    <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                      <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">Click on any service bar to see detailed monthly breakdown with payment information</p>
                  <MonthlyBreakdownCharts expenses={expenses} />
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
