import React from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const RoleDebug = () => {
  const { user, userProfile, role, refreshProfile, setUserRole } = useAuth();
  const [debugInfo, setDebugInfo] = React.useState({});

  const checkUserRole = async () => {
    if (!user?.email) return;

    try {
      // Check users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      // Check employees table
      const { data: employeeData, error: employeeError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      setDebugInfo({
        authUser: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        usersTable: {
          data: userData,
          error: userError
        },
        employeesTable: {
          data: employeeData,
          error: employeeError
        },
        contextState: {
          userProfile,
          role
        }
      });
    } catch (error) {
      console.error('Error checking user role:', error);
    }
  };

  const forceRefresh = async () => {
    await refreshProfile();
    setTimeout(checkUserRole, 1000); // Check again after refresh
  };

  React.useEffect(() => {
    checkUserRole();
  }, [user]);

  if (!user) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3">🔍 Role Debug Information</h3>
      
      <div className="space-y-3">
        <div>
          <strong>Current Auth Context:</strong>
          <pre className="text-sm bg-white p-2 rounded mt-1 overflow-auto">
            {JSON.stringify({ userProfile, role }, null, 2)}
          </pre>
        </div>

        <div>
          <strong>Database Check Results:</strong>
          <pre className="text-sm bg-white p-2 rounded mt-1 overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="flex gap-2">
          <button
            onClick={checkUserRole}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
          >
            Check Role Again
          </button>
          
          <button
            onClick={forceRefresh}
            className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
          >
            Force Refresh Profile
          </button>
        </div>

        <div className="text-sm text-yellow-700">
          <p><strong>Expected:</strong> User with email {user.email} should have role 'driver_management'</p>
          <p><strong>Current:</strong> Role is showing as '{role}'</p>
        </div>
      </div>
    </div>
  );
};

export default RoleDebug;
