import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, 
  Paperclip, 
  Smile, 
  Phone, 
  Video, 
  MoreVertical,
  ChevronLeft,
  Users,
  Hash,
  Lock,
  Image,
  File,
  Heart,
  ThumbsUp,
  MessageCircle,
  Reply,
  Edit,
  Trash,
  X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const ChatArea = ({ 
  conversation, 
  messages, 
  onSendMessage, 
  onBack,
  typingUsers = [],
  loading = false
}) => {
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const emojis = ['😊', '👍', '❤️', '🎉', '🔥', '👏', '🙌', '💯', '😎', '🚀'];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    onSendMessage(newMessage.trim(), replyTo);
    setNewMessage('');
    setReplyTo(null);
  };

  const handleFileUpload = (event) => {
    const files = event.target.files;
    if (files.length > 0) {
      // Handle file upload logic here
      console.log('Files to upload:', files);
    }
  };

  const handleReaction = (messageId, reactionType) => {
    // Handle reaction logic here
    console.log('Adding reaction:', reactionType, 'to message:', messageId);
  };

  const getMessageBubbleStyle = (isOwnMessage) => {
    return isOwnMessage
      ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white ml-auto'
      : 'bg-white text-gray-900 border border-gray-200';
  };

  const getConversationIcon = () => {
    if (conversation.conversation_type === 'group') return <Hash className="w-5 h-5" />;
    if (conversation.conversation_type === 'team') return <Lock className="w-5 h-5" />;
    return <Users className="w-5 h-5" />;
  };

  if (!conversation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <MessageCircle className="w-24 h-24 text-gray-300 mx-auto mb-6" />
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">Welcome to Chat</h2>
          <p className="text-gray-500">Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Chat Header */}
      <div className="bg-white border-b border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={onBack}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                {getConversationIcon()}
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {conversation.conversation_name}
                </h2>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  {getConversationIcon()}
                  <span>
                    {conversation.conversation_type === 'group' 
                      ? `${conversation.participants_count} members`
                      : conversation.conversation_type === 'team'
                      ? 'Team chat'
                      : 'Direct message'
                    }
                  </span>
                  {conversation.participants_count > 2 && (
                    <span className="text-green-600">• Active</span>
                  )}
                </div>
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
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center py-8">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              onReaction={handleReaction}
              onReply={() => setReplyTo(message)}
              isOwnMessage={message.sender?.id === conversation.currentUserId}
            />
          ))
        )}
        
        {/* Typing indicators */}
        {typingUsers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm">
                  {typingUsers.map(u => u.user?.full_name || 'Someone').join(', ')} 
                  {typingUsers.length === 1 ? ' is ' : ' are '} typing...
                </span>
              </div>
            </div>
          </motion.div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Reply Preview */}
      {replyTo && (
        <div className="bg-blue-50 border-t border-blue-200 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Reply className="w-4 h-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                Replying to {replyTo.sender?.full_name || 'Unknown'}
              </span>
            </div>
            <button
              onClick={() => setReplyTo(null)}
              className="text-blue-600 hover:text-blue-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-blue-700 mt-1 truncate">
            {replyTo.content}
          </p>
        </div>
      )}

      {/* Message Input */}
      <div className="bg-white border-t border-gray-200 p-4">
        <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
          {/* File Upload */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFileUpload}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          
          {/* Emoji Picker */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Smile className="w-5 h-5" />
            </button>
            
            <AnimatePresence>
              {showEmojiPicker && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute bottom-full right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10"
                >
                  <div className="grid grid-cols-5 gap-2">
                    {emojis.map((emoji, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => {
                          setNewMessage(prev => prev + emoji);
                          setShowEmojiPicker(false);
                        }}
                        className="w-8 h-8 text-xl hover:bg-gray-100 rounded transition-colors"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Message Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};

// Message Bubble Component
const MessageBubble = ({ message, onReaction, onReply, isOwnMessage }) => {
  const [showActions, setShowActions] = useState(false);

  const reactions = [
    { type: 'like', icon: ThumbsUp, label: 'Like' },
    { type: 'love', icon: Heart, label: 'Love' },
    { type: 'reply', icon: Reply, label: 'Reply' }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className="relative group">
        {/* Message Content */}
        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm ${
          getMessageBubbleStyle(isOwnMessage)
        }`}>
          {/* Reply Preview */}
          {message.reply_to && (
            <div className={`mb-2 p-2 rounded-lg text-xs ${
              isOwnMessage ? 'bg-blue-400 bg-opacity-30' : 'bg-gray-100'
            }`}>
              <div className="flex items-center space-x-2">
                <Reply className="w-3 h-3" />
                <span className="font-medium">
                  {message.reply_to.sender?.full_name || 'Unknown'}
                </span>
              </div>
              <p className="truncate">{message.reply_to.content}</p>
            </div>
          )}
          
          {/* Message Content */}
          <p className="text-sm leading-relaxed">{message.content}</p>
          
          {/* Message Meta */}
          <div className={`flex items-center justify-between mt-2 text-xs ${
            isOwnMessage ? 'text-blue-200' : 'text-gray-500'
          }`}>
            <span>{formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}</span>
            {message.is_edited && <span>• edited</span>}
          </div>
        </div>
        
        {/* Message Actions */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className={`absolute top-0 ${isOwnMessage ? 'right-full mr-2' : 'left-full ml-2'} bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10`}
            >
              <div className="flex space-x-1">
                {reactions.map((reaction) => (
                  <button
                    key={reaction.type}
                    onClick={() => onReaction(message.id, reaction.type)}
                    className="p-2 hover:bg-gray-100 rounded transition-colors"
                    title={reaction.label}
                  >
                    <reaction.icon className="w-4 h-4 text-gray-600" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className="flex items-center space-x-1 mt-2">
            {message.reactions.map((reaction, index) => (
              <span
                key={index}
                className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
              >
                {reaction.reaction_type} {reaction.user?.full_name}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

const getMessageBubbleStyle = (isOwnMessage) => {
  return isOwnMessage
    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
    : 'bg-white text-gray-900 border border-gray-200';
};

export default ChatArea;
