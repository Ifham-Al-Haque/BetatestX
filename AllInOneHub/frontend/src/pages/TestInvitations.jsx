import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const TestInvitations = () => {
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addResult = (message, type = 'info') => {
    setTestResults(prev => [...prev, { message, type, timestamp: new Date().toLocaleTimeString() }]);
  };

  const testGetPendingInvitations = async () => {
    addResult('🧪 Testing get_pending_invitations...', 'info');
    setLoading(true);
    
    try {
      const { data, error } = await supabase.rpc('get_pending_invitations');
      
      if (error) {
        addResult(`❌ Error: ${error.message}`, 'error');
        return false;
      }
      
      addResult(`✅ Success! Found ${data?.length || 0} pending invitations`, 'success');
      if (data && data.length > 0) {
        addResult(`📧 First invitation: ${data[0].email}`, 'info');
      }
      return true;
    } catch (err) {
      addResult(`❌ Exception: ${err.message}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const testInviteUser = async () => {
    addResult('🧪 Testing invite_user...', 'info');
    setLoading(true);
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        addResult('❌ No authenticated user found', 'error');
        return false;
      }
      
      addResult(`👤 Using user ID: ${user.id}`, 'info');
      
      const { data, error } = await supabase.rpc('invite_user', {
        invite_email: `test-${Date.now()}@example.com`,
        invite_role: 'employee',
        inviter_id: user.id
      });
      
      if (error) {
        addResult(`❌ Error: ${error.message}`, 'error');
        return false;
      }
      
      if (data.success) {
        addResult(`✅ Invitation created successfully!`, 'success');
        addResult(`📧 Email: ${data.data.email}`, 'info');
        addResult(`🔑 Token: ${data.data.token}`, 'info');
        addResult(`🔗 URL: ${window.location.origin}/invite/${data.data.token}`, 'info');
        return true;
      } else {
        addResult(`⚠️ Function returned: ${data.error}`, 'warning');
        return false;
      }
    } catch (err) {
      addResult(`❌ Exception: ${err.message}`, 'error');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    addResult('🚀 Starting all tests...', 'info');
    
    // Test 1: get_pending_invitations
    const test1 = await testGetPendingInvitations();
    
    // Test 2: invite_user
    const test2 = await testInviteUser();
    
    // Test 3: Verify invitation was created
    if (test1 && test2) {
      addResult('🔄 Verifying invitation was created...', 'info');
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { data: updatedInvitations } = await supabase.rpc('get_pending_invitations');
      const testInvitation = updatedInvitations?.find(inv => inv.email.includes('test-'));
      
      if (testInvitation) {
        addResult('✅ Complete test successful!', 'success');
      } else {
        addResult('❌ Invitation not found in updated list', 'error');
      }
    }
    
    addResult('🏁 All tests completed!', 'info');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg border p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Invitation System Test</h1>
        <p className="text-gray-600 mb-6">
          This page tests your invitation system. Make sure you've run the SIMPLE_FIX.sql script first!
        </p>
        
        <div className="flex gap-3 mb-6">
          <button
            onClick={runAllTests}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
          >
            {loading ? 'Running Tests...' : 'Run All Tests'}
          </button>
          
          <button
            onClick={testGetPendingInvitations}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
          >
            Test get_pending_invitations
          </button>
          
          <button
            onClick={testInviteUser}
            disabled={loading}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg"
          >
            Test invite_user
          </button>
          
          <button
            onClick={clearResults}
            className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            Clear Results
          </button>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-medium text-gray-900 mb-3">Test Results:</h3>
          {testResults.length === 0 ? (
            <p className="text-gray-500">No tests run yet. Click a test button above.</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-2 rounded text-sm ${
                    result.type === 'error' ? 'bg-red-100 text-red-800' :
                    result.type === 'success' ? 'bg-green-100 text-green-800' :
                    result.type === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}
                >
                  <span className="font-mono text-xs text-gray-500">{result.timestamp}</span>
                  <span className="ml-2">{result.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-medium text-yellow-900 mb-2">Before Testing:</h3>
        <ol className="list-decimal list-inside text-yellow-800 space-y-1">
          <li>Go to your Supabase Dashboard</li>
          <li>Open SQL Editor</li>
          <li>Copy and paste the content of <code className="bg-yellow-100 px-1 rounded">SIMPLE_FIX.sql</code></li>
          <li>Click "Run" to execute the SQL</li>
          <li>Come back here and click "Run All Tests"</li>
        </ol>
      </div>
    </div>
  );
};

export default TestInvitations;
