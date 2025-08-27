import React, { useMemo, useState } from "react"; // Analytics component with real expense data
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Shield, X,
  BarChart3, ArrowLeft, PieChart as PieChartIcon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useExpenses } from "../hooks/useApi";
import LoadingSpinner from "../components/LoadingSpinner";

// Color scheme for charts
const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'];

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
        <p className="font-semibold text-gray-800">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value?.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
          </p>
        ))}
      </div>
    );
  }
  return null;
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
        const service = expense.service_name.trim();
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
    <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis 
            dataKey="service" 
            angle={-45}
            textAnchor="end"
            height={80}
            interval={0}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <YAxis 
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
            tick={{ fontSize: 12, fill: '#6B7280' }}
            axisLine={{ stroke: '#D1D5DB' }}
          />
          <Tooltip content={<CustomTooltip />} />
                     <Bar 
             dataKey="total" 
             fill="#3B82F6"
             radius={[4, 4, 0, 0]}
           >
            {serviceData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};



// Individual Service Line Charts Component
const IndividualServiceCharts = ({ expenses }) => {
  // Group expenses by service and month
  const serviceData = useMemo(() => {
    if (!expenses.length) return {};

    const grouped = {};
    expenses.forEach(expense => {
      if (expense.service_name && expense.amount_aed && expense.date_paid) {
        const service = expense.service_name.trim();
        const date = new Date(expense.date_paid);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
        
        if (!grouped[service]) {
          grouped[service] = {};
        }
        if (!grouped[service][monthKey]) {
          grouped[service][monthKey] = {
            monthName,
            total: 0,
            count: 0
          };
        }
        grouped[service][monthKey].total += parseFloat(expense.amount_aed) || 0;
        grouped[service][monthKey].count += 1;
      }
    });

    // Convert to array format for charts
    const result = {};
    Object.keys(grouped).forEach(service => {
      const months = Object.values(grouped[service]);
      result[service] = months.sort((a, b) => {
        const aDate = new Date(a.monthName);
        const bDate = new Date(b.monthName);
        return aDate - bDate;
      });
    });

    return result;
  }, [expenses]);

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
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Individual Service Trends
      </h3>
      
      {services.map((serviceName, index) => {
        const data = serviceData[serviceName];
        if (!data || data.length === 0) return null;

        return (
          <motion.div
            key={serviceName}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-600"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {serviceName}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {data.length} months • Total: AED {data.reduce((sum, item) => sum + item.total, 0).toLocaleString()}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {data.filter(item => item.total > 0).length} active months
                </span>
              </div>
            </div>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="monthName" 
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
                            <p className="text-xs text-gray-500">
                              {payload[0].payload.count} transaction{payload[0].payload.count !== 1 ? 's' : ''}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="total" 
                    stroke={COLORS[index % COLORS.length]}
                    strokeWidth={3}
                    dot={{ fill: COLORS[index % COLORS.length], strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: COLORS[index % COLORS.length], strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Service Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Peak Month</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {data.reduce((max, item) => item.total > max.total ? item : max, data[0]).monthName}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Average Monthly</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  AED {(data.reduce((sum, item) => sum + item.total, 0) / data.length).toFixed(0)}
                </p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Transactions</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {data.reduce((sum, item) => sum + item.count, 0)}
                </p>
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
        const service = expense.service_name.trim();
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
    <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={pieData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percentage }) => `${name} (${percentage}%)`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {pieData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-4 border border-gray-200 rounded-xl shadow-lg">
                    <p className="font-bold text-gray-800 text-lg">{data.name}</p>
                    <p className="text-lg font-semibold text-gray-600">
                      {data.value.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </p>
                    <p className="text-sm text-gray-500">{data.percentage}% of total</p>
                  </div>
                );
              }
              return null;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

// Monthly Expense Trend Chart Component
const MonthlyExpenseTrendChart = ({ data }) => {
  // Process monthly data for charts - moved to top before any returns
  const monthlyData = useMemo(() => {
    if (!data || !data.length) return [];

    const monthlyStats = {};
    data.forEach(expense => {
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
  }, [data]);

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
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={monthlyData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
        <XAxis 
          dataKey="month" 
          tick={{ fontSize: 12, fill: '#6B7280' }}
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
          tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #E5E7EB',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
          }}
          formatter={(value) => [`${(value / 1000).toFixed(1)}k AED`, 'Amount']}
          labelFormatter={(label) => {
            const [year, month] = label.split('-');
            const monthNames = [
              'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
            ];
            return `${monthNames[parseInt(month) - 1]} ${year}`;
          }}
        />
        <Line 
          type="monotone" 
          dataKey="total" 
          stroke="#3B82F6"
          strokeWidth={3}
          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
          activeDot={{ r: 8, strokeWidth: 2, stroke: 'white' }}
        />
      </LineChart>
    </ResponsiveContainer>
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
  if (!data || data.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
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

  const chartData = Object.entries(serviceStats)
    .map(([service, stats]) => ({
      service: service.length > 20 ? service.substring(0, 20) + '...' : service,
      average: stats.total / stats.count,
      count: stats.count
    }))
    .sort((a, b) => b.average - a.average)
    .slice(0, 8); // Top 8 services

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
  
  // State
  const [activeTab, setActiveTab] = useState('overview');



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
      {/* Header Section */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
                <p className="text-sm text-gray-600">Track and analyze your service spending and expenses</p>
              </div>
            </div>
          </div>
        </div>
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
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <DollarSign className="w-6 h-6 text-blue-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Services</p>
                        <p className="text-2xl font-semibold text-gray-900">{summaryStats.totalServices}</p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-green-100 rounded-lg">
                        <TrendingUp className="w-6 h-6 text-green-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Spent</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          AED {summaryStats.totalSpent.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-yellow-100 rounded-lg">
                        <Calendar className="w-6 h-6 text-yellow-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Average Per Service</p>
                        <p className="text-2xl font-semibold text-gray-900">
                          AED {summaryStats.averagePerService.toFixed(0)}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex items-center">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Shield className="w-6 h-6 text-purple-600" />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-500">Total Transactions</p>
                        <p className="text-2xl font-semibold text-gray-900">{expenses.length}</p>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Existing Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Breakdown</h3>
                    <ServiceBreakdownChart expenses={expenses} />
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Distribution</h3>
                    <ServiceDistributionChart expenses={expenses} />
                  </motion.div>
                </div>

                {/* Additional Charts from Dashboard */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Monthly Expense Trend Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Expense Trend</h3>
                    <MonthlyExpenseTrendChart data={expenses} />
                  </motion.div>

                  {/* Departmental Expenses Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Departmental Expenses</h3>
                    <DepartmentalExpensesLineChart data={expenses} />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Average Spending by Service Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Spending by Service</h3>
                    <AverageSpendingChart data={expenses} />
                  </motion.div>

                  {/* Top Expense Categories Chart */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                    className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                  >
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Expense Categories</h3>
                    <TopExpenseCategories data={expenses} />
                  </motion.div>
                </div>

                {/* Individual Service Line Charts */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                >
                  <IndividualServiceCharts expenses={expenses} />
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Breakdown</h3>
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Distribution</h3>
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
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Service Expense Breakdown</h3>
                  <p className="text-gray-600 mb-6">Click on any service bar to see detailed monthly breakdown with payment information</p>
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
