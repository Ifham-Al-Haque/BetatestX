import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  CheckCheck,
  Settings,
  Filter,
  Search,
  MoreVertical,
  AlertCircle,
  Info,
  CheckCircle,
  AlertTriangle,
  MessageCircle,
  FileText,
  Calendar,
  CreditCard,
  Clock,
  User,
  Shield,
  Zap
} from 'lucide-react';
import { useNotifications } from '../../context/EnhancedNotificationContext';
import { useAuth } from '../../context/AuthContext';
import ChatPopup from './ChatPopup';
import { formatDistanceToNow } from 'date-fns';

const EnhancedNotificationContainer = () => {
  const { 
    notifications, 
    chatPopups, 
    unreadCount, 
    markNotificationAsRead, 
    markAllNotificationsAsRead,
    removeChatPopup,
    handleViewConversation
  } = useNotifications();
  
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState('all'); // all, unread, read
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  // Filter notifications based on current filter and search
  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
                         (filter === 'unread' && !notification.is_read) ||
                         (filter === 'read' && notification.is_read);
    
    const matchesSearch = !searchQuery || 
                         notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const getNotificationIcon = (type, priority) => {
    const iconProps = { className: "w-5 h-5" };
    
    switch (type) {
      case 'complaint':
      case 'complaint_update':
        return <AlertCircle {...iconProps} className="w-5 h-5 text-red-500" />;
      case 'suggestion':
        return <FileText {...iconProps} className="w-5 h-5 text-blue-500" />;
      case 'it_request':
      case 'it_request_update':
        return <Zap {...iconProps} className="w-5 h-5 text-orange-500" />;
      case 'chat_message':
        return <MessageCircle {...iconProps} className="w-5 h-5 text-green-500" />;
      case 'task_assigned':
      case 'task_update':
        return <CheckCircle {...iconProps} className="w-5 h-5 text-purple-500" />;
      case 'expense_submitted':
      case 'expense_approved':
      case 'expense_rejected':
        return <CreditCard {...iconProps} className="w-5 h-5 text-yellow-500" />;
      case 'calendar_event':
        return <Calendar {...iconProps} className="w-5 h-5 text-indigo-500" />;
      case 'attendance_issue':
        return <Clock {...iconProps} className="w-5 h-5 text-pink-500" />;
      case 'payment_due':
        return <CreditCard {...iconProps} className="w-5 h-5 text-red-600" />;
      case 'system_maintenance':
        return <Settings {...iconProps} className="w-5 h-5 text-gray-500" />;
      case 'security_alert':
        return <Shield {...iconProps} className="w-5 h-5 text-red-600" />;
      default:
        return <Bell {...iconProps} className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'border-l-red-600 bg-red-50';
      case 'high':
        return 'border-l-orange-500 bg-orange-50';
      case 'medium':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-400 bg-gray-50';
      default:
        return 'border-l-gray-400 bg-gray-50';
    }
  };

  const handleNotificationClick = async (notification) => {
    if (!notification.is_read) {
      await markNotificationAsRead(notification.id);
    }
    
    // Handle action URL if present
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }
    
    setIsOpen(false);
  };

  const handleMarkAllAsRead = async () => {
    await markAllNotificationsAsRead();
  };

  return (
    <>
      {/* Notification Bell */}
      <div className="relative">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
        >
          {unreadCount > 0 ? (
            <BellRing className="w-6 h-6 text-blue-600" />
          ) : (
            <Bell className="w-6 h-6" />
          )}
          
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.div>
          )}
        </motion.button>

        {/* Notification Dropdown */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-full mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                  <div className="flex items-center space-x-2">
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="p-1 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Mark all as read"
                      >
                        <CheckCheck className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="p-1 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Search and Filter */}
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search notifications..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    />
                  </div>
                  
                  <div className="flex space-x-2">
                    {['all', 'unread', 'read'].map((filterType) => (
                      <button
                        key={filterType}
                        onClick={() => setFilter(filterType)}
                        className={`px-3 py-1 text-xs rounded-full transition-colors ${
                          filter === filterType
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Notifications List */}
              <div className="max-h-96 overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-sm">
                      {searchQuery || filter !== 'all' 
                        ? 'No notifications match your criteria'
                        : 'No notifications yet'
                      }
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {filteredNotifications.map((notification) => (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-l-4 ${
                          getPriorityColor(notification.priority)
                        } ${!notification.is_read ? 'bg-blue-50/50' : ''}`}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type, notification.priority)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className={`text-sm font-medium ${
                                !notification.is_read ? 'text-gray-900' : 'text-gray-700'
                              }`}>
                                {notification.title}
                              </h4>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.message}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-gray-500">
                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                              </span>
                              
                              {notification.action_label && (
                                <span className="text-xs text-blue-600 font-medium">
                                  {notification.action_label}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              {filteredNotifications.length > 0 && (
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                  <button
                    onClick={() => {
                      // Navigate to full notifications page
                      window.location.href = '/notifications';
                    }}
                    className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Chat Popups */}
      <AnimatePresence>
        {chatPopups.map((popup, index) => (
          <ChatPopup
            key={popup.id}
            popup={{ ...popup, index }}
            onClose={removeChatPopup}
            onViewConversation={handleViewConversation}
          />
        ))}
      </AnimatePresence>
    </>
  );
};

export default EnhancedNotificationContainer;
