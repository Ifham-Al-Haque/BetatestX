import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { itServicesApi } from '../services/itServicesApi';
import LoadingSpinner from '../components/LoadingSpinner';

const ITRequestsDebug = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  const { isDark } = useTheme();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔍 Debug: Starting fetchData');
        console.log('🔍 Debug: User:', user);
        console.log('🔍 Debug: UserProfile:', userProfile);
        
        setLoading(true);
        setError(null);
        
        // Test each API call individually
        console.log('🔍 Debug: Testing categories...');
        const categoriesData = await itServicesApi.categories.getAll();
        console.log('🔍 Debug: Categories result:', categoriesData);
        
        console.log('🔍 Debug: Testing priorities...');
        const prioritiesData = await itServicesApi.priorities.getAll();
        console.log('🔍 Debug: Priorities result:', prioritiesData);
        
        console.log('🔍 Debug: Testing requests...');
        const requestsData = await itServicesApi.requests.getAll({}, user?.id, userProfile?.role);
        console.log('🔍 Debug: Requests result:', requestsData);
        
        console.log('🔍 Debug: Testing stats...');
        const statsData = await itServicesApi.requests.getStats(user?.id, userProfile?.role);
        console.log('🔍 Debug: Stats result:', statsData);
        
        setDebugInfo({
          categories: categoriesData?.length || 0,
          priorities: prioritiesData?.length || 0,
          requests: requestsData?.data?.length || 0,
          stats: statsData
        });
        
        console.log('🔍 Debug: All API calls successful');
        setLoading(false);
        
      } catch (err) {
        console.error('🔍 Debug: Error in fetchData:', err);
        setError(err.message || 'Unknown error');
        setLoading(false);
      }
    };

    fetchData();
  }, [user, userProfile]);

  if (loading) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center"
        style={{
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <LoadingSpinner size="xl" text="Debug: Loading IT requests..." />
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen p-6"
      style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)'
      }}
    >
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">IT Requests Debug</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <strong>Error:</strong> {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">User Information</h2>
            <div className="space-y-2">
              <p><strong>User ID:</strong> {user?.id || 'Not available'}</p>
              <p><strong>User Email:</strong> {user?.email || 'Not available'}</p>
              <p><strong>User Role:</strong> {userProfile?.role || 'Not available'}</p>
              <p><strong>Employee ID:</strong> {userProfile?.employee_id || 'Not available'}</p>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">API Results</h2>
            <div className="space-y-2">
              <p><strong>Categories:</strong> {debugInfo.categories}</p>
              <p><strong>Priorities:</strong> {debugInfo.priorities}</p>
              <p><strong>Requests:</strong> {debugInfo.requests}</p>
              <p><strong>Stats:</strong> {JSON.stringify(debugInfo.stats, null, 2)}</p>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Theme Information</h2>
          <div className="space-y-2">
            <p><strong>Dark Mode:</strong> {isDark ? 'Yes' : 'No'}</p>
            <p><strong>CSS Variables:</strong></p>
            <div className="bg-gray-100 p-4 rounded text-sm">
              <p>--bg-primary: {getComputedStyle(document.documentElement).getPropertyValue('--bg-primary')}</p>
              <p>--text-primary: {getComputedStyle(document.documentElement).getPropertyValue('--text-primary')}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ITRequestsDebug;
