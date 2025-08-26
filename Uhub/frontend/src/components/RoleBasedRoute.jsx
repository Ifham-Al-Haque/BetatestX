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
  employee: {
    level: 2,
    name: 'Employee',
    description: 'Standard user with access to main features, HR view, IT requests, and todo list',
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_view_only', 'it_requests', 'todo_list']
  },
  cs_manager: {
    level: 3,
    name: 'CS Manager',
    description: 'Customer Service manager with full CS panel access plus employee features',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_view_only', 'it_requests', 'todo_list', 'customer_service_full']
  },
  driver_management: {
    level: 4,
    name: 'Driver Management',
    description: 'Driver management with full driver panel access plus employee features',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_view_only', 'it_requests', 'todo_list', 'driver_management_full']
  },
  hr_manager: {
    level: 5,
    name: 'HR Manager',
    description: 'HR manager with employee oversight, complaints inbox, and driver records view',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_management', 'it_requests', 'todo_list', 'driver_records_view_only']
  }
};

// Feature access mapping
export const FEATURE_ACCESS = {
  // Admin features - Only admin has access
  admin_dashboard: ['admin'],
  user_management: ['admin'],
  system_settings: ['admin'],
  role_management: ['admin'],
  invitation_manager: ['admin'],
  test_invitations: ['admin'],
  access_management: ['admin'],
  access_requests: ['admin'],
  rbac_test: ['admin'],
  call_center_demo: ['admin'],
  csv_importer: ['admin'],
  
  // Main Panel Features - All roles have access
  home: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  dashboard: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  calendar_view: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  
  // Slice of Life Panel - All roles have access
  events: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  memories: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  
  // Communication Panel - All roles have access
  communication: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  
  // User Profile - All roles have access
  user_profile: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  profile: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  
  // HR Panel - Different access levels
  employees: ['admin', 'hr_manager'], // Full access for admin and HR manager
  employees_view_only: ['employee', 'cs_manager', 'driver_management'], // View only for others
  complaints: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  complaints_inbox: ['admin', 'hr_manager'], // Only admin and HR manager see inbox
  suggestions: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  attendance: ['admin', 'hr_manager'],
  hr_operations: ['admin', 'hr_manager'],
  payroll: ['admin', 'hr_manager'],
  epr: ['admin', 'hr_manager'],
  
  // IT Service Panel - All roles have access to IT requests
  it_requests: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  it_assets: ['admin'],
  it_tickets: ['admin'],
  request_inbox: ['admin'],
  
  // Todo List Panel - All roles have full access
  todo_list: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  task_management: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  my_tasks: ['admin', 'employee', 'cs_manager', 'driver_management', 'hr_manager'],
  
  // Customer Service Panel - CS Manager has full access
  customer_service: ['admin', 'cs_manager'],
  cspa: ['admin', 'cs_manager'],
  cs_tickets: ['admin', 'cs_manager'],
  cs_requests: ['admin', 'cs_manager'],
  
  // Driver Management Panel - Different access levels
  drivers: ['admin', 'driver_management'], // Full access for admin and driver management
  driver_records: ['admin', 'driver_management', 'hr_manager'], // HR manager can view only
  driver_documents: ['admin', 'driver_management'],
  fleet_management: ['admin', 'driver_management'],
  fleet_records: ['admin', 'driver_management'],
  breakdowns: ['admin', 'driver_management'],
  
  // Asset Management Panel - Admin only
  assets: ['admin'],
  simcards: ['admin'],
  vouchers: ['admin'],
  
  // Financial Panel - Admin only
  expenses: ['admin'],
  expense_tracker: ['admin'],
  payment_calendar: ['admin'],
  upcoming_payments: ['admin'],
  
  // Analytics and Reports - Admin only
  analytics: ['admin'],
  reports: ['admin'],
  
  // Additional features
  calendar: ['admin'],
  tickets: ['admin'],
  surveys: ['admin'],
  invitation_manager: ['admin'],
  test_invitations: ['admin'],
  access_management: ['admin'],
  access_requests: ['admin'],
  rbac_test: ['admin'],
  call_center_demo: ['admin'],
  csv_importer: ['admin']
};

