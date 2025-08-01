import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

export default function LoadingDiagnostic() {
  const [diagnostics, setDiagnostics] = useState({
    supabaseConnection: 'checking...',
    authStatus: 'checking...',
    databaseTables: 'checking...',
    environmentVariables: 'checking...'
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      const results = {};

      // Check Supabase connection
      try {
        const { data, error } = await supabase.from('employees').select('count').limit(1);
        results.supabaseConnection = error ? `❌ Error: ${error.message}` : '✅ Connected';
      } catch (err) {
        results.supabaseConnection = `❌ Connection failed: ${err.message}`;
      }

      // Check auth status
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        results.authStatus = error ? `❌ Auth error: ${error.message}` : 
          session ? `✅ Authenticated (${session.user.email})` : '⚠️ No session';
      } catch (err) {
        results.authStatus = `❌ Auth check failed: ${err.message}`;
      }

      // Check environment variables
      const envVars = {
        url: process.env.REACT_APP_SUPABASE_URL ? '✅ Set' : '❌ Missing',
        key: process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'
      };
      results.environmentVariables = `URL: ${envVars.url}, Key: ${envVars.key}`;

      // Check database tables
      try {
        const tables = ['employees', 'expenses', 'assets', 'payment_events'];
        const tableChecks = await Promise.all(
          tables.map(async (table) => {
            try {
              const { error } = await supabase.from(table).select('id').limit(1);
              return { table, status: error ? '❌' : '✅' };
            } catch (err) {
              return { table, status: '❌' };
            }
          })
        );
        results.databaseTables = tableChecks.map(t => `${t.table}: ${t.status}`).join(', ');
      } catch (err) {
        results.databaseTables = `❌ Table check failed: ${err.message}`;
      }

      setDiagnostics(results);
    };

    runDiagnostics();
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="font-semibold text-gray-800 mb-3">Loading Diagnostic</h3>
      <div className="space-y-2 text-sm">
        <div><strong>Supabase:</strong> {diagnostics.supabaseConnection}</div>
        <div><strong>Auth:</strong> {diagnostics.authStatus}</div>
        <div><strong>Env Vars:</strong> {diagnostics.environmentVariables}</div>
        <div><strong>Tables:</strong> {diagnostics.databaseTables}</div>
      </div>
    </div>
  );
} 