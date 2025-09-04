import React, { useState } from 'react';
import { BarChart3, TrendingUp, Upload, FileText, Users, Activity, Target } from 'lucide-react';
import { HRManagerAndAbove } from '../components/RoleBasedSection';

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
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-3 bg-blue-100 rounded-lg w-fit mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-medium text-blue-900 mb-2">Data Import</h4>
                <p className="text-sm text-blue-600">Import your CSV data for analysis</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-3 bg-green-100 rounded-lg w-fit mx-auto mb-4">
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="font-medium text-green-900 mb-2">Analytics</h4>
                <p className="text-sm text-green-600">View performance metrics and insights</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center hover:shadow-md transition-shadow duration-200"
              >
                <div className="p-3 bg-purple-100 rounded-lg w-fit mx-auto mb-4">
                  <FileText className="w-8 h-8 text-purple-600" />
                </div>
                <h4 className="font-medium text-purple-900 mb-2">Reports</h4>
                <p className="text-sm text-purple-600">Generate comprehensive reports</p>
              </motion.div>
            </div>

            {/* Welcome Message */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 p-8 rounded-xl border border-blue-100 text-center"
            >
              <BarChart3 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Customer Service Performance Analysis</h3>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Welcome to the CSPA system. Use the tabs above to navigate between different sections and analyze your customer service performance data.
              </p>
            </motion.div>
          </div>
        );
      
      case 'analytics':
        return <SimpleAnalytics />;
      
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
        <div className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Customer Service Performance Analysis</h1>
                  <p className="text-sm text-gray-600">Monitor and analyze customer service metrics and performance</p>
                </div>
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
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-1 mb-8"
          >
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
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
