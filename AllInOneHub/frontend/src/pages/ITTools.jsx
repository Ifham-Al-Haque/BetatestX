import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Search, FileText, Download, X, 
  TrendingUp, Filter, Calendar, Package, Ticket
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ITAnalytics from '../components/ITAnalytics';
import ITAdvancedSearch from '../components/ITAdvancedSearch';
import ITReportTemplates from '../components/ITReportTemplates';
import ITDataExport from '../components/ITDataExport';
import { Card, CardContent } from '../components/ui/card';
import Button from '../components/ui/button';

const ITTools = () => {
  const { user, userProfile } = useAuth();
  
  const [activeTool, setActiveTool] = useState(null);

  const tools = [
    {
      id: 'analytics',
      name: 'Analytics Dashboard',
      description: 'Comprehensive insights into IT requests, tickets, and assets with trends and performance metrics',
      icon: BarChart3,
      color: 'from-blue-500 to-cyan-600',
      component: ITAnalytics
    },
    {
      id: 'search',
      name: 'Advanced Search',
      description: 'Search across IT requests, assets, and tickets with saved filter presets',
      icon: Search,
      color: 'from-purple-500 to-pink-600',
      component: ITAdvancedSearch
    },
    {
      id: 'reports',
      name: 'Report Templates',
      description: 'Pre-built reports with scheduling and export options',
      icon: FileText,
      color: 'from-green-500 to-emerald-600',
      component: ITReportTemplates
    },
    {
      id: 'export',
      name: 'Data Export',
      description: 'Export filtered data in CSV, Excel, or JSON formats',
      icon: Download,
      color: 'from-orange-500 to-red-600',
      component: ITDataExport
    }
  ];

  const handleToolClick = (tool) => {
    setActiveTool(tool);
  };

  const handleCloseTool = () => {
    setActiveTool(null);
  };

  const ToolComponent = activeTool?.component;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">IT Tools & Analytics</h1>
          <p className="text-gray-600 text-lg">
            Powerful tools for analyzing, searching, reporting, and exporting IT service data
          </p>
        </motion.div>

        {/* Tools Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {tools.map((tool, index) => {
            const Icon = tool.icon;
            return (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                className="cursor-pointer"
                onClick={() => handleToolClick(tool)}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 overflow-hidden">
                  <div className={`bg-gradient-to-r ${tool.color} p-1`}>
                    <CardContent className="bg-white p-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-4 rounded-xl bg-gradient-to-r ${tool.color} shadow-lg`}>
                          <Icon className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {tool.name}
                          </h3>
                          <p className="text-gray-600 text-sm mb-4">
                            {tool.description}
                          </p>
                          <Button
                            className={`bg-gradient-to-r ${tool.color} text-white hover:opacity-90`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToolClick(tool);
                            }}
                          >
                            Open Tool
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
        >
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Requests</p>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Ticket className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Assets</p>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Open Tickets</p>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                </div>
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FileText className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">SLA Compliance</p>
                  <p className="text-3xl font-bold text-gray-900">-</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-white">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">About IT Tools</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Analytics Dashboard</h4>
                  <p className="text-sm text-gray-600">
                    Get comprehensive insights into IT service performance, including trends, 
                    SLA compliance, resolution times, and category breakdowns.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Advanced Search</h4>
                  <p className="text-sm text-gray-600">
                    Search across all IT data types with advanced filters. Save your search 
                    presets for quick access to common queries.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Report Templates</h4>
                  <p className="text-sm text-gray-600">
                    Use pre-built report templates for common analysis needs. Schedule reports 
                    to be automatically generated and emailed.
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Data Export</h4>
                  <p className="text-sm text-gray-600">
                    Export filtered data in multiple formats (CSV, Excel, JSON) with custom 
                    field selection for your specific needs.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tool Modals */}
      {activeTool && ToolComponent && (
        <ToolComponent
          onClose={handleCloseTool}
          onResultSelect={(type, item) => {
            console.log('Selected:', type, item);
            // Handle result selection - could navigate to detail page
          }}
        />
      )}
    </div>
  );
};

export default ITTools;
