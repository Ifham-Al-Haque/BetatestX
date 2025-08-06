import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useExpenseStats } from '../hooks/useExpenseStats';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';
import LoadingSpinner from '../components/LoadingSpinner';
import { ArrowLeft, BarChart3, TrendingUp, PieChart as PieChartIcon } from 'lucide-react';

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

// Service Breakdown Bar Chart Component
const ServiceBreakdownChart = ({ data, onServiceClick }) => {
  const serviceData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const serviceStats = {};
    data.forEach(expense => {
      if (expense.service_name && expense.amount_aed) {
        const service = expense.service_name.trim();
        if (!serviceStats[service]) {
          serviceStats[service] = {
            total: 0,
            count: 0,
            service: service
          };
        }
        serviceStats[service].total += expense.amount_aed;
        serviceStats[service].count += 1;
      }
    });

    return Object.values(serviceStats)
      .sort((a, b) => b.total - a.total)
      .map((item, index) => ({
        ...item,
        color: COLORS[index % COLORS.length]
      }));
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 font-medium">No service data available</p>
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
            onClick={(data) => onServiceClick(data.service)}
            style={{ cursor: 'pointer' }}
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

// Service Detail Line Chart Component
const ServiceDetailChart = ({ data, selectedService, onBack }) => {
  const serviceData = useMemo(() => {
    if (!data || !selectedService) return [];

    // Filter data for selected service
    const serviceExpenses = data.filter(expense => 
      expense.service_name?.trim() === selectedService
    );

    // Group by year and month
    const monthlyData = {};
    serviceExpenses.forEach(expense => {
      if (expense.date_paid) {
        const date = new Date(expense.date_paid);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const key = `${year}-${month.toString().padStart(2, '0')}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = {
            period: key,
            total: 0,
            count: 0,
            year: year,
            month: month
          };
        }
        monthlyData[key].total += expense.amount_aed || 0;
        monthlyData[key].count += 1;
      }
    });

    // Get all available months and create a complete range
    const allMonths = Object.keys(monthlyData);
    if (allMonths.length === 0) return [];

    // Find the date range
    const sortedMonths = allMonths.sort();
    const firstMonth = sortedMonths[0];
    const lastMonth = sortedMonths[sortedMonths.length - 1];
    
    const [firstYear, firstMonthNum] = firstMonth.split('-').map(Number);
    const [lastYear, lastMonthNum] = lastMonth.split('-').map(Number);
    
    // Create complete month range
    const completeMonthlyData = {};
    const currentDate = new Date(firstYear, firstMonthNum - 1, 1);
    const endDate = new Date(lastYear, lastMonthNum, 0);
    
    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const key = `${year}-${month.toString().padStart(2, '0')}`;
      
      if (monthlyData[key]) {
        // Use existing data
        completeMonthlyData[key] = {
          ...monthlyData[key],
          monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      } else {
        // Fill missing months with zero values
        completeMonthlyData[key] = {
          period: key,
          total: 0,
          count: 0,
          year: year,
          month: month,
          monthName: new Date(year, month - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
        };
      }
      
      // Move to next month
      currentDate.setMonth(currentDate.getMonth() + 1);
    }

    return Object.values(completeMonthlyData)
      .sort((a, b) => new Date(a.period) - new Date(b.period));
  }, [data, selectedService]);

  if (!selectedService) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all duration-200 hover:shadow-md"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {selectedService} - Monthly Breakdown
            </h3>
            <p className="text-gray-600 mt-1">
              {serviceData.length} months total • {serviceData.filter(item => item.total > 0).length} months with spending
            </p>
          </div>
        </div>
      </div>

             {serviceData.length === 0 ? (
         <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
           <div className="text-center">
             <TrendingUp className="w-16 h-16 mx-auto mb-4 text-gray-300" />
             <p className="text-lg text-gray-500 font-medium">No monthly data available for {selectedService}</p>
             <p className="text-sm text-gray-400 mt-2">Add expenses for this service to see trends</p>
           </div>
         </div>
      ) : (
                 <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100">
           <ResponsiveContainer width="100%" height="100%">
             <LineChart data={serviceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
               <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
               <XAxis 
                 dataKey="monthName" 
                 tick={{ fontSize: 12, fill: '#6B7280' }}
                 angle={-45}
                 textAnchor="end"
                 height={80}
                 axisLine={{ stroke: '#D1D5DB' }}
               />
               <YAxis 
                 tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                 tick={{ fontSize: 12, fill: '#6B7280' }}
                 axisLine={{ stroke: '#D1D5DB' }}
               />
               <Tooltip content={<CustomTooltip />} />
               <Line 
                 type="monotone" 
                 dataKey="total" 
                 stroke="#3B82F6" 
                 strokeWidth={4}
                 dot={{ fill: '#3B82F6', strokeWidth: 3, r: 6 }}
                 activeDot={{ r: 8, stroke: '#3B82F6', strokeWidth: 3 }}
               />
             </LineChart>
           </ResponsiveContainer>
         </div>
      )}

      {/* Month Coverage Summary */}
      {serviceData.length > 0 && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <h4 className="text-lg font-semibold text-gray-900 mb-3">Month Coverage Analysis</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Data Range:</p>
              <p className="font-medium text-gray-900">
                {serviceData[0]?.monthName} to {serviceData[serviceData.length - 1]?.monthName}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Missing Months:</p>
              <p className="font-medium text-gray-900">
                {serviceData.filter(item => item.total === 0).length} months with zero spending
              </p>
            </div>
          </div>
          {serviceData.filter(item => item.total === 0).length > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 mb-2">Months with no spending:</p>
              <div className="flex flex-wrap gap-2">
                {serviceData
                  .filter(item => item.total === 0)
                  .map(item => (
                    <span key={item.period} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md">
                      {item.monthName}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

             {/* Summary Statistics */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
         <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
           <div className="text-sm font-medium text-blue-600 mb-2">Total Spent</div>
           <div className="text-2xl font-bold text-blue-900">
             {serviceData.reduce((sum, item) => sum + item.total, 0).toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
           </div>
         </div>
         <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
           <div className="text-sm font-medium text-green-600 mb-2">Average Monthly</div>
           <div className="text-2xl font-bold text-green-900">
             {(serviceData.reduce((sum, item) => sum + item.total, 0) / Math.max(serviceData.length, 1)).toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
           </div>
         </div>
         <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
           <div className="text-sm font-medium text-purple-600 mb-2">Total Transactions</div>
           <div className="text-2xl font-bold text-purple-900">
             {serviceData.reduce((sum, item) => sum + item.count, 0)}
           </div>
         </div>
       </div>
    </div>
  );
};

// Service Distribution Pie Chart Component
const ServiceDistributionChart = ({ data }) => {
  const pieData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const serviceStats = {};
    data.forEach(expense => {
      if (expense.service_name && expense.amount_aed) {
        const service = expense.service_name.trim();
        if (!serviceStats[service]) {
          serviceStats[service] = 0;
        }
        serviceStats[service] += expense.amount_aed;
      }
    });

    const total = Object.values(serviceStats).reduce((sum, val) => sum + val, 0);
    
    return Object.entries(serviceStats)
      .map(([service, amount], index) => ({
        name: service,
        value: amount,
        percentage: ((amount / total) * 100).toFixed(1),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 services
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <PieChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 font-medium">No service data available</p>
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
  const { user, userProfile } = useAuth();
  const { sidebarWidth } = useSidebar();
  const { data: expenseStats, isLoading, error } = useExpenseStats();
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState('breakdown'); // 'breakdown' or 'distribution'

  const safeExpenseStats = expenseStats || [];

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!safeExpenseStats.length) {
      return {
        totalServices: 0,
        totalSpent: 0,
        averagePerService: 0
      };
    }

    const serviceStats = {};
    safeExpenseStats.forEach(expense => {
      if (expense.service_name && expense.amount_aed) {
        const service = expense.service_name.trim();
        if (!serviceStats[service]) {
          serviceStats[service] = 0;
        }
        serviceStats[service] += expense.amount_aed;
      }
    });

    const totalSpent = Object.values(serviceStats).reduce((sum, val) => sum + val, 0);
    const totalServices = Object.keys(serviceStats).length;

    return {
      totalServices,
      totalSpent,
      averagePerService: totalServices > 0 ? totalSpent / totalServices : 0
    };
  }, [safeExpenseStats]);

  const handleServiceClick = (service) => {
    setSelectedService(service);
  };

  const handleBack = () => {
    setSelectedService(null);
  };

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
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      
      <div className="flex-1 transition-all duration-300 ease-in-out" style={{ marginLeft: `${sidebarWidth}px` }}>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics</h1>
                <p className="text-gray-600 text-lg">Service spending analysis and insights</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500 mb-1">Last updated</p>
                <p className="text-sm font-medium text-gray-900">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Services</p>
                    <p className="text-3xl font-bold text-gray-900">{summaryStats.totalServices}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-blue-50 flex-shrink-0">
                    <BarChart3 className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Total Spent</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {summaryStats.totalSpent.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-green-50 flex-shrink-0">
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-shadow duration-300 md:col-span-2 lg:col-span-1">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-2">Average per Service</p>
                    <p className="text-3xl font-bold text-gray-900">
                      {summaryStats.averagePerService.toLocaleString('en-US', { style: 'currency', currency: 'AED' })}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-purple-50 flex-shrink-0">
                    <PieChartIcon className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Chart Section */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
              {selectedService ? (
                <ServiceDetailChart 
                  data={safeExpenseStats} 
                  selectedService={selectedService} 
                  onBack={handleBack}
                />
              ) : (
                <div className="space-y-8">
                  {/* Tab Navigation */}
                  <div className="flex space-x-2 bg-gray-100 p-2 rounded-xl">
                    <button
                      onClick={() => setActiveTab('breakdown')}
                      className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeTab === 'breakdown'
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Service Breakdown
                    </button>
                    <button
                      onClick={() => setActiveTab('distribution')}
                      className={`flex-1 py-3 px-6 rounded-lg text-sm font-semibold transition-all duration-200 ${
                        activeTab === 'distribution'
                          ? 'bg-white text-blue-600 shadow-md'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      Distribution
                    </button>
                  </div>

                  {/* Chart Content */}
                  <div>
                    {activeTab === 'breakdown' ? (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Service Spending Breakdown
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg">
                          Click on any bar to see detailed monthly breakdown for that service
                        </p>
                        <ServiceBreakdownChart 
                          data={safeExpenseStats} 
                          onServiceClick={handleServiceClick}
                        />
                      </div>
                    ) : (
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                          Service Distribution
                        </h3>
                        <p className="text-gray-600 mb-6 text-lg">
                          Percentage breakdown of total spending by service
                        </p>
                        <ServiceDistributionChart data={safeExpenseStats} />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
