import React from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const RoleDebug = () => {
  const { user, userProfile, role, refreshProfile } = useAuth();
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

  React.useEffect(() => {
    checkUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const testProfileCreation = async () => {
    console.log('🧪 Testing profile creation...');
    console.log('Current state:', { user, userProfile, role });
    
    if (user?.id) {
      console.log('🔄 Manually refreshing profile...');
      await refreshProfile();
    }
  };

  const forceAdminRole = () => {
    console.warn('Force-admin is disabled. Roles come only from public.users.');
  };

  const forceEmployeeRole = () => {
    console.warn('Force-employee is disabled. Roles come only from public.users.');
  };

  const checkDatabase = async () => {
    await checkUserRole();
  };

  const handleCreateSimpleProfile = () => {
    console.warn('Client-side profile creation is disabled.');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg shadow-lg p-4 z-50">
      <div className="text-sm font-semibold mb-2">🔍 Role Debug</div>
      <div className="text-xs mb-2">
        <div>User: {user?.email}</div>
        <div>Role: {role || 'No Role'}</div>
        <div>Profile: {userProfile ? '✅' : '❌'}</div>
      </div>
      <div className="space-y-1">
        <button
          onClick={testProfileCreation}
          className="w-full px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Profile
        </button>
        <button
          onClick={forceAdminRole}
          className="w-full px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
        >
          Force Admin
        </button>
        <button
          onClick={forceEmployeeRole}
          className="w-full px-2 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600"
        >
          Force Employee
        </button>
        <button
          onClick={checkDatabase}
          className="w-full px-2 py-1 text-xs bg-purple-500 text-white rounded hover:bg-purple-600"
        >
          Check DB
        </button>
        <button
          onClick={handleCreateSimpleProfile}
          className="w-full px-2 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600"
        >
          Simple Profile
        </button>
      </div>
      
      {/* Debug Info Display */}
      {Object.keys(debugInfo).length > 0 && (
        <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
          <div className="font-semibold">DB Health:</div>
          <pre className="text-xs overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default RoleDebug;