// Check if user has access to a specific feature
export const hasFeatureAccess = (userRole, feature) => {
  if (!userRole || !feature) {
    console.log('hasFeatureAccess: Missing userRole or feature', { userRole, feature });
    return false;
  }
  
  const allowedRoles = FEATURE_ACCESS[feature];
  if (!allowedRoles) {
    console.log('hasFeatureAccess: Feature not found in FEATURE_ACCESS', { feature, userRole });
    return false;
  }
  
  const hasAccess = allowedRoles.includes(userRole) || allowedRoles.includes('all');
  console.log('hasFeatureAccess:', { userRole, feature, allowedRoles, hasAccess });
  return hasAccess;
};

// Get role-based navigation access for sidebar
export const getRoleNavigationAccess = (userRole) => {
  if (!userRole) return { panels: [], items: {} };
  
  const roleAccess = {
    admin: {
      panels: ['main', 'admin', 'user_profile', 'hr_panel', 'customer_service', 'it_services', 'driver_management', 'asset_management', 'financial', 'todo_list', 'slice_of_life', 'communication'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        admin: ['admin_dashboard', 'user_management'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employees', 'employee_records', 'complaints', 'complaints_inbox', 'suggestions', 'attendance', 'payroll', 'epr'],
        customer_service: ['cspa', 'cs_tickets', 'cs_requests'],
        it_services: ['it_requests', 'it_assets', 'it_tickets', 'request_inbox'],
        driver_management: ['drivers', 'driver_records', 'driver_documents', 'fleet_management', 'fleet_records', 'breakdowns'],
        asset_management: ['assets', 'simcards', 'vouchers'],
        financial: ['expenses', 'expense_tracker', 'payment_calendar', 'upcoming_payments'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication']
      }
    },
    employee: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'todo_list', 'slice_of_life', 'communication'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication']
      }
    },
    cs_manager: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'todo_list', 'slice_of_life', 'communication', 'customer_service'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication'],
        customer_service: ['cspa', 'cs_tickets', 'cs_requests']
      }
    },
    driver_management: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'todo_list', 'slice_of_life', 'communication', 'driver_management'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication'],
        driver_management: ['drivers', 'driver_records', 'driver_documents', 'fleet_management', 'fleet_records', 'breakdowns']
      }
    },
    hr_manager: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'todo_list', 'slice_of_life', 'communication', 'driver_management'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employees', 'employee_records', 'complaints', 'complaints_inbox', 'suggestions', 'attendance', 'payroll', 'epr'],
        it_services: ['it_requests'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication'],
        driver_management: ['driver_records'] // View only
      }
    }
  };
  
  return roleAccess[userRole] || { panels: [], items: {} };
};

// Check if user can see a specific panel
export const canSeePanel = (userRole, panelKey) => {
  const access = getRoleNavigationAccess(userRole);
  return access.panels.includes(panelKey);
};

// Check if user can see a specific navigation item
export const canSeeItem = (userRole, panelKey, itemKey) => {
  // First check if the user can see the panel
  if (!canSeePanel(userRole, panelKey)) {
    return false;
  }
  
  // Then check if the user has access to the specific feature
  // Convert itemKey to a more standardized format for feature checking
  const featureKey = itemKey.toLowerCase().replace(/\s+/g, '_');
  
  // Check if the feature exists in FEATURE_ACCESS
  if (FEATURE_ACCESS[featureKey]) {
    return hasFeatureAccess(userRole, featureKey);
  }
  
  // If no specific feature mapping, check the navigation access
  const access = getRoleNavigationAccess(userRole);
  return access.items[panelKey]?.includes(itemKey) || false;
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
