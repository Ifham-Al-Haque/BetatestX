import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, User } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

const ChatPopup = ({ popup, onRemove }) => {
  const { removeChatPopup } = useNotifications();

  const handleRemove = () => {
    removeChatPopup(popup.id);
    if (onRemove) onRemove(popup.id);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-red-500 bg-red-50';
      case 'medium':
        return 'border-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return '🔴';
      case 'medium':
        return '🟡';
      case 'low':
        return '🔵';
      default:
        return '⚪';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: -50 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -50 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
    >
      <div className="bg-white rounded-lg shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-6 h-6" />
              <div>
                <h3 className="font-semibold text-lg">{popup.title}</h3>
                <p className="text-blue-100 text-sm">New message received</p>
              </div>
            </div>
            <button
              onClick={handleRemove}
              className="text-white hover:text-blue-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Message Content */}
        <div className="p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold">
                <User className="w-5 h-5" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                <p className="text-gray-800 text-sm leading-relaxed">
                  {popup.message}
                </p>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {new Date(popup.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex space-x-3">
            <button
              onClick={handleRemove}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors font-medium"
            >
              Dismiss
            </button>
            <button
              onClick={() => {
                // Navigate to chat - you can implement this based on your routing
                window.location.href = `/chat?conversation=${popup.conversationId}`;
                handleRemove();
              }}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors font-medium"
            >
              View Chat
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPopup;
