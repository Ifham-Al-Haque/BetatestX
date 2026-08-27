// src/components/Sidebar.jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefetch } from '../hooks/usePrefetch';
import { useTaskSidebarCounts } from '../hooks/useTaskSidebarCounts';
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
  Sparkles,
  LayoutGrid,
  MessageCircle,
  Bell,
  Folder,
  Cpu,
  X,
  Calculator
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { canSeePanel, hasFeatureAccess } from './RoleBasedRoute';
import { isPanelVisibleInEdition } from '../config/edition';
import Logo from './ui/logo';

const NAVIGATION_PANELS = [
  {
    key: 'main',
    title: 'Home Panel',
    icon: Home,
    items: [
      { label: 'Home', path: '/', icon: Home, feature: 'home' },
      { label: 'Dashboard', path: '/dashboard', icon: BarChart3, feature: 'dashboard' },
      { label: 'Calendar View', path: '/calendar-view', icon: Calendar, feature: 'calendar_view' },
      { label: 'Organizational Hierarchy', path: '/organizational-hierarchy', icon: Users, feature: 'organizational_hierarchy' }
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
      { label: 'Employees', path: '/employees', icon: Users, feature: 'employees', altFeatures: ['employee_records'] },
      { label: 'Departments', path: '/departments', icon: Building, feature: 'department_management' },
      { label: 'Payroll', path: '/payroll', icon: Calculator, feature: 'payroll' },
      { label: 'Employee Onboarding', path: '/employee-onboarding', icon: UserCheck, feature: 'employee_onboarding' },
      { label: 'Employee Offboarding', path: '/employee-offboarding', icon: UserCheck, feature: 'employee_offboarding' },
      { label: 'Attendance', path: '/attendance', icon: Calendar, feature: 'attendance' },
      { label: 'Leave', path: '/leave', icon: Calendar, feature: 'leave' },
      { label: 'Complaints', path: '/complaints', icon: AlertTriangle, feature: 'complaints' },
      { label: 'Complaints Inbox', path: '/complaints-inbox', icon: Inbox, feature: 'complaints_inbox' },
      { label: 'Suggestions', path: '/suggestions', icon: Lightbulb, feature: 'suggestions' },
      { label: 'Suggestions Inbox', path: '/suggestions-inbox', icon: Inbox, feature: 'suggestions_inbox' }
    ]
  },
  {
    key: 'customer_service',
    title: 'Customer Service',
    icon: Headphones,
    items: [
      { label: 'CSPA', path: '/cspa', icon: Headphones, feature: 'cspa' }
    ]
  },
  {
    key: 'it_services',
    title: 'IT Services',
    icon: Cog,
    items: [
      { label: 'Overview', path: '/it-services', icon: LayoutGrid, feature: 'it_requests' },
      { label: 'IT Requests', path: '/it-requests', icon: FileText, feature: 'it_requests' },
      { label: 'Request Inbox', path: '/request-inbox', icon: Inbox, feature: 'request_inbox' },
      { label: 'IT Tools & Analytics', path: '/it-tools', icon: BarChart3, feature: 'it_tools' }
    ]
  },
  {
    key: 'operation',
    title: 'Operation',
    icon: Cog,
    items: [
      { label: 'Overview', path: '/operation', icon: LayoutGrid, feature: 'fleet_management' },
      { label: 'Fleet Record', path: '/operation/fleet-records', icon: Car, feature: 'fleet_records' },
      { label: 'Fleet Offboarding', path: '/operation/fleet-lifecycle', icon: CheckSquare, feature: 'fleet_lifecycle' },
      { label: 'UDrive Fleetio', path: '/operation/fleetio', icon: Database, feature: 'udrive_fleetio' },
      { label: 'Driver & Team Records', path: '/operation/drivers', icon: Users, feature: 'driver_records' },
      { label: 'Schedule & Roster', path: '/operation/roster', icon: Calendar, feature: 'operation_roster' },
      { label: 'Team Allocation', path: '/operation/team-allocation', icon: Users, feature: 'operation_roster' },
      { label: 'Breakdowns', path: '/operation/breakdowns', icon: AlertTriangle, feature: 'breakdowns' }
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
  },
  {
    key: 'subscribe_panel',
    title: 'Subscribe Now',
    icon: Bell,
    items: [
      { label: 'Subscribe Now', path: '/subscribe-now', icon: Bell, feature: 'subscribe_now' },
      { label: 'LTR Reporting', path: '/subscribe-now#ltr-reporting', icon: BarChart3, feature: 'ltr_reporting' }
    ]
  },
  {
    key: 'collections_panel',
    title: 'Collections',
    icon: Folder,
    items: [
      { label: 'Collections', path: '/collections', icon: Folder, feature: 'collections' }
    ]
  },
  {
    key: 'marketing_panel',
    title: 'Marketing',
    icon: Sparkles,
    items: [
      { label: 'Marketing Calendar', path: '/marketing-calendar', icon: Calendar, feature: 'marketing_calendar' }
    ]
  },
  {
    key: 'iot_panel',
    title: 'IOT',
    icon: Cpu,
    items: [
      { label: 'IOT Record', path: '/iot-record', icon: Database, feature: 'iot_record' }
    ]
  }
];

const NavBadge = ({ count, variant = 'purple' }) => {
  if (!count || count <= 0) return null;
  const colors =
    variant === 'red'
      ? 'bg-red-500 text-white'
      : 'bg-purple-500 text-white';
  return (
    <span
      className={`ml-auto min-w-[1.25rem] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-bold ${colors}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

const CollapsedBadge = ({ count, variant = 'purple' }) => {
  if (!count || count <= 0) return null;
  const color = variant === 'red' ? 'bg-red-500' : 'bg-purple-500';
  return (
    <span
      className={`absolute -top-1 -right-1 min-w-[1rem] h-4 px-0.5 flex items-center justify-center rounded-full text-[9px] font-bold text-white ${color} ring-2 ring-[var(--card-bg)]`}
      title={`${count} item${count !== 1 ? 's' : ''}`}
    >
      {count > 9 ? '9+' : count}
    </span>
  );
};

const Sidebar = () => {
  const { isCollapsed, toggleSidebar, isMobile, isMobileOpen, closeMobileSidebar } = useSidebar();
  const location = useLocation();
  const { user, userProfile } = useAuth();
  const { prefetchRoute } = usePrefetch();
  const { data: taskCounts } = useTaskSidebarCounts();

  const userRole = userProfile?.role || user?.role || 'loading';
  const isAuthLoading = !user && !userProfile;

  // Initialize expanded panels from localStorage or default to collapsed (only main panel expanded)
  const [expandedPanels, setExpandedPanels] = useState(() => {
    try {
      const saved = localStorage.getItem('sidebar-expanded-panels');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn('Error loading sidebar panel state:', error);
    }
    // Default: only main panel expanded, all others collapsed
    return {
      main: true,
      admin: false,
      user_profile: false,
      hr_panel: false,
      customer_service: false,
      it_services: false,
      operation: false,
      driver_management: false,
      operation_panel: false,
      asset_management: false,
      financial: false,
      todo_list: false,
      slice_of_life: false,
      communication: false,
      subscribe_panel: false,
      collections_panel: false,
      marketing_panel: false,
      iot_panel: false
    };
  });

  // Track prefetched routes to avoid duplicate calls
  const prefetchedRoutesRef = useRef(new Set());
  const prefetchTimeoutRef = useRef(null);

  const togglePanel = (panelKey) => {
    setExpandedPanels(prev => {
      const newState = {
        ...prev,
        [panelKey]: !prev[panelKey]
      };
      // Save to localStorage
      try {
        localStorage.setItem('sidebar-expanded-panels', JSON.stringify(newState));
      } catch (error) {
        console.warn('Error saving sidebar panel state:', error);
      }
      return newState;
    });
  };

  const filteredPanels = useMemo(
    () =>
      NAVIGATION_PANELS.filter((panel) => {
        if (!userRole || userRole === 'loading') return false;
        if (!isPanelVisibleInEdition(panel.key)) return false;
        return canSeePanel(userRole, panel.key);
      }),
    [userRole]
  );

  const getFilteredItems = useCallback(
    (panel) => {
      if (!userRole || userRole === 'loading') return [];
      return panel.items.filter((item) => {
        if (!item.feature) return true;
        if (hasFeatureAccess(userRole, item.feature)) return true;
        if (item.altFeatures?.some((feature) => hasFeatureAccess(userRole, feature))) return true;
        return false;
      });
    },
    [userRole]
  );

  const getActiveNavPath = useCallback(
    (pathname) => {
      const allItems = filteredPanels.flatMap((panel) => getFilteredItems(panel));
      let bestMatch = null;

      for (const item of allItems) {
        const basePath = item.path.split('#')[0];
        if (basePath === '/' && pathname === '/') return '/';
        if (pathname === basePath || pathname.startsWith(`${basePath}/`)) {
          if (!bestMatch || basePath.length > bestMatch.length) {
            bestMatch = basePath;
          }
        }
      }

      return bestMatch;
    },
    [filteredPanels, getFilteredItems]
  );

  useEffect(() => {
    if (isAuthLoading) return;

    const activePath = getActiveNavPath(location.pathname);
    if (!activePath) return;

    const panelWithActiveItem = filteredPanels.find((panel) =>
      getFilteredItems(panel).some((item) => item.path.split('#')[0] === activePath)
    );

    if (!panelWithActiveItem) return;

    setExpandedPanels((prev) => {
      if (prev[panelWithActiveItem.key]) return prev;

      const newState = { ...prev, [panelWithActiveItem.key]: true };
      try {
        localStorage.setItem('sidebar-expanded-panels', JSON.stringify(newState));
      } catch (error) {
        console.warn('Error saving sidebar panel state:', error);
      }
      return newState;
    });
  }, [isAuthLoading, location.pathname, filteredPanels, getFilteredItems, getActiveNavPath]);

  const isActive = (path) => {
    const activePath = getActiveNavPath(location.pathname);
    return activePath === path.split('#')[0];
  };

  if (isAuthLoading) {
    return (
      <div
        className="h-screen border-r shadow-lg flex-shrink-0 w-80 transition-all duration-500"
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div className="flex flex-col h-full">
          <div
            className="p-4 border-b"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--gradient-primary)'
            }}
          >
            <Logo size="sm" variant="negative" showText={true} textClassName="text-white" />
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div
              className="transition-colors duration-300"
              style={{ color: 'var(--text-muted)' }}
            >
              Loading...
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Enhanced animation variants with spring physics for smoother feel
  const panelVariants = {
    hidden: { 
      opacity: 0, 
      height: 0,
      scale: 0.95
    },
    visible: { 
      opacity: 1, 
      height: 'auto',
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30,
        mass: 0.8
      }
    },
    exit: { 
      opacity: 0, 
      height: 0,
      scale: 0.95,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 35,
        mass: 0.5
      }
    }
  };

  const itemVariants = {
    hidden: { 
      opacity: 0, 
      x: -15,
      scale: 0.9
    },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
        mass: 0.5
      }
    },
    exit: { 
      opacity: 0, 
      x: -10,
      scale: 0.95,
      transition: {
        duration: 0.15,
        ease: [0.4, 0, 1, 1]
      }
    }
  };

  try {
    return (
      <motion.div
        initial={{ width: isCollapsed ? 80 : 280 }}
        animate={{ 
          width: isMobile ? 280 : (isCollapsed ? 80 : 280),
          x: isMobile && !isMobileOpen ? -280 : 0
        }}
        transition={{ 
          type: "spring",
          stiffness: 300,
          damping: 30,
          mass: 0.8
        }}
        className={`h-full border-r shadow-xl transition-all duration-500 ${
          isMobile ? 'fixed left-0 top-0 z-50' : ''
        }`}
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)',
          width: isMobile ? '280px' : undefined,
          // iOS safe area insets
          paddingTop: isMobile ? 'max(0px, env(safe-area-inset-top))' : undefined,
          paddingBottom: isMobile ? 'max(0px, env(safe-area-inset-bottom))' : undefined,
          maxHeight: isMobile ? '100vh' : undefined,
          overflowY: isMobile ? 'auto' : undefined,
          WebkitOverflowScrolling: isMobile ? 'touch' : undefined,
          // Better shadow on mobile
          boxShadow: isMobile ? '2px 0 8px rgba(0, 0, 0, 0.15)' : undefined
        }}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div 
            className={`${isMobile ? 'p-3' : 'p-4'} border-b transition-all duration-300`}
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--gradient-primary)',
              paddingTop: isMobile ? 'max(0.75rem, env(safe-area-inset-top))' : undefined
            }}
          >
            <div className="flex items-center justify-between">
              <motion.button
                onClick={isMobile ? closeMobileSidebar : toggleSidebar}
                className={`${isMobile ? 'p-2.5' : 'p-2'} rounded-lg text-white touch-manipulation`}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  minWidth: isMobile ? '44px' : undefined,
                  minHeight: isMobile ? '44px' : undefined,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  WebkitTapHighlightColor: 'transparent'
                }}
                whileHover={!isMobile ? { 
                  scale: 1.05,
                  background: 'rgba(255, 255, 255, 0.2)',
                  transition: {
                    type: "spring",
                    stiffness: 400,
                    damping: 25
                  }
                } : {}}
                whileTap={{ 
                  scale: 0.95,
                  transition: {
                    type: "spring",
                    stiffness: 600,
                    damping: 30
                  }
                }}
                aria-label={isMobile ? "Close menu" : "Toggle sidebar"}
              >
                {isMobile ? (
                  <X className="w-5 h-5" />
                ) : isCollapsed ? (
                  <ChevronRight className="w-5 h-5" />
                ) : (
                  <ChevronLeft className="w-5 h-5" />
                )}
              </motion.button>
              
              {(!isCollapsed || isMobile) && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Logo size="sm" variant="negative" showText={true} textClassName="text-white" />
                </motion.div>
              )}
            </div>
          </div>

          {/* User Profile Section */}
          <div 
            className="p-4 border-b transition-all duration-300"
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-secondary)'
            }}
          >
            <AnimatePresence mode="wait">
              {!isCollapsed ? (
                <motion.div
                  key="expanded-profile"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center space-x-3"
                >
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--gradient-accent)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <span className="text-white text-sm font-medium">
                      {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p 
                      className="text-sm font-medium truncate transition-colors duration-300"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {userProfile?.full_name || 'User'}
                    </p>
                    <p 
                      className="text-xs truncate transition-colors duration-300"
                      style={{ color: 'var(--text-muted)' }}
                    >
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
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{
                      background: 'var(--gradient-accent)',
                      boxShadow: 'var(--shadow-md)'
                    }}
                  >
                    <span className="text-white text-sm font-medium">
                      {userProfile?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Panels */}
          <div
            className={`flex-1 overflow-y-auto ${isMobile ? 'p-2 pb-4' : 'p-2'}`}
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain',
              paddingBottom: isMobile ? 'max(1rem, env(safe-area-inset-bottom))' : undefined,
            }}
          >
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
                  <motion.div 
                    key={panel.key} 
                    className="rounded-lg shadow-sm border overflow-hidden"
                    style={{
                      background: 'var(--card-bg)',
                      borderColor: 'var(--card-border)',
                      boxShadow: 'var(--shadow-sm)'
                    }}
                    whileHover={!isMobile ? {
                      boxShadow: 'var(--shadow-md)',
                      borderColor: 'var(--border-accent)',
                      transition: {
                        type: "spring",
                        stiffness: 400,
                        damping: 25
                      }
                    } : {}}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25
                    }}
                  >
                    {/* Panel Header */}
                    <motion.button
                      onClick={() => togglePanel(panel.key)}
                      className="w-full p-3 flex items-center justify-between group relative"
                      style={{
                        background: 'transparent'
                      }}
                      title={isCollapsed && !isMobile ? panel.title : undefined}
                      whileHover={!isMobile ? {
                        background: 'var(--card-hover)',
                        transition: {
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }
                      } : {}}
                      whileTap={{
                        scale: 0.98,
                        transition: {
                          type: "spring",
                          stiffness: 600,
                          damping: 30
                        }
                      }}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="relative shrink-0">
                          <Icon 
                            className="w-5 h-5 transition-colors duration-300"
                            style={{ color: 'var(--text-secondary)' }}
                          />
                          {isCollapsed && !isMobile && panel.key === 'todo_list' && (
                            <CollapsedBadge
                              count={taskCounts?.overdue || taskCounts?.myOpen}
                              variant={taskCounts?.overdue > 0 ? 'red' : 'purple'}
                            />
                          )}
                        </div>
                        {(!isCollapsed || isMobile) && (
                          <span 
                            className="text-sm font-medium transition-colors duration-300 flex items-center gap-2 flex-1 min-w-0"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            <span className="truncate">{panel.title}</span>
                            {panel.key === 'todo_list' && (
                              <NavBadge count={taskCounts?.overdue} variant="red" />
                            )}
                          </span>
                        )}
                      </div>
                      {(!isCollapsed || isMobile) && (
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                          }}
                        >
                          <ChevronDown 
                            className="w-4 h-4"
                            style={{ color: 'var(--text-muted)' }}
                          />
                        </motion.div>
                      )}
                    </motion.button>

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
                                  transition={{ delay: index * 0.03 }}
                                >
                                  <motion.div
                                    className="relative"
                                    whileHover={!isMobile && !active ? {
                                      x: 4,
                                      transition: {
                                        type: "spring",
                                        stiffness: 400,
                                        damping: 25
                                      }
                                    } : {}}
                                  >
                                    <Link
                                      to={item.path}
                                      className={`flex items-center ${isMobile ? 'px-3 py-3' : 'px-3 py-2'} rounded-lg text-sm ${isCollapsed && !isMobile ? 'justify-center' : ''} touch-manipulation relative overflow-hidden group`}
                                      style={{
                                        background: active ? 'var(--bg-sidebar-active)' : 'transparent',
                                        color: active ? 'var(--text-accent)' : 'var(--text-secondary)',
                                        borderLeft: active ? '3px solid var(--border-accent)' : '3px solid transparent',
                                        minHeight: isMobile ? '44px' : undefined,
                                        WebkitTapHighlightColor: 'transparent',
                                        touchAction: 'manipulation',
                                        position: 'relative'
                                      }}
                                      title={isCollapsed && !isMobile ? item.label : undefined}
                                      onClick={() => {
                                        if (isMobile) {
                                          closeMobileSidebar();
                                        }
                                      }}
                                      onMouseEnter={(e) => {
                                        if (!active && !isMobile) {
                                          // Debounce prefetch to avoid rapid successive calls
                                          if (prefetchTimeoutRef.current) {
                                            clearTimeout(prefetchTimeoutRef.current);
                                          }
                                          
                                          prefetchTimeoutRef.current = setTimeout(() => {
                                            // Skip if already prefetched
                                            if (!prefetchedRoutesRef.current.has(item.path)) {
                                              prefetchedRoutesRef.current.add(item.path);
                                              // Prefetch data for this route (non-blocking)
                                              prefetchRoute(item.path).catch(err => {
                                                // Remove from set on error so it can be retried
                                                prefetchedRoutesRef.current.delete(item.path);
                                                // Silently handle prefetch errors - they shouldn't affect UX
                                                console.debug('Prefetch failed for', item.path, err);
                                              });
                                            }
                                          }, 300); // 300ms debounce
                                        }
                                      }}
                                    >
                                      {/* Active indicator glow effect */}
                                      {active && (
                                        <motion.div
                                          className="absolute inset-0 rounded-lg"
                                          style={{
                                            background: 'linear-gradient(90deg, var(--border-accent) 0%, transparent 100%)',
                                            opacity: 0.1
                                          }}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 0.15 }}
                                          transition={{
                                            type: "spring",
                                            stiffness: 300,
                                            damping: 30
                                          }}
                                        />
                                      )}
                                      
                                      {/* Hover background effect */}
                                      <motion.div
                                        className="absolute inset-0 rounded-lg"
                                        style={{
                                          background: active ? 'var(--bg-sidebar-active)' : 'var(--bg-sidebar-hover)',
                                          opacity: 0
                                        }}
                                        whileHover={!isMobile ? {
                                          opacity: active ? 1 : 0.6,
                                          transition: {
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 25
                                          }
                                        } : {}}
                                      />
                                      
                                      <div className="relative z-10 flex items-center w-full">
                                        <motion.div
                                          className="relative shrink-0"
                                          animate={active ? {
                                            scale: 1.1,
                                            transition: {
                                              type: "spring",
                                              stiffness: 400,
                                              damping: 20
                                            }
                                          } : {
                                            scale: 1
                                          }}
                                        >
                                          <ItemIcon 
                                            className={`${isCollapsed && !isMobile ? 'w-6 h-6' : 'w-4 h-4 mr-3'}`}
                                            style={{ 
                                              color: active ? 'var(--text-accent)' : 'var(--text-muted)',
                                              filter: active ? 'drop-shadow(0 0 4px var(--border-accent))' : 'none'
                                            }}
                                          />
                                          {isCollapsed && !isMobile && item.feature === 'my_tasks' && (
                                            <CollapsedBadge count={taskCounts?.myOpen} variant="purple" />
                                          )}
                                        </motion.div>
                                        {(!isCollapsed || isMobile) && (
                                          <motion.span
                                            className="flex items-center flex-1 min-w-0"
                                            animate={active ? {
                                              fontWeight: 600,
                                              transition: {
                                                type: "spring",
                                                stiffness: 400,
                                                damping: 25
                                              }
                                            } : {
                                              fontWeight: 400
                                            }}
                                            style={{
                                              color: active ? 'var(--text-accent)' : 'var(--text-secondary)'
                                            }}
                                          >
                                            <span className="truncate">{item.label}</span>
                                            {item.feature === 'my_tasks' && (
                                              <NavBadge count={taskCounts?.myOpen} variant="purple" />
                                            )}
                                          </motion.span>
                                        )}
                                      </div>
                                    </Link>
                                  </motion.div>
                                </motion.div>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    );
  } catch (error) {
    console.error("Error rendering Sidebar:", error);
    return (
      <div 
        className="h-full border-r shadow-lg flex items-center justify-center transition-all duration-500"
        style={{
          background: 'var(--bg-sidebar)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-primary)'
        }}
      >
        <div 
          className="transition-colors duration-300"
          style={{ color: 'var(--text-muted)' }}
        >
          Error loading sidebar.
        </div>
      </div>
    );
  }
};

export default Sidebar;
