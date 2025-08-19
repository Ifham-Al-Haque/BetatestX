import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

// Role hierarchy and permissions
export const ROLE_PERMISSIONS = {
  admin: {
    level: 4,
    name: 'Administrator',
    description: 'Full access to all system features',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: Shield,
    access: ['all']
  },
  customer_service: {
    level: 3,
    name: 'Customer Service',
    description: 'Access to CSPA and customer service features',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: Shield,
    access: ['cspa', 'customer_service', 'basic_features', 'user_management']
  },
  driver_management: {
    level: 2,
    name: 'Operation Management',
    description: 'Access to driver records and operations',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: Shield,
    access: ['driver_records', 'driver_operations', 'basic_features']
  },
  employee: {
    level: 1,
    name: 'Employee',
    description: 'Basic access to assigned features',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: Shield,
    access: ['basic_features', 'assigned_tasks']
  }
};

// Feature access mapping
export const FEATURE_ACCESS = {
  // Admin features
  admin_dashboard: ['admin'],
  user_management: ['admin', 'customer_service'],
  system_settings: ['admin'],
  
  // Customer Service features
  cspa: ['admin', 'customer_service'],
  customer_support: ['admin', 'customer_service'],
  ticket_management: ['admin', 'customer_service'],
  
  // Driver Management features
  driver_records: ['admin', 'driver_management'],
  driver_operations: ['admin', 'driver_management'],
  fleet_management: ['admin', 'driver_management'],
  
  // Basic features
  dashboard: ['admin', 'customer_service', 'driver_management', 'employee'],
  profile: ['admin', 'customer_service', 'driver_management', 'employee'],
  reports: ['admin', 'customer_service', 'driver_management'],
  
  // Employee features
  assigned_tasks: ['admin', 'customer_service', 'driver_management', 'employee'],
  attendance: ['admin', 'customer_service', 'driver_management', 'employee']
};

// Check if user has access to a specific feature
export const hasFeatureAccess = (userRole, feature) => {
  if (!userRole || !feature) return false;
  
  const allowedRoles = FEATURE_ACCESS[feature];
  if (!allowedRoles) return false;
  
  return allowedRoles.includes(userRole) || allowedRoles.includes('all');
};

// Check if user has minimum role level
export const hasRoleLevel = (userRole, requiredLevel) => {
  if (!userRole) return false;
  
  const userLevel = ROLE_PERMISSIONS[userRole]?.level || 0;
  return userLevel >= requiredLevel;
};

// Main RBAC Route Component
export const RoleBasedRoute = ({ 
  children, 
  requiredRole = null, 
  requiredFeature = null, 
  minRoleLevel = null,
  fallback = null,
  showAccessDenied = true 
}) => {
  const { user, userProfile, loading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access permissions...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const userRole = userProfile?.role || user?.role;
  let hasAccess = true;
  let accessReason = '';

  // Check role-based access
  if (requiredRole && userRole !== requiredRole) {
    hasAccess = false;
    accessReason = `This page requires ${ROLE_PERMISSIONS[requiredRole]?.name || requiredRole} role`;
  }

  // Check feature-based access
  if (requiredFeature && !hasFeatureAccess(userRole, requiredFeature)) {
    hasAccess = false;
    accessReason = `This feature requires ${requiredFeature} access`;
  }

  // Check minimum role level
  if (minRoleLevel && !hasRoleLevel(userRole, minRoleLevel)) {
    hasAccess = false;
    accessReason = `This requires minimum role level ${minRoleLevel}`;
  }

  // Grant access if all checks pass
  if (hasAccess) {
    return children;
  }

  // Show custom fallback if provided
  if (fallback) {
    return fallback;
  }

  // Show access denied page
  if (showAccessDenied) {
    return <AccessDeniedPage reason={accessReason} userRole={userRole} />;
  }

  // Redirect to dashboard if access denied
  return <Navigate to="/dashboard" replace />;
};

// Access Denied Component
const AccessDeniedPage = ({ reason, userRole }) => {
  const roleInfo = ROLE_PERMISSIONS[userRole];
  const Icon = roleInfo?.icon || Shield;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className={`mx-auto w-16 h-16 ${roleInfo?.bgColor} rounded-full flex items-center justify-center mb-6`}>
          <Lock className={`w-8 h-8 ${roleInfo?.color}`} />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
        
        <p className="text-gray-600 mb-6">{reason}</p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-center mb-2">
            <Icon className={`w-5 h-5 ${roleInfo?.color} mr-2`} />
            <span className={`font-medium ${roleInfo?.color}`}>
              {roleInfo?.name || userRole}
            </span>
          </div>
          <p className="text-sm text-gray-500">{roleInfo?.description}</p>
        </div>
        
        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go Back
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

// Higher-order component for role-based access
export const withRoleAccess = (WrappedComponent, accessConfig = {}) => {
  return (props) => (
    <RoleBasedRoute {...accessConfig}>
      <WrappedComponent {...props} />
    </RoleBasedRoute>
  );
};

// Hook for checking access in components
export const useRoleAccess = () => {
  const { user, userProfile } = useAuth();
  
  // Get role from userProfile first, then fallback to user
  const userRole = userProfile?.role || user?.role;
  
  // Add safety checks to prevent undefined errors
  if (!userRole) {
    return {
      userRole: null,
      roleInfo: null,
      hasFeatureAccess: () => false,
      hasRoleLevel: () => false,
      isAdmin: false,
      isCustomerService: false,
      isDriverManagement: false,
      isEmployee: false
    };
  }
  
  return {
    userRole,
    roleInfo: ROLE_PERMISSIONS[userRole] || null,
    hasFeatureAccess: (feature) => hasFeatureAccess(userRole, feature),
    hasRoleLevel: (level) => hasRoleLevel(userRole, level),
    isAdmin: userRole === 'admin',
    isCustomerService: userRole === 'customer_service',
    isDriverManagement: userRole === 'driver_management',
    isEmployee: userRole === 'employee'
  };
};
