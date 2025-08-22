import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Search, 
  Plus, 
  MoreVertical, 
  Send, 
  Paperclip,
  Smile,
  Phone,
  Video,
  Users,
  Settings,
  X,
  ChevronLeft,
  UserPlus,
  Hash,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import chatService from '../services/chatService';
import { formatDistanceToNow } from 'date-fns';

const Chat = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Refs
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  
  // Real-time subscriptions
  const [conversationChannel, setConversationChannel] = useState(null);
  const [typingChannel, setTypingChannel] = useState(null);
  const [statusChannel, setStatusChannel] = useState(null);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      setupRealTimeSubscriptions();
      updateUserStatus(true);
    }

    return () => {
      cleanupSubscriptions();
      if (user) {
        updateUserStatus(false);
      }
    };
  }, [user?.id]); // Only depend on user ID

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
      setupConversationSubscriptions(selectedConversation.id);
    }
  }, [selectedConversation?.id]); // Only depend on conversation ID

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await chatService.getConversations();
      setConversations(data);
    } catch (err) {
      showError('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, limit = 50) => {
    try {
      const data = await chatService.getMessages(conversationId, limit);
      setMessages(data);
    } catch (err) {
      showError('Error', 'Failed to load messages');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedConversation) return;

    try {
      setSending(true);
      await chatService.sendMessage(selectedConversation.id, newMessage.trim());
      setNewMessage('');
      
      // Clear typing indicator
      await chatService.setTypingIndicator(selectedConversation.id, false);
    } catch (err) {
      showError('Error', 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    
    // Set typing indicator
    if (selectedConversation) {
      chatService.setTypingIndicator(selectedConversation.id, true);
      
      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to clear typing indicator
      typingTimeoutRef.current = setTimeout(() => {
        if (selectedConversation) {
          chatService.setTypingIndicator(selectedConversation.id, false);
        }
      }, 3000);
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      await chatService.markMessagesAsRead(conversationId);
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const updateUserStatus = async (isOnline) => {
    try {
      await chatService.updateUserStatus(isOnline);
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const setupRealTimeSubscriptions = async () => {
    try {
      // Subscribe to user status changes
      const statusSub = chatService.subscribeToUserStatus((payload) => {
        if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
          loadOnlineUsers();
        }
      });
      setStatusChannel(statusSub);

      // Subscribe to new conversations
      const conversationSub = await chatService.subscribeToNewConversations(() => {
        loadConversations();
      });
      if (conversationSub) {
        setConversationChannel(conversationSub);
      }
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
    }
  };

  const setupConversationSubscriptions = (conversationId) => {
    // Subscribe to new messages
    const messageSub = chatService.subscribeToConversation(conversationId, (payload) => {
      if (payload.eventType === 'INSERT') {
        const newMessage = payload.new;
        setMessages(prev => [...prev, newMessage]);
        
        // Mark as read if conversation is active
        if (selectedConversation?.id === conversationId) {
          markMessagesAsRead(conversationId);
        }
      }
    });

    // Subscribe to typing indicators
    const typingSub = chatService.subscribeToTypingIndicators(conversationId, (payload) => {
      if (payload.eventType === 'INSERT') {
        loadTypingIndicators(conversationId);
      } else if (payload.eventType === 'DELETE') {
        setTypingUsers(prev => prev.filter(u => u.user.id !== payload.old.user_id));
      }
    });
    setTypingChannel(typingSub);
  };

  const loadTypingIndicators = async (conversationId) => {
    try {
      const data = await chatService.getTypingIndicators(conversationId);
      setTypingUsers(data);
    } catch (err) {
      console.error('Failed to load typing indicators:', err);
    }
  };

  const loadOnlineUsers = async () => {
    try {
      const data = await chatService.getOnlineUsers();
      setOnlineUsers(data);
    } catch (err) {
      console.error('Failed to load online users:', err);
    }
  };

  const cleanupSubscriptions = () => {
    if (conversationChannel) {
      chatService.unsubscribe(conversationChannel);
    }
    if (typingChannel) {
      chatService.unsubscribe(typingChannel);
    }
    if (statusChannel) {
      chatService.unsubscribe(statusChannel);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const filteredConversations = conversations.filter(conv =>
    conv.conversation_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleNewDirectChat = async (userId) => {
    try {
      const conversationId = await chatService.createDirectConversation(userId);
      const newConversation = conversations.find(c => c.id === conversationId);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }
      setShowNewChat(false);
      success('Success', 'New conversation started!');
    } catch (err) {
      showError('Error', 'Failed to start conversation');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600">Please log in to access chat</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar - Conversation List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
            <button
              onClick={() => setShowNewChat(true)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading conversations...</div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                  selectedConversation?.id === conversation.id ? 'bg-blue-50 border-blue-200' : ''
                }`}
                onClick={() => setSelectedConversation(conversation)}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {conversation.conversation_type === 'group' ? (
                        <Users className="w-6 h-6" />
                      ) : (
                        conversation.conversation_name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {conversation.conversation_name}
                      </h3>
                      {conversation.unread_count > 0 && (
                        <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full">
                          {conversation.unread_count}
                        </span>
                      )}
                    </div>
                    
                    {conversation.last_message_content && (
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {conversation.last_message_content}
                      </p>
                    )}
                    
                    {conversation.last_message_time && (
                      <p className="text-xs text-gray-400 mt-1">
                        {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {selectedConversation.conversation_type === 'group' ? (
                        <Users className="w-5 h-5" />
                      ) : (
                        selectedConversation.conversation_name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-semibold text-gray-900">
                        {selectedConversation.conversation_name}
                      </h2>
                      <p className="text-sm text-gray-500">
                        {selectedConversation.conversation_type === 'group' 
                          ? `${selectedConversation.participants_count} participants`
                          : 'Direct message'
                        }
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Phone className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <Video className="w-5 h-5" />
                  </button>
                  <button className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender?.id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                    message.sender?.id === user.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}>
                    {message.sender?.id !== user.id && (
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="text-xs font-medium text-gray-600">
                          {message.sender?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    <p className="text-sm">{message.content}</p>
                    {message.sender?.id === user.id && (
                      <p className="text-xs text-blue-200 mt-1 text-right">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
                    <p className="text-sm">
                      {typingUsers.map(u => u.user.full_name).join(', ')} 
                      {typingUsers.length === 1 ? ' is ' : ' are '} typing...
                    </p>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex items-center space-x-3">
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Paperclip className="w-5 h-5" />
                </button>
                
                <button
                  type="button"
                  className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Smile className="w-5 h-5" />
                </button>
                
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                
                <button
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          </>
        ) : (
          /* Welcome State */
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-gray-600 mb-2">Welcome to Chat</h2>
              <p className="text-gray-500 mb-6">
                Select a conversation to start messaging with your team
              </p>
              <button
                onClick={() => setShowNewChat(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start New Conversation
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            onClose={() => setShowNewChat(false)}
            onStartChat={handleNewDirectChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// New Chat Modal Component
const NewChatModal = ({ onClose, onStartChat }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState(null);

  const searchUsers = async (query) => {
    if (!query.trim()) {
      setUsers([]);
      return;
    }

    try {
      setLoading(true);
      const data = await chatService.searchUsers(query);
      setUsers(data);
    } catch (err) {
      console.error('Failed to search users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      searchUsers(query);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">New Conversation</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {loading ? (
              <div className="text-center py-4 text-gray-500">Searching...</div>
            ) : users.length === 0 && searchQuery ? (
              <div className="text-center py-4 text-gray-500">No users found</div>
            ) : (
              users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => onStartChat(user.id)}
                >
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{user.full_name}</h3>
                    <p className="text-sm text-gray-500">{user.role} • {user.department}</p>
                  </div>
                  <UserPlus className="w-5 h-5 text-gray-400" />
                </div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Chat;
