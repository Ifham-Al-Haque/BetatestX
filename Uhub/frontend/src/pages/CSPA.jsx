import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, TrendingDown, Upload, FileText, Users, Activity, Target,
  Phone, PhoneIncoming, PhoneOutgoing, Clock, Star, MessageSquare,
  CheckCircle, AlertCircle, Download, Calendar, Zap, Award
} from 'lucide-react';
import { HRManagerAndAbove } from '../components/RoleBasedSection';
import CSPAPerformanceAnalytics from '../components/CSPAPerformanceAnalytics';
import { motion } from 'framer-motion';

// Simple placeholder components to avoid any import issues
const SimpleCSVImporter = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Upload className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">CSV Data Importer</h3>
    </div>
    <p className="text-gray-600">Import your customer service data here.</p>
  </div>
);

const SimpleAnalytics = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-green-100 rounded-lg">
        <TrendingUp className="w-5 h-5 text-green-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">Performance Analytics</h3>
    </div>
    <p className="text-gray-600">Analytics will be displayed here.</p>
  </div>
);

const SimpleImportHistory = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-purple-100 rounded-lg">
        <Activity className="w-5 h-5 text-purple-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">Import History</h3>
    </div>
    <p className="text-gray-600">Import history will be displayed here.</p>
  </div>
);

const CSPA = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  // Mock data for overview metrics - in production, this would come from API
  const overviewMetrics = {
    totalCalls: 1247,
    avgResponseTime: '2.3 min',
    satisfactionScore: 4.6,
    activeAgents: 12,
    resolvedTickets: 1189,
    pendingTickets: 58,
    callVolumeChange: '+12.5%',
    satisfactionChange: '+0.3',
    responseTimeChange: '-15%'
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'analytics', label: 'Performance Analytics', icon: TrendingUp },
    { id: 'data-import', label: 'Data Import', icon: Upload },
    { id: 'reports', label: 'Reports', icon: FileText }
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Phone className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-80" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">Total Calls</h3>
                <p className="text-3xl font-bold mb-2">{overviewMetrics.totalCalls.toLocaleString()}</p>
                <p className="text-sm opacity-80 flex items-center gap-1">
                  <span className="text-green-300">{overviewMetrics.callVolumeChange}</span>
                  <span>vs last month</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-green-500 to-emerald-600 p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Clock className="w-6 h-6" />
                  </div>
                  <TrendingDown className="w-5 h-5 opacity-80" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">Avg Response Time</h3>
                <p className="text-3xl font-bold mb-2">{overviewMetrics.avgResponseTime}</p>
                <p className="text-sm opacity-80 flex items-center gap-1">
                  <span className="text-green-300">{overviewMetrics.responseTimeChange}</span>
                  <span>improvement</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-500 to-orange-500 p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Star className="w-6 h-6" />
                  </div>
                  <TrendingUp className="w-5 h-5 opacity-80" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">Satisfaction Score</h3>
                <p className="text-3xl font-bold mb-2">{overviewMetrics.satisfactionScore}</p>
                <p className="text-sm opacity-80 flex items-center gap-1">
                  <span className="text-green-300">+{overviewMetrics.satisfactionChange}</span>
                  <span>vs last month</span>
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-purple-500 to-indigo-600 p-6 rounded-xl shadow-lg text-white hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white/20 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                  <Activity className="w-5 h-5 opacity-80" />
                </div>
                <h3 className="text-sm font-medium opacity-90 mb-1">Active Agents</h3>
                <p className="text-3xl font-bold mb-2">{overviewMetrics.activeAgents}</p>
                <p className="text-sm opacity-80">Currently handling calls</p>
              </motion.div>
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Resolved Tickets</h3>
                      <p className="text-sm text-gray-600">Successfully closed</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{overviewMetrics.resolvedTickets}</span>
                  <span className="text-sm text-gray-500">/ {overviewMetrics.totalCalls}</span>
                </div>
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(overviewMetrics.resolvedTickets / overviewMetrics.totalCalls) * 100}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {((overviewMetrics.resolvedTickets / overviewMetrics.totalCalls) * 100).toFixed(1)}% resolution rate
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 rounded-lg">
                      <AlertCircle className="w-5 h-5 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Pending Tickets</h3>
                      <p className="text-sm text-gray-600">Awaiting resolution</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-gray-900">{overviewMetrics.pendingTickets}</span>
                  <span className="text-sm text-gray-500">active</span>
                </div>
                <div className="mt-4 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-orange-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(overviewMetrics.pendingTickets / overviewMetrics.totalCalls) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">
                    {((overviewMetrics.pendingTickets / overviewMetrics.totalCalls) * 100).toFixed(1)}%
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-xl border border-blue-100"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Quick Actions</h3>
                  <p className="text-gray-600 mb-4">Get started with your customer service analysis</p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setActiveTab('data-import')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    Import Data
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="px-4 py-2 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors flex items-center gap-2"
                  >
                    <BarChart3 className="w-4 h-4" />
                    View Analytics
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        );
      
      case 'analytics':
        return (
          <div className="space-y-6">
            {analyticsData ? (
              <CSPAPerformanceAnalytics data={analyticsData} selectedPeriod={selectedPeriod} />
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
              >
                <div className="text-center py-12">
                  <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="w-10 h-10 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">No Analytics Data Available</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Import your customer service data to view detailed performance analytics, trends, and insights.
                  </p>
                  <button
                    onClick={() => setActiveTab('data-import')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Import Data Now
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        );
      
      case 'data-import':
        return (
          <div className="space-y-6">
            <SimpleCSVImporter />
            <SimpleImportHistory />
          </div>
        );
      
      case 'reports':
        return (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">Reports & Export</h3>
            </div>
            <p className="text-gray-600">Generate comprehensive reports and export data for further analysis.</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <HRManagerAndAbove
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <BarChart3 className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the Customer Service Performance Analysis system.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      }
    >
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-20">
              <div className="flex items-center space-x-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200 }}
                  className="p-3 bg-white/20 backdrop-blur-sm rounded-xl"
                >
                  <BarChart3 className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Customer Service Performance Analysis</h1>
                  <p className="text-sm text-blue-100">Monitor and analyze customer service metrics and performance</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value)}
                  className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/50"
                >
                  <option value="week" className="text-gray-900">This Week</option>
                  <option value="month" className="text-gray-900">This Month</option>
                  <option value="quarter" className="text-gray-900">This Quarter</option>
                  <option value="year" className="text-gray-900">This Year</option>
                </select>
                <button className="p-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg text-white hover:bg-white/30 transition-colors">
                  <Download className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 mb-8"
          >
            <div className="flex space-x-1">
              {tabs.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <motion.button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg text-sm font-medium transition-all duration-300 relative ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg -z-10"
                        initial={false}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {renderTabContent()}
          </motion.div>
        </div>
      </div>
    </HRManagerAndAbove>
  );
};

export default CSPA;
