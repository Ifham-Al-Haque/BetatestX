import React, { useState } from 'react';
import { BarChart3, TrendingUp, Upload, FileText } from 'lucide-react';

// Simple placeholder components to avoid any import issues
const SimpleCSVImporter = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-lg font-medium text-gray-900 mb-4">CSV Data Importer</h3>
    <p className="text-gray-600">Import your customer service data here.</p>
  </div>
);

const SimpleAnalytics = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Analytics</h3>
    <p className="text-gray-600">Analytics will be displayed here.</p>
  </div>
);

const SimpleImportHistory = () => (
  <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
    <h3 className="text-lg font-medium text-gray-900 mb-4">Import History</h3>
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
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 text-center">
            <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Customer Service Performance Analysis</h3>
            <p className="text-gray-600 mb-4">
              Welcome to the CSPA system. Use the tabs above to navigate between different sections.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900">Data Import</h4>
                <p className="text-sm text-blue-600">Import your CSV data</p>
              </div>
              <div className="p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900">Analytics</h4>
                <p className="text-sm text-green-600">View performance metrics</p>
              </div>
              <div className="p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900">Reports</h4>
                <p className="text-sm text-purple-600">Generate insights</p>
              </div>
            </div>
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
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Reports & Export</h3>
            <p className="text-gray-600">Generate comprehensive reports and export data for further analysis.</p>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Customer Service Performance Analysis
          </h1>
          <p className="text-gray-600">
            Monitor and analyze customer service metrics, ticket performance, and customer satisfaction
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
            <div className="flex space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
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
          </div>
        </div>

        {/* Tab Content */}
        {renderTabContent()}
      </div>
    </div>
  );
};

export default CSPA;
