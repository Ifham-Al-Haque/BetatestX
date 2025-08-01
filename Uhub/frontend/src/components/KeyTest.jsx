import React from 'react';
import config from '../config';

const KeyTest = () => {
  const key = config.supabase.anonKey;
  const keyLength = key ? key.length : 0;
  const keyStart = key ? key.substring(0, 20) + '...' : 'No key';
  const keyEnd = key ? '...' + key.substring(key.length - 20) : '';

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <h3 className="font-semibold text-sm mb-2">🔑 API Key Test</h3>
      <div className="text-xs space-y-1">
        <p><strong>Key Length:</strong> {keyLength}</p>
        <p><strong>Key Start:</strong> {keyStart}</p>
        <p><strong>Key End:</strong> {keyEnd}</p>
        <p><strong>URL:</strong> {config.supabase.url}</p>
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-600">Full Key (Click to show)</summary>
          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">{key}</pre>
        </details>
      </div>
    </div>
  );
};

export default KeyTest; 