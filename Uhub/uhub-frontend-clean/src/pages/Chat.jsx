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
  Lock,
  Sparkles,
  Zap,
  Globe,
  Shield
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
  const [allUsers, setAllUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  
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
      loadAllUsers();
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

  const loadAllUsers = async () => {
    try {
      setLoadingUsers(true);
      const data = await chatService.getAllUsers();
      setAllUsers(data);
    } catch (err) {
      console.error('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
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
      if (conversationId) {
        // Reload conversations to get the new one
        await loadConversations();
        // Find and select the new conversation
        const newConversation = conversations.find(c => c.id === conversationId);
        if (newConversation) {
          setSelectedConversation(newConversation);
        }
      }
      setShowNewChat(false);
      success('Success', 'New conversation started!');
    } catch (err) {
      showError('Error', 'Failed to start conversation');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
        <div className="text-center text-white">
          <MessageCircle className="w-16 h-16 text-blue-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Please log in to access chat</h2>
          <p className="text-blue-200">Join the conversation with your team</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Enhanced Sidebar - Conversation List */}
      <div className="w-80 bg-white/80 backdrop-blur-sm border-r border-gray-200/50 flex flex-col shadow-xl">
        {/* Enhanced Header */}
        <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold">Team Chat</h1>
                <p className="text-blue-100 text-sm">Connect with your team</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewChat(true)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-all duration-200"
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.button>
          </div>
          
          {/* Enhanced Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-blue-300" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/20 border border-white/30 rounded-xl text-white placeholder-blue-200 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/50 transition-all duration-200"
            />
          </div>
        </div>

        {/* Online Users Section */}
        <div className="p-4 border-b border-gray-200/50">
          <div className="flex items-center space-x-2 mb-3">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-700">Online ({onlineUsers.length})</span>
          </div>
          <div className="flex space-x-2">
            {onlineUsers.slice(0, 5).map((onlineUser) => (
              <motion.div
                key={onlineUser.user.id}
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold border-2 border-white shadow-lg"
                title={onlineUser.user.full_name}
              >
                {onlineUser.user.full_name?.charAt(0)?.toUpperCase() || '?'}
              </motion.div>
            ))}
            {onlineUsers.length > 5 && (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-xs font-semibold border-2 border-white">
                +{onlineUsers.length - 5}
              </div>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading conversations...</p>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p>No conversations found</p>
            </div>
          ) : (
            <div className="p-2">
              {filteredConversations.map((conversation) => (
                <motion.div
                  key={conversation.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedConversation(conversation)}
                  className={`p-4 rounded-xl cursor-pointer transition-all duration-200 mb-2 ${
                    selectedConversation?.id === conversation.id
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                      : 'bg-white/60 hover:bg-white/80 text-gray-700 hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      selectedConversation?.id === conversation.id
                        ? 'bg-white/20'
                        : 'bg-gradient-to-r from-blue-500 to-purple-600'
                    }`}>
                      <MessageCircle className={`w-6 h-6 ${
                        selectedConversation?.id === conversation.id ? 'text-white' : 'text-white'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-semibold truncate ${
                        selectedConversation?.id === conversation.id ? 'text-white' : 'text-gray-900'
                      }`}>
                        {conversation.conversation_name}
                      </h3>
                      <p className={`text-sm truncate ${
                        selectedConversation?.id === conversation.id ? 'text-blue-100' : 'text-gray-500'
                      }`}>
                        {conversation.conversation_type === 'group' 
                          ? `${conversation.participants_count} participants`
                          : 'Direct message'
                        }
                      </p>
                    </div>
                    {conversation.unread_count > 0 && (
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        selectedConversation?.id === conversation.id
                          ? 'bg-white text-blue-600'
                          : 'bg-red-500 text-white'
                      }`}>
                        {conversation.unread_count}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-white/60 backdrop-blur-sm">
        {selectedConversation ? (
          <>
            {/* Enhanced Chat Header */}
            <div className="bg-white/80 backdrop-blur-sm border-b border-gray-200/50 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200 lg:hidden"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-white" />
                    </div>
                    
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">
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
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <Phone className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <Video className="w-5 h-5" />
                  </motion.button>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>
            </div>

            {/* Enhanced Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-transparent to-blue-50/30">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex ${message.sender?.id === user.id ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg ${
                    message.sender?.id === user.id
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200/50'
                  }`}>
                    {message.sender?.id !== user.id && (
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                          {message.sender?.full_name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                          {message.sender?.full_name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </span>
                      </div>
                    )}
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.sender?.id === user.id && (
                      <p className="text-xs text-blue-200 mt-2 text-right">
                        {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </motion.div>
              ))}
              
              {/* Enhanced Typing indicators */}
              {typingUsers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/80 backdrop-blur-sm border border-gray-200/50 text-gray-600 px-4 py-3 rounded-2xl shadow-lg">
                    <div className="flex items-center space-x-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                      <p className="text-sm">
                        {typingUsers.map(u => u.user.full_name).join(', ')} 
                        {typingUsers.length === 1 ? ' is ' : ' are '} typing...
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Enhanced Message Input */}
            <div className="bg-white/80 backdrop-blur-sm border-t border-gray-200/50 p-6">
              <form onSubmit={sendMessage} className="flex items-center space-x-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <Paperclip className="w-5 h-5" />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
                >
                  <Smile className="w-5 h-5" />
                </motion.button>
                
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={handleTyping}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={sending}
                />
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!newMessage.trim() || sending}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </form>
            </div>
          </>
        ) : (
          /* Enhanced Welcome State */
          <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center"
            >
              <div className="w-32 h-32 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mx-auto mb-8 shadow-2xl">
                <MessageCircle className="w-16 h-16 text-white" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                Welcome to Team Chat
              </h2>
              <p className="text-gray-600 mb-8 text-lg max-w-md mx-auto">
                Select a conversation to start messaging with your team. 
                Stay connected, collaborate effectively, and build stronger relationships.
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowNewChat(true)}
                className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold text-lg"
              >
                <Plus className="w-5 h-5 inline mr-2" />
                Start New Conversation
              </motion.button>
              
              {/* Feature highlights */}
              <div className="grid grid-cols-3 gap-6 mt-12 max-w-2xl mx-auto">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Zap className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-sm text-gray-600">Real-time messaging</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Globe className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-sm text-gray-600">Global collaboration</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-sm text-gray-600">Secure & private</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>

      {/* Enhanced New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            onClose={() => setShowNewChat(false)}
            onStartChat={handleNewDirectChat}
            allUsers={allUsers}
            loadingUsers={loadingUsers}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Enhanced New Chat Modal Component
const NewChatModal = ({ onClose, onStartChat, allUsers, loadingUsers }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allUsers.filter(user => 
        user.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setUsers(filtered);
    } else {
      setUsers(allUsers);
    }
  }, [searchQuery, allUsers]);

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    const timeout = setTimeout(() => {
      // Search is handled by useEffect above
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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md border border-gray-200/50"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <UserPlus className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">New Conversation</h2>
                <p className="text-sm text-gray-500">Start chatting with your team</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
          
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {loadingUsers ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-3"></div>
                <p className="text-gray-500">Loading users...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p>{searchQuery ? 'No users found' : 'No users available'}</p>
              </div>
            ) : (
              users.map((user) => (
                <motion.div
                  key={user.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-xl cursor-pointer transition-all duration-200"
                  onClick={() => onStartChat(user.id)}
                >
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold shadow-lg">
                    {user.full_name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {user.full_name || user.email}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {user.role} • {user.department || 'No Department'}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-4 h-4 text-blue-600" />
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Chat;
