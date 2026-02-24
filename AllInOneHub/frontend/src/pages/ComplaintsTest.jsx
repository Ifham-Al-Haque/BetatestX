import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthContext';

const ComplaintsTest = () => {
  const { user, userProfile } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const runTests = async () => {
    setLoading(true);
    setTestResults([]);
    
    const results = [];

    try {
      // Test 1: Check if user is authenticated
      results.push({
        test: 'User Authentication',
        status: user ? 'PASS' : 'FAIL',
        details: user ? `User ID: ${user.id}, Email: ${user.email}` : 'No user found'
      });

      // Test 2: Check if userProfile is loaded
      results.push({
        test: 'User Profile',
        status: userProfile ? 'PASS' : 'FAIL',
        details: userProfile ? `Role: ${userProfile.role}, Name: ${userProfile.full_name}` : 'No profile found'
      });

      // Test 3: Check if complaints table exists
      const { data: tableCheck, error: tableError } = await supabase
        .from('complaints')
        .select('count')
        .limit(1);

      results.push({
        test: 'Complaints Table Access',
        status: !tableError ? 'PASS' : 'FAIL',
        details: !tableError ? 'Table accessible' : `Error: ${tableError.message}`
      });

      // Test 4: Try to fetch complaints
      if (!tableError) {
        const { data: complaints, error: complaintsError } = await supabase
          .from('complaints')
          .select('*')
          .limit(5);

        results.push({
          test: 'Fetch Complaints',
          status: !complaintsError ? 'PASS' : 'FAIL',
          details: !complaintsError ? `Found ${complaints?.length || 0} complaints` : `Error: ${complaintsError.message}`
        });

        if (complaints && complaints.length > 0) {
          results.push({
            test: 'Sample Complaint Data',
            status: 'PASS',
            details: `First complaint: ${JSON.stringify(complaints[0], null, 2)}`
          });
        }
      }

      // Test 5: Check RLS policies
      if (user) {
        const { data: userComplaints, error: userError } = await supabase
          .from('complaints')
          .select('*')
          .eq('complainant_id', user.id)
          .limit(1);

        results.push({
          test: 'User-Specific Complaints',
          status: !userError ? 'PASS' : 'FAIL',
          details: !userError ? `User complaints query successful` : `Error: ${userError.message}`
        });
      }

    } catch (error) {
      results.push({
        test: 'General Error',
        status: 'FAIL',
        details: `Unexpected error: ${error.message}`
      });
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Complaints System Test</h1>
          
          <div className="mb-6">
            <button
              onClick={runTests}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Running Tests...' : 'Run Tests'}
            </button>
          </div>

          <div className="space-y-4">
            {testResults.map((result, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  result.status === 'PASS' 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{result.test}</h3>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${
                      result.status === 'PASS'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {result.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">{result.details}</p>
              </div>
            ))}
          </div>

          {testResults.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              Click "Run Tests" to start testing the complaints system
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComplaintsTest;
