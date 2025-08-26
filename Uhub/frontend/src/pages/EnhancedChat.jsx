import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Users, Hash, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import enhancedChatService from '../services/enhancedChatService';
import ConversationList from '../components/chat/ConversationList';
import ChatArea from '../components/chat/ChatArea';
import NewChatModal from '../components/chat/NewChatModal';

const EnhancedChat = () => {
  const { user, userProfile } = useAuth();
  const { success, error: showError } = useToast();
  
  // State management
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  const [onlineUsers, setOnlineUsers] = useState([]);
  
  // Refs for cleanup
  const subscriptionsRef = useRef([]);

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
  }, [user?.id]);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation.id);
      markMessagesAsRead(selectedConversation.id);
    }
  }, [selectedConversation?.id]);

  const loadConversations = async () => {
    try {
      setLoading(true);
      const data = await enhancedChatService.getEnhancedConversations();
      setConversations(data);
    } catch (err) {
      showError('Error', 'Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async (conversationId, limit = 50, offset = 0) => {
    try {
      setMessagesLoading(true);
      const data = await enhancedChatService.getEnhancedMessages(conversationId, limit, offset);
      setMessages(data);
    } catch (err) {
      showError('Error', 'Failed to load messages');
    } finally {
      setMessagesLoading(false);
    }
  };

  const sendMessage = async (content, replyTo = null) => {
    if (!content.trim() || !selectedConversation) return;

    try {
      const metadata = {};
      if (replyTo) {
        metadata.reply_to_id = replyTo.id;
        metadata.reply_to_content = replyTo.content;
        metadata.reply_to_sender = replyTo.sender;
      }

      const newMessage = await enhancedChatService.sendEnhancedMessage(
        selectedConversation.id, 
        content, 
        'text', 
        metadata
      );
      
      // Add message to local state
      setMessages(prev => [...prev, newMessage]);
      
      // Update conversation last message
      setConversations(prev => 
        prev.map(conv => 
          conv.id === selectedConversation.id 
            ? { ...conv, last_message_content: content, last_message_created_at: new Date().toISOString() }
            : conv
        )
      );
      
      success('Message sent successfully');
    } catch (err) {
      showError('Error', 'Failed to send message');
    }
  };

  const startDirectChat = async (userId) => {
    try {
      const conversationId = await enhancedChatService.createDirectChat(userId);
      
      // Reload conversations to show the new one
      await loadConversations();
      
      // Find and select the new conversation
      const newConversation = conversations.find(conv => conv.id === conversationId);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }
      
      success('Direct chat started');
    } catch (err) {
      showError('Error', 'Failed to start direct chat');
    }
  };

  const startGroupChat = async (conversationId) => {
    try {
      // Reload conversations to show the new one
      await loadConversations();
      
      // Find and select the new conversation
      const newConversation = conversations.find(conv => conv.id === conversationId);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }
      
      success('Group chat created successfully');
    } catch (err) {
      showError('Error', 'Failed to create group chat');
    }
  };

  const startTeamChat = async (conversationId) => {
    try {
      // Reload conversations to show the new one
      await loadConversations();
      
      // Find and select the new conversation
      const newConversation = conversations.find(conv => conv.id === conversationId);
      if (newConversation) {
        setSelectedConversation(newConversation);
      }
      
      success('Team chat started successfully');
    } catch (err) {
      showError('Error', 'Failed to start team chat');
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      await enhancedChatService.markMessagesAsRead(conversationId);
      
      // Update local conversation state
      setConversations(prev => 
        prev.map(conv => 
          conv.id === conversationId 
            ? { ...conv, unread_count: 0 }
            : conv
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  };

  const updateUserStatus = async (isOnline) => {
    try {
      await enhancedChatService.updateUserStatus(isOnline);
    } catch (err) {
      console.error('Failed to update user status:', err);
    }
  };

  const setupRealTimeSubscriptions = () => {
    const callbacks = {
      onNewMessage: (payload) => {
        const newMessage = payload.new;
        
        // Add message to current conversation if it matches
        if (selectedConversation && newMessage.conversation_id === selectedConversation.id) {
          setMessages(prev => [...prev, newMessage]);
        }
        
        // Reload conversations to update last message
        loadConversations();
      },
      
      onMessageUpdate: (payload) => {
        const updatedMessage = payload.new;
        
        // Update message in current conversation
        if (selectedConversation && updatedMessage.conversation_id === selectedConversation.id) {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      },
      
      onReactionChange: (payload) => {
        // Handle reaction changes if needed
        console.log('Reaction change:', payload);
      },
      
      onStatusChange: (payload) => {
        // Handle user status changes
        console.log('Status change:', payload);
      },
      
      onTypingChange: (payload) => {
        // Handle typing indicators
        console.log('Typing change:', payload);
      }
    };

    const subs = enhancedChatService.setupRealTimeSubscriptions(callbacks);
    subscriptionsRef.current = subs;
  };

  const cleanupSubscriptions = () => {
    enhancedChatService.cleanup();
    subscriptionsRef.current = [];
  };

  const handleConversationSelect = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleNewChat = () => {
    setShowNewChat(true);
  };

  const handleCloseNewChat = () => {
    setShowNewChat(false);
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
      {/* Conversation List */}
      <ConversationList
        conversations={conversations}
        selectedConversation={selectedConversation}
        onSelectConversation={handleConversationSelect}
        onNewChat={handleNewChat}
        loading={loading}
      />

      {/* Chat Area */}
      {selectedConversation ? (
        <ChatArea
          conversation={selectedConversation}
          messages={messages}
          onSendMessage={sendMessage}
          onLoadMoreMessages={loadMessages}
          loading={messagesLoading}
          typingUsers={typingUsers}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600">Select a conversation to start chatting</h2>
            <p className="text-gray-500 mt-2">Or start a new chat with someone</p>
            <button
              onClick={handleNewChat}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start New Chat
            </button>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      <AnimatePresence>
        {showNewChat && (
          <NewChatModal
            onClose={handleCloseNewChat}
            onStartChat={startDirectChat}
            onStartGroupChat={startGroupChat}
            onStartTeamChat={startTeamChat}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedChat;
