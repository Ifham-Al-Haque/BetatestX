// src/components/WidgetNavigation.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
  ClipboardList,
  Bell,
  Folder,
  Cpu,
  X,
  Archive
} from 'lucide-react';
import { canSeePanel, hasFeatureAccess } from './RoleBasedRoute';

// Widget configuration mapping from sidebar panels
const widgetConfig = [
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
    title: 'Tasks',
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
      { label: 'Employee Records', path: '/employee-records', icon: Users, feature: 'employees_view_only', description: 'View records' },
      { label: 'Employee Onboarding', path: '/employee-onboarding', icon: UserCheck, feature: 'employee_onboarding', description: 'Onboard staff' },
      { label: 'Employee Offboarding', path: '/employee-offboarding', icon: UserCheck, feature: 'employee_offboarding', description: 'Offboard staff' },
      { label: 'Employee History', path: '/employee-history', icon: Archive, feature: 'employees', description: 'View archived employees' },
      { label: 'Attendance', path: '/attendance', icon: Calendar, feature: 'attendance', description: 'Track attendance' },
      { label: 'Complaints', path: '/complaints', icon: AlertTriangle, feature: 'complaints', description: 'Issue tracking' },
      { label: 'Complaints Inbox', path: '/complaints-inbox', icon: Inbox, feature: 'complaints_inbox', description: 'View complaints' },
      { label: 'Suggestions', path: '/suggestions', icon: Lightbulb, feature: 'suggestions', description: 'View suggestions' }
    ]
  },
  {
    key: 'it_services',
    title: 'IT Services',
    icon: Cog,
    color: 'from-teal-500 to-cyan-600',
    items: [
      { label: 'IT Requests', path: '/it-requests', icon: FileText, feature: 'it_requests', description: 'Tech support' },
      { label: 'Request Inbox', path: '/request-inbox', icon: Inbox, feature: 'request_inbox', description: 'View requests' }
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
    key: 'driver_management',
    title: 'Driver Management',
    icon: Car,
    color: 'from-green-500 to-emerald-600',
    items: [
      { label: 'Driver Records', path: '/drivers', icon: Car, feature: 'driver_records', description: 'View drivers' },
      { label: 'Fleet Records', path: '/driver-operations', icon: Car, feature: 'fleet_records', description: 'Fleet data' },
      { label: 'Fleet Management', path: '/fleet', icon: Database, feature: 'fleet_management', description: 'Manage fleet' },
      { label: 'Breakdowns', path: '/breakdowns', icon: AlertTriangle, feature: 'breakdowns', description: 'Track breakdowns' }
    ]
  },
  {
    key: 'operation_panel',
    title: 'Operation Panel',
    icon: Cog,
    color: 'from-slate-500 to-gray-600',
    items: [
      { label: 'Fleet Onboarding', path: '/fleet-onboarding', icon: CheckSquare, feature: 'fleet_onboarding', description: 'Onboard fleet' },
      { label: 'Fleet Offboarding', path: '/fleet-offboarding', icon: AlertTriangle, feature: 'fleet_offboarding', description: 'Offboard fleet' },
      { label: 'Fleet Delivery Checklist', path: '/fleet-delivery-checklist', icon: ClipboardList, feature: 'fleet_delivery_checklist', description: 'Delivery checklist' },
      { label: 'Fleet Maintenance Record', path: '/fleet-maintenance-record', icon: FileText, feature: 'fleet_maintenance_record', description: 'Maintenance logs' }
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

// Enhanced Widget Component
const Widget = ({ widget, userRole, index, onExpand }) => {
  const Icon = widget.icon;
  
  // Filter items based on user role - with fallback
  let filteredItems = widget.items.filter(item => {
    if (!userRole) {
      // If no role, show first item
      return item === widget.items[0];
    }
    if (!item.feature) return true;
    try {
      return hasFeatureAccess(userRole, item.feature);
    } catch (error) {
      // Fallback: show first item if there's an error
      return item === widget.items[0];
    }
  });

  // Fallback: if no items match, show first item
  if (filteredItems.length === 0) {
    filteredItems = [widget.items[0]];
  }

  // Get primary item (first accessible item)
  const primaryItem = filteredItems[0];

  const handleClick = (e) => {
    e.preventDefault();
    if (filteredItems.length > 1) {
      // If multiple items, show expand modal
      onExpand(widget, filteredItems);
    } else {
      // If single item, navigate directly
      window.location.href = primaryItem.path;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 25,
        delay: index * 0.05
      }}
      whileHover={{
        y: -8,
        scale: 1.02,
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 25
        }
      }}
      whileTap={{
        scale: 0.98,
        transition: {
          type: "spring",
          stiffness: 600,
          damping: 30
        }
      }}
      className="group relative"
    >
      <button
        onClick={handleClick}
        className="w-full block p-4 sm:p-5 md:p-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl sm:rounded-2xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-center touch-manipulation relative overflow-hidden group-hover:shadow-2xl group-hover:shadow-blue-500/25 cursor-pointer"
        style={{
          minHeight: '140px',
          WebkitTapHighlightColor: 'transparent'
        }}
      >
        {/* Gradient overlay on hover */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-10 rounded-xl sm:rounded-2xl`}
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25
          }}
        />

        {/* Icon container */}
        <motion.div
          className={`w-14 h-14 sm:w-16 sm:h-16 md:w-18 md:h-18 bg-gradient-to-r ${widget.color} rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 shadow-lg relative z-10`}
          whileHover={{
            scale: 1.15,
            rotate: 5,
            transition: {
              type: "spring",
              stiffness: 400,
              damping: 20
            }
          }}
        >
          <Icon className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 text-white" />
          {/* Glow effect */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-r ${widget.color} rounded-xl sm:rounded-2xl blur-xl opacity-0 group-hover:opacity-50`}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 25
            }}
          />
        </motion.div>

        {/* Title */}
        <h3 className="text-base sm:text-lg font-bold text-white mb-1 sm:mb-2 group-hover:text-emerald-300 transition-colors relative z-10 line-clamp-1">
          {widget.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-blue-200/80 opacity-90 line-clamp-2 relative z-10 mb-2">
          {primaryItem.description}
        </p>

        {/* Item count badge - shows when multiple items available */}
        {filteredItems.length > 1 && (
          <motion.div
            className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-emerald-400/80 to-blue-400/80 backdrop-blur-sm relative z-10 shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{
              type: "spring",
              stiffness: 400,
              damping: 20,
              delay: index * 0.05 + 0.2
            }}
            whileHover={{ scale: 1.1 }}
          >
            {filteredItems.length} sections
            <motion.span
              className="ml-1.5"
              animate={{ x: [0, 3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              →
            </motion.span>
          </motion.div>
        )}

        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full"
          transition={{
            duration: 0.6,
            ease: "easeInOut"
          }}
        />
      </button>
    </motion.div>
  );
};

// Widget Expansion Modal Component
const WidgetExpansionModal = ({ widget, items, isOpen, onClose }) => {
  const navigate = useNavigate();

  // Early return if modal shouldn't be shown
  if (!isOpen || !widget || !items || items.length === 0) {
    return null;
  }

  const Icon = widget.icon;

  const handleItemClick = (item) => {
    navigate(item.path);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 50 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30
            }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <motion.div
              className={`bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 rounded-2xl sm:rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden pointer-events-auto border border-white/20`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`bg-gradient-to-r ${widget.color} p-6 sm:p-8 border-b border-white/20`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <motion.div
                      className={`w-16 h-16 sm:w-20 sm:h-20 bg-white/20 backdrop-blur-md rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg`}
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 25,
                        delay: 0.1
                      }}
                    >
                      <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                    </motion.div>
                    <div>
                      <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
                        {widget.title}
                      </h2>
                      <p className="text-white/80 text-sm sm:text-base">
                        {items.length} {items.length === 1 ? 'section' : 'sections'} available
                      </p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-colors"
                    whileHover={{ scale: 1.1, rotate: 90 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.button>
                </div>
              </div>

              {/* Items Grid */}
              <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(85vh-140px)]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {items.map((item, index) => {
                    const ItemIcon = item.icon;
                    return (
                      <motion.button
                        key={item.path}
                        onClick={() => handleItemClick(item)}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 25,
                          delay: index * 0.05
                        }}
                        whileHover={{
                          scale: 1.02,
                          y: -4,
                          transition: {
                            type: "spring",
                            stiffness: 400,
                            damping: 25
                          }
                        }}
                        whileTap={{ scale: 0.98 }}
                        className={`group p-4 sm:p-5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl hover:bg-white/20 hover:border-white/30 transition-all duration-300 text-left touch-manipulation relative overflow-hidden`}
                      >
                        {/* Gradient overlay */}
                        <motion.div
                          className={`absolute inset-0 bg-gradient-to-br ${widget.color} opacity-0 group-hover:opacity-10 rounded-xl`}
                          transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 25
                          }}
                        />

                        <div className="flex items-start space-x-4 relative z-10">
                          <div className={`w-12 h-12 bg-gradient-to-r ${widget.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform`}>
                            <ItemIcon className="w-6 h-6 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-base sm:text-lg font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                              {item.label}
                            </h3>
                            <p className="text-sm text-blue-200/80 line-clamp-2">
                              {item.description}
                            </p>
                          </div>
                          <motion.div
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            animate={{ x: [0, 5, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                          >
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </motion.div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Main Widget Navigation Component
const WidgetNavigation = ({ userRole }) => {
  const [expandedWidget, setExpandedWidget] = useState(null);
  const [expandedItems, setExpandedItems] = useState([]);

  // Filter widgets based on user role - with fallback to show all if no role
  let filteredWidgets = widgetConfig.filter(widget => {
    if (!userRole) {
      // If no role, show main panel at minimum
      return widget.key === 'main' || widget.key === 'user_profile' || widget.key === 'todo_list';
    }
    try {
      return canSeePanel(userRole, widget.key);
    } catch (error) {
      console.warn('Error checking panel access:', error);
      // Fallback: show main panel if there's an error
      return widget.key === 'main';
    }
  });

  // Fallback: if no widgets match, show at least main panel
  if (filteredWidgets.length === 0) {
    filteredWidgets = widgetConfig.filter(widget => 
      widget.key === 'main' || widget.key === 'user_profile' || widget.key === 'todo_list'
    );
  }

  const handleExpand = (widget, items) => {
    setExpandedWidget(widget);
    setExpandedItems(items);
  };

  const handleClose = () => {
    setExpandedWidget(null);
    setExpandedItems([]);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4 md:gap-5">
        {filteredWidgets.map((widget, index) => (
          <Widget
            key={widget.key}
            widget={widget}
            userRole={userRole}
            index={index}
            onExpand={handleExpand}
          />
        ))}
      </div>

      {/* Expansion Modal */}
      <WidgetExpansionModal
        widget={expandedWidget}
        items={expandedItems}
        isOpen={!!expandedWidget}
        onClose={handleClose}
      />
    </div>
  );
};

export default WidgetNavigation;

