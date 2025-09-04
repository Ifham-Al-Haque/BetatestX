import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Users, X, Minimize2, Maximize2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';

const WelcomeChat = () => {
  const { user, userProfile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const [departments] = useState([
    'General', 'IT', 'HR', 'Drivers', 'CS', 'Finance', 'Operations'
  ]);
  const [selectedDepartment, setSelectedDepartment] = useState('General');

  // Sample welcome messages
  const welcomeMessages = [
    { id: 1, user: 'System', message: 'Welcome to UDrive Hub! 🚀', timestamp: new Date(), isSystem: true },
    { id: 2, user: 'System', message: 'This is a demo chat - in production, you\'ll have real-time messaging with your team! 💬', timestamp: new Date(), isSystem: true },
    { id: 3, user: 'System', message: 'Try sending a message below! 👇', timestamp: new Date(), isSystem: true }
  ];

  useEffect(() => {
    if (isOpen) {
      setMessages(welcomeMessages);
      scrollToBottom();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageData = {
      id: Date.now(),
      user: userProfile?.full_name || user?.email?.split('@')[0] || 'Anonymous',
      message: newMessage,
      timestamp: new Date(),
      department: selectedDepartment,
      userId: user?.id
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setIsTyping(false);

    // Simulate typing indicator for demo
    setTimeout(() => {
      const botResponse = {
        id: Date.now() + 1,
        user: 'UDrive Bot',
        message: getBotResponse(newMessage),
        timestamp: new Date(),
        isBot: true
      };
      setMessages(prev => [...prev, botResponse]);
    }, 1000 + Math.random() * 2000);
  };

  const getBotResponse = (message) => {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return 'Hello! 👋 How can I help you today?';
    } else if (lowerMessage.includes('help')) {
      return 'I\'m here to help! You can ask about features, navigation, or just chat with the team.';
    } else if (lowerMessage.includes('dashboard')) {
      return 'Great! The dashboard is your main hub for all operations. Click the dashboard button to access it!';
    } else if (lowerMessage.includes('feature')) {
      return 'We have many features! Fleet management, HR operations, analytics, and more. Explore the navigation!';
    } else if (lowerMessage.includes('thank')) {
      return 'You\'re welcome! 😊 Is there anything else you\'d like to know?';
    } else {
      const responses = [
        'That\'s interesting! Tell me more.',
        'Thanks for sharing that with the team!',
        'Great point! I\'ll make sure the team sees this.',
        'I appreciate your input!',
        'That\'s a good question. Let me know if you need help finding the answer!'
      ];
      return responses[Math.floor(Math.random() * responses.length)];
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (!isTyping) {
      setIsTyping(true);
    }
  };

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  if (!user) return null;

  return (
    <>
      {/* Chat Toggle Button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
        title="Team Chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed bottom-24 right-6 z-40 w-96 bg-white rounded-lg shadow-2xl border border-gray-200 transition-all duration-300 ${
          isMinimized ? 'h-16' : 'h-[500px]'
        }`}>
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#2FF9B5] to-[#2562CF] text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <MessageCircle className="w-5 h-5" />
              <div>
                <h3 className="font-semibold">Team Chat</h3>
                <p className="text-xs opacity-90">{onlineUsers.length + 1} online</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleMinimize}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title={isMinimized ? 'Maximize' : 'Minimize'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={toggleChat}
                className="p-1 hover:bg-white/20 rounded transition-colors"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <>
              {/* Department Selector */}
              <div className="p-3 border-b border-gray-200">
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 h-80">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.userId === user?.id ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg ${
                        msg.isSystem
                          ? 'bg-blue-50 text-blue-800 mx-auto text-center'
                          : msg.isBot
                          ? 'bg-gray-100 text-gray-800'
                          : msg.userId === user?.id
                          ? 'bg-[#2FF9B5] text-white'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {!msg.isSystem && (
                        <div className="text-xs opacity-75 mb-1">
                          {msg.user} • {msg.timestamp.toLocaleTimeString()}
                        </div>
                      )}
                      <div className="text-sm">{msg.message}</div>
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg">
                      <div className="text-sm">Typing...</div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="p-4 border-t border-gray-200">
                <form onSubmit={handleSendMessage} className="flex space-x-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={handleTyping}
                    placeholder="Type your message..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-[#2FF9B5] text-white rounded-lg hover:bg-[#25D4A3] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
};

export default WelcomeChat;
