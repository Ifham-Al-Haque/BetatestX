import {
  Home,
  BarChart3,
  Users,
  Shield,
  Car,
  Building,
  Cog,
  Calendar,
  FileText,
  Headphones,
  AlertTriangle,
  CheckSquare,
  Inbox,
  Lightbulb,
  Heart,
  Camera,
  MessageCircle,
  Sparkles,
  UserCheck,
  Database,
  LayoutGrid,
  ClipboardList,
  Bell,
  Folder,
  Cpu,
  Archive,
  Calculator
} from 'lucide-react';
import { canSeePanel, hasFeatureAccess } from '../components/RoleBasedRoute';

export const widgetConfig = [
  {
    key: 'main',
    title: 'Home Panel',
    icon: Home,
    color: 'from-blue-500 to-indigo-600',
    items: [
      { label: 'Home', path: '/', icon: Home, feature: 'home', description: 'Main dashboard' },
      { label: 'Dashboard', path: '/dashboard', icon: BarChart3, feature: 'dashboard', description: 'View analytics' },
      { label: 'Calendar View', path: '/calendar-view', icon: Calendar, feature: 'calendar_view', description: 'Schedule view' },
      { label: 'Organizational Hierarchy', path: '/organizational-hierarchy', icon: Users, feature: 'organizational_hierarchy', description: 'Team structure' }
    ]
  },
  {
    key: 'user_profile',
    title: 'User Profile',
    icon: UserCheck,
    color: 'from-emerald-500 to-teal-600',
    items: [
      { label: 'User Profile', path: '/profile', icon: UserCheck, feature: 'user_profile', description: 'Manage account' }
    ]
  },
  {
    key: 'todo_list',
    title: 'To Do List',
    icon: ClipboardList,
    color: 'from-purple-500 to-pink-600',
    items: [
      { label: 'Task Management', path: '/task-management', icon: ClipboardList, feature: 'task_management', description: 'Manage tasks' },
      { label: 'My Tasks', path: '/tasks', icon: CheckSquare, feature: 'my_tasks', description: 'Track progress' },
      { label: 'Reports', path: '/reports', icon: BarChart3, feature: 'reports', description: 'View reports' }
    ]
  },
  {
    key: 'admin',
    title: 'Administration',
    icon: Shield,
    color: 'from-red-500 to-pink-600',
    items: [
      { label: 'Admin Dashboard', path: '/admin/dashboard', icon: Shield, feature: 'admin_dashboard', description: 'System control' },
      { label: 'User Management', path: '/user-management', icon: Users, feature: 'user_management', description: 'Manage users' }
    ]
  },
  {
    key: 'hr_panel',
    title: 'HR Panel',
    icon: UserCheck,
    color: 'from-indigo-500 to-purple-600',
    items: [
      { label: 'Employees', path: '/employees', icon: Users, feature: 'employees', description: 'Manage employees' },
      { label: 'Payroll', path: '/payroll', icon: Calculator, feature: 'payroll', description: 'Calculate & manage payroll' },
      { label: 'Employee Onboarding', path: '/employee-onboarding', icon: UserCheck, feature: 'employee_onboarding', description: 'Onboard staff' },
      { label: 'Employee Offboarding', path: '/employee-offboarding', icon: UserCheck, feature: 'employee_offboarding', description: 'Offboard staff' },
      { label: 'Employee History', path: '/employee-history', icon: Archive, feature: 'employees', description: 'View archived employees' },
      { label: 'Attendance', path: '/attendance', icon: Calendar, feature: 'attendance', description: 'Track attendance' },
      { label: 'Leave', path: '/leave', icon: ClipboardList, feature: 'leave', description: 'Approve leave requests' },
      { label: 'Complaints', path: '/complaints', icon: AlertTriangle, feature: 'complaints', description: 'Issue tracking' },
      { label: 'Complaints Inbox', path: '/complaints-inbox', icon: Inbox, feature: 'complaints_inbox', description: 'HR complaints triage' },
      { label: 'Suggestions', path: '/suggestions', icon: Lightbulb, feature: 'suggestions', description: 'Submit & vote on ideas' },
      { label: 'Suggestions Inbox', path: '/suggestions-inbox', icon: Inbox, feature: 'suggestions_inbox', description: 'HR suggestions triage' }
    ]
  },
  {
    key: 'it_services',
    title: 'IT Services',
    icon: Cog,
    color: 'from-teal-500 to-cyan-600',
    items: [
      { label: 'Overview', path: '/it-services', icon: LayoutGrid, feature: 'it_requests', description: 'IT Services hub' },
      { label: 'IT Requests', path: '/it-requests', icon: FileText, feature: 'it_requests', description: 'Tech support' },
      { label: 'Request Inbox', path: '/request-inbox', icon: Inbox, feature: 'request_inbox', description: 'View requests' },
      { label: 'IT Tools & Analytics', path: '/it-tools', icon: BarChart3, feature: 'it_tools', description: 'Analytics & reports' }
    ]
  },
  {
    key: 'customer_service',
    title: 'Customer Service',
    icon: Headphones,
    color: 'from-orange-500 to-amber-600',
    items: [
      { label: 'CSPA', path: '/cspa', icon: Headphones, feature: 'cspa', description: 'Customer support' },
      { label: 'CS Tickets', path: '/tickets', icon: FileText, feature: 'cs_tickets', description: 'Manage tickets' }
    ]
  },
  {
    key: 'operation',
    title: 'Operation',
    icon: Cog,
    color: 'from-slate-600 to-blue-600',
    items: [
      { label: 'Fleet Record', path: '/operation/fleet-records', icon: Car, feature: 'fleet_records', description: 'Vehicle profiles' },
      { label: 'Fleet Offboarding', path: '/operation/fleet-lifecycle', icon: CheckSquare, feature: 'fleet_lifecycle', description: 'Retire fleet vehicles' },
      { label: 'UDrive Fleetio', path: '/operation/fleetio', icon: Database, feature: 'udrive_fleetio', description: 'Maintenance-focused fleet ops' },
      { label: 'Driver & Team Records', path: '/operation/drivers', icon: Car, feature: 'driver_records', description: 'Drivers and teams' },
      { label: 'Schedule & Roster', path: '/operation/roster', icon: Calendar, feature: 'operation_roster', description: 'Team schedules' },
      { label: 'Breakdowns', path: '/operation/breakdowns', icon: AlertTriangle, feature: 'breakdowns', description: 'Track breakdowns' }
    ]
  },
  {
    key: 'asset_management',
    title: 'Asset Management',
    icon: Building,
    color: 'from-amber-500 to-yellow-600',
    items: [
      { label: 'Assets', path: '/assets', icon: Building, feature: 'assets', description: 'Manage assets' },
      { label: 'Sim Cards', path: '/simcards', icon: Database, feature: 'simcards', description: 'SIM management' }
    ]
  },
  {
    key: 'financial',
    title: 'Financial',
    icon: BarChart3,
    color: 'from-violet-500 to-purple-600',
    items: [
      { label: 'Expense Tracker', path: '/expenses', icon: BarChart3, feature: 'expense_tracker', description: 'Track expenses' },
      { label: 'Payment Calendar', path: '/payment-calendar', icon: Calendar, feature: 'payment_calendar', description: 'Payment schedule' },
      { label: 'Upcoming Payments', path: '/upcoming-payments', icon: Calendar, feature: 'upcoming_payments', description: 'Due payments' },
      { label: 'Vouchers', path: '/vouchers', icon: FileText, feature: 'vouchers', description: 'Manage vouchers' },
      { label: 'Analytics', path: '/analytics', icon: BarChart3, feature: 'analytics', description: 'Financial analytics' }
    ]
  },
  {
    key: 'slice_of_life',
    title: 'Slice of Life',
    icon: Heart,
    color: 'from-rose-500 to-pink-600',
    items: [
      { label: 'Events', path: '/events', icon: Calendar, feature: 'events', description: 'View events' },
      { label: 'Memories', path: '/memories', icon: Heart, feature: 'memories', description: 'View memories' },
      { label: 'Collections', path: '/collections', icon: Folder, feature: 'collections', description: 'View collections' },
      { label: 'Picture Upload', path: '/event-picture-upload', icon: Camera, feature: 'events', description: 'Upload photos' }
    ]
  },
  {
    key: 'communication',
    title: 'Communication',
    icon: MessageCircle,
    color: 'from-cyan-500 to-blue-600',
    items: [
      { label: 'Team Chat', path: '/chat', icon: MessageCircle, feature: 'communication', description: 'Chat with team' }
    ]
  },
  {
    key: 'subscribe_panel',
    title: 'Subscribe Now',
    icon: Bell,
    color: 'from-fuchsia-500 to-purple-600',
    items: [
      { label: 'Subscribe Now', path: '/subscribe-now', icon: Bell, feature: 'subscribe_now', description: 'Subscription' },
      { label: 'LTR Reporting', path: '/subscribe-now#ltr-reporting', icon: BarChart3, feature: 'ltr_reporting', description: 'LTR reports' }
    ]
  },
  {
    key: 'collections_panel',
    title: 'Collections',
    icon: Folder,
    color: 'from-lime-500 to-green-600',
    items: [
      { label: 'Collections', path: '/collections', icon: Folder, feature: 'collections', description: 'View collections' }
    ]
  },
  {
    key: 'marketing_panel',
    title: 'Marketing',
    icon: Sparkles,
    color: 'from-pink-500 to-rose-600',
    items: [
      { label: 'Marketing Calendar', path: '/marketing-calendar', icon: Calendar, feature: 'marketing_calendar', description: 'Marketing schedule' },
      { label: 'Marketing Dashboard', path: '/marketing-dashboard', icon: BarChart3, feature: 'marketing_dashboard', description: 'Marketing analytics' },
      { label: 'Marketing Events', path: '/marketing-events', icon: Calendar, feature: 'marketing_events', description: 'Marketing events' },
      { label: 'Marketing Analytics', path: '/marketing-analytics', icon: BarChart3, feature: 'marketing_analytics', description: 'View analytics' }
    ]
  },
  {
    key: 'iot_panel',
    title: 'IOT',
    icon: Cpu,
    color: 'from-sky-500 to-blue-600',
    items: [
      { label: 'IOT Record', path: '/iot-record', icon: Database, feature: 'iot_record', description: 'IOT data' }
    ]
  }
];

