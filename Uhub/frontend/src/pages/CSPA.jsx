import React, { useState } from 'react';
import { 
  BarChart3, TrendingUp, Upload, FileText, Download
} from 'lucide-react';
import { HRManagerAndAbove } from '../components/RoleBasedSection';
import CSPAPerformanceAnalytics from '../components/CSPAPerformanceAnalytics';
import { motion } from 'framer-motion';

const SimpleCSVImporter = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Upload className="w-5 h-5 text-blue-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">CSV Data Importer</h3>
    </div>
    <p className="text-gray-600">CSV import is not wired to live metrics yet. Use this tab when a dataset format is confirmed.</p>
  </div>
);

const SimpleImportHistory = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <div className="flex items-center gap-3 mb-4">
      <div className="p-2 bg-purple-100 rounded-lg">
        <FileText className="w-5 h-5 text-purple-600" />
      </div>
      <h3 className="text-lg font-medium text-gray-900">Import History</h3>
    </div>
    <p className="text-gray-600">No imports have been recorded.</p>
  </div>
);

const CSPA = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');

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
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white p-8 rounded-xl shadow-sm border border-gray-200"
            >
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BarChart3 className="w-10 h-10 text-blue-600" />
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">No live CS metrics yet</h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  CSPA does not have connected call or ticket data. Import a dataset to review performance, or use IT Requests for internal support tickets.
                </p>
                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('data-import')}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Import Data
                  </button>
                  <button
                    onClick={() => setActiveTab('analytics')}
                    className="px-6 py-3 bg-white text-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-50 transition-colors inline-flex items-center gap-2"
                  >
                    <BarChart3 className="w-5 h-5" />
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
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
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
