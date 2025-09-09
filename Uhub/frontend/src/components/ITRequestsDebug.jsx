import React, { useState, useEffect } from 'react';
import { itServicesApi } from '../services/itServicesApi';
import { useAuth } from '../context/AuthContext';

const ITRequestsDebug = () => {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    debugITRequests();
  }, []);

  const debugITRequests = async () => {
    console.log('🔍 Debug: Starting IT Requests debug...');
    setLoading(true);
    
    const debugData = {
      user: user ? { id: user.id, email: user.email, role: user.role } : null,
      timestamp: new Date().toISOString(),
      tests: {}
    };

    try {
      // Test 1: Categories
      console.log('🔍 Debug: Testing categories...');
      try {
        const categories = await itServicesApi.categories.getAll();
        debugData.tests.categories = {
          status: 'success',
          count: categories.length,
          data: categories.slice(0, 2) // First 2 items
        };
        console.log('🔍 Debug: Categories result:', categories);
      } catch (error) {
        debugData.tests.categories = {
          status: 'error',
          error: error.message,
          code: error.code,
          statusCode: error.status
        };
        console.error('🔍 Debug: Categories error:', error);
      }

      // Test 2: Priorities
      console.log('🔍 Debug: Testing priorities...');
      try {
        const priorities = await itServicesApi.priorities.getAll();
        debugData.tests.priorities = {
          status: 'success',
          count: priorities.length,
          data: priorities.slice(0, 2) // First 2 items
        };
        console.log('🔍 Debug: Priorities result:', priorities);
      } catch (error) {
        debugData.tests.priorities = {
          status: 'error',
          error: error.message,
          code: error.code,
          statusCode: error.status
        };
        console.error('🔍 Debug: Priorities error:', error);
      }

      // Test 3: Requests
      console.log('🔍 Debug: Testing requests...');
      try {
        const requests = await itServicesApi.requests.getAll({}, user?.id, user?.role);
        debugData.tests.requests = {
          status: 'success',
          count: requests.data?.length || 0,
          data: requests.data?.slice(0, 2) || [] // First 2 items
        };
        console.log('🔍 Debug: Requests result:', requests);
      } catch (error) {
        debugData.tests.requests = {
          status: 'error',
          error: error.message,
          code: error.code,
          statusCode: error.status,
          details: error
        };
        console.error('🔍 Debug: Requests error:', error);
      }

      // Test 4: Stats
      console.log('🔍 Debug: Testing stats...');
      try {
        const stats = await itServicesApi.requests.getStats(user?.id, user?.role);
        debugData.tests.stats = {
          status: 'success',
          data: stats
        };
        console.log('🔍 Debug: Stats result:', stats);
      } catch (error) {
        debugData.tests.stats = {
          status: 'error',
          error: error.message,
          code: error.code,
          statusCode: error.status
        };
        console.error('🔍 Debug: Stats error:', error);
      }

    } catch (error) {
      console.error('🔍 Debug: Error in fetchData:', error);
      debugData.generalError = error.message;
    }

    setDebugInfo(debugData);
    setLoading(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success': return 'text-green-600 bg-green-100';
      case 'error': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">🔍 IT Requests Debug</h3>
        <p>Loading debug information...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">🔍 IT Requests Debug</h3>
      
      <div className="space-y-4">
        <div>
          <h4 className="font-medium mb-2">User Info</h4>
          <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>

        <div>
          <h4 className="font-medium mb-2">Test Results</h4>
          <div className="space-y-2">
            {Object.entries(debugInfo.tests || {}).map(([testName, result]) => (
              <div key={testName} className="border rounded p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span>{getStatusIcon(result.status)}</span>
                  <span className="font-medium capitalize">{testName}</span>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(result.status)}`}>
                    {result.status}
                  </span>
                </div>
                
                {result.status === 'success' && (
                  <div className="text-sm text-gray-600">
                    Count: {result.count}
                  </div>
                )}
                
                {result.status === 'error' && (
                  <div className="text-sm">
                    <div className="text-red-600 font-medium">Error: {result.error}</div>
                    {result.code && <div className="text-gray-600">Code: {result.code}</div>}
                    {result.statusCode && <div className="text-gray-600">Status: {result.statusCode}</div>}
                  </div>
                )}
                
                {result.data && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-blue-600">View Data</summary>
                    <pre className="bg-gray-100 p-2 rounded text-xs mt-1 overflow-auto">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        </div>

        {debugInfo.generalError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <strong>General Error:</strong> {debugInfo.generalError}
          </div>
        )}

        <div className="mt-4 p-4 bg-blue-50 rounded">
          <h4 className="font-medium mb-2">💡 Solutions</h4>
          <ul className="text-sm space-y-1">
            <li>• If categories/priorities fail: Check if tables exist in database</li>
            <li>• If requests fail with 404: Run the quick_fix_it_requests.sql script</li>
            <li>• If requests fail with permission error: Check RLS policies</li>
            <li>• If all fail: Check Supabase connection and API keys</li>
          </ul>
        </div>

        <button
          onClick={debugITRequests}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          🔄 Run Debug Again
        </button>
      </div>
    </div>
  );
};

export default ITRequestsDebug;
