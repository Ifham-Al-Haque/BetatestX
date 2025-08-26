import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { motion } from 'framer-motion';

const NotificationDemo = () => {
  const { addNotification, addChatPopup } = useNotifications();

  const testNotifications = [
    {
      type: 'complaint',
      title: 'Test Complaint',
      message: 'This is a test complaint notification',
      priority: 'high'
    },
    {
      type: 'suggestion',
      title: 'Test Suggestion',
      message: 'This is a test suggestion notification',
      priority: 'medium'
    },
    {
      type: 'it_request',
      title: 'Test IT Request',
      message: 'This is a test IT request notification',
      priority: 'low'
    },
    {
      type: 'calendar',
      title: 'Test Calendar Event',
      message: 'This is a test calendar event notification',
      priority: 'medium'
    },
    {
      type: 'payment',
      title: 'Test Payment',
      message: 'This is a test payment notification',
      priority: 'high'
    }
  ];

  const testChatPopups = [
    {
      type: 'chat_message',
      title: 'Test Chat Message',
      message: 'This is a test chat message that should appear as a popup in the center of the screen.',
      conversationId: 'test-123',
      senderId: 'test-sender'
    }
  ];

  const handleTestNotification = (notification) => {
    addNotification(notification);
  };

  const handleTestChatPopup = (popup) => {
    addChatPopup(popup);
  };

  const handleTestAll = () => {
    testNotifications.forEach((notification, index) => {
      setTimeout(() => {
        addNotification(notification);
      }, index * 1000); // Stagger notifications by 1 second
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Notification System Demo</h2>
        <p className="text-gray-600">
          Test the different types of notifications and chat popups
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Notifications */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Test Notifications</h3>
          <p className="text-gray-600 mb-4">
            These will appear in the notification bell dropdown
          </p>
          
          <div className="space-y-3">
            {testNotifications.map((notification, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTestNotification(notification)}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-blue-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{notification.title}</p>
                    <p className="text-sm text-gray-600">{notification.message}</p>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    notification.priority === 'high' ? 'bg-red-100 text-red-800' :
                    notification.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {notification.priority}
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleTestAll}
            className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Test All Notifications
          </motion.button>
        </div>

        {/* Test Chat Popups */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">Test Chat Popups</h3>
          <p className="text-gray-600 mb-4">
            These will appear as popups in the center of the screen
          </p>
          
          <div className="space-y-3">
            {testChatPopups.map((popup, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleTestChatPopup(popup)}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-left hover:border-purple-300 hover:shadow-md transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{popup.title}</p>
                    <p className="text-sm text-gray-600">{popup.message}</p>
                  </div>
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Chat
                  </span>
                </div>
              </motion.button>
            ))}
          </div>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> Chat popups automatically disappear after 5 seconds, 
              while notifications stay in the bell dropdown until manually dismissed.
            </p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h4 className="font-semibold text-yellow-800 mb-2">How to Test:</h4>
        <ol className="list-decimal list-inside text-sm text-yellow-700 space-y-1">
          <li>Click on any notification type to test it individually</li>
          <li>Use "Test All Notifications" to see multiple notifications appear</li>
          <li>Click the notification bell icon in the top-right corner to view notifications</li>
          <li>Chat popups will appear in the center of the screen</li>
          <li>Notifications will appear in the bell dropdown</li>
        </ol>
      </div>
    </div>
  );
};

export default NotificationDemo;
