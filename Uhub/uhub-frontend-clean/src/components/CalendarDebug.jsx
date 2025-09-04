import React, { useState } from 'react';
import { Calendar } from 'lucide-react';

const CalendarDebug = ({ onAddEvent, events, loading, user }) => {
  const [debugInfo, setDebugInfo] = useState({});

  const runDebug = () => {
    const info = {
      user: user ? {
        id: user.id,
        role: user.role,
        email: user.email,
        hasMetadata: !!user.user_metadata
      } : 'No user',
      events: events ? events.length : 'No events array',
      loading: loading,
      onAddEvent: typeof onAddEvent,
      timestamp: new Date().toISOString()
    };
    
    console.log('🔍 Calendar Debug Info:', info);
    setDebugInfo(info);
  };

  const testAddEvent = () => {
    console.log('🧪 Testing Add Event function...');
    try {
      if (typeof onAddEvent === 'function') {
        onAddEvent();
        console.log('✅ Add Event function called successfully');
      } else {
        console.error('❌ onAddEvent is not a function:', onAddEvent);
      }
    } catch (error) {
      console.error('❌ Error calling onAddEvent:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg z-50 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          <h3 className="font-semibold text-gray-900">Calendar Debug</h3>
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span>User Status:</span>
          <span className={user ? 'text-green-600' : 'text-red-600'}>
            {user ? 'Logged In' : 'Not Logged In'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Events Count:</span>
          <span className="text-blue-600">
            {events ? events.length : 'N/A'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Loading:</span>
          <span className={loading ? 'text-yellow-600' : 'text-green-600'}>
            {loading ? 'Yes' : 'No'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span>Add Event Function:</span>
          <span className={typeof onAddEvent === 'function' ? 'text-green-600' : 'text-red-600'}>
            {typeof onAddEvent === 'function' ? 'Available' : 'Missing'}
          </span>
        </div>

        {debugInfo.timestamp && (
          <div className="text-xs text-gray-500">
            Last debug: {new Date(debugInfo.timestamp).toLocaleTimeString()}
          </div>
        )}
      </div>

      <div className="flex space-x-2 mt-3">
        <button
          onClick={runDebug}
          className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Run Debug
        </button>
        <button
          onClick={testAddEvent}
          className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          Test Add Event
        </button>
      </div>

      {/* Debug Output */}
      {Object.keys(debugInfo).length > 0 && (
        <div className="mt-3 p-2 bg-gray-50 rounded text-xs">
          <strong>Debug Output:</strong>
          <pre className="mt-1 text-gray-600 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default CalendarDebug;
