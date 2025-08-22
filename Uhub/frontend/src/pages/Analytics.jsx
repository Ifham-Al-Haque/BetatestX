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
import { useSidebar } from "../context/SidebarContext";
import Sidebar from "../components/Sidebar";
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





export default function Analytics() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebar();
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
        <Sidebar />
        <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <LoadingSpinner size="xl" text="Loading analytics data..." />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center">
              <p className="text-red-600 mb-2 text-lg">Error loading analytics data</p>
              <p className="text-gray-500">{error.message}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      <Sidebar />
      <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                     {/* Header */}
           <div className="flex justify-between items-center mb-8">
             <div>
               <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                 Analytics Dashboard
               </h1>
               <p className="text-gray-600 dark:text-gray-400 mt-2">
                 Track and analyze your service spending and expenses
               </p>
             </div>
           </div>

          {/* Tab Navigation */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-1 mb-6">
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Overview
              </button>
              
              <button
                onClick={() => setActiveTab('breakdown')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'breakdown'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Service Breakdown
              </button>
              <button
                onClick={() => setActiveTab('distribution')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'distribution'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Distribution
              </button>
              <button
                onClick={() => setActiveTab('monthly-breakdown')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'monthly-breakdown'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Monthly Breakdown
              </button>
            </div>
          </div>

          {/* Content based on active tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                   <div className="flex items-center">
                     <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                       <DollarSign className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                     </div>
                     <div className="ml-4">
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Services</p>
                       <p className="text-2xl font-semibold text-gray-900 dark:text-white">{summaryStats.totalServices}</p>
                     </div>
                   </div>
                 </div>

                                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                   <div className="flex items-center">
                     <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                       <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                     </div>
                     <div className="ml-4">
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Spent</p>
                       <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                         AED {summaryStats.totalSpent.toLocaleString()}
                       </p>
                     </div>
                   </div>
                 </div>

                                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                   <div className="flex items-center">
                     <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                       <Calendar className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                     </div>
                     <div className="ml-4">
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Per Service</p>
                       <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                         AED {summaryStats.averagePerService.toFixed(0)}
                       </p>
                     </div>
                   </div>
                 </div>

                                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                   <div className="flex items-center">
                     <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                       <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                     </div>
                     <div className="ml-4">
                       <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Transactions</p>
                       <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                         {expenses.length}
                       </p>
                     </div>
                   </div>
                 </div>
              </div>

                             {/* Existing Charts */}
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Breakdown</h3>
                   <ServiceBreakdownChart expenses={expenses} />
                 </div>

                 <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Distribution</h3>
                   <ServiceDistributionChart expenses={expenses} />
                 </div>
               </div>

               {/* Individual Service Line Charts */}
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                 <IndividualServiceCharts expenses={expenses} />
               </div>
            </div>
          )}

          

                     {activeTab === 'breakdown' && (
             <div className="space-y-6">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Breakdown</h3>
                 <ServiceBreakdownChart expenses={expenses} />
               </div>
             </div>
           )}

                     {activeTab === 'distribution' && (
             <div className="space-y-6">
               <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Distribution</h3>
                 <ServiceDistributionChart expenses={expenses} />
               </div>
             </div>
           )}

          {activeTab === 'monthly-breakdown' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Monthly Service Expense Breakdown</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">Click on any service bar to see detailed monthly breakdown with payment information</p>
                <MonthlyBreakdownCharts expenses={expenses} />
              </div>
            </div>
          )}

          

          
        </div>
      </div>
    </div>
  );
}
