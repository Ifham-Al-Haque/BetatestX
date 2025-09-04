import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  AdminOnly, 
  ManagerAndAbove, 
  EmployeeAndAbove, 
  HRManagerAndAbove,
  DriverManagementAndAbove
} from './RoleBasedSection';

const RoleTest = () => {
  const { user, userProfile, role } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Role-Based Access Control Test</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates how different user roles can access different features.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">Current User Info</h3>
              <p className="text-sm text-blue-700">Email: {user?.email || 'Not logged in'}</p>
              <p className="text-sm text-blue-700">Role: {role || 'No role'}</p>
              <p className="text-sm text-blue-700">Profile Role: {userProfile?.role || 'No profile role'}</p>
            </div>
            
            <div className="p-4 bg-green-50 rounded-lg">
              <h3 className="font-semibold text-green-900 mb-2">Effective Role</h3>
              <p className="text-sm text-green-700">
                The system uses the role from your user profile: <strong>{userProfile?.role || role || 'employee'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Admin Only Section */}
        <AdminOnly
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Only Section</h3>
                <p className="text-gray-600">This section is only visible to administrators.</p>
              </div>
            </div>
          }
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Admin Access Granted!</h3>
              <p className="text-green-700">You have full administrative access to the system.</p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Admin Capabilities:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• User management and role assignment</li>
                  <li>• System configuration</li>
                  <li>• Access to all features</li>
                  <li>• Database administration</li>
                </ul>
              </div>
            </div>
          </div>
        </AdminOnly>

        {/* HR Manager Section */}
        <HRManagerAndAbove
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">HR Manager Section</h3>
                <p className="text-gray-600">This section requires HR Manager role or above.</p>
              </div>
            </div>
          }
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-purple-900 mb-2">HR Manager Access Granted!</h3>
              <p className="text-purple-700">You have access to HR management features.</p>
              <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">HR Manager Capabilities:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Employee management and oversight</li>
                  <li>• Attendance monitoring and reports</li>
                  <li>• HR operations and policies</li>
                  <li>• Performance and compliance reports</li>
                </ul>
              </div>
            </div>
          </div>
        </HRManagerAndAbove>

        {/* Manager Section */}
        <ManagerAndAbove
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">👥</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Manager Section</h3>
                <p className="text-gray-600">This section requires Manager role or above.</p>
              </div>
            </div>
          }
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-blue-900 mb-2">Manager Access Granted!</h3>
              <p className="text-blue-700">You have managerial access to the system.</p>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Manager Capabilities:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Employee management</li>
                  <li>• Team oversight</li>
                  <li>• Report generation</li>
                  <li>• Department coordination</li>
                </ul>
              </div>
            </div>
          </div>
        </ManagerAndAbove>

        {/* Driver Management Section */}
        <DriverManagementAndAbove
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚗</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Driver Management Section</h3>
                <p className="text-gray-600">This section requires Driver Management role or above.</p>
              </div>
            </div>
          }
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Driver Management Access Granted!</h3>
              <p className="text-green-700">You have driver management access to the system.</p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Driver Management Capabilities:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Driver records management</li>
                  <li>• Driver documents handling</li>
                  <li>• Dashboard access</li>
                  <li>• Basic operations</li>
                </ul>
              </div>
            </div>
          </div>
        </DriverManagementAndAbove>

        {/* Employee Section */}
        <EmployeeAndAbove
          fallback={
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🚫</span>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">You need at least Employee role to access this section.</p>
              </div>
            </div>
          }
        >
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✅</span>
              </div>
              <h3 className="text-xl font-semibold text-green-900 mb-2">Employee Access Granted!</h3>
              <p className="text-green-700">You have basic employee access to the system.</p>
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <h4 className="font-medium text-green-900 mb-2">Employee Capabilities:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• View dashboard</li>
                  <li>• Manage personal profile</li>
                  <li>• Basic system operations</li>
                  <li>• View assigned data</li>
                </ul>
              </div>
            </div>
          </div>
        </EmployeeAndAbove>

        {/* Role Information */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Available Roles</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             <div className="p-4 bg-red-50 rounded-lg">
               <h4 className="font-medium text-red-900 mb-2">Administrator</h4>
               <p className="text-sm text-red-700">Full system access and control</p>
             </div>
             <div className="p-4 bg-blue-50 rounded-lg">
               <h4 className="font-medium text-blue-900 mb-2">Manager</h4>
               <p className="text-sm text-blue-700">Semi-admin with elevated permissions</p>
             </div>
             <div className="p-4 bg-green-50 rounded-lg">
               <h4 className="font-medium text-green-900 mb-2">Driver Management</h4>
               <p className="text-sm text-green-700">Driver-specific operations</p>
             </div>
             <div className="p-4 bg-purple-50 rounded-lg">
               <h4 className="font-medium text-purple-900 mb-2">HR Manager</h4>
               <p className="text-sm text-purple-700">Human Resources management</p>
             </div>
             <div className="p-4 bg-gray-50 rounded-lg">
               <h4 className="font-medium text-gray-900 mb-2">Employee</h4>
               <p className="text-sm text-gray-700">Standard user with read-only access</p>
             </div>
             <div className="p-4 bg-orange-50 rounded-lg">
               <h4 className="font-medium text-orange-900 mb-2">Viewer</h4>
               <p className="text-sm text-orange-700">Read-only minimal access</p>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RoleTest;
