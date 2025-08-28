// src/components/Sidebar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Home,
  Users,
  Shield,
  BarChart3,
  Car,
  Headphones,
  FileText,
  Calendar,
  UserCheck,
  Building,
  Database,
  Cog,
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  Inbox,
  Lightbulb,
  Heart,
  Camera,
  ImageIcon,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { useTheme } from '../context/ThemeContext';
import { canSeePanel, hasFeatureAccess } from './RoleBasedRoute';

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const { isDark } = useTheme();
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();
  
  // Add safety check for userProfile
  const userRole = userProfile?.role || user?.role || 'loading';
  
  console.log('🔍 Sidebar component rendering:', {
    hasUser: !!user,
    hasUserProfile: !!userProfile,
    userRole: userRole,
    userEmail: user?.email,
    profileName: userProfile?.full_name,
    userProfileDetails: userProfile,
    userDetails: user,
    isDark
  });
  
  // Debug role detection
  console.log('🔍 Role detection debug:', {
    userProfileRole: userProfile?.role,
    userRole: user?.role,
    finalRole: userRole,
    userProfileExists: !!userProfile,
    userExists: !!user
  });
  
  const [expandedPanels, setExpandedPanels] = useState({
    main: true,
    admin: true,
    user_profile: true,
    hr_panel: true,
    customer_service: true,
    it_services: true,
    driver_management: true,
    asset_management: true,
    financial: true,
    todo_list: true,
    slice_of_life: true,
    communication: true
  });

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const togglePanel = (panelKey) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelKey]: !prev[panelKey]
    }));
  };

  const isActive = (path) => location.pathname === path;

  // Safety check - don't render if auth is not initialized
  if (!user && !userProfile) {
    console.log('🔍 Sidebar: Auth not initialized yet, showing loading state');
    return (
      <div className={`h-screen bg-gradient-to-b ${isDark ? 'from-slate-800 to-slate-900' : 'from-blue-50 to-white'} border-r ${isDark ? 'border-slate-700' : 'border-gray-200'} shadow-lg flex-shrink-0 w-80 transition-all duration-500`}>
        <div className="flex flex-col h-full">
          <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-700 to-slate-800' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700'}`}>
            <div className="text-white font-semibold text-lg">UHub</div>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className={`${isDark ? 'text-slate-400' : 'text-gray-500'} transition-colors duration-300`}>Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  // Navigation panels configuration with role-based filtering
  const navigationPanels = [
    {
      key: 'main',
      title: 'Home Panel',
      icon: Home,
      items: [
        { label: 'Home', path: '/', icon: Home, feature: 'home' },
        { label: 'Dashboard', path: '/dashboard', icon: BarChart3, feature: 'dashboard' },
        { label: 'Calendar View', path: '/calendar-view', icon: Calendar, feature: 'calendar_view' }
      ]
    },
    {
      key: 'slice_of_life',
      title: 'Slice of Life',
      icon: Heart,
      items: [
        { label: 'Events', path: '/events', icon: Calendar, feature: 'events' },
        { label: 'Memories', path: '/memories', icon: Heart, feature: 'memories' },
        { label: 'Picture Upload', path: '/event-picture-upload', icon: Camera, feature: 'events' }
      ]
    },
    {
      key: 'communication',
      title: 'Communication',
      icon: MessageCircle,
      items: [
        { label: 'Team Chat', path: '/chat', icon: MessageCircle, feature: 'communication' }
      ]
    },
    {
      key: 'admin',
      title: 'Administration',
      icon: Shield,
      items: [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: Shield, feature: 'admin_dashboard' },
        { label: 'User Management', path: '/user-management', icon: Users, feature: 'user_management' }
      ]
    },
    {
      key: 'user_profile',
      title: 'User Profile',
      icon: UserCheck,
      items: [
        { label: 'User Profile', path: '/profile', icon: UserCheck, feature: 'user_profile' }
      ]
    },
    {
      key: 'hr_panel',
      title: 'HR Panel',
      icon: UserCheck,
      items: [
        { label: 'Employees', path: '/employees', icon: Users, feature: 'employees' },
        { label: 'Employee Records', path: '/employee-records', icon: Users, feature: 'employees_view_only' },
        { label: 'Attendance', path: '/attendance', icon: Calendar, feature: 'attendance' },
        { label: 'Complaints', path: '/complaints', icon: AlertTriangle, feature: 'complaints' },
        { label: 'Complaints Inbox', path: '/complaints-inbox', icon: Inbox, feature: 'complaints_inbox' },
        { label: 'Suggestions', path: '/suggestions', icon: Lightbulb, feature: 'suggestions' }
      ]
    },
    {
      key: 'customer_service',
      title: 'Customer Service',
      icon: Headphones,
      items: [
        { label: 'CSPA', path: '/cspa', icon: Headphones, feature: 'cspa' },
        { label: 'CS Tickets', path: '/tickets', icon: FileText, feature: 'cs_tickets' }
      ]
    },
    {
      key: 'it_services',
      title: 'IT Services',
      icon: Cog,
      items: [
        { label: 'IT Requests', path: '/it-requests', icon: FileText, feature: 'it_requests' },
        { label: 'Request Inbox', path: '/request-inbox', icon: Inbox, feature: 'request_inbox' }
      ]
    },
    {
      key: 'driver_management',
      title: 'Operation Management',
      icon: Car,
      items: [
        { label: 'Driver Records', path: '/drivers', icon: Car, feature: 'driver_records' },
        { label: 'Fleet Records', path: '/driver-operations', icon: Car, feature: 'fleet_records' },
        { label: 'Fleet Management', path: '/fleet', icon: Database, feature: 'fleet_management' },
        { label: 'Breakdowns', path: '/breakdowns', icon: AlertTriangle, feature: 'breakdowns' }
      ]
    },
    {
      key: 'asset_management',
      title: 'Asset Management',
      icon: Building,
      items: [
        { label: 'Assets', path: '/assets', icon: Building, feature: 'assets' },
        { label: 'Sim Cards', path: '/simcards', icon: Database, feature: 'simcards' }
      ]
    },
    {
      key: 'financial',
      title: 'Financial',
      icon: BarChart3,
      items: [
        { label: 'Expense Tracker', path: '/expenses', icon: BarChart3, feature: 'expense_tracker' },
        { label: 'Payment Calendar', path: '/payment-calendar', icon: Calendar, feature: 'payment_calendar' },
        { label: 'Upcoming Payments', path: '/upcoming-payments', icon: Calendar, feature: 'upcoming_payments' },
        { label: 'Vouchers', path: '/vouchers', icon: FileText, feature: 'vouchers' },
        { label: 'Analytics', path: '/analytics', icon: BarChart3, feature: 'analytics' }
      ]
    },
    {
      key: 'todo_list',
      title: 'To Do List',
      icon: ClipboardList,
      items: [
        { label: 'Task Management', path: '/task-management', icon: ClipboardList, feature: 'task_management' },
        { label: 'My Tasks', path: '/tasks', icon: CheckSquare, feature: 'my_tasks' },
        { label: 'Reports', path: '/reports', icon: BarChart3, feature: 'reports' }
      ]
    }
  ];

  // Filter panels based on user role
  const filteredPanels = navigationPanels.filter(panel => {
    if (!userRole) return false;
    return canSeePanel(userRole, panel.key);
  });

  // Filter items within each panel based on user role
  const getFilteredItems = (panel) => {
    if (!userRole) return [];
    return panel.items.filter(item => {
      if (!item.feature) return true; // If no feature specified, show by default
      return hasFeatureAccess(userRole, item.feature);
    });
  };

  const panelVariants = {
    hidden: { opacity: 0, height: 0 },
    visible: { 
      opacity: 1, 
      height: 'auto',
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      transition: {
        duration: 0.2,
        ease: "easeInOut"
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.2,
        ease: "easeOut"
      }
    },
    exit: { 
      opacity: 0, 
      x: -10,
      transition: {
        duration: 0.1,
        ease: "easeIn"
      }
    }
  };

  try {
    return (
      <motion.div
        initial={{ width: isCollapsed ? 80 : 280 }}
        animate={{ width: isCollapsed ? 80 : 280 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className={`h-full bg-gradient-to-b ${isDark ? 'from-slate-800 to-slate-900' : 'from-blue-50 to-white'} border-r ${isDark ? 'border-slate-700' : 'border-gray-200'} shadow-lg transition-all duration-500`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-700 to-slate-800' : 'border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700'} transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <motion.button
                onClick={toggleSidebar}
                className="p-2 rounded-lg text-white hover:bg-blue-500 transition-colors duration-200"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </motion.button>
              
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                  className="text-white font-semibold text-lg"
                >
                  UHub
                </motion.div>
              )}
            </div>
          </div>

          {/* User Profile Section */}
          <div className={`p-4 border-b ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-700 to-slate-600' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50'} transition-all duration-300`}>
            <AnimatePresence mode="wait">
              {!isCollapsed ? (
                <motion.div
                  key="expanded-profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-3"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
                      {userProfile?.full_name || 'User'}
                    </p>
                    <p className={`text-xs truncate transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                      {userProfile?.role || 'No Role'}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="collapsed-profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center space-y-2 w-full"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Panels */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="space-y-2">
              {filteredPanels.map((panel) => {
                const Icon = panel.icon;
                const isExpanded = expandedPanels[panel.key];
                const filteredItems = getFilteredItems(panel);
                
                // Don't show panel if it has no visible items
                if (filteredItems.length === 0) {
                  return null;
                }
                
                return (
                  <div key={panel.key} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    {/* Panel Header */}
                    <button
                      onClick={() => togglePanel(panel.key)}
                      className="w-full p-3 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <Icon className={`w-5 h-5 transition-colors duration-300 ${isDark ? 'text-slate-300' : 'text-gray-600'}`} />
                        {!isCollapsed && (
                          <span className={`text-sm font-medium transition-colors duration-300 ${isDark ? 'text-slate-200' : 'text-gray-700'}`}>{panel.title}</span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className={`w-4 h-4 transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'}`} />
                        </motion.div>
                      )}
                    </button>

                    {/* Panel Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          variants={panelVariants}
                          initial="hidden"
                          animate="visible"
                          exit="exit"
                          className="overflow-hidden"
                        >
                          <div className="p-2 space-y-1">
                            {filteredItems.map((item, index) => {
                              const ItemIcon = item.icon;
                              const active = isActive(item.path);
                              
                              return (
                                <motion.div
                                  key={index}
                                  variants={itemVariants}
                                  initial="hidden"
                                  animate="visible"
                                  transition={{ delay: index * 0.05 }}
                                >
                                  <Link
                                    to={item.path}
                                    className={`flex items-center px-3 py-2 rounded-lg text-sm transition-all duration-300 ${
                                      active 
                                        ? isDark 
                                          ? 'bg-blue-900/30 text-blue-300 border border-blue-700/50' 
                                          : 'bg-blue-100 text-blue-700'
                                        : isDark
                                          ? 'text-slate-300 hover:text-slate-100 hover:bg-slate-700/50'
                                          : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                                    } ${isCollapsed ? 'justify-center' : ''}`}
                                  >
                                    <ItemIcon className={`${isCollapsed ? 'w-6 h-6' : 'w-4 h-4 mr-3'}`} />
                                    {!isCollapsed && (
                                      <span>{item.label}</span>
                                    )}
                                  </Link>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className={`p-4 border-t ${isDark ? 'border-slate-700 bg-gradient-to-r from-slate-800 to-slate-700' : 'border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50'} transition-all duration-300`}>
            <button
              onClick={handleSignOut}
              className={`flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 w-full ${
                isDark 
                  ? 'text-red-400 hover:bg-red-900/30 hover:text-red-300' 
                  : 'text-red-600 hover:bg-red-50'
              }`}
            >
              <Settings className="w-5 h-5" />
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: 'auto' }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    Sign Out
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.div>
    );
  } catch (error) {
    console.error("Error rendering Sidebar:", error);
    return (
      <div className={`h-full bg-gradient-to-b ${isDark ? 'from-slate-800 to-slate-900' : 'from-blue-50 to-white'} border-r ${isDark ? 'border-slate-700' : 'border-gray-200'} shadow-lg flex items-center justify-center transition-all duration-500`}>
        <div className={`transition-colors duration-300 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>Error loading sidebar.</div>
      </div>
    );
  }
};

export default Sidebar;
