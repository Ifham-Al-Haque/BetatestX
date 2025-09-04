import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const SupabaseTest = () => {
  const [testResult, setTestResult] = useState('Testing...');
  const [error, setError] = useState(null);

  useEffect(() => {
    const testConnection = async () => {
      try {
        console.log('🧪 Testing Supabase connection...');
        
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Connection timeout')), 5000)
        );
        
        // Test basic connection without depending on tables
        const connectionPromise = supabase.auth.getSession();
        
        const { data, error } = await Promise.race([connectionPromise, timeoutPromise]);
        
        if (error) {
          console.error('❌ Supabase test failed:', error);
          setError(error.message);
          setTestResult('Connection Failed');
        } else {
          console.log('✅ Supabase connection successful:', data);
          setTestResult('Connection Successful');
        }
      } catch (err) {
        console.error('❌ Unexpected error in Supabase test:', err);
        setError(err.message);
        setTestResult('Connection Failed');
      }
    };

    testConnection();
  }, []);

  if (process.env.NODE_ENV !== 'development') {
    return null; // Only show in development
  }

  return (
    <div className="fixed bottom-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-semibold text-sm mb-2">🔧 Supabase Test</h3>
      <p className="text-xs mb-2">Status: <span className={testResult === 'Connection Successful' ? 'text-green-600' : 'text-red-600'}>{testResult}</span></p>
      {error && (
        <details className="text-xs">
          <summary className="cursor-pointer text-gray-600">Error Details</summary>
          <pre className="mt-1 text-red-600 bg-red-50 p-2 rounded text-xs overflow-auto max-h-20">{error}</pre>
        </details>
      )}
    </div>
  );
};

export default SupabaseTest; 