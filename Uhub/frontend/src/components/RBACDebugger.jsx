import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Shield, UserCheck, AlertTriangle, CheckCircle, XCircle, 
  Eye, EyeOff, RefreshCw, Lock, Unlock, Users, Settings,
  Database, FileText, BarChart3, Car, Headphones, Cog
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useRoleAccess, ROLE_PERMISSIONS, FEATURE_ACCESS, hasFeatureAccess } from './RoleBasedRoute';
import { supabase } from '../supabaseClient';

export default function RBACDebugger() {
  const { user, userProfile, role, refreshProfile } = useAuth();
  const { userRole, roleInfo, hasFeatureAccess: checkFeatureAccess } = useRoleAccess();
  const [showSensitiveData, setShowSensitiveData] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);

  // Test all features for current user
  const testAllFeatures = () => {
    setLoading(true);
    const results = {};
    
    Object.keys(FEATURE_ACCESS).forEach(feature => {
      const hasAccess = checkFeatureAccess(feature);
      results[feature] = hasAccess;
    });
    
    setTestResults(results);
    setLoading(false);
  };

  // Test specific feature access
  const testFeatureAccess = (feature) => {
    return checkFeatureAccess(feature);
  };

  // Get all available features for current role
  const getAvailableFeatures = () => {
    if (!userRole) return [];
    
    return Object.entries(FEATURE_ACCESS)
      .filter(([feature, allowedRoles]) => 
        allowedRoles.includes(userRole) || allowedRoles.includes('all')
      )
      .map(([feature]) => feature);
  };

  // Get restricted features for current role
  const getRestrictedFeatures = () => {
    if (!userRole) return [];
    
    return Object.entries(FEATURE_ACCESS)
      .filter(([feature, allowedRoles]) => 
        !allowedRoles.includes(userRole) && !allowedRoles.includes('all')
      )
      .map(([feature]) => feature);
  };

  // Check if user can access admin features
  const canAccessAdminFeatures = () => {
    return userRole === 'admin';
  };

  // Check if user can access HR features
  const canAccessHRFeatures = () => {
    return ['admin', 'hr_manager'].includes(userRole);
  };

  // Check if user can access CS features
  const canAccessCSFeatures = () => {
    return ['admin', 'hr_manager', 'cs_manager'].includes(userRole);
  };

  // Check if user can access driver management features
  const canAccessDriverFeatures = () => {
    return ['admin', 'manager', 'driver_management'].includes(userRole);
  };

  // Check if user can access financial features
  const canAccessFinancialFeatures = () => {
    return ['admin', 'manager'].includes(userRole);
  };

  const availableFeatures = getAvailableFeatures();
  const restrictedFeatures = getRestrictedFeatures();

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Shield className="w-8 h-8 text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">RBAC System Debugger</h1>
          </div>
          <button
            onClick={testAllFeatures}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
          >
            {loading ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            Test All Features
          </button>
        </div>

        {/* Current User Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Current User Status</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-700">User ID:</span>
                <span className="font-mono text-blue-900">{user?.id || 'Not loaded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Email:</span>
                <span className="font-mono text-blue-900">{user?.email || 'Not loaded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">AuthContext Role:</span>
                <span className="font-mono text-blue-900">{role || 'Not loaded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">useRoleAccess Role:</span>
                <span className="font-mono text-blue-900">{userRole || 'Not loaded'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-700">Profile Loaded:</span>
                <span className="font-mono text-blue-900">{userProfile ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-900 mb-3">Role Information</h3>
            {roleInfo ? (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-green-700">Role Name:</span>
                  <span className="font-semibold text-green-900">{roleInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Level:</span>
                  <span className="font-mono text-green-900">{roleInfo.level}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-green-700">Description:</span>
                  <span className="text-green-900">{roleInfo.description}</span>
                </div>
              </div>
            ) : (
              <p className="text-green-700">No role information available</p>
            )}
          </div>
        </div>

        {/* Role Capabilities */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="font-semibold text-red-900 mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Admin Access
            </h4>
            <div className="text-sm text-red-700">
              {canAccessAdminFeatures() ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Full administrative access
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-2" />
                  No admin access
                </div>
              )}
            </div>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h4 className="font-semibold text-purple-900 mb-2 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              HR Access
            </h4>
            <div className="text-sm text-purple-700">
              {canAccessHRFeatures() ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  HR management access
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-2" />
                  No HR access
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-2 flex items-center">
              <Headphones className="w-4 h-4 mr-2" />
              CS Access
            </h4>
            <div className="text-sm text-indigo-700">
              {canAccessCSFeatures() ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Customer service access
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-2" />
                  No CS access
                </div>
              )}
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2 flex items-center">
              <Car className="w-4 h-4 mr-2" />
              Driver Management
            </h4>
            <div className="text-sm text-green-700">
              {canAccessDriverFeatures() ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Driver management access
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-2" />
                  No driver access
                </div>
              )}
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-900 mb-2 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Financial Access
            </h4>
            <div className="text-sm text-yellow-700">
              {canAccessFinancialFeatures() ? (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Financial management access
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-2" />
                  No financial access
                </div>
              )}
            </div>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Settings className="w-4 h-4 mr-2" />
              System Access
            </h4>
            <div className="text-sm text-gray-700">
              <div className="flex justify-between">
                <span>Available Features:</span>
                <span className="font-semibold text-green-600">{availableFeatures.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Restricted Features:</span>
                <span className="font-semibold text-red-600">{restrictedFeatures.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Access Testing */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Feature Access Testing</h3>
            <button
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center"
            >
              {showSensitiveData ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
              {showSensitiveData ? 'Hide' : 'Show'} All Features
            </button>
          </div>

          {/* Available Features */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-3 flex items-center">
              <CheckCircle className="w-4 h-4 mr-2" />
              Available Features ({availableFeatures.length})
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {availableFeatures.map(feature => (
                <div key={feature} className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-mono">
                  {feature}
                </div>
              ))}
            </div>
          </div>

          {/* Restricted Features */}
          {showSensitiveData && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-3 flex items-center">
                <XCircle className="w-4 h-4 mr-2" />
                Restricted Features ({restrictedFeatures.length})
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {restrictedFeatures.map(feature => (
                  <div key={feature} className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-mono">
                    {feature}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Test Results */}
          {Object.keys(testResults).length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-3 flex items-center">
                <Database className="w-4 h-4 mr-2" />
                Test Results
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {Object.entries(testResults).map(([feature, hasAccess]) => (
                  <div 
                    key={feature} 
                    className={`px-2 py-1 rounded text-sm font-mono flex items-center justify-between ${
                      hasAccess 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    <span>{feature}</span>
                    {hasAccess ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Debug Actions */}
        <div className="mt-8 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3">Debug Actions</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={refreshProfile}
              className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Refresh Profile
            </button>
            <button
              onClick={() => console.log('AuthContext State:', { user, userProfile, role })}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Log Auth State
            </button>
            <button
              onClick={() => console.log('Role Access State:', { userRole, roleInfo })}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Log Role State
            </button>
            <button
              onClick={() => console.log('Feature Access:', FEATURE_ACCESS)}
              className="px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 text-sm"
            >
              Log Feature Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
