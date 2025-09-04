import React from 'react';
import { useRoleAccess, ROLE_PERMISSIONS } from './RoleBasedRoute';
import { 
  Users, Shield, Headphones, Car, BarChart3, 
  FileText, Calendar, UserCheck, Database, 
  TrendingUp, Activity, Settings, Building,
  Eye, Home, ClipboardList
} from 'lucide-react';

// Dashboard cards for different roles
const DASHBOARD_CARDS = {
  admin: [
    {
      title: 'Total Users',
      value: '24',
      icon: Users,
      color: 'bg-blue-500',
      description: 'Active system users'
    },
    {
      title: 'System Status',
      value: 'Healthy',
      icon: Shield,
      color: 'bg-green-500',
      description: 'All systems operational'
    },
    {
      title: 'Active Sessions',
      value: '8',
      icon: Activity,
      color: 'bg-purple-500',
      description: 'Current user sessions'
    },
    {
      title: 'System Load',
      value: '23%',
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: 'Current system load'
    }
  ],
  
  hr_manager: [
    {
      title: 'Open Tickets',
      value: '12',
      icon: FileText,
      color: 'bg-red-500',
      description: 'Pending customer support'
    },
    {
      title: 'CSPA Score',
      value: '94%',
      icon: Headphones,
      color: 'bg-green-500',
      description: 'Customer satisfaction'
    },
    {
      title: 'Response Time',
      value: '2.3h',
      icon: Activity,
      color: 'bg-blue-500',
      description: 'Average response time'
    },
    {
      title: 'Resolved Today',
      value: '8',
      icon: UserCheck,
      color: 'bg-purple-500',
      description: 'Issues resolved today'
    }
  ],
  
  manager: [
    {
      title: 'Active Employees',
      value: '156',
      icon: Users,
      color: 'bg-blue-500',
      description: 'Total active employees'
    },
    {
      title: 'Asset Count',
      value: '89',
      icon: Building,
      color: 'bg-green-500',
      description: 'Total managed assets'
    },
    {
      title: 'Operations',
      value: '23',
      icon: Activity,
      color: 'bg-purple-500',
      description: 'Active operations'
    },
    {
      title: 'Performance',
      value: '94%',
      icon: TrendingUp,
      color: 'bg-orange-500',
      description: 'System performance'
    }
  ],
  
  driver_management: [
    {
      title: 'Active Drivers',
      value: '45',
      icon: Users,
      color: 'bg-green-500',
      description: 'Currently on duty'
    },
    {
      title: 'Fleet Status',
      value: '89%',
      icon: Car,
      color: 'bg-blue-500',
      description: 'Vehicles operational'
    },
    {
      title: 'Operations',
      value: '23',
      icon: Activity,
      color: 'bg-purple-500',
      description: 'Active operations'
    },
    {
      title: 'Maintenance',
      value: '3',
      icon: Settings,
      color: 'bg-orange-500',
      description: 'Vehicles in maintenance'
    }
  ],
  
  employee: [
    {
      title: 'Assigned Tasks',
      value: '5',
      icon: FileText,
      color: 'bg-blue-500',
      description: 'Your current tasks'
    },
    {
      title: 'Attendance',
      value: 'Present',
      icon: Calendar,
      color: 'bg-green-500',
      description: 'Today\'s status'
    },
    {
      title: 'Performance',
      value: '92%',
      icon: TrendingUp,
      color: 'bg-purple-500',
      description: 'This month\'s score'
    },
    {
      title: 'Notifications',
      value: '3',
      icon: Activity,
      color: 'bg-orange-500',
      description: 'Unread notifications'
    }
  ],
  
  viewer: [
    {
      title: 'Dashboard Access',
      value: 'Read Only',
      icon: Eye,
      color: 'bg-blue-500',
      description: 'View-only access'
    },
    {
      title: 'Driver Count',
      value: '45',
      icon: Users,
      color: 'bg-green-500',
      description: 'Total drivers'
    },
    {
      title: 'Employee Count',
      value: '156',
      icon: Users,
      color: 'bg-purple-500',
      description: 'Total employees'
    },
    {
      title: 'System Status',
      value: 'Active',
      icon: Activity,
      color: 'bg-orange-500',
      description: 'System operational'
    }
  ]
};

