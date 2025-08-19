import React from 'react';
import { useRoleAccess, RoleBasedRoute } from '../components/RoleBasedRoute';
import { RoleBasedDashboard } from '../components/RoleBasedDashboard';

const RBACTest = () => {
  const { userRole, roleInfo, hasFeatureAccess, isAdmin } = useRoleAccess();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">RBAC System Test</h1>
        
        {/* Current User Info */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current User Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-600">Role:</p>
              <p className="text-lg font-semibold text-gray-900">{userRole || 'No role assigned'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Role Info:</p>
              <p className="text-lg font-semibold text-gray-900">{roleInfo?.name || 'No role info'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Is Admin:</p>
              <p className="text-lg font-semibold text-gray-900">{isAdmin ? 'Yes' : 'No'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Has CSPA Access:</p>
              <p className="text-lg font-semibold text-gray-900">{hasFeatureAccess('cspa') ? 'Yes' : 'No'}</p>
            </div>
          </div>
        </div>

        {/* Feature Access Test */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Feature Access Test</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Admin Dashboard</h3>
              <p className="text-sm text-gray-600">Access: {hasFeatureAccess('admin_dashboard') ? '✅ Allowed' : '❌ Denied'}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">User Management</h3>
              <p className="text-sm text-gray-600">Access: {hasFeatureAccess('user_management') ? '✅ Allowed' : '❌ Denied'}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">CSPA</h3>
              <p className="text-sm text-gray-600">Access: {hasFeatureAccess('cspa') ? '✅ Allowed' : '❌ Denied'}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Driver Records</h3>
              <p className="text-sm text-gray-600">Access: {hasFeatureAccess('driver_records') ? '✅ Allowed' : '❌ Denied'}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Reports</h3>
              <p className="text-sm text-gray-600">Access: {hasFeatureAccess('reports') ? '✅ Allowed' : '❌ Denied'}</p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Attendance</h3>
              <p className="text-sm text-gray-600">Access: {hasFeatureAccess('attendance') ? '✅ Allowed' : '❌ Denied'}</p>
            </div>
          </div>
        </div>

        {/* Role-Based Dashboard Test */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Role-Based Dashboard Test</h2>
          <RoleBasedDashboard />
        </div>

        {/* Route Protection Test */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Route Protection Test</h2>
          
          {/* Admin Only Route */}
          <div className="mb-4 p-4 border rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Admin Only Route</h3>
            <RoleBasedRoute requiredRole="admin">
              <div className="bg-green-100 p-3 rounded">
                ✅ This content is only visible to admins
              </div>
            </RoleBasedRoute>
            <RoleBasedRoute requiredRole="admin" showAccessDenied={false}>
              <div className="bg-red-100 p-3 rounded">
                ❌ Non-admins cannot see this content
              </div>
            </RoleBasedRoute>
          </div>

          {/* Customer Service Route */}
          <div className="mb-4 p-4 border rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Customer Service Route</h3>
            <RoleBasedRoute requiredFeature="cspa">
              <div className="bg-blue-100 p-3 rounded">
                ✅ This content is only visible to users with CSPA access
              </div>
            </RoleBasedRoute>
            <RoleBasedRoute requiredFeature="cspa" showAccessDenied={false}>
              <div className="bg-red-100 p-3 rounded">
                ❌ Users without CSPA access cannot see this content
              </div>
            </RoleBasedRoute>
          </div>

          {/* Minimum Role Level Route */}
          <div className="mb-4 p-4 border rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Minimum Role Level Route (Level 2+)</h3>
            <RoleBasedRoute minRoleLevel={2}>
              <div className="bg-purple-100 p-3 rounded">
                ✅ This content is only visible to users with role level 2 or higher
              </div>
            </RoleBasedRoute>
            <RoleBasedRoute minRoleLevel={2} showAccessDenied={false}>
              <div className="bg-red-100 p-3 rounded">
                ❌ Users with role level 1 cannot see this content
              </div>
            </RoleBasedRoute>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RBACTest;
