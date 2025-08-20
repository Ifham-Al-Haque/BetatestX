import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, AlertTriangle, Lock } from 'lucide-react';

// Role hierarchy and permissions
export const ROLE_PERMISSIONS = {
  admin: {
    level: 1,
    name: 'Administrator',
    description: 'Full system administrator with complete access to all sections',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    icon: Shield,
    access: ['all']
  },
  manager: {
    level: 2,
    name: 'Manager',
    description: 'Semi-admin with elevated permissions but no user management',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: Shield,
    access: ['assets', 'drivers', 'tickets', 'calendar', 'expenses', 'simcards', 'vouchers', 'analytics', 'dashboard', 'employees', 'attendance']
  },
  driver_management: {
    level: 3,
    name: 'Driver Management',
    description: 'Driver-specific role with access only to driver-related pages',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: Shield,
    access: ['drivers', 'dashboard', 'driver_records', 'driver_documents']
  },
  hr_manager: {
    level: 4,
    name: 'HR Manager',
    description: 'Human Resources management with employee oversight',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: Shield,
    access: ['employees', 'attendance', 'reports', 'hr_operations', 'basic_features']
  },
  cs_manager: {
    level: 5,
    name: 'CS Manager',
    description: 'Customer Service management with CSPA and ticket oversight',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    icon: Shield,
    access: ['cspa', 'cs_tickets', 'requests', 'attendance_view', 'complaints', 'task_management', 'my_tasks', 'reports', 'calendar_view', 'user_profile']
  },
  employee: {
    level: 6,
    name: 'Employee',
    description: 'Standard user with read-only access to main panel and personal data',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: Shield,
    access: ['dashboard', 'personal_data', 'complaints', 'attendance', 'my_tasks', 'reports', 'user_profile']
  },
  viewer: {
    level: 7,
    name: 'Viewer',
    description: 'Read-only user with minimal permissions',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: Shield,
    access: ['drivers', 'employees', 'dashboard']
  }
};

// Feature access mapping
export const FEATURE_ACCESS = {
  // Admin features
  admin_dashboard: ['admin'],
  user_management: ['admin'],
  system_settings: ['admin'],
  role_management: ['admin'],
  
  // Manager features
  assets: ['admin', 'manager'],
  drivers: ['admin', 'manager', 'driver_management', 'employee', 'viewer'],
  tickets: ['admin', 'manager'],
  calendar: ['admin', 'manager'],
  expenses: ['admin', 'manager'],
  simcards: ['admin', 'manager'],
  vouchers: ['admin', 'manager'],
  analytics: ['admin', 'manager'],
  dashboard: ['admin', 'manager', 'driver_management', 'employee', 'viewer'],
  employees: ['admin', 'manager', 'hr_manager', 'employee', 'viewer'],
  attendance: ['admin', 'manager', 'hr_manager', 'employee'],
  
  // HR Manager features
  hr_operations: ['admin', 'hr_manager'],
  
  // CS Manager features
  cspa: ['admin', 'hr_manager', 'cs_manager'],
  cs_tickets: ['admin', 'hr_manager', 'cs_manager'],
  requests: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee'],
  attendance_view: ['admin', 'manager', 'hr_manager', 'cs_manager', 'employee'],
  complaints: ['admin', 'manager', 'hr_manager', 'cs_manager', 'employee'],
  task_management: ['admin', 'manager', 'driver_management', 'cs_manager'],
  my_tasks: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee'],
  reports: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager'],
  calendar_view: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee'],
  user_profile: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee', 'viewer'],
  
  // Driver Management features
  driver_records: ['admin', 'manager', 'driver_management'],
  driver_documents: ['admin', 'manager', 'driver_management'],
  
  // Employee features
  personal_data: ['admin', 'manager', 'hr_manager', 'employee'],
  complaints: ['admin', 'manager', 'employee'],
  my_tasks: ['admin', 'manager', 'employee'],
  reports: ['admin', 'manager', 'hr_manager', 'employee'],
  user_profile: ['admin', 'manager', 'hr_manager', 'employee'],
  
  // Basic features
  profile: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee', 'viewer']
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
      isHRManager: false,
      isCSManager: false,
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
    isHRManager: userRole === 'hr_manager',
    isCSManager: userRole === 'cs_manager',
    isDriverManagement: userRole === 'driver_management',
    isEmployee: userRole === 'employee'
  };
};