// Quick actions for different roles
const QUICK_ACTIONS = {
  admin: [
    { label: 'Add New User', action: '/user-management', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { label: 'System Settings', action: '/settings', icon: Settings, color: 'bg-gray-100 text-gray-700' },
    { label: 'View Reports', action: '/reports', icon: BarChart3, color: 'bg-green-100 text-green-700' },
    { label: 'User Management', action: '/user-management', icon: Shield, color: 'bg-purple-100 text-purple-700' }
  ],
  
  hr_manager: [
    { label: 'New Ticket', action: '/tickets', icon: FileText, color: 'bg-red-100 text-red-700' },
    { label: 'CSPA Dashboard', action: '/cspa', icon: Headphones, color: 'bg-blue-100 text-blue-700' },
    { label: 'Customer Support', action: '/customer-support', icon: UserCheck, color: 'bg-green-100 text-green-700' },
    { label: 'View Reports', action: '/reports', icon: BarChart3, color: 'bg-purple-100 text-purple-700' }
  ],
  
  manager: [
    { label: 'Manage Employees', action: '/employees', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { label: 'Manage Assets', action: '/assets', icon: Building, color: 'bg-green-100 text-green-700' },
    { label: 'View Analytics', action: '/analytics', icon: BarChart3, color: 'bg-purple-100 text-purple-700' },
    { label: 'Task Management', action: '/task-management', icon: ClipboardList, color: 'bg-orange-100 text-orange-700' }
  ],
  
  driver_management: [
    { label: 'Add Driver', action: '/drivers', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { label: 'Fleet Overview', action: '/fleet', icon: Car, color: 'bg-green-100 text-green-700' },
    { label: 'Operations', action: '/driver-operations', icon: Activity, color: 'bg-purple-100 text-purple-700' },
    { label: 'Maintenance', action: '/maintenance', icon: Settings, color: 'bg-orange-100 text-orange-700' }
  ],
  
  employee: [
    { label: 'View Tasks', action: '/tasks', icon: FileText, color: 'bg-blue-100 text-blue-700' },
    { label: 'Attendance', action: '/attendance', icon: Calendar, color: 'bg-green-100 text-green-700' },
    { label: 'Profile', action: '/profile', icon: UserCheck, color: 'bg-purple-100 text-purple-700' },
    { label: 'Reports', action: '/reports', icon: BarChart3, color: 'bg-orange-100 text-orange-700' }
  ],
  
  viewer: [
    { label: 'Dashboard', action: '/dashboard', icon: Home, color: 'bg-blue-100 text-blue-700' },
    { label: 'View Drivers', action: '/drivers', icon: Car, color: 'bg-green-100 text-green-700' },
    { label: 'View Employees', action: '/employees', icon: Users, color: 'bg-purple-100 text-purple-700' },
    { label: 'User Profile', action: '/profile', icon: UserCheck, color: 'bg-orange-100 text-orange-700' }
  ]
};

export const RoleBasedDashboard = () => {
  const { userRole, roleInfo } = useRoleAccess();

  if (!userRole || !roleInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const dashboardCards = DASHBOARD_CARDS[userRole] || DASHBOARD_CARDS.employee;
  const quickActions = QUICK_ACTIONS[userRole] || QUICK_ACTIONS.employee;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Welcome back, {roleInfo.name}!
            </h1>
            <p className="text-gray-600 mt-2">
              {roleInfo.description}
            </p>
          </div>
          
          <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${roleInfo.bgColor} ${roleInfo.color}`}>
            <roleInfo.icon className="w-4 h-4 mr-2" />
            {roleInfo.name}
          </div>
        </div>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {dashboardCards.map((card, index) => {
          const Icon = card.icon;
          
          return (
            <div
              key={index}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{card.value}</p>
                  <p className="text-xs text-gray-500 mt-1">{card.description}</p>
                </div>
                <div className={`p-3 rounded-lg ${card.color} bg-opacity-10`}>
                  <Icon className={`w-6 h-6 ${card.color.replace('bg-', 'text-')}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            
            return (
              <button
                key={index}
                onClick={() => window.location.href = action.action}
                className={`flex items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors ${action.color} hover:opacity-80`}
              >
                <Icon className="w-5 h-5 mr-3" />
                <span className="font-medium">{action.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Role-Specific Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm text-gray-600">User login successful</span>
              <span className="text-xs text-gray-400 ml-auto">2 min ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Dashboard accessed</span>
              <span className="text-xs text-gray-400 ml-auto">5 min ago</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-sm text-gray-600">Profile updated</span>
              <span className="text-xs text-gray-400 ml-auto">1 hour ago</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">System Status</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Database</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Authentication</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">File Storage</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleBasedDashboard;
