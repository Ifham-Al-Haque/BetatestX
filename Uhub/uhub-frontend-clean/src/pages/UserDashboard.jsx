import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Car, 
  Users, 
  BarChart3, 
  Calendar, 
  Shield,
  Zap,
  Building2,
  ArrowRight,
  CheckCircle,
  Star,
  Globe,
  Lock,
  Home,
  User,
  FileText,
  Settings,
  Database,
  Phone,
  MapPin,
  Eye,
  Briefcase,
  CreditCard,
  Truck,
  ClipboardList,
  MessageSquare,
  Bell,
  PieChart,
  TrendingUp,
  Activity,
  Target,
  Award,
  BookOpen,
  HelpCircle,
  LogOut,
  UserCircle,
  Clock,
  TrendingDown,
  Plus
} from 'lucide-react';
import Logo from '../components/ui/logo';

const UserDashboard = () => {
  const navigate = useNavigate();
  const { user, userProfile, signOut } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);

  // Role-based panel configurations
  const getRolePanels = (role) => {
    const panels = {
      'admin': [
        {
          icon: BarChart3,
          title: 'Dashboard',
          description: 'View comprehensive analytics and system overview',
          color: 'from-blue-500 to-indigo-600',
          bgColor: 'bg-blue-50',
          route: '/dashboard',
          category: 'Analytics'
        },
        {
          icon: Users,
          title: 'User Management',
          description: 'Manage all users, roles, and permissions',
          color: 'from-purple-500 to-pink-600',
          bgColor: 'bg-purple-50',
          route: '/user-management',
          category: 'Administration'
        },
        {
          icon: Building2,
          title: 'Employee Records',
          description: 'Access and manage employee information',
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          route: '/employees',
          category: 'HR'
        },
        {
          icon: Car,
          title: 'Fleet Management',
          description: 'Manage drivers, vehicles, and fleet operations',
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-50',
          route: '/fleet-management',
          category: 'Operations'
        },
        {
          icon: Database,
          title: 'System Settings',
          description: 'Configure system parameters and preferences',
          color: 'from-slate-500 to-gray-600',
          bgColor: 'bg-slate-50',
          route: '/settings',
          category: 'System'
        },
        {
          icon: FileText,
          title: 'Reports',
          description: 'Generate and view detailed reports',
          color: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-50',
          route: '/reports',
          category: 'Analytics'
        }
      ],
      'hr_manager': [
        {
          icon: Users,
          title: 'Employee Records',
          description: 'Manage employee information and records',
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          route: '/employees',
          category: 'HR'
        },
        // Dashboard panel temporarily hidden for HR Manager
        // {
        //   icon: BarChart3,
        //   title: 'HR Analytics',
        //   description: 'View HR metrics and performance data',
        //   color: 'from-blue-500 to-indigo-600',
        //   bgColor: 'bg-blue-50',
        //   route: '/hr-analytics',
        //   category: 'Analytics'
        // },
        {
          icon: Calendar,
          title: 'Attendance',
          description: 'Track employee attendance and time',
          color: 'from-purple-500 to-pink-600',
          bgColor: 'bg-purple-50',
          route: '/attendance',
          category: 'HR'
        },
        {
          icon: MessageSquare,
          title: 'Complaints',
          description: 'Manage employee complaints and concerns',
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-50',
          route: '/complaints-inbox',
          category: 'HR'
        },
        {
          icon: Award,
          title: 'Performance',
          description: 'Employee performance tracking and reviews',
          color: 'from-yellow-500 to-amber-600',
          bgColor: 'bg-yellow-50',
          route: '/performance',
          category: 'HR'
        },
        {
          icon: FileText,
          title: 'HR Reports',
          description: 'Generate HR-related reports',
          color: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-50',
          route: '/hr-reports',
          category: 'Reports'
        }
      ],
      'cs_manager': [
        {
          icon: Phone,
          title: 'Customer Service',
          description: 'Manage customer inquiries and support',
          color: 'from-blue-500 to-indigo-600',
          bgColor: 'bg-blue-50',
          route: '/customer-service',
          category: 'Service'
        },
        {
          icon: MessageSquare,
          title: 'Complaints',
          description: 'Handle customer complaints and feedback',
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-50',
          route: '/complaints-inbox',
          category: 'Service'
        },
        {
          icon: FileText,
          title: 'IT Requests',
          description: 'Manage IT support requests',
          color: 'from-purple-500 to-pink-600',
          bgColor: 'bg-purple-50',
          route: '/it-requests',
          category: 'Support'
        },
        {
          icon: BarChart3,
          title: 'CS Analytics',
          description: 'Customer service performance metrics',
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          route: '/cs-analytics',
          category: 'Analytics'
        },
        {
          icon: Calendar,
          title: 'Schedule',
          description: 'Manage team schedules and shifts',
          color: 'from-yellow-500 to-amber-600',
          bgColor: 'bg-yellow-50',
          route: '/schedule',
          category: 'Operations'
        },
        {
          icon: Users,
          title: 'Team Management',
          description: 'Manage customer service team',
          color: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-50',
          route: '/team-management',
          category: 'Management'
        }
      ],
      'driver_management': [
        {
          icon: Car,
          title: 'Fleet Management',
          description: 'Manage drivers, vehicles, and fleet operations',
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          route: '/fleet-management',
          category: 'Operations'
        },
        {
          icon: MapPin,
          title: 'Driver Tracking',
          description: 'Real-time driver location and route tracking',
          color: 'from-blue-500 to-indigo-600',
          bgColor: 'bg-blue-50',
          route: '/driver-tracking',
          category: 'Operations'
        },
        {
          icon: FileText,
          title: 'Driver Records',
          description: 'Access driver information and documents',
          color: 'from-purple-500 to-pink-600',
          bgColor: 'bg-purple-50',
          route: '/driver-records',
          category: 'Records'
        },
        {
          icon: BarChart3,
          title: 'Fleet Analytics',
          description: 'Fleet performance and efficiency metrics',
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-50',
          route: '/fleet-analytics',
          category: 'Analytics'
        },
        {
          icon: Calendar,
          title: 'Maintenance',
          description: 'Vehicle maintenance schedules and records',
          color: 'from-yellow-500 to-amber-600',
          bgColor: 'bg-yellow-50',
          route: '/maintenance',
          category: 'Operations'
        },
        {
          icon: CreditCard,
          title: 'Expenses',
          description: 'Track fleet-related expenses and costs',
          color: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-50',
          route: '/expenses',
          category: 'Finance'
        }
      ],
      'employee': [
        // Dashboard panel temporarily hidden for employees
        // {
        //   icon: BarChart3,
        //   title: 'Dashboard',
        //   description: 'View your personal dashboard and metrics',
        //   color: 'from-blue-500 to-indigo-600',
        //   bgColor: 'bg-blue-50',
        //   route: '/dashboard',
        //   category: 'Personal'
        // },
        {
          icon: User,
          title: 'My Profile',
          description: 'Manage your personal information',
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          route: '/profile',
          category: 'Personal'
        },
        {
          icon: Calendar,
          title: 'Attendance',
          description: 'View your attendance and time records',
          color: 'from-purple-500 to-pink-600',
          bgColor: 'bg-purple-50',
          route: '/attendance',
          category: 'Personal'
        },
        {
          icon: MessageSquare,
          title: 'My Complaints',
          description: 'Submit and track your complaints',
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-50',
          route: '/my-complaints',
          category: 'Support'
        },
        {
          icon: ClipboardList,
          title: 'My Tasks',
          description: 'View and manage assigned tasks',
          color: 'from-yellow-500 to-amber-600',
          bgColor: 'bg-yellow-50',
          route: '/my-tasks',
          category: 'Work'
        },
        {
          icon: FileText,
          title: 'Reports',
          description: 'Access your personal reports',
          color: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-50',
          route: '/my-reports',
          category: 'Reports'
        }
      ],
      'viewer': [
        // Dashboard panel temporarily hidden for viewers
        // {
        //   icon: Eye,
        //   title: 'View Dashboard',
        //   description: 'Read-only access to system overview',
        //   color: 'from-blue-500 to-indigo-600',
        //   bgColor: 'bg-blue-50',
        //   route: '/dashboard',
        //   category: 'View'
        // },
        {
          icon: FileText,
          title: 'View Reports',
          description: 'Access to read-only reports',
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          route: '/reports',
          category: 'View'
        },
        {
          icon: Users,
          title: 'View Employees',
          description: 'Read-only access to employee records',
          color: 'from-purple-500 to-pink-600',
          bgColor: 'bg-purple-50',
          route: '/employees',
          category: 'View'
        },
        {
          icon: BarChart3,
          title: 'View Analytics',
          description: 'Access to system analytics and metrics',
          color: 'from-orange-500 to-red-600',
          bgColor: 'bg-orange-50',
          route: '/analytics',
          category: 'View'
        }
      ]
    };

    return panels[role] || panels['employee'];
  };

  const handlePanelClick = (route) => {
    navigate(route);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  useEffect(() => {
    setIsVisible(true);
    
    // Mock recent activity data
    setRecentActivity([
      { id: 1, action: 'Employee record updated', time: '2 hours ago', type: 'update' },
      { id: 2, action: 'New complaint submitted', time: '4 hours ago', type: 'create' },
      { id: 3, action: 'Report generated', time: '1 day ago', type: 'report' },
      { id: 4, action: 'User login', time: '1 day ago', type: 'login' }
    ]);
  }, []);

  // Redirect if not authenticated
  if (!user) {
    navigate('/login');
    return null;
  }

  // Get panels based on user role
  const userPanels = userProfile?.role ? getRolePanels(userProfile.role) : getRolePanels('employee');

  // Group panels by category
  const groupedPanels = userPanels.reduce((acc, panel) => {
    if (!acc[panel.category]) {
      acc[panel.category] = [];
    }
    acc[panel.category].push(panel);
    return acc;
  }, {});

  // Get user stats based on role
  const getUserStats = () => {
    const baseStats = [
      { label: 'Total Logins', value: '24', icon: Clock, color: 'text-blue-500' },
      { label: 'Last Active', value: '2h ago', icon: Activity, color: 'text-green-500' }
    ];

    if (userProfile?.role === 'hr_manager') {
      return [
        ...baseStats,
        { label: 'Employees', value: '156', icon: Users, color: 'text-purple-500' },
        { label: 'Active Complaints', value: '8', icon: MessageSquare, color: 'text-orange-500' }
      ];
    } else if (userProfile?.role === 'admin') {
      return [
        ...baseStats,
        { label: 'Total Users', value: '89', icon: Users, color: 'text-purple-500' },
        { label: 'System Status', value: 'Healthy', icon: CheckCircle, color: 'text-green-500' }
      ];
    }

    return baseStats;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Logo size="md" showText={true} className="text-gray-900" />
              <div className="text-sm text-gray-500">|</div>
              <span className="text-sm text-gray-600">User Dashboard</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900">
                  {userProfile?.full_name || user.email}
                </div>
                <div className="text-xs text-gray-500 capitalize">
                  {userProfile?.role || 'employee'}
                </div>
              </div>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className={`mb-8 transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <Home className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {userProfile?.full_name?.split(' ')[0] || 'User'}!
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Access your personalized dashboard and explore the powerful features available to you based on your role.
            </p>
          </div>

          {/* User Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {getUserStats().map((stat, index) => (
              <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color}`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Role-based Panels */}
        <div className="space-y-8">
          {Object.entries(groupedPanels).map(([category, panels]) => (
            <div key={category} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">{category}</h2>
                <span className="text-sm text-gray-500">{panels.length} features</span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {panels.map((panel, index) => (
                  <div
                    key={index}
                    className={`${panel.bgColor} rounded-xl p-5 hover:transform hover:scale-105 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md border border-gray-100`}
                    onClick={() => handlePanelClick(panel.route)}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-r ${panel.color} rounded-xl flex items-center justify-center mb-4 shadow-sm`}>
                      <panel.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{panel.title}</h3>
                    <p className="text-gray-600 text-sm leading-relaxed mb-4">{panel.description}</p>
                    <div className="flex items-center justify-between">
                      <ArrowRight className="w-4 h-4 text-gray-400" />
                      <span className="text-xs text-gray-500">Click to access</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors duration-200">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-sm text-gray-700">{activity.action}</span>
                <span className="text-xs text-gray-500 ml-auto">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default UserDashboard;
