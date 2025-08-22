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
  Image as ImageIcon,
  Sparkles,
  MessageCircle
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { RoleBasedNavigation, RoleIndicator } from './RoleBasedNavigation';

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const location = useLocation();
  const { user, userProfile, signOut } = useAuth();
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
    sliceOfLife: true,
    communication: true
  });

  const handleSignOut = async () => {
    await signOut();
  };

  const togglePanel = (panelKey) => {
    setExpandedPanels(prev => ({
      ...prev,
      [panelKey]: !prev[panelKey]
    }));
  };

  const isActive = (path) => location.pathname === path;

  // Navigation panels configuration - Restored to match your original structure
  const navigationPanels = [
    {
      key: 'main',
      title: 'Main',
      icon: Home,
      items: [
        { label: 'Home', path: '/', icon: Home },
        { label: 'Dashboard', path: '/dashboard', icon: BarChart3 },
        { label: 'Calendar View', path: '/calendar-view', icon: Calendar }
      ]
    },
    {
      key: 'sliceOfLife',
      title: 'Slice of Life',
      icon: Heart,
      items: [
        { label: 'Events', path: '/events', icon: Calendar },
        { label: 'Memories', path: '/memories', icon: Heart },
        { label: 'Picture Upload', path: '/event-picture-upload', icon: Camera }
      ]
    },
    {
      key: 'communication',
      title: 'Communication',
      icon: MessageCircle,
      items: [
        { label: 'Team Chat', path: '/chat', icon: MessageCircle }
      ]
    },
    {
      key: 'admin',
      title: 'Administration',
      icon: Shield,
      items: [
        { label: 'Admin Dashboard', path: '/admin/dashboard', icon: Shield },
        { label: 'User Management', path: '/user-management', icon: Users }
      ]
    },
    {
      key: 'user_profile',
      title: 'User Profile',
      icon: UserCheck,
      items: [
        { label: 'User Profile', path: '/profile', icon: UserCheck }
      ]
    },
    {
      key: 'hr_panel',
      title: 'HR Panel',
      icon: UserCheck,
      items: [
        { label: 'Employees', path: '/employees', icon: Users },
        { label: 'Attendance', path: '/attendance', icon: Calendar },
        { label: 'Complaints', path: '/complaints', icon: AlertTriangle },
        { label: 'Complaints Inbox', path: '/complaints-inbox', icon: Inbox },
        { label: 'Suggestions', path: '/suggestions', icon: Lightbulb }
      ]
    },
    {
      key: 'customer_service',
      title: 'Customer Service',
      icon: Headphones,
      items: [
        { label: 'CSPA', path: '/cspa', icon: Headphones },
        { label: 'CS Tickets', path: '/tickets', icon: FileText }
      ]
    },
    {
      key: 'it_services',
      title: 'IT Services',
      icon: Cog,
      items: [
        { label: 'IT Requests', path: '/it-requests', icon: FileText },
        { label: 'Request Inbox', path: '/request-inbox', icon: Inbox }
      ]
    },
    {
      key: 'driver_management',
      title: 'Driver Management',
      icon: Car,
      items: [
        { label: 'Driver Records', path: '/drivers', icon: Car },
        { label: 'Fleet Records', path: '/driver-operations', icon: Car },
        { label: 'Fleet Management', path: '/fleet', icon: Database },
        { label: 'Breakdowns', path: '/breakdowns', icon: AlertTriangle }
      ]
    },
    {
      key: 'asset_management',
      title: 'Asset Management',
      icon: Building,
      items: [
        { label: 'Assets', path: '/assets', icon: Building },
        { label: 'Sim Cards', path: '/simcards', icon: Database }
      ]
    },
    {
      key: 'financial',
      title: 'Financial',
      icon: BarChart3,
      items: [
        { label: 'Expense Tracker', path: '/expenses', icon: BarChart3 },
        { label: 'Payment Calendar', path: '/payment-calendar', icon: Calendar },
        { label: 'Upcoming Payments', path: '/upcoming-payments', icon: Calendar },
        { label: 'Vouchers', path: '/vouchers', icon: FileText },
        { label: 'Analytics', path: '/analytics', icon: BarChart3 }
      ]
    },
    {
      key: 'todo_list',
      title: 'To Do List',
      icon: ClipboardList,
      items: [
        { label: 'Task Management', path: '/task-management', icon: ClipboardList },
        { label: 'My Tasks', path: '/tasks', icon: CheckSquare },
        { label: 'Reports', path: '/reports', icon: BarChart3 }
      ]
    }
  ];

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
    hidden: { x: -20, opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: {
        duration: 0.2
      }
    }
  };

  return (
    <motion.div
      initial={{ width: 280 }}
      animate={{ width: isCollapsed ? 80 : 280 }}
      transition={{ duration: 0.3, ease: "easeInOut" }}
      className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}
    >
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-indigo-600">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center space-x-3"
              >
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">U</span>
                </div>
                <span className="text-xl font-bold text-white">U Drive</span>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-8 h-8 bg-white bg-opacity-20 rounded-lg flex items-center justify-center mx-auto"
              >
                <span className="text-white font-bold text-sm">U</span>
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors duration-200"
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-white" />
            ) : (
              <ChevronLeft className="w-4 h-4 text-white" />
            )}
          </button>
        </div>

        {/* User Profile */}
        <div className="sidebar-user-profile">
          <AnimatePresence mode="wait">
            {!isCollapsed ? (
              <motion.div
                key="expanded-profile"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3 w-full"
              >
                <div className="flex items-center space-x-3">
                  <div className="sidebar-avatar">
                    <span className="text-white text-sm font-medium">
                      {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userProfile?.full_name || 'User'}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userProfile?.position || 'Administrator'}
                    </p>
                  </div>
                </div>
                
                {/* Role Indicator */}
                <div className="sidebar-role-indicator">
                  <RoleIndicator />
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
                <div className="sidebar-avatar">
                  <span className="text-white text-sm font-medium">
                    {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="sidebar-role-indicator">
                  <RoleIndicator />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Panels */}
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-2">
            {navigationPanels.map((panel) => {
              const Icon = panel.icon;
              const isExpanded = expandedPanels[panel.key];
              
              return (
                <div key={panel.key} className="sidebar-panel bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                  {/* Panel Header */}
                  <button
                    onClick={() => togglePanel(panel.key)}
                    className={`sidebar-panel-header ${
                      isExpanded ? 'sidebar-panel-expanded' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className={`sidebar-icon w-5 h-5 text-gray-600 ${isCollapsed ? 'mx-auto' : ''}`} />
                      {!isCollapsed && (
                        <span className="text-sm font-medium text-gray-700 sidebar-text">{panel.title}</span>
                      )}
                    </div>
                    {!isCollapsed && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="sidebar-chevron"
                      >
                        <ChevronDown className="w-4 h-4 text-gray-500" />
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
                        className="sidebar-panel-content overflow-hidden"
                      >
                        <div className="p-2 space-y-1">
                          {panel.items.map((item, index) => {
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
                                  className={`sidebar-nav-item ${
                                    active 
                                      ? 'active' 
                                      : 'text-gray-700 hover:text-gray-900'
                                  } ${isCollapsed ? 'justify-center' : ''}`}
                                >
                                  <ItemIcon className={`sidebar-icon ${isCollapsed ? 'w-6 h-6' : 'w-4 h-4 mr-3'}`} />
                                  {!isCollapsed && (
                                    <span className="sidebar-text">{item.label}</span>
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
        <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-gray-50 to-blue-50">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors duration-200 w-full"
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
};

export default Sidebar;
