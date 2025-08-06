import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import { 
  DollarSign, TrendingUp, TrendingDown, Calendar, 
  Plus, Edit, Trash, Filter, Search, Settings,
  Monitor, Server, Globe, Database, Cloud, Shield, X, Save,
  BarChart3, ArrowLeft, PieChart as PieChartIcon
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useExpenseStats } from "../hooks/useExpenseStats";
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

// Service Breakdown Bar Chart Component
const ServiceBreakdownChart = ({ services, onServiceClick }) => {
  const serviceData = useMemo(() => {
    if (!services || services.length === 0) return [];

    // Calculate total spending for each service from monthly_spending
    const serviceStats = services.map(service => {
      const total = Object.values(service.monthly_spending || {}).reduce((sum, amount) => sum + (amount || 0), 0);
      return {
        service: service.service_name,
        total: total,
        count: Object.keys(service.monthly_spending || {}).length,
        color: COLORS[services.indexOf(service) % COLORS.length]
      };
    });

    return serviceStats
      .filter(item => item.total > 0) // Only show services with spending
      .sort((a, b) => b.total - a.total);
  }, [services]);

  if (!services || services.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 font-medium">No service data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some services to see analytics</p>
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
const ServiceDetailChart = ({ service }) => {
  const serviceData = useMemo(() => {
    if (!service || !service.monthly_spending) return [];

    // Convert monthly_spending object to array format for the chart
    const monthlyData = Object.entries(service.monthly_spending || {})
      .map(([month, amount]) => ({
        monthName: month,
        total: amount || 0,
        count: 1
      }))
      .sort((a, b) => {
        // Sort by month (assuming format like "Jan-24", "Feb-24", etc.)
        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const aMonth = a.monthName.split('-')[0];
        const bMonth = b.monthName.split('-')[0];
        const aYear = a.monthName.split('-')[1];
        const bYear = b.monthName.split('-')[1];
        
        if (aYear !== bYear) return aYear.localeCompare(bYear);
        return monthOrder.indexOf(aMonth) - monthOrder.indexOf(bMonth);
      });

    return monthlyData;
  }, [service]);

  if (!service) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900">
              {service.service_name} - Monthly Breakdown
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
            <p className="text-lg text-gray-500 font-medium">No monthly data available for {service.service_name}</p>
            <p className="text-sm text-gray-400 mt-2">Add monthly spending data to see trends</p>
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
                    <span key={item.monthName} className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-md">
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
const ServiceDistributionChart = ({ services }) => {
  const pieData = useMemo(() => {
    if (!services || services.length === 0) return [];

    // Calculate total spending for each service
    const serviceStats = services.map(service => {
      const total = Object.values(service.monthly_spending || {}).reduce((sum, amount) => sum + (amount || 0), 0);
      return {
        name: service.service_name,
        value: total,
        category: service.category
      };
    }).filter(service => service.value > 0); // Only services with spending

    const totalSpending = serviceStats.reduce((sum, service) => sum + service.value, 0);
    
    return serviceStats
      .map((service, index) => ({
        ...service,
        percentage: ((service.value / totalSpending) * 100).toFixed(1),
        color: COLORS[index % COLORS.length]
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8); // Top 8 services
  }, [services]);

  if (!services || services.length === 0) {
    return (
      <div className="h-96 bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border border-gray-100 flex items-center justify-center">
        <div className="text-center">
          <PieChartIcon className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p className="text-lg text-gray-500 font-medium">No service data available</p>
          <p className="text-sm text-gray-400 mt-2">Add some services to see distribution</p>
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

// Service Management Components
const ServiceForm = ({ service, onClose, onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    service_name: service?.service_name || "",
    currency: service?.currency || "USD",
    amount: service?.amount || "",
    amount_in_aed: service?.amount_in_aed || "",
    service_status: service?.service_status || "Active",
    category: service?.category || "",
    notes: service?.notes || "",
    monthly_spending: service?.monthly_spending || {}
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {service ? "Edit Service" : "Add New Service"}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                name="service_name"
                value={formData.service_name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter service name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Category</option>
                <option value="Automation">Automation</option>
                <option value="Retool">Retool</option>
                <option value="Design">Design</option>
                <option value="Hosting">Hosting</option>
                <option value="Communication">Communication</option>
                <option value="Development">Development</option>
                <option value="Marketing">Marketing</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Currency
              </label>
              <select
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="USD">USD</option>
                <option value="AED">AED</option>
                <option value="GBP">GBP</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter amount"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Amount in AED
              </label>
              <input
                type="number"
                name="amount_in_aed"
                value={formData.amount_in_aed}
                onChange={handleChange}
                step="0.01"
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="Enter amount in AED"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Status
              </label>
              <select
                name="service_status"
                value={formData.service_status}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Enter service notes..."
            />
          </div>

          <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isLoading ? "Saving..." : (service ? "Update Service" : "Create Service")}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

const ServiceCard = ({ service, onEdit, onDelete }) => {
  const getServiceIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'automation': return <Server className="w-5 h-5" />;
      case 'design': return <Monitor className="w-5 h-5" />;
      case 'hosting': return <Cloud className="w-5 h-5" />;
      case 'communication': return <Globe className="w-5 h-5" />;
      case 'development': return <Database className="w-5 h-5" />;
      case 'marketing': return <TrendingUp className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'Inactive': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'Suspended': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'Pending': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center">
          <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg mr-3">
            {getServiceIcon(service.category)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {service.service_name}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {service.category || 'Uncategorized'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(service)}
            className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(service.id)}
            className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Status</span>
          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(service.service_status)}`}>
            {service.service_status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">Amount</span>
          <span className="text-sm text-gray-900 dark:text-white font-semibold">
            {service.amount} {service.currency}
          </span>
        </div>

        {service.amount_in_aed && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">Amount in AED</span>
            <span className="text-sm text-gray-900 dark:text-white font-semibold">
              AED {service.amount_in_aed}
            </span>
          </div>
        )}

        {service.notes && (
          <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {service.notes}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default function Analytics() {
  const { user } = useAuth();
  const { sidebarWidth } = useSidebar();
  const { data: expenseStats, isLoading, error } = useExpenseStats();
  
  // Service Management State
  const [selectedService, setSelectedService] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [services, setServices] = useState([
    // Sample data based on your spreadsheet
    {
      id: 1,
      service_name: "AWS [BESPIN]",
      currency: "USD",
      amount: "Varies per usage",
      amount_in_aed: "",
      service_status: "Active",
      category: "Automation",
      notes: "Cloud infrastructure and services",
      monthly_spending: {
        "Jan-24": 6360.09,
        "Feb-24": 1831.5,
        "Oct-24": 1831.5,
        "Jan-25": 18592.12
      }
    },
    {
      id: 2,
      service_name: "ATLASSIAN",
      currency: "USD",
      amount: "",
      amount_in_aed: "",
      service_status: "Active",
      category: "Automation",
      notes: "JIRA and Confluence services",
      monthly_spending: {
        "Jan-24": 684.8,
        "Mar-24": 659.55,
        "Apr-24": 56.5
      }
    },
    {
      id: 3,
      service_name: "RETOOL",
      currency: "USD",
      amount: "Varies per user license",
      amount_in_aed: "",
      service_status: "Active",
      category: "Retool",
      notes: "FROM JUNE 2025 RETOOL IS STOP BUT KEPT FREE TIER ACCOUNT",
      monthly_spending: {
        "Jan-24": 65,
        "May-24": 576,
        "Dec-24": 180
      }
    },
    {
      id: 4,
      service_name: "FIGMA-UDRIVE",
      currency: "USD",
      amount: "",
      amount_in_aed: "",
      service_status: "Active",
      category: "Design",
      notes: "Main Subscription is yearly and have quarterly tune up FROM MARCH 2023-TILL FEBRUARY 2565",
      monthly_spending: {
        "Jul-24": 1080,
        "Dec-24": 405,
        "Mar-25": 2700,
        "Jun-25": 225
      }
    },
    {
      id: 5,
      service_name: "CLOUDFARE",
      currency: "USD",
      amount: "250",
      amount_in_aed: "",
      service_status: "Active",
      category: "Hosting",
      notes: "CDN and security services",
      monthly_spending: {
        "Jan-24": 250,
        "Feb-24": 250,
        "Mar-24": 250,
        "Apr-24": 250,
        "May-24": 250,
        "Jun-24": 250,
        "Jul-24": 250,
        "Aug-24": 250,
        "Sep-24": 250,
        "Oct-24": 250,
        "Nov-24": 250,
        "Dec-24": 250,
        "Jan-25": 250,
        "Feb-25": 250,
        "Mar-25": 250,
        "Apr-25": 250,
        "May-25": 250,
        "Jun-25": 250,
        "Jul-25": 250,
        "Aug-25": 250,
        "Sep-25": 250,
        "Oct-25": 250,
        "Nov-25": 250,
        "Dec-25": 250
      }
    }
  ]);

  // Service Management Functions
  const handleAddService = () => {
    setEditingService(null);
    setShowServiceForm(true);
  };

  const handleEditService = (service) => {
    setEditingService(service);
    setShowServiceForm(true);
  };

  const handleDeleteService = (serviceId) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this service?");
    if (confirmDelete) {
      setServices(services.filter(service => service.id !== serviceId));
    }
  };

  const handleSubmitService = (formData) => {
    if (editingService) {
      // Update existing service
      setServices(services.map(service => 
        service.id === editingService.id 
          ? { ...service, ...formData }
          : service
      ));
    } else {
      // Add new service
      const newService = {
        id: Date.now(),
        ...formData,
        monthly_spending: {}
      };
      setServices([...services, newService]);
    }
    setShowServiceForm(false);
    setEditingService(null);
  };

  const handleCloseServiceForm = () => {
    setShowServiceForm(false);
    setEditingService(null);
  };

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

  const handleServiceClick = (serviceName) => {
    // Find the service object by name
    const service = services.find(s => s.service_name === serviceName);
    if (service) {
      setSelectedService(service);
    }
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
            <button
              onClick={handleAddService}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Service
            </button>
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
                onClick={() => setActiveTab('services')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'services'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                Service Management
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
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">{services.length}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <div className="flex items-center">
                    <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                      <TrendingUp className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Services</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {services.filter(s => s.service_status === 'Active').length}
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
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Categories</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        {new Set(services.map(s => s.category).filter(Boolean)).size}
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
                      <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Monthly Spend</p>
                      <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                        AED {services.reduce((total, service) => {
                          const monthlyTotal = Object.values(service.monthly_spending || {}).reduce((sum, amount) => sum + (amount || 0), 0);
                          return total + monthlyTotal;
                        }, 0).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Existing Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Breakdown</h3>
                  <ServiceBreakdownChart services={services} onServiceClick={handleServiceClick} />
                </div>

                <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Distribution</h3>
                  <ServiceDistributionChart services={services} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'services' && (
            <div className="space-y-6">
              {/* Service Management Header */}
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Service Management
                  </h2>
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search services..."
                        className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white">
                      <option value="">All Categories</option>
                      <option value="Automation">Automation</option>
                      <option value="Design">Design</option>
                      <option value="Hosting">Hosting</option>
                      <option value="Communication">Communication</option>
                      <option value="Development">Development</option>
                      <option value="Marketing">Marketing</option>
                    </select>
                  </div>
                </div>

                {/* Services Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <AnimatePresence>
                    {services.map((service) => (
                      <ServiceCard
                        key={service.id}
                        service={service}
                        onEdit={handleEditService}
                        onDelete={handleDeleteService}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'breakdown' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Breakdown</h3>
                <ServiceBreakdownChart services={services} onServiceClick={handleServiceClick} />
              </div>
            </div>
          )}

          {activeTab === 'distribution' && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Distribution</h3>
                <ServiceDistributionChart services={services} />
              </div>
            </div>
          )}

          {/* Service Detail Modal */}
          {selectedService && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
              >
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {selectedService.service_name} - Monthly Spending
                    </h2>
                    <button
                      onClick={() => setSelectedService(null)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <div className="p-6">
                  <ServiceDetailChart service={selectedService} />
                </div>
              </motion.div>
            </div>
          )}

          {/* Service Form Modal */}
          <AnimatePresence>
            {showServiceForm && (
              <ServiceForm
                service={editingService}
                onClose={handleCloseServiceForm}
                onSubmit={handleSubmitService}
                isLoading={false}
              />
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
