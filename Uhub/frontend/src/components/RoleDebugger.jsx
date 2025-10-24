import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoleAccess } from './RoleBasedRoute';

export default function RoleDebugger() {
  const { user, userProfile, role, loading } = useAuth();
  const { userRole, roleInfo, hasFeatureAccess } = useRoleAccess();

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-4">Role Debug Information</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Auth Context</h3>
          <p><strong>User:</strong> {user ? user.email : 'Not logged in'}</p>
          <p><strong>User ID:</strong> {user ? user.id : 'N/A'}</p>
          <p><strong>Role:</strong> {role || 'Not set'}</p>
          <p><strong>Loading:</strong> {loading ? 'Yes' : 'No'}</p>
          <p><strong>User Profile:</strong> {userProfile ? JSON.stringify(userProfile, null, 2) : 'Not loaded'}</p>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Role Access Hook</h3>
          <p><strong>User Role:</strong> {userRole || 'Not set'}</p>
          <p><strong>Role Info:</strong> {roleInfo ? JSON.stringify(roleInfo, null, 2) : 'Not available'}</p>
        </div>

        <div className="bg-green-100 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Feature Access Tests</h3>
          <p><strong>Analytics Access:</strong> {hasFeatureAccess('analytics') ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Admin Dashboard Access:</strong> {hasFeatureAccess('admin_dashboard') ? '✅ Yes' : '❌ No'}</p>
          <p><strong>User Management Access:</strong> {hasFeatureAccess('user_management') ? '✅ Yes' : '❌ No'}</p>
        </div>

        <div className="bg-yellow-100 p-4 rounded">
          <h3 className="font-semibold text-lg mb-2">Navigation Visibility</h3>
          <p><strong>Should see Analytics:</strong> {userRole === 'admin' || userRole === 'manager' || userRole === 'driver_management' || userRole === 'it_management' ? '✅ Yes' : '❌ No'}</p>
          <p><strong>Should see Financial Panel:</strong> {userRole === 'admin' || userRole === 'manager' || userRole === 'driver_management' || userRole === 'it_management' ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>
    </div>
  );
}
