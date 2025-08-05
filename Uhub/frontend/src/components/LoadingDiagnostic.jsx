import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const LoadingDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({
    supabaseConnection: 'checking',
    authStatus: 'checking',
    tablesAccess: 'checking'
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      console.log('🔍 Running loading diagnostics...');
      
      // Test Supabase connection
      try {
        const startTime = Date.now();
        const { data, error } = await supabase.auth.getSession();
        const endTime = Date.now();
        
        if (error) {
          setDiagnostics(prev => ({ ...prev, supabaseConnection: 'error' }));
          console.error('❌ Supabase connection failed:', error);
        } else {
          setDiagnostics(prev => ({ ...prev, supabaseConnection: 'success' }));
          console.log(`✅ Supabase connection: ${endTime - startTime}ms`);
        }
      } catch (error) {
        setDiagnostics(prev => ({ ...prev, supabaseConnection: 'error' }));
        console.error('❌ Supabase connection error:', error);
      }

      // Test table access
      try {
        const startTime = Date.now();
        const { data, error } = await supabase
          .from('expenses')
          .select('id')
          .limit(1);
        const endTime = Date.now();
        
        if (error) {
          setDiagnostics(prev => ({ ...prev, tablesAccess: 'error' }));
          console.error('❌ Table access failed:', error);
        } else {
          setDiagnostics(prev => ({ ...prev, tablesAccess: 'success' }));
          console.log(`✅ Table access: ${endTime - startTime}ms`);
        }
      } catch (error) {
        setDiagnostics(prev => ({ ...prev, tablesAccess: 'error' }));
        console.error('❌ Table access error:', error);
      }

      // Check auth status
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setDiagnostics(prev => ({ 
          ...prev, 
          authStatus: session ? 'authenticated' : 'not-authenticated' 
        }));
        console.log('✅ Auth status checked');
      } catch (error) {
        setDiagnostics(prev => ({ ...prev, authStatus: 'error' }));
        console.error('❌ Auth status check failed:', error);
      }
    };

    runDiagnostics();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
      case 'authenticated':
        return 'text-green-600';
      case 'error':
        return 'text-red-600';
      case 'checking':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
      case 'authenticated':
        return '✅';
      case 'error':
        return '❌';
      case 'checking':
        return '⏳';
      default:
        return '❓';
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 z-50 max-w-xs">
      <h3 className="text-sm font-semibold text-gray-900 mb-2">Loading Diagnostics</h3>
      <div className="space-y-1 text-xs">
        <div className={`flex items-center space-x-2 ${getStatusColor(diagnostics.supabaseConnection)}`}>
          <span>{getStatusIcon(diagnostics.supabaseConnection)}</span>
          <span>Supabase Connection</span>
        </div>
        <div className={`flex items-center space-x-2 ${getStatusColor(diagnostics.authStatus)}`}>
          <span>{getStatusIcon(diagnostics.authStatus)}</span>
          <span>Authentication</span>
        </div>
        <div className={`flex items-center space-x-2 ${getStatusColor(diagnostics.tablesAccess)}`}>
          <span>{getStatusIcon(diagnostics.tablesAccess)}</span>
          <span>Database Access</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingDiagnostic; 