import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Database, CheckCircle, XCircle, AlertTriangle, RefreshCw } from 'lucide-react';

const DatabaseTest = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    const results = {};

    try {
      // Test 1: Basic connection
      console.log('🧪 Testing basic Supabase connection...');
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      results.connection = !sessionError ? 'success' : 'error';
      results.connectionError = sessionError?.message;

      // Test 2: Check if calendar_events table exists
      console.log('🧪 Testing calendar_events table access...');
      try {
        const { data: tableData, error: tableError } = await supabase
          .from('calendar_events')
          .select('id')
          .limit(1);
        
        if (tableError) {
          if (tableError.code === '42P01') {
            results.tableExists = 'missing';
            results.tableError = 'Table "calendar_events" does not exist. Please run the database setup script.';
          } else {
            results.tableExists = 'error';
            results.tableError = tableError.message;
          }
        } else {
          results.tableExists = 'success';
          results.tableCount = tableData?.length || 0;
        }
      } catch (tableErr) {
        results.tableExists = 'error';
        results.tableError = tableErr.message;
      }

      // Test 3: Try to insert a test event
      if (results.tableExists === 'success') {
        console.log('🧪 Testing event creation...');
        try {
          const testEvent = {
            title: 'Test Event',
            description: 'This is a test event to verify database functionality',
            start_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            end_date: new Date(Date.now() + 24 * 60 * 60 * 1000 + 60 * 60 * 1000).toISOString(),
            type: 'event',
            priority: 'low',
            category: 'Work',
            user_id: sessionData?.session?.user?.id || 'test-user'
          };

          const { data: insertData, error: insertError } = await supabase
            .from('calendar_events')
            .insert(testEvent)
            .select()
            .single();

          if (insertError) {
            results.insertTest = 'error';
            results.insertError = insertError.message;
          } else {
            results.insertTest = 'success';
            results.insertId = insertData.id;

            // Clean up test event
            await supabase
              .from('calendar_events')
              .delete()
              .eq('id', insertData.id);
          }
        } catch (insertErr) {
          results.insertTest = 'error';
          results.insertError = insertErr.message;
        }
      }

    } catch (error) {
      console.error('❌ Database test failed:', error);
      results.generalError = error.message;
    } finally {
      setLoading(false);
      setTestResults(results);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'missing':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Success';
      case 'error':
        return 'Error';
      case 'missing':
        return 'Missing';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'missing':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Database Test</h3>
        </div>
        <button
          onClick={runTests}
          disabled={loading}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="space-y-2 text-sm">
        {/* Connection Test */}
        <div className="flex items-center justify-between">
          <span>Connection:</span>
          <div className="flex items-center space-x-2">
            {testResults.connection && getStatusIcon(testResults.connection)}
            <span className={getStatusColor(testResults.connection)}>
              {testResults.connection ? getStatusText(testResults.connection) : 'Not tested'}
            </span>
          </div>
        </div>

        {/* Table Test */}
        <div className="flex items-center justify-between">
          <span>Calendar Table:</span>
          <div className="flex items-center space-x-2">
            {testResults.tableExists && getStatusIcon(testResults.tableExists)}
            <span className={getStatusColor(testResults.tableExists)}>
              {testResults.tableExists ? getStatusText(testResults.tableExists) : 'Not tested'}
            </span>
          </div>
        </div>

        {/* Insert Test */}
        {testResults.tableExists === 'success' && (
          <div className="flex items-center justify-between">
            <span>Event Creation:</span>
            <div className="flex items-center space-x-2">
              {testResults.insertTest && getStatusIcon(testResults.insertTest)}
              <span className={getStatusColor(testResults.insertTest)}>
                {testResults.insertTest ? getStatusText(testResults.insertTest) : 'Not tested'}
              </span>
            </div>
          </div>
        )}

        {/* Error Messages */}
        {testResults.connectionError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Connection Error:</strong> {testResults.connectionError}
          </div>
        )}

        {testResults.tableError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Table Error:</strong> {testResults.tableError}
          </div>
        )}

        {testResults.insertError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>Insert Error:</strong> {testResults.insertError}
          </div>
        )}

        {testResults.generalError && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            <strong>General Error:</strong> {testResults.generalError}
          </div>
        )}

        {/* Success Messages */}
        {testResults.tableCount !== undefined && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            <strong>Table Status:</strong> Found {testResults.tableCount} existing events
          </div>
        )}

        {testResults.insertId && (
          <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
            <strong>Test Event:</strong> Successfully created and cleaned up
          </div>
        )}

        {/* Instructions */}
        {testResults.tableExists === 'missing' && (
          <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
            <strong>Next Step:</strong> Run the database_setup.sql script in your Supabase SQL Editor
          </div>
        )}
      </div>

      <button
        onClick={runTests}
        disabled={loading}
        className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Run Database Tests'}
      </button>
    </div>
  );
};

export default DatabaseTest;
