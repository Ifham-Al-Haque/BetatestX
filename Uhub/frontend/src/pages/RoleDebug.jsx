import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useRoleAccess, hasFeatureAccess, ROLE_PERMISSIONS } from '../components/RoleBasedRoute';

const RoleDebug = () => {
  const { user, userProfile } = useAuth();
  const { userRole, roleInfo, hasFeatureAccess: checkFeatureAccess } = useRoleAccess();

  const testFeatures = ['cspa', 'complaints', 'cs_tickets', 'attendance', 'reports'];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Role Debug Information</h1>
          
          <div className="space-y-6">
            {/* User Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-blue-900 mb-3">User Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">User ID:</span> {user?.id || 'Not loaded'}
                </div>
                <div>
                  <span className="font-medium">Email:</span> {user?.email || 'Not loaded'}
                </div>
                <div>
                  <span className="font-medium">User Role (from user):</span> {user?.role || 'Not set'}
                </div>
                <div>
                  <span className="font-medium">User Profile Role:</span> {userProfile?.role || 'Not loaded'}
                </div>
              </div>
            </div>

            {/* Role Information */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-green-900 mb-3">Role Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Detected Role:</span> {userRole || 'Not detected'}
                </div>
                <div>
                  <span className="font-medium">Role Info:</span> {roleInfo ? 'Loaded' : 'Not loaded'}
                </div>
                {roleInfo && (
                  <>
                    <div>
                      <span className="font-medium">Role Name:</span> {roleInfo.name}
                    </div>
                    <div>
                      <span className="font-medium">Role Level:</span> {roleInfo.level}
                    </div>
                    <div>
                      <span className="font-medium">Role Description:</span> {roleInfo.description}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Feature Access Test */}
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-yellow-900 mb-3">Feature Access Test</h2>
              <div className="space-y-2">
                {testFeatures.map(feature => {
                  const hasAccess = checkFeatureAccess(feature);
                  const directCheck = hasFeatureAccess(userRole, feature);
                  return (
                    <div key={feature} className="flex items-center justify-between p-2 bg-white rounded border">
                      <span className="font-medium">{feature}:</span>
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-1 text-xs rounded ${hasAccess ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Hook: {hasAccess ? 'YES' : 'NO'}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${directCheck ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          Direct: {directCheck ? 'YES' : 'NO'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Available Roles */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-purple-900 mb-3">Available Roles in System</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {Object.entries(ROLE_PERMISSIONS).map(([roleKey, roleData]) => (
                  <div key={roleKey} className="p-2 bg-white rounded border">
                    <div className="font-medium">{roleKey}</div>
                    <div className="text-sm text-gray-600">{roleData.name}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Raw Data */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Raw Data (for debugging)</h2>
              <details className="text-sm">
                <summary className="cursor-pointer font-medium">Click to expand</summary>
                <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto">
                  {JSON.stringify({
                    user: user ? { id: user.id, email: user.email, role: user.role } : null,
                    userProfile: userProfile ? { 
                      id: userProfile.id, 
                      email: userProfile.email, 
                      role: userProfile.role,
                      full_name: userProfile.full_name 
                    } : null,
                    detectedRole: userRole,
                    roleInfo: roleInfo
                  }, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleDebug;
