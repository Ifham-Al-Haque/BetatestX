import React from 'react';
import config from '../config';

const KeyValidator = () => {
  const key = config.supabase.anonKey;
  
  // Validate JWT format
  const isValidJWT = (token) => {
    if (!token) return false;
    const parts = token.split('.');
    return parts.length === 3;
  };
  
  // Check for common issues
  const issues = [];
  if (!key) {
    issues.push('No key provided');
  } else {
    if (key.length !== 151) {
      issues.push(`Expected 151 characters, got ${key.length}`);
      issues.push('This suggests environment variables are overriding config');
    }
    if (!isValidJWT(key)) {
      issues.push('Not a valid JWT format (should have 3 parts separated by dots)');
    }
    if (key.includes('\n') || key.includes('\r')) {
      issues.push('Key contains newline characters');
    }
    if (key.trim() !== key) {
      issues.push('Key has leading or trailing whitespace');
    }
  }

  return (
    <div className="fixed top-4 left-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-md">
      <h3 className="font-semibold text-sm mb-2">🔍 Key Validator</h3>
      <div className="text-xs space-y-1">
        <p><strong>Key Length:</strong> {key ? key.length : 'No key'}</p>
        <p><strong>Valid JWT:</strong> {isValidJWT(key) ? '✅ Yes' : '❌ No'}</p>
        <p><strong>Issues Found:</strong> {issues.length}</p>
        {issues.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-red-600">Issues</summary>
            <ul className="mt-1 text-red-600 bg-red-50 p-2 rounded text-xs">
              {issues.map((issue, index) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </details>
        )}
        <details className="mt-2">
          <summary className="cursor-pointer text-gray-600">Raw Key (First 100 chars)</summary>
          <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto max-h-20">
            {key ? key.substring(0, 100) + '...' : 'No key'}
          </pre>
        </details>
      </div>
    </div>
  );
};

export default KeyValidator; 