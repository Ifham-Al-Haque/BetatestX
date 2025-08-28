import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, Users, Shield, Settings, BarChart3, 
  Car, Headphones, FileText, Calendar, 
  UserCheck, Building, Database, Cog, AlertTriangle,
  CheckSquare, ClipboardList, Inbox, Lightbulb
} from 'lucide-react';
import { useRoleAccess, ROLE_PERMISSIONS } from './RoleBasedRoute';
import { useSidebar } from '../context/SidebarContext';

// Navigation items configuration
const NAVIGATION_ITEMS = {
  // Dashboard - Admin only (temporarily hidden for other roles)
  dashboard: {
    path: '/dashboard',
    label: 'Dashboard',
    icon: Home,
    roles: ['admin'],
    description: 'Main dashboard and overview (Admin only)'
  },

  // Home - All roles
  home: {
    path: '/',
    label: 'Home',
    icon: Home,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee', 'viewer'],
    description: 'Welcome page and system overview'
  },

  // Admin only features
  admin_dashboard: {
    path: '/admin/dashboard',
    label: 'Admin Dashboard',
    icon: Shield,
    roles: ['admin'],
    description: 'Administrative controls and system management'
  },

  user_management: {
    path: '/user-management',
    label: 'User Management',
    icon: Users,
    roles: ['admin'],
    description: 'Manage system users and permissions'
  },

  // Customer Service features
  cspa: {
    path: '/cspa',
    label: 'CSPA',
    icon: Headphones,
    roles: ['admin', 'hr_manager', 'cs_manager'],
    description: 'Customer Service Performance Analytics'
  },

  cs_tickets: {
    path: '/tickets',
    label: 'CS Tickets',
    icon: FileText,
    roles: ['admin', 'hr_manager', 'cs_manager'],
    description: 'Customer service ticket management system'
  },

  // IT Services features
  it_requests: {
    path: '/it-requests',
    label: 'Requests',
    icon: FileText,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee'],
    description: 'Submit and manage IT service requests'
  },

  it_tickets: {
    path: '/it-tickets',
    label: 'IT Tickets',
    icon: FileText,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'employee'],
    description: 'IT ticket management and task tracking'
  },

  it_assets: {
    path: '/it-assets',
    label: 'IT Assets',
    icon: Building,
    roles: ['admin', 'manager', 'driver_management'],
    description: 'IT asset management and tracking'
  },

  // Driver Management features
  driver_records: {
    path: '/drivers',
    label: 'Driver Records',
    icon: Car,
    roles: ['admin', 'driver_management'],
    description: 'Driver information and records'
  },

  fleet_records: {
    path: '/driver-operations',
    label: 'Fleet Records',
    icon: Car,
    roles: ['admin', 'driver_management'],
    description: 'Fleet operations and management'
  },

  fleet_management: {
    path: '/fleet',
    label: 'Fleet Management',
    icon: Database,
    roles: ['admin', 'driver_management'],
    description: 'Fleet and vehicle management'
  },

  // Employee Management features
  employees: {
    path: '/employees',
    label: 'Employees',
    icon: Users,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager'],
    description: 'Employee management and records'
  },

  employee_profile: {
    path: '/employee-profile',
    label: 'Employee Profile',
    icon: UserCheck,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager'],
    description: 'Employee profile management'
  },

  employee_form: {
    path: '/employee-form',
    label: 'Employee Form',
    icon: FileText,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager'],
    description: 'Add or edit employee information'
  },

  // Sim Card Management
  sim_cards: {
    path: '/simcards',
    label: 'Sim Cards',
    icon: Database,
    roles: ['admin', 'driver_management'],
    description: 'Sim card management and tracking'
  },

  // Analytics and Reporting
  analytics: {
    path: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
    roles: ['admin', 'manager', 'driver_management'],
    description: 'Data analytics and insights'
  },

  // Asset Management
  assets: {
    path: '/assets',
    label: 'Assets',
    icon: Building,
    roles: ['admin', 'manager', 'driver_management'],
    description: 'Asset management and tracking'
  },

  // Expense and Payment Management
  expense_tracker: {
    path: '/expenses',
    label: 'Expense Tracker',
    icon: BarChart3,
    roles: ['admin', 'manager', 'driver_management'],
    description: 'Track and manage expenses'
  },

  payment_calendar: {
    path: '/payment-calendar',
    label: 'Payment Calendar',
    icon: Calendar,
    roles: ['admin', 'manager', 'driver_management'],
    description: 'Payment scheduling and tracking'
  },

  upcoming_payments: {
    path: '/upcoming-payments',
    label: 'Upcoming Payments',
    icon: Calendar,
    roles: ['admin', 'manager', 'driver_management'],
    description: 'View upcoming payment events'
  },

  // Voucher Management
  vouchers: {
    path: '/vouchers',
    label: 'Vouchers',
    icon: FileText,
    roles: ['admin', 'manager'],
    description: 'Voucher management system'
  },

  // HR Management features
  attendance: {
    path: '/attendance',
    label: 'Attendance',
    icon: Calendar,
    roles: ['admin', 'manager', 'hr_manager', 'cs_manager', 'employee'],
    description: 'Attendance tracking and management'
  },

  attendance_upload: {
    path: '/attendance-upload',
    label: 'Attendance Upload',
    icon: Calendar,
    roles: ['admin', 'manager', 'hr_manager'],
    description: 'Upload attendance data'
  },

  complaints: {
    path: '/complaints',
    label: 'Complaints',
    icon: AlertTriangle,
    roles: ['admin', 'manager', 'hr_manager', 'cs_manager', 'employee'],
    description: 'Employee complaints and grievances management'
  },

  complaints_inbox: {
    path: '/complaints-inbox',
    label: 'Complaints Inbox',
    icon: Inbox,
    roles: ['admin', 'hr_manager'],
    description: 'HR complaints inbox - manage and respond to all complaints'
  },

  complaints_test: {
    path: '/complaints-test',
    label: 'Complaints Test',
    icon: AlertTriangle,
    roles: ['admin', 'hr_manager'],
    description: 'Test and debug complaints system'
  },

  role_debug: {
    path: '/role-debug',
    label: 'Role Debug',
    icon: Shield,
    roles: ['admin', 'hr_manager', 'cs_manager'],
    description: 'Debug role and permission issues'
  },

  request_inbox: {
    path: '/request-inbox',
    label: 'Request Inbox',
    icon: Inbox,
    roles: ['admin', 'it_manager', 'it_support', 'tech_support'],
    description: 'IT service request inbox for tech support'
  },

  surveys: {
    path: '/surveys',
    label: 'Surveys',
    icon: FileText,
    roles: ['admin', 'manager', 'hr_manager', 'employee'],
    description: 'Employee surveys and feedback collection'
  },

  payroll: {
    path: '/payroll',
    label: 'Payroll',
    icon: BarChart3,
    roles: ['admin', 'hr_manager'],
    description: 'Payroll management and processing'
  },

  epr: {
    path: '/epr',
    label: 'EPR',
    icon: UserCheck,
    roles: ['admin', 'hr_manager', 'employee'],
    description: 'Employee Performance Review system'
  },

  // Task Management System
  task_management: {
    path: '/task-management',
    label: 'Task Management',
    icon: ClipboardList,
    roles: ['admin', 'manager', 'driver_management', 'cs_manager'],
    description: 'Create and assign tasks to team members'
  },

  assigned_tasks: {
    path: '/tasks',
    label: 'My Tasks',
    icon: CheckSquare,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee'],
    description: 'View and manage assigned tasks'
  },

  // Basic features for all roles
  profile: {
    path: '/profile',
    label: 'User Profile',
    icon: UserCheck,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee', 'viewer'],
    description: 'User profile and settings'
  },

  reports: {
    path: '/reports',
    label: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager'],
    description: 'Analytics and reporting'
  },

  // Invitation Management
  invitation_manager: {
    path: '/invitation-manager',
    label: 'Invitation Manager',
    icon: Users,
    roles: ['admin'],
    description: 'Manage user invitations'
  },

  // Test and Debug (Admin only)
  test_invitations: {
    path: '/test-invitations',
    label: 'Test Invitations',
    icon: FileText,
    roles: ['admin'],
    description: 'Test invitation system functionality'
  },

  // Additional UDrive specific features
  breakdowns: {
    path: '/breakdowns',
    label: 'Breakdowns',
    icon: AlertTriangle,
    roles: ['admin', 'driver_management'],
    description: 'Vehicle breakdown tracking and management'
  },

  calendar_view: {
    path: '/calendar-view',
    label: 'Calendar View',
    icon: Calendar,
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee'],
    description: 'Calendar view of events and schedules'
  }
};

// Group navigation items by category
const NAVIGATION_GROUPS = {
  main: {
    title: 'Main',
    items: ['home', 'employees', 'calendar_view'],
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee', 'viewer']
  },
  admin: {
    title: 'Administration',
    items: ['admin_dashboard', 'user_management'],
    roles: ['admin']
  },
  user_profile: {
    title: 'User Profile',
    items: ['profile'],
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee', 'viewer']
  },
  hr_management: {
    title: 'Customer Service',
    items: ['cspa', 'cs_tickets'],
    roles: ['admin', 'hr_manager', 'cs_manager']
  },

  it_services: {
    title: 'IT Services',
    items: ['it_requests', 'request_inbox'],
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee']
  },
  driver_management: {
    title: 'Driver Management',
    items: ['driver_records', 'fleet_records', 'fleet_management', 'breakdowns'],
    roles: ['admin', 'manager', 'driver_management']
  },
  asset_management: {
    title: 'Asset Management',
    items: ['assets', 'sim_cards'],
    roles: ['admin', 'manager', 'driver_management']
  },
  financial: {
    title: 'Financial',
    items: ['expense_tracker', 'payment_calendar', 'upcoming_payments', 'vouchers', 'analytics'],
    roles: ['admin', 'manager', 'driver_management']
  },
  hr_panel: {
    title: 'HR Panel',
    items: ['attendance', 'complaints', 'complaints_inbox', 'complaints_test', 'role_debug'],
    roles: ['admin', 'manager', 'hr_manager', 'cs_manager', 'employee']
  },
  todo_list: {
    title: 'To Do List',
    items: ['task_management', 'my_tasks', 'reports'],
    roles: ['admin', 'manager', 'driver_management', 'hr_manager', 'cs_manager', 'employee']
  }
};

export const RoleBasedNavigation = () => {
  const { userRole, roleInfo } = useRoleAccess();
  const { isCollapsed } = useSidebar();
  const navigate = useNavigate();

  // Add safety check - show loading state if role is not loaded yet
  if (!userRole) {
    return (
      <div className="space-y-6">
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-sm text-gray-500">Loading navigation...</p>
        </div>
      </div>
    );
  }

  // Filter navigation groups based on user role
  const visibleGroups = Object.entries(NAVIGATION_GROUPS).filter(([key, group]) => {
    if (!group.roles) return true; // Show groups without role restrictions
    return group.roles.includes(userRole);
  });

  return (
    <nav className="space-y-6">
      {visibleGroups.map(([groupKey, group]) => {
        // Filter items in this group based on user role
        const visibleItems = group.items.filter(itemKey => {
          const item = NAVIGATION_ITEMS[itemKey];
          return item && item.roles.includes(userRole);
        });

        if (visibleItems.length === 0) return null;

        return (
          <div key={groupKey} className="space-y-2">
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-3">
                {group.title}
              </h3>
            )}
            
            <div className="space-y-1">
              {visibleItems.map(itemKey => {
                const item = NAVIGATION_ITEMS[itemKey];
                if (!item) return null;

                const Icon = item.icon;
                
                // Special handling for User Management to fix navigation issue
                if (itemKey === 'user_management') {
                  return (
                    <button
                      key={itemKey}
                      onClick={() => {
                        console.log('Navigating to User Management:', item.path);
                        navigate(item.path, { replace: false });
                      }}
                      className={`
                        w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                        text-gray-700 hover:bg-gray-50 hover:text-gray-900
                        ${isCollapsed ? 'justify-center' : ''}
                      `}
                      title={item.description}
                    >
                      <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                  );
                }

                return (
                  <NavLink
                    key={itemKey}
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                      ${isActive 
                        ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-700' 
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                      }
                      ${isCollapsed ? 'justify-center' : ''}
                    `}
                    title={item.description}
                  >
                    <Icon className={`${isCollapsed ? 'w-5 h-5' : 'w-5 h-5 mr-3'} flex-shrink-0`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </NavLink>
                );
              })}
            </div>
          </div>
        );
      })}
    </nav>
  );
};

// Quick access component for role-based actions
export const RoleBasedActions = () => {
  const { userRole, roleInfo } = useRoleAccess();

  if (!userRole) return null;

  const getQuickActions = () => {
    switch (userRole) {
      case 'admin':
        return [
          { label: 'Home', path: '/', icon: Home },
          { label: 'Add User', path: '/user-management', icon: Users },
          { label: 'Manage Employees', path: '/employees', icon: Users },
          { label: 'Manage Assets', path: '/assets', icon: Building },
          { label: 'View Analytics', path: '/analytics', icon: BarChart3 },
          { label: 'Task Management', path: '/task-management', icon: ClipboardList },
          { label: 'HR Management', path: '/attendance', icon: Calendar }
        ];
      
      case 'hr_manager':
        return [
          { label: 'Home', path: '/', icon: Home },
          { label: 'New CS Ticket', path: '/tickets', icon: FileText },
          { label: 'CSPA Dashboard', path: '/cspa', icon: Headphones },
          { label: 'Manage Vouchers', path: '/vouchers', icon: FileText },
          { label: 'Task Management', path: '/task-management', icon: ClipboardList }
        ];
      
      case 'cs_manager':
        return [
          { label: 'Home', path: '/', icon: Home },
          { label: 'Employees', path: '/employees', icon: Users },
          { label: 'CSPA Dashboard', path: '/cspa', icon: Headphones },
          { label: 'CS Tickets', path: '/tickets', icon: FileText },
          { label: 'IT Requests', path: '/it-requests', icon: FileText },
          { label: 'Attendance', path: '/attendance', icon: Calendar },
          { label: 'Complaints', path: '/complaints', icon: AlertTriangle },
          { label: 'Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Task Management', path: '/task-management', icon: ClipboardList },
          { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
          { label: 'Reports', path: '/reports', icon: BarChart3 },
          { label: 'Calendar View', path: '/calendar-view', icon: Calendar },
          { label: 'User Profile', path: '/profile', icon: UserCheck }
        ];
      
      case 'manager':
        return [
          { label: 'Home', path: '/', icon: Home },
          { label: 'Manage Employees', path: '/employees', icon: Users },
          { label: 'Manage Assets', path: '/assets', icon: Building },
          { label: 'View Analytics', path: '/analytics', icon: BarChart3 },
          { label: 'Task Management', path: '/task-management', icon: ClipboardList },
          { label: 'Fleet Overview', path: '/fleet', icon: Database }
        ];
      
      case 'driver_management':
        return [
          { label: 'Home', path: '/', icon: Home },
          { label: 'Add Driver', path: '/drivers', icon: Car },
          { label: 'Fleet Overview', path: '/fleet', icon: Database },
          { label: 'Fleet Records', path: '/driver-operations', icon: Car },
          { label: 'Manage Assets', path: '/assets', icon: Building },
          { label: 'Sim Cards', path: '/simcards', icon: Database },
          { label: 'Task Management', path: '/task-management', icon: ClipboardList }
        ];
      
      case 'employee':
        return [
          { label: 'Home', path: '/', icon: Home },
          { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
          { label: 'Attendance', path: '/attendance', icon: Calendar },
          { label: 'Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'User Profile', path: '/profile', icon: UserCheck },
          { label: 'Calendar View', path: '/calendar-view', icon: Calendar }
        ];
      
      case 'hr_manager':
        return [
          { label: 'Attendance', path: '/attendance', icon: Calendar },
          { label: 'Complaints', path: '/complaints', icon: AlertTriangle },
          { label: 'Suggestions', path: '/suggestions', icon: Lightbulb },
          { label: 'Surveys', path: '/surveys', icon: FileText },
          { label: 'Payroll', path: '/payroll', icon: BarChart3 },
          { label: 'EPR', path: '/epr', icon: UserCheck }
        ];
      
      case 'viewer':
        return [
          { label: 'Home', path: '/', icon: Home },
          { label: 'Dashboard', path: '/dashboard', icon: Home },
          { label: 'View Drivers', path: '/drivers', icon: Car },
          { label: 'View Employees', path: '/employees', icon: Users },
          { label: 'User Profile', path: '/profile', icon: UserCheck }
        ];
      
      default:
        return [];
    }
  };

  const quickActions = getQuickActions();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Quick Actions for {roleInfo?.name || userRole}
      </h3>
      
      <div className="grid grid-cols-1 gap-2">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <NavLink
              key={index}
              to={action.path}
              className="flex items-center px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md transition-colors"
            >
              <Icon className="w-4 h-4 mr-2" />
              {action.label}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

// Role indicator component
export const RoleIndicator = () => {
  const { userRole, roleInfo } = useRoleAccess();
  const { isCollapsed } = useSidebar();

  // Add safety check - don't render if role is not loaded yet
  if (!userRole || !roleInfo) {
    return (
      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 ${isCollapsed ? 'justify-center' : ''}`}>
        {!isCollapsed && <span>Loading...</span>}
      </div>
    );
  }

  const Icon = roleInfo.icon;

  return (
    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${roleInfo.bgColor} ${roleInfo.color} ${isCollapsed ? 'justify-center' : ''}`}>
      <Icon className={`w-3 h-3 ${isCollapsed ? '' : 'mr-1'}`} />
      {!isCollapsed && roleInfo.name}
    </div>
  );
};
