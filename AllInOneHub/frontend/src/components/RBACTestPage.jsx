import React from 'react';
import { useAuth } from '../context/AuthContext';
import { hasFeatureAccess, getRoleNavigationAccess } from './RoleBasedRoute';

const RBACTestPage = () => {
  const { user, userProfile } = useAuth();
  const userRole = userProfile?.role || user?.role;

  if (!userRole) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-red-600 mb-4">RBAC Test - No Role Found</h1>
        <p className="text-gray-600">User profile or role not loaded yet.</p>
      </div>
    );
  }

  const roleAccess = getRoleNavigationAccess(userRole);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-blue-600 mb-6">🔐 RBAC System Test Page</h1>
      
      {/* User Info */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">👤 User Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-600">Email:</p>
            <p className="font-medium">{user?.email || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Full Name:</p>
            <p className="font-medium">{userProfile?.full_name || 'N/A'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role:</p>
            <p className="font-medium text-blue-600">{userRole}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">User ID:</p>
            <p className="font-medium">{user?.id || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Role Access */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🎯 Role-Based Access</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Visible Panels:</h3>
            <div className="flex flex-wrap gap-2">
              {roleAccess.panels.map(panel => (
                <span key={panel} className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                  {panel}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-700 mb-2">Panel Items:</h3>
            <div className="space-y-3">
              {Object.entries(roleAccess.items).map(([panel, items]) => (
                <div key={panel} className="border-l-4 border-blue-200 pl-4">
                  <h4 className="font-medium text-gray-600 capitalize">{panel.replace('_', ' ')}:</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {items.map(item => (
                      <span key={item} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {item.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Access Test */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🧪 Feature Access Test</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[
            'home', 'dashboard', 'calendar_view', 'user_profile', 'employees', 
            'complaints', 'suggestions', 'it_requests', 'todo_list', 'task_management',
            'cspa', 'cs_tickets', 'driver_records', 'fleet_management', 'assets',
            'expenses', 'analytics', 'admin_dashboard', 'user_management'
          ].map(feature => (
            <div key={feature} className="text-center">
              <div className={`p-3 rounded-lg ${
                hasFeatureAccess(userRole, feature) 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <p className="font-medium text-sm">{feature.replace('_', ' ')}</p>
                <p className="text-xs mt-1">
                  {hasFeatureAccess(userRole, feature) ? '✅ Access' : '❌ No Access'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Test */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">🧭 Navigation Test</h2>
        <p className="text-gray-600 mb-4">
          This page tests the RBAC system. Based on your role ({userRole}), you should only see 
          the panels and features that you have access to in the sidebar.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800 mb-2">📋 Test Instructions:</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1 text-sm">
            <li>Check the sidebar - you should only see panels you have access to</li>
            <li>Try navigating to different routes - some should be blocked</li>
            <li>Verify that the feature access above matches your sidebar</li>
            <li>Test with different user roles to see different access patterns</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default RBACTestPage;
