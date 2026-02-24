import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Plus, 
  Users, 
  MessageCircle, 
  Hash, 
  Lock,
  Filter,
  MoreVertical,
  Circle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ConversationList = ({ 
  conversations, 
  selectedConversation, 
  onSelectConversation, 
  onNewChat,
  loading 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', label: 'All', icon: MessageCircle, count: conversations.length },
    { id: 'direct', label: 'Direct', icon: Users, count: conversations.filter(c => c.conversation_type === 'direct').length },
    { id: 'group', label: 'Groups', icon: Hash, count: conversations.filter(c => c.conversation_type === 'group').length },
    { id: 'team', label: 'Teams', icon: Lock, count: conversations.filter(c => c.conversation_type === 'team').length }
  ];

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.conversation_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.last_message_content?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || conv.conversation_type === activeCategory;
    
    return matchesSearch && matchesCategory;
  });

  const getConversationIcon = (conversation) => {
    const IconComponent = conversation.conversation_type === 'group' ? Hash : Users;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusColor = (conversation) => {
    if (conversation.conversation_type === 'direct') {
      // Check if user is online
      return conversation.participant_online ? 'bg-green-400' : 'bg-gray-400';
    }
    return 'bg-blue-400';
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-gray-900">Messages</h1>
          <button
            onClick={onNewChat}
            className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex-1 flex items-center justify-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                activeCategory === category.id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <category.icon className="w-4 h-4 mr-2" />
              {category.label}
              <span className="ml-1 text-xs bg-gray-200 px-2 py-1 rounded-full">
                {category.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading conversations...</p>
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="p-8 text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'No conversations found' : 'No conversations yet'}
            </p>
            {!searchQuery && (
              <button
                onClick={onNewChat}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Start your first conversation
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => (
              <motion.div
                key={conversation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                  selectedConversation?.id === conversation.id 
                    ? 'bg-blue-50 border-r-4 border-blue-500' 
                    : ''
                }`}
                onClick={() => onSelectConversation(conversation)}
              >
                <div className="flex items-start space-x-3">
                  {/* Avatar */}
                  <div className="relative flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                      {conversation.conversation_type === 'group' ? (
                        <Hash className="w-6 h-6" />
                      ) : (
                        conversation.conversation_name?.charAt(0)?.toUpperCase() || '?'
                      )}
                    </div>
                    {/* Online status indicator */}
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(conversation)}`}></div>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-semibold text-gray-900 truncate">
                        {conversation.conversation_name}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {conversation.unread_count > 0 && (
                          <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-500 rounded-full min-w-[20px]">
                            {conversation.unread_count > 99 ? '99+' : conversation.unread_count}
                          </span>
                        )}
                        <button className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {/* Last message */}
                    {conversation.last_message_content && (
                      <div className="flex items-center space-x-2 mb-1">
                        {getConversationIcon(conversation)}
                        <p className="text-sm text-gray-600 truncate flex-1">
                          {conversation.last_message_content}
                        </p>
                      </div>
                    )}
                    
                    {/* Meta info */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {conversation.conversation_type === 'group' 
                          ? `${conversation.participants_count} members`
                          : 'Direct message'
                        }
                      </span>
                      {conversation.last_message_time && (
                        <span className="text-xs text-gray-400">
                          {formatDistanceToNow(new Date(conversation.last_message_time), { addSuffix: true })}
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
    </div>
  );
};

export default ConversationList;