const DEFAULT_QUICK_PATHS = {
  admin: ['/dashboard', '/user-management', '/employees', '/it-requests'],
  hr_manager: ['/employees', '/payroll', '/complaints-inbox', '/suggestions-inbox', '/task-management'],
  manager: ['/dashboard', '/employees', '/task-management', '/it-requests'],
  employee: ['/tasks', '/profile', '/it-requests', '/calendar-view'],
  default: ['/profile', '/tasks', '/calendar-view', '/it-requests']
};

export const getAccessibleWidgetItems = (widget, userRole) => {
  if (!userRole) return [];
  return widget.items.filter((item) => !item.feature || hasFeatureAccess(userRole, item.feature));
};

export const getFilteredWidgets = (userRole) => {
  if (!userRole) return [];
  return widgetConfig
    .map((widget) => {
      if (!canSeePanel(userRole, widget.key)) return null;
      const items = getAccessibleWidgetItems(widget, userRole);
      if (items.length === 0) return null;
      return { widget, items };
    })
    .filter(Boolean);
};

export const getAccessibleModules = (userRole) => {
  if (!userRole) return [];
  const modules = [];

  widgetConfig.forEach((widget) => {
    if (!canSeePanel(userRole, widget.key)) return;
    getAccessibleWidgetItems(widget, userRole).forEach((item) => {
      modules.push({
        path: item.path,
        pathname: item.path.split('#')[0],
        label: item.label,
        description: item.description,
        icon: item.icon,
        color: widget.color,
        feature: item.feature
      });
    });
  });

  return modules;
};

export const getModuleByPath = (path, userRole) => {
  const pathname = path.split('#')[0];
  const modules = getAccessibleModules(userRole);
  return (
    modules.find((m) => m.path === path) ||
    modules.find((m) => m.pathname === pathname)
  );
};

export const getDefaultQuickPaths = (userRole) => {
  return DEFAULT_QUICK_PATHS[userRole] || DEFAULT_QUICK_PATHS.default;
};
