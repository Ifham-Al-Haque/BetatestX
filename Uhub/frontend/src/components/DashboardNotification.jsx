import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle, Info, X, Bell } from 'lucide-react';

const NotificationTypes = {
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  INFO: 'info'
};

const NotificationIcon = ({ type }) => {
  switch (type) {
    case NotificationTypes.SUCCESS:
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    case NotificationTypes.WARNING:
      return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
    case NotificationTypes.ERROR:
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    case NotificationTypes.INFO:
      return <Info className="w-5 h-5 text-blue-600" />;
    default:
      return <Bell className="w-5 h-5 text-gray-600" />;
  }
};

const NotificationCard = ({ notification, onDismiss, onAction }) => {
  const [isVisible, setIsVisible] = useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss(notification.id);
    }, 300);
  };

  const handleAction = () => {
    if (onAction) {
      onAction(notification);
    }
  };

  if (!isVisible) return null;

  const typeClass = {
    [NotificationTypes.SUCCESS]: 'notification-card-success',
    [NotificationTypes.WARNING]: 'notification-card-warning',
    [NotificationTypes.ERROR]: 'notification-card-error',
    [NotificationTypes.INFO]: 'notification-card-info',
  }[notification.type] || 'notification-card-neutral';

  return (
    <div className={`notification-card ${typeClass} border rounded-lg p-4 mb-3 transition-all duration-300 transform translate-x-0 opacity-100`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <NotificationIcon type={notification.type} />
          <div className="flex-1 min-w-0">
            <h4 className="notification-card-title text-sm font-medium">
              {notification.title}
            </h4>
            {notification.message && (
              <p className="notification-card-message text-sm mt-1">
                {notification.message}
              </p>
            )}
            {notification.action && (
              <button
                onClick={handleAction}
                className="notification-card-action mt-2 text-sm font-medium underline hover:no-underline transition-all duration-200"
              >
                {notification.action.label}
              </button>
            )}
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="notification-dismiss ml-3 p-1 rounded-full transition-colors duration-200"
          aria-label="Dismiss notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const DashboardNotification = ({ notifications = [], onDismiss, onAction, maxNotifications = 3 }) => {
  const [visibleNotifications, setVisibleNotifications] = useState(notifications.slice(0, maxNotifications));

  useEffect(() => {
    setVisibleNotifications(notifications.slice(0, maxNotifications));
  }, [notifications, maxNotifications]);

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div className="dashboard-notifications">
      <div className="notifications-header mb-3">
        <h3 className="notifications-header-title text-lg font-semibold">Payment Alerts</h3>
        <p className="notifications-header-subtitle text-sm">Action required on upcoming or overdue payments</p>
      </div>
      <div className="notifications-list">
        {visibleNotifications.map((notification) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardNotification;
export { NotificationTypes };
