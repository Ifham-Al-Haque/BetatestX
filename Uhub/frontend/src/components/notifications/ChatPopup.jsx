import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  X, 
  User, 
  Clock, 
  Paperclip,
  Image as ImageIcon,
  FileText,
  Download,
  Eye
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { formatDistanceToNow } from 'date-fns';

const ChatPopup = ({ 
  popup, 
  onClose, 
  onViewConversation,
  position = { x: 0, y: 0 }
}) => {
  const { user } = useAuth();
  const { conversations } = useChat();
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(5);

  // Auto-dismiss after 5 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsVisible(false);
          setTimeout(() => onClose(popup.id), 300);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [popup.id, onClose]);

  // Find the conversation for this popup
  const conversation = conversations.find(conv => conv.id === popup.conversationId);

  const handleViewConversation = () => {
    onViewConversation(popup.conversationId);
    onClose(popup.id);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose(popup.id), 300);
  };

  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return ImageIcon;
    if (fileType?.includes('pdf')) return FileText;
    return Paperclip;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: -20 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed z-50 max-w-sm w-full"
        style={{
          right: '20px',
          top: `${80 + (popup.index * 120)}px`,
          zIndex: 1000 - popup.index
        }}
      >
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm">
                    {conversation?.conversation_name || 'New Message'}
                  </h3>
                  <p className="text-blue-100 text-xs">
                    {popup.senderName || 'Unknown User'}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="text-xs text-blue-200">
                  {timeLeft}s
                </div>
                <button
                  onClick={handleClose}
                  className="p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                {popup.senderName?.charAt(0)?.toUpperCase() || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-gray-800 text-sm leading-relaxed line-clamp-3">
                  {popup.message}
                </p>
                
                {/* Show attachments if any */}
                {popup.attachments && popup.attachments.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {popup.attachments.slice(0, 2).map((attachment, index) => {
                      const FileIcon = getFileIcon(attachment.file_type);
                      return (
                        <div key={index} className="flex items-center space-x-2 text-xs text-gray-600">
                          <FileIcon className="w-3 h-3" />
                          <span className="truncate">{attachment.file_name}</span>
                          <span className="text-gray-400">({formatFileSize(attachment.file_size)})</span>
                        </div>
                      );
                    })}
                    {popup.attachments.length > 2 && (
                      <div className="text-xs text-gray-500">
                        +{popup.attachments.length - 2} more files
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center space-x-1 text-xs text-gray-500">
                    <Clock className="w-3 h-3" />
                    <span>{formatDistanceToNow(new Date(popup.timestamp), { addSuffix: true })}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={handleViewConversation}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-full hover:bg-blue-700 transition-colors flex items-center space-x-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600"
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ChatPopup;