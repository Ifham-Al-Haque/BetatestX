import React, { useState, useEffect } from 'react';
import { ChevronUp, ChevronDown, X, Info } from 'lucide-react';
import { supabase } from '../supabaseClient';

const LoadingDiagnostic = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
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

  const getStatusText = (status) => {
    switch (status) {
      case 'success':
        return 'Connected';
      case 'authenticated':
        return 'Authenticated';
      case 'error':
        return 'Failed';
      case 'checking':
        return 'Checking...';
      case 'not-authenticated':
        return 'Not Authenticated';
      default:
        return 'Unknown';
    }
  };

  // Don't render if hidden
  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-w-xs transition-all duration-300 ease-in-out">
      {/* Header with toggle and close buttons */}
      <div className="flex items-center justify-between p-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-500" />
          <h3 className="text-sm font-semibold text-gray-900">System Status</h3>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>
      </div>

      {/* Collapsible content */}
      {isExpanded && (
        <div className="p-3 space-y-2">
          <div className="space-y-2 text-xs">
            <div className={`flex items-center justify-between ${getStatusColor(diagnostics.supabaseConnection)}`}>
              <div className="flex items-center space-x-2">
                <span>{getStatusIcon(diagnostics.supabaseConnection)}</span>
                <span>Supabase Connection</span>
              </div>
              <span className="text-xs font-medium">{getStatusText(diagnostics.supabaseConnection)}</span>
            </div>
            <div className={`flex items-center justify-between ${getStatusColor(diagnostics.authStatus)}`}>
              <div className="flex items-center space-x-2">
                <span>{getStatusIcon(diagnostics.authStatus)}</span>
                <span>Authentication</span>
              </div>
              <span className="text-xs font-medium">{getStatusText(diagnostics.authStatus)}</span>
            </div>
            <div className={`flex items-center justify-between ${getStatusColor(diagnostics.tablesAccess)}`}>
              <div className="flex items-center space-x-2">
                <span>{getStatusIcon(diagnostics.tablesAccess)}</span>
                <span>Database Access</span>
              </div>
              <span className="text-xs font-medium">{getStatusText(diagnostics.tablesAccess)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Collapsed view - just show overall status */}
      {!isExpanded && (
        <div className="p-3">
          <div className="flex items-center justify-center">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">System Online</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingDiagnostic; 