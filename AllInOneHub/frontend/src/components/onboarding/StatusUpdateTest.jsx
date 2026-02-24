import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { debugOnboardingTable, testStatusUpdate } from './StatusUpdateDebug';
import { updateOnboardingStatus } from './StatusUpdateFallback';

export default function StatusUpdateTest({ recordId }) {
  const [testResults, setTestResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults(null);

    try {
      console.log('🧪 Running status update tests...');
      
      const results = {
        tableStructure: null,
        testUpdate: null,
        fallbackUpdate: null
      };

      // Test 1: Check table structure
      console.log('1️⃣ Testing table structure...');
      results.tableStructure = await debugOnboardingTable();
      console.log('Table structure result:', results.tableStructure);

      // Test 2: Test basic update
      if (recordId) {
        console.log('2️⃣ Testing basic update...');
        results.testUpdate = await testStatusUpdate(recordId, 'in_progress');
        console.log('Test update result:', results.testUpdate);

        // Test 3: Test fallback update
        console.log('3️⃣ Testing fallback update...');
        results.fallbackUpdate = await updateOnboardingStatus(recordId, 'in_progress', 'Test update');
        console.log('Fallback update result:', results.fallbackUpdate);
      }

      setTestResults(results);
      console.log('✅ All tests completed:', results);

    } catch (error) {
      console.error('❌ Test error:', error);
      setTestResults({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'error':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Status Update Debug Test</h3>
        <button
          onClick={runTests}
          disabled={loading}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors duration-200"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>{loading ? 'Running Tests...' : 'Run Tests'}</span>
        </button>
      </div>

      {testResults && (
        <div className="space-y-4">
          {/* Table Structure Test */}
          <div className={`p-4 rounded-lg border ${getStatusColor(testResults.tableStructure?.error ? 'error' : 'success')}`}>
            <div className="flex items-center space-x-2 mb-2">
              {getStatusIcon(testResults.tableStructure?.error ? 'error' : 'success')}
              <span className="font-medium">Table Structure</span>
            </div>
            {testResults.tableStructure?.error ? (
              <p className="text-sm">{testResults.tableStructure.error}</p>
            ) : (
              <div className="text-sm">
                <p><strong>Columns found:</strong> {testResults.tableStructure?.columns?.length || 0}</p>
                <p><strong>Status columns:</strong> {testResults.tableStructure?.statusColumns?.join(', ') || 'None'}</p>
                <p><strong>Sample record fields:</strong> {testResults.tableStructure?.sampleRecord?.join(', ') || 'None'}</p>
              </div>
            )}
          </div>

          {/* Test Update */}
          {testResults.testUpdate && (
            <div className={`p-4 rounded-lg border ${getStatusColor(testResults.testUpdate?.error ? 'error' : 'success')}`}>
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(testResults.testUpdate?.error ? 'error' : 'success')}
                <span className="font-medium">Basic Update Test</span>
              </div>
              <p className="text-sm">
                {testResults.testUpdate?.error || 'Update successful'}
              </p>
            </div>
          )}

          {/* Fallback Update */}
          {testResults.fallbackUpdate && (
            <div className={`p-4 rounded-lg border ${getStatusColor(testResults.fallbackUpdate?.success ? 'success' : 'error')}`}>
              <div className="flex items-center space-x-2 mb-2">
                {getStatusIcon(testResults.fallbackUpdate?.success ? 'success' : 'error')}
                <span className="font-medium">Fallback Update Test</span>
              </div>
              <p className="text-sm">
                {testResults.fallbackUpdate?.success 
                  ? `Success using column: ${testResults.fallbackUpdate.statusColumn || 'unknown'}`
                  : testResults.fallbackUpdate?.error || 'Update failed'
                }
              </p>
              {testResults.fallbackUpdate?.warning && (
                <p className="text-sm mt-1 text-yellow-700">{testResults.fallbackUpdate.warning}</p>
              )}
            </div>
          )}

          {/* Error */}
          {testResults.error && (
            <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-800">
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Test Error</span>
              </div>
              <p className="text-sm">{testResults.error}</p>
            </div>
          )}
        </div>
      )}

      {!testResults && !loading && (
        <div className="text-center py-8 text-gray-500">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <p>Click "Run Tests" to diagnose the status update issue</p>
        </div>
      )}
    </div>
  );
}
