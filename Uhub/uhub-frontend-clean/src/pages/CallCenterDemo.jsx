import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Phone, 
  PhoneIncoming, 
  PhoneOutgoing, 
  BarChart3, 
  Users, 
  Clock,
  TrendingUp,
  FileText,
  Download
} from 'lucide-react';
import CSVDataImporter from '../components/CSVDataImporter';
import CSPAPerformanceAnalytics from '../components/CSPAPerformanceAnalytics';
import LoadingSpinner from '../components/LoadingSpinner';
import { HRManagerAndAbove } from '../components/RoleBasedSection';


const CallCenterDemo = () => {
  const [importedData, setImportedData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResults, setAnalysisResults] = useState(null);

  const handleDataImported = (data) => {
    console.log('Data imported:', data);
    setImportedData(data);
  };

  const handleDataProcessed = (processedData) => {
    console.log('Data processed:', processedData);
    setIsAnalyzing(true);
    
    // Simulate analysis processing
    setTimeout(() => {
      setAnalysisResults(processedData);
      setIsAnalyzing(false);
    }, 1000);
  };

  const downloadSampleData = () => {
    const sampleData = [
      {
        "Direction": "inbound",
        "Start Date": "7/20/25 11:57:15 PM",
        "Call Result": "cancel",
        "Agent": "",
        "Queue": "",
        "Talk Time": "0:00:00",
        "Time spent in Queue": "",
        "Abandoned": "FALSE",
        "Lost in IVR": "TRUE",
        "Survey Rating": "",
        "On hold Duration": "0:00:00",
        "Repeats": "0",
        "Call ID": "5cbbbca9-f8eb-4a54-8c2a-1e3e5dbb8007"
      },
      {
        "Direction": "inbound",
        "Start Date": "7/20/25 11:52:16 PM",
        "Call Result": "answered",
        "Agent": "Omar Abdelhamid",
        "Queue": "9PM-Emergency_Only_Queue",
        "Talk Time": "0:01:20",
        "Time spent in Queue": "0:00:02",
        "Abandoned": "FALSE",
        "Lost in IVR": "FALSE",
        "Survey Rating": "",
        "On hold Duration": "0:00:00",
        "Repeats": "0",
        "Call ID": "d3931ff9-3188-437a-b12f-4483eff0b3f8"
      }
    ];

    const csvContent = [
      Object.keys(sampleData[0]).join(','),
      ...sampleData.map(row => Object.values(row).map(value => `"${value}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'call-center-sample-data.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
            <HRManagerAndAbove
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-4">
              You don't have permission to access the Call Center Analytics Demo.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your administrator if you believe this is an error.
            </p>
          </div>
        </div>
      }
    >
      <div className="flex min-h-screen bg-gray-50">
        
        <div className="flex-1 py-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center mb-8"
            >
              <div className="flex items-center justify-center mb-4">
                <Phone className="w-12 h-12 text-blue-600 mr-3" />
                <h1 className="text-4xl font-bold text-gray-900">Call Center Analytics Demo</h1>
              </div>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Import your call center CSV data and analyze performance metrics, agent productivity, and call patterns
              </p>
            </motion.div>

            {/* Sample Data Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold text-gray-900">Sample Data Format</h2>
                <button
                  onClick={downloadSampleData}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Sample CSV
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <PhoneIncoming className="w-8 h-8 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600 font-medium">Direction</p>
                      <p className="text-lg font-semibold text-blue-900">inbound/outbound</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Users className="w-8 h-8 text-green-600" />
                    <div>
                      <p className="text-sm text-green-600 font-medium">Agent</p>
                      <p className="text-lg font-semibold text-green-900">Agent Name</p>
                    </div>
                  </div>
                </div>
                
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Clock className="w-8 h-8 text-purple-600" />
                    <div>
                      <p className="text-sm text-purple-600 font-medium">Talk Time</p>
                      <p className="text-lg font-semibold text-purple-900">Duration</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-2">Required CSV Columns:</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-600">
                  <span>• Direction</span>
                  <span>• Start Date</span>
                  <span>• Call Result</span>
                  <span>• Agent</span>
                  <span>• Queue</span>
                  <span>• Talk Time</span>
                  <span>• Call ID</span>
                  <span>• Survey Rating</span>
                </div>
              </div>
            </motion.div>

            {/* Data Import Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
            >
              <h2 className="text-2xl font-semibold text-gray-900 mb-6">Import Your Call Center Data</h2>
              <CSVDataImporter 
                onDataImported={handleDataImported}
                onDataProcessed={handleDataProcessed}
              />
            </motion.div>

            {/* Analysis Results */}
            {isAnalyzing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
              >
                <LoadingSpinner />
                <p className="text-lg text-gray-600 mt-4">Analyzing your call center data...</p>
              </motion.div>
            )}

            {analysisResults && !isAnalyzing && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold text-gray-900">Call Center Analytics</h2>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <BarChart3 className="w-4 h-4" />
                    <span>Data Type: Call Center</span>
                  </div>
                </div>
                
                <CSPAPerformanceAnalytics data={analysisResults} />
              </motion.div>
            )}

            {/* Import Summary */}
            {importedData && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-green-50 border border-green-200 rounded-xl p-6"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-green-900">Data Imported Successfully!</h3>
                    <p className="text-green-700">
                      File: {importedData.file.name} | 
                      Rows: {importedData.totalRows} | 
                      Timestamp: {new Date(importedData.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
            </HRManagerAndAbove>
  );
};

export default CallCenterDemo;


