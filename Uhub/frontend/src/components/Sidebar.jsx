// src/components/Sidebar.jsx
import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { usePrefetch } from '../hooks/usePrefetch';
import { 
  Settings,
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
import { useTheme } from '../context/ThemeContext';
import { canSeePanel, hasFeatureAccess } from './RoleBasedRoute';
import { isPanelVisibleInEdition } from '../config/edition';

const Sidebar = () => {
  const { isCollapsed, toggleSidebar, isMobile, isMobileOpen, closeMobileSidebar } = useSidebar();
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

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

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

  const isActive = (path) => location.pathname === path;
  const { prefetchRoute } = usePrefetch();

  // Safety check - don't render if auth is not initialized
  if (!user && !userProfile) {
    console.log('🔍 Sidebar: Auth not initialized yet, showing loading state');
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
            <div className="text-white font-semibold text-lg">UHub</div>
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

  // Navigation panels configuration with role-based filtering
  const navigationPanels = [
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
        { label: 'Collections', path: '/collections', icon: Folder, feature: 'collections' },
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
        { label: 'Payroll', path: '/payroll', icon: BarChart3, feature: 'payroll' },
        { label: 'Payroll Calculator', path: '/payroll-calculator', icon: Calculator, feature: 'payroll_calculator' },
        { label: 'Employee Onboarding', path: '/employee-onboarding', icon: UserCheck, feature: 'employee_onboarding' },
        { label: 'Employee Offboarding', path: '/employee-offboarding', icon: UserCheck, feature: 'employee_offboarding' },
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
        { label: 'Marketing Calendar', path: '/marketing-calendar', icon: Calendar, feature: 'marketing_calendar' },
        { label: 'Marketing Dashboard', path: '/marketing-dashboard', icon: BarChart3, feature: 'marketing_dashboard' },
        { label: 'Marketing Events', path: '/marketing-events', icon: Calendar, feature: 'marketing_events' },
        { label: 'Marketing Analytics', path: '/marketing-analytics', icon: BarChart3, feature: 'marketing_analytics' }
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

  // Filter panels based on user role (and the active app edition)
  const filteredPanels = navigationPanels.filter(panel => {
    if (!userRole) return false;
    if (!isPanelVisibleInEdition(panel.key)) return false;
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
                  className="text-white font-semibold text-lg"
                >
                  UHub
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
            className={`flex-1 overflow-y-auto ${isMobile ? 'p-2' : 'p-2'}`}
            style={{
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'contain'
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
                        <Icon 
                          className="w-5 h-5 transition-colors duration-300"
                          style={{ color: 'var(--text-secondary)' }}
                        />
                        {(!isCollapsed || isMobile) && (
                          <span 
                            className="text-sm font-medium transition-colors duration-300"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {panel.title}
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
                                        </motion.div>
                                        {(!isCollapsed || isMobile) && (
                                          <motion.span
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
                                            {item.label}
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

          {/* Footer */}
          <div 
            className={`${isMobile ? 'p-3' : 'p-4'} border-t transition-all duration-300`}
            style={{
              borderColor: 'var(--border-primary)',
              background: 'var(--bg-secondary)',
              paddingBottom: isMobile ? 'max(0.75rem, env(safe-area-inset-bottom))' : undefined
            }}
          >
            <motion.button
              onClick={handleSignOut}
              className={`flex items-center ${isMobile ? 'space-x-3 px-3 py-3' : 'space-x-3 px-3 py-2'} rounded-lg text-sm font-medium w-full touch-manipulation relative overflow-hidden`}
              style={{
                color: 'var(--text-danger)',
                background: 'transparent',
                minHeight: isMobile ? '44px' : undefined,
                WebkitTapHighlightColor: 'transparent',
                touchAction: 'manipulation'
              }}
              whileHover={!isMobile ? {
                background: 'var(--accent-danger)',
                color: 'white',
                scale: 1.02,
                transition: {
                  type: "spring",
                  stiffness: 400,
                  damping: 25
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
              onTouchStart={(e) => {
                e.currentTarget.style.background = 'var(--accent-danger)';
                e.currentTarget.style.color = 'white';
              }}
              onTouchEnd={(e) => {
                setTimeout(() => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--text-danger)';
                }, 150);
              }}
            >
              <Settings className="w-5 h-5" />
              <AnimatePresence>
                {(!isCollapsed || isMobile) && (
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
            </motion.button>
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
