import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

const SimpleDatabaseCheck = () => {
  const [checkResult, setCheckResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const checkDatabase = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking database...');
      
      // Simple check: try to select from calendar_events
      const { data, error } = await supabase
        .from('calendar_events')
        .select('id')
        .limit(1);
      
      if (error) {
        console.error('❌ Database check failed:', error);
        setCheckResult({
          success: false,
          error: error.message,
          code: error.code,
          details: error.details
        });
      } else {
        console.log('✅ Database check successful:', data);
        setCheckResult({
          success: true,
          count: data?.length || 0,
          message: 'Table exists and is accessible'
        });
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setCheckResult({
        success: false,
        error: err.message,
        type: 'Unexpected error'
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = () => {
    if (!checkResult) return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    if (checkResult.success) return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getStatusColor = () => {
    if (!checkResult) return 'text-gray-600';
    if (checkResult.success) return 'text-green-600';
    return 'text-red-600';
  };

  const getStatusText = () => {
    if (!checkResult) return 'Not checked';
    if (checkResult.success) return 'Success';
    return 'Failed';
  };

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Database className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">DB Check</h3>
        </div>
        <button
          onClick={checkDatabase}
          disabled={loading}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>Status:</span>
          <div className="flex items-center space-x-2">
            {getStatusIcon()}
            <span className={getStatusColor()}>
              {getStatusText()}
            </span>
          </div>
        </div>

        {checkResult && (
          <>
            {checkResult.success && (
              <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
                <strong>✅ Success:</strong> {checkResult.message}
                {checkResult.count !== undefined && (
                  <div>Found {checkResult.count} events</div>
                )}
              </div>
            )}

            {!checkResult.success && (
              <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
                <strong>❌ Error:</strong> {checkResult.error}
                {checkResult.code && (
                  <div>Code: {checkResult.code}</div>
                )}
                {checkResult.details && (
                  <div>Details: {checkResult.details}</div>
                )}
                {checkResult.type && (
                  <div>Type: {checkResult.type}</div>
                )}
              </div>
            )}

            {!checkResult.success && checkResult.code === '42P01' && (
              <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded">
                <strong>⚠️ Solution:</strong> The calendar_events table doesn't exist. 
                Run the database setup script in Supabase SQL Editor.
              </div>
            )}
          </>
        )}
      </div>

      <button
        onClick={checkDatabase}
        disabled={loading}
        className="w-full mt-3 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
      >
        {loading ? 'Checking...' : 'Check Database'}
      </button>
    </div>
  );
};

export default SimpleDatabaseCheck;
