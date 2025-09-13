import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Bot, 
  User, 
  X, 
  Minimize2, 
  Maximize2,
  Loader2,
  HelpCircle,
  Heart,
  MapPin,
  Calendar,
  Users,
  Sparkles,
  Zap,
  Shield,
  Phone,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { sendChatbotMessageWithRetry } from '../services/chatbotService';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: '👋 **Welcome to Life Link!** I\'m your AI-powered assistant, ready to help you with all things blood donation!\n\n**I can assist you with:**\n• 🩸 Blood donation eligibility & process\n• 🔍 Finding compatible donors nearby\n• 🆘 Creating emergency blood requests\n• 🏥 Locating donation centers\n• ❓ Answering health & safety questions\n\n**Try asking:** "How to donate blood?" or "Find nearby donors"\n\nHow can I help you today? 💙',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const quickActions = [
    {
      text: 'How to donate blood?',
      icon: <Heart className="h-4 w-4" />,
      category: 'donation'
    },
    {
      text: 'Find nearby donors',
      icon: <MapPin className="h-4 w-4" />,
      category: 'search'
    },
    {
      text: 'Create blood request',
      icon: <Users className="h-4 w-4" />,
      category: 'request'
    },
    {
      text: 'Check eligibility',
      icon: <Shield className="h-4 w-4" />,
      category: 'eligibility'
    },
    {
      text: 'Blood compatibility',
      icon: <Zap className="h-4 w-4" />,
      category: 'compatibility'
    },
    {
      text: 'Emergency request',
      icon: <Phone className="h-4 w-4" />,
      category: 'emergency'
    }
  ];

  const emergencyActions = [
    {
      text: '🚨 URGENT: Need blood now',
      icon: <Phone className="h-4 w-4" />,
      urgent: true
    },
    {
      text: '📞 Contact blood bank',
      icon: <Phone className="h-4 w-4" />,
      urgent: true
    }
  ];

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    setShowSuggestions(false);

    try {
      const data = await sendChatbotMessageWithRetry(message);

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.response || 'I apologize, but I\'m having trouble processing your request right now. Please try again later.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: '⚠️ **Connection Issue**\n\nI\'m experiencing technical difficulties. Here\'s what you can do:\n\n• 🔄 **Refresh the page** and try again\n• 🌐 **Check your internet connection**\n• 📞 **Contact support** directly\n• ⏰ **Try again** in a few moments\n\nI\'m here to help! 💙',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <>
      {/* Chatbot Toggle Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 ${
          isOpen ? 'hidden' : 'block'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
      >
        <div className="relative">
          <div className="bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 text-white p-3 sm:p-4 rounded-full shadow-2xl hover:shadow-3xl transition-all duration-300 border-2 border-white min-h-[44px] min-w-[44px] flex items-center justify-center">
            <MessageCircle className="h-5 w-5 sm:h-6 sm:w-6" />
          </div>
          <div className="absolute -top-1 -right-1 bg-green-500 text-white text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full animate-pulse">
            AI
          </div>
        </div>
      </motion.button>

      {/* Chatbot Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-gray-100 overflow-hidden ${
              isMinimized 
                ? 'w-72 sm:w-80 h-14 sm:h-16' 
                : 'w-[calc(100vw-2rem)] sm:w-[420px] h-[calc(100vh-2rem)] sm:h-[650px] max-w-[420px] max-h-[650px]'
            }`}
            initial={{ opacity: 0, scale: 0.8, y: 20, rotateY: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateY: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20, rotateY: 15 }}
            transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
          >
            {/* Header */}
            <div className="relative bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 text-white p-3 sm:p-4">
              <div className="absolute inset-0 bg-black bg-opacity-10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center space-x-2 sm:space-x-3">
                  <div className="relative">
                    <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center backdrop-blur-sm">
                      <Bot className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <div className="absolute -bottom-1 -right-1 h-3 w-3 sm:h-4 sm:w-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg">Life Link AI</h3>
                    <p className="text-xs text-pink-100 flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">AI-Powered Assistant</span>
                      <span className="sm:hidden">AI Assistant</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <motion.button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    {isMinimized ? <Maximize2 className="h-4 w-4" /> : <Minimize2 className="h-4 w-4" />}
                  </motion.button>
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 sm:p-2 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors backdrop-blur-sm min-h-[44px] min-w-[44px] flex items-center justify-center"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                  >
                    <X className="h-4 w-4" />
                  </motion.button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 h-[calc(100vh-280px)] sm:h-[450px] bg-gradient-to-b from-gray-50 to-white">
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, type: "spring" }}
                    >
                      <div className={`flex items-start space-x-2 sm:space-x-3 max-w-[90%] sm:max-w-[85%] ${
                        message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                      }`}>
                        <div className={`h-8 w-8 sm:h-9 sm:w-9 rounded-full flex items-center justify-center shadow-md ${
                          message.type === 'user' 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' 
                            : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
                        }`}>
                          {message.type === 'user' ? <User className="h-3 w-3 sm:h-4 sm:w-4" /> : <Bot className="h-3 w-3 sm:h-4 sm:w-4" />}
                        </div>
                        <div className={`rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm ${
                          message.type === 'user'
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                            : 'bg-white text-gray-800 border border-gray-100'
                        }`}>
                          <div className="prose prose-sm max-w-none">
                            <p className="text-xs sm:text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
                          </div>
                          <p className={`text-xs mt-1 sm:mt-2 flex items-center ${
                            message.type === 'user' ? 'text-blue-100' : 'text-gray-500'
                          }`}>
                            <Clock className="h-3 w-3 mr-1" />
                            {formatTime(message.timestamp)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <motion.div
                      className="flex justify-start"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-start space-x-2 sm:space-x-3">
                        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-full bg-gradient-to-r from-red-500 to-pink-500 flex items-center justify-center shadow-md">
                          <Bot className="h-3 w-3 sm:h-4 sm:w-4 text-white" />
                        </div>
                        <div className="bg-white rounded-xl sm:rounded-2xl px-3 py-2 sm:px-4 sm:py-3 shadow-sm border border-gray-100">
                          <div className="flex items-center space-x-2">
                            <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin text-red-500" />
                            <span className="text-xs sm:text-sm text-gray-600">AI is thinking...</span>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {showSuggestions && (
                  <div className="p-3 sm:p-4 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-white">
                    <div className="flex items-center justify-between mb-2 sm:mb-3">
                      <p className="text-xs sm:text-sm font-medium text-gray-700 flex items-center">
                        <Sparkles className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2 text-purple-500" />
                        <span className="hidden sm:inline">Quick Actions</span>
                        <span className="sm:hidden">Actions</span>
                      </p>
                      <motion.button
                        onClick={() => setShowSuggestions(false)}
                        className="text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <ChevronUp className="h-4 w-4" />
                      </motion.button>
                    </div>
                    
                    {/* Emergency Actions */}
                    <div className="mb-2 sm:mb-3">
                      <p className="text-xs text-red-600 font-medium mb-2 flex items-center">
                        <Phone className="h-3 w-3 mr-1" />
                        Emergency
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {emergencyActions.map((action, index) => (
                          <motion.button
                            key={index}
                            onClick={() => sendMessage(action.text)}
                            className="flex items-center space-x-2 px-3 py-2 text-xs bg-red-50 hover:bg-red-100 text-red-700 rounded-lg transition-colors border border-red-200 min-h-[44px]"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {action.icon}
                            <span className="font-medium text-left">{action.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>

                    {/* Regular Actions */}
                    <div>
                      <p className="text-xs text-gray-600 font-medium mb-2">General Help</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {quickActions.map((action, index) => (
                          <motion.button
                            key={index}
                            onClick={() => sendMessage(action.text)}
                            className="flex items-center space-x-2 p-2 sm:p-3 text-xs bg-white hover:bg-gray-50 rounded-lg transition-colors text-left border border-gray-100 shadow-sm min-h-[44px]"
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className={`p-1 rounded-full ${
                              action.category === 'emergency' ? 'bg-red-100 text-red-600' :
                              action.category === 'donation' ? 'bg-blue-100 text-blue-600' :
                              action.category === 'search' ? 'bg-green-100 text-green-600' :
                              action.category === 'request' ? 'bg-purple-100 text-purple-600' :
                              action.category === 'eligibility' ? 'bg-yellow-100 text-yellow-600' :
                              'bg-pink-100 text-pink-600'
                            }`}>
                              {action.icon}
                            </div>
                            <span className="font-medium text-gray-700 text-left">{action.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Show suggestions toggle when hidden */}
                {!showSuggestions && (
                  <div className="p-2 border-t border-gray-100 bg-gray-50">
                    <motion.button
                      onClick={() => setShowSuggestions(true)}
                      className="w-full flex items-center justify-center space-x-2 py-2 text-xs text-gray-600 hover:text-gray-800 transition-colors min-h-[44px]"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ChevronDown className="h-4 w-4" />
                      <span>Show quick actions</span>
                    </motion.button>
                  </div>
                )}

                {/* Input */}
                <div className="p-3 sm:p-4 border-t border-gray-100 bg-white">
                  <div className="flex items-center space-x-2 sm:space-x-3">
                    <div className="flex-1 relative">
                      <input
                        ref={inputRef}
                        type="text"
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Ask me anything about blood donation..."
                        className="w-full px-3 sm:px-4 py-2 sm:py-3 pr-10 sm:pr-12 border border-gray-200 rounded-xl sm:rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white text-sm sm:text-base min-h-[44px]"
                        disabled={isLoading}
                      />
                      {inputMessage && (
                        <motion.button
                          onClick={() => setInputMessage('')}
                          className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <X className="h-4 w-4" />
                        </motion.button>
                      )}
                    </div>
                    <motion.button
                      onClick={() => sendMessage()}
                      disabled={!inputMessage.trim() || isLoading}
                      className="p-2 sm:p-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-xl sm:rounded-2xl hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl min-h-[44px] min-w-[44px] flex items-center justify-center"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                    </motion.button>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                    <span className="hidden sm:inline">Press Enter to send</span>
                    <span className="sm:hidden">Enter to send</span>
                    <span className="flex items-center">
                      <Sparkles className="h-3 w-3 mr-1" />
                      <span className="hidden sm:inline">Powered by AI</span>
                      <span className="sm:hidden">AI</span>
                    </span>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Chatbot;
