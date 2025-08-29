import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';

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
  data_operator: {
    level: 2,
    name: 'Data Operator',
    description: 'Data operator with access to home, slice of life, communication, HR view, IT requests, fleet records, expense tracker, and todo list',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_view_only', 'it_requests', 'fleet_records', 'expense_tracker', 'todo_list']
  },
  finance: {
    level: 2,
    name: 'Finance',
    description: 'Finance role with access to home, slice of life, communication, HR view, IT requests, sim cards, payment calendar, upcoming payments, vouchers, and todo list',
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_view_only', 'it_requests', 'simcards', 'payment_calendar', 'upcoming_payments', 'vouchers', 'todo_list']
  },
  it_management: {
    level: 2,
    name: 'IT Management',
    description: 'IT management role with access to home, slice of life, communication, HR view, IT requests, request inbox, assets, sim cards, payment calendar, upcoming payments, analytics, and todo list',
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_view_only', 'it_requests', 'request_inbox', 'assets', 'simcards', 'payment_calendar', 'upcoming_payments', 'analytics', 'todo_list']
  },
  employee: {
    level: 3,
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
  },
  manager: {
    level: 4,
    name: 'Manager',
    description: 'General manager with access to assets, employees, and operational features',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    icon: Shield,
    access: ['main_panel', 'slice_of_life', 'communication', 'user_profile', 'hr_view_only', 'it_requests', 'todo_list', 'asset_management', 'driver_records_view_only']
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
  home: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  dashboard: ['admin'], // Dashboard temporarily restricted to admin only
  calendar_view: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  
  // Slice of Life Panel - All roles have access
  events: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  memories: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  
  // Communication Panel - All roles have access
  communication: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  
  // User Profile - All roles have access
  user_profile: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  profile: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  
  // HR Panel - Different access levels
  employees: ['admin', 'hr_manager', 'manager'], // Full access for admin, HR manager, and manager
  employees_view_only: ['data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management'], // View only for others
  complaints: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  complaints_inbox: ['admin', 'hr_manager'], // Only admin and HR manager see inbox
  suggestions: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  attendance: ['admin', 'hr_manager'],
  hr_operations: ['admin', 'hr_manager'],
  payroll: ['admin', 'hr_manager'],
  epr: ['admin', 'hr_manager'],
  
  // IT Service Panel - All roles have access to IT requests
  it_requests: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  it_assets: ['admin', 'it_management'],
  it_tickets: ['admin'],
  request_inbox: ['admin', 'it_management'],
  
  // Todo List Panel - All roles have full access
  todo_list: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  task_management: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  my_tasks: ['admin', 'data_operator', 'finance', 'it_management', 'employee', 'cs_manager', 'driver_management', 'hr_manager', 'manager'],
  
  // Customer Service Panel - CS Manager has full access
  customer_service: ['admin', 'cs_manager'],
  cspa: ['admin', 'cs_manager'],
  cs_tickets: ['admin', 'cs_manager'],
  cs_requests: ['admin', 'cs_manager'],
  
  // Driver Management Panel - Different access levels
  drivers: ['admin', 'driver_management'], // Full access for admin and driver management
  driver_records: ['admin', 'driver_management', 'hr_manager', 'manager'], // HR manager and manager can view only
  driver_documents: ['admin', 'driver_management'],
  fleet_management: ['admin', 'driver_management'],
  fleet_records: ['admin', 'driver_management', 'data_operator'],
  breakdowns: ['admin', 'driver_management'],
  
  // Asset Management Panel - Admin, HR Manager, Driver Management, and Manager
  assets: ['admin', 'hr_manager', 'driver_management', 'manager', 'it_management'],
  simcards: ['admin', 'hr_manager', 'driver_management', 'manager', 'finance', 'it_management'], // Allow HR managers, driver management, managers, finance, and IT management to access SIM cards
  vouchers: ['admin', 'finance'],
  
  // Financial Panel - Different access levels
  expenses: ['admin'],
  expense_tracker: ['admin', 'data_operator'],
  payment_calendar: ['admin', 'finance', 'it_management'],
  upcoming_payments: ['admin', 'finance', 'it_management'],
  
  // Analytics and Reports - Admin and IT Management
  analytics: ['admin', 'it_management'],
  reports: ['admin'],
  
  // Additional features
  calendar: ['admin'],
  tickets: ['admin'],
  surveys: ['admin']
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
    data_operator: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'driver_management', 'financial', 'todo_list', 'slice_of_life', 'communication'],
      items: {
        main: ['home', 'calendar_view'],
        user_profile: ['profile'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests'],
        driver_management: ['fleet_records'],
        financial: ['expense_tracker'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication']
      }
    },
    finance: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'asset_management', 'financial', 'todo_list', 'slice_of_life', 'communication'],
      items: {
        main: ['home', 'calendar_view'],
        user_profile: ['profile'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests'],
        asset_management: ['simcards'],
        financial: ['payment_calendar', 'upcoming_payments', 'vouchers'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication']
      }
    },
    it_management: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'asset_management', 'financial', 'todo_list', 'slice_of_life', 'communication'],
      items: {
        main: ['home', 'calendar_view'],
        user_profile: ['profile'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests', 'request_inbox'],
        asset_management: ['assets', 'simcards'],
        financial: ['payment_calendar', 'upcoming_payments', 'analytics'],
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
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'todo_list', 'slice_of_life', 'communication', 'driver_management', 'asset_management'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication'],
        driver_management: ['drivers', 'driver_records', 'driver_documents', 'fleet_management', 'fleet_records', 'breakdowns'],
        asset_management: ['assets', 'simcards']
      }
    },
    hr_manager: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'todo_list', 'slice_of_life', 'communication', 'driver_management', 'asset_management'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employees', 'employee_records', 'complaints', 'complaints_inbox', 'suggestions', 'attendance', 'payroll', 'epr'],
        it_services: ['it_requests'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication'],
        driver_management: ['driver_records'], // View only
        asset_management: ['assets', 'simcards']
      }
    },
    manager: {
      panels: ['main', 'user_profile', 'hr_panel', 'it_services', 'todo_list', 'slice_of_life', 'communication', 'driver_management', 'asset_management'],
      items: {
        main: ['home', 'dashboard', 'calendar_view'],
        user_profile: ['profile', 'settings'],
        hr_panel: ['employee_records', 'complaints', 'suggestions'],
        it_services: ['it_requests'],
        todo_list: ['todo_list', 'task_management', 'my_tasks'],
        slice_of_life: ['events', 'memories'],
        communication: ['communication'],
        driver_management: ['driver_records'], // View only
        asset_management: ['assets', 'simcards']
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
  
  // Debug logging
  console.log('🔍 ProtectedRoute:', {
    pathname: location.pathname,
    user: !!user,
    userProfile: !!userProfile,
    userRole: userProfile?.role,
    loading,
    requiredRole,
    requiredFeature
  });

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

  // Wait for auth to be fully checked before making decisions
  if (!user && !loading) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If still loading auth, show loading
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    );
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

  // Redirect to home page if access denied (not dashboard)
  return <Navigate to="/" replace />;
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
    isDataOperator: userRole === 'data_operator',
    isFinance: userRole === 'finance',
    isITManagement: userRole === 'it_management',
    isHRManager: userRole === 'hr_manager',
    isCSManager: userRole === 'cs_manager',
    isDriverManagement: userRole === 'driver_management',
    isEmployee: userRole === 'employee'
  };
};
