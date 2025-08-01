import React from 'react';
import config from '../config';

const DebugInfo = () => {
  const key = config.supabase.anonKey;
  const envUrl = process.env.REACT_APP_SUPABASE_URL;
  const envKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

  return (
    <div className="fixed top-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="font-semibold text-sm mb-2">🐛 Debug Info</h3>
      <div className="text-xs space-y-1">
        <p><strong>Config Key Length:</strong> {key ? key.length : 'No key'}</p>
        <p><strong>Env URL:</strong> {envUrl ? 'Set' : 'Not set'}</p>
        <p><strong>Env Key:</strong> {envKey ? `${envKey.length} chars` : 'Not set'}</p>
        <p><strong>Config URL:</strong> {config.supabase.url}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-600">Config Key (First 50 chars)</summary>
          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
            {key ? key.substring(0, 50) + '...' : 'No key'}
          </pre>
        </details>
        {envKey && (
          <details className="mt-2">
            <summary className="cursor-pointer text-gray-600">Env Key (First 50 chars)</summary>
            <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
              {envKey.substring(0, 50) + '...'}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};

export default DebugInfo; 