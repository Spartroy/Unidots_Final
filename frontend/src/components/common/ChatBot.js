import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import { 
  ChatBubbleLeftRightIcon, 
  PaperAirplaneIcon, 
  XMarkIcon,
  MagnifyingGlassIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

/**
 * Intelligent chatbot component for clients to search orders and view their status
 */
const ChatBot = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { type: 'bot', text: 'Hello! I can help you find information about your orders. You can ask me to search for an order by number or name.' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Focus input when chat opens
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleInputChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage = { type: 'user', text: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    
    // Show typing indicator
    setIsTyping(true);

    try {
      // Process the message
      const response = await processMessage(inputValue);
      
      // Add bot response
      setTimeout(() => {
        setIsTyping(false);
        setMessages(prev => [...prev, { type: 'bot', text: response.text, orders: response.orders }]);
      }, 500); // Small delay for natural feel
    } catch (error) {
      console.error('Error processing message:', error);
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        type: 'bot', 
        text: 'Sorry, I encountered an error while processing your request. Please try again later.' 
      }]);
    }
  };

  const processMessage = async (message) => {
    const lowerMessage = message.toLowerCase().trim();
    
    // Check if message is requesting recent orders
    if (lowerMessage.includes('recent orders') || 
        lowerMessage.includes('latest orders') || 
        lowerMessage.includes('show orders') || 
        lowerMessage.includes('my orders')) {
      return await getRecentOrders();
    }
    
    // Check if message is searching for an order
    if (lowerMessage.includes('order') || 
        lowerMessage.includes('find') || 
        lowerMessage.includes('search') || 
        lowerMessage.includes('status') ||
        lowerMessage.includes('#')) {
      
      // Extract potential order number or name
      let searchTerm = '';
      
      // Check for order number format (e.g., #12345)
      const orderNumberMatch = lowerMessage.match(/#(\w+)/);
      if (orderNumberMatch) {
        searchTerm = orderNumberMatch[1];
      } else {
        // Extract keywords after common phrases
        const afterFind = lowerMessage.match(/(?:find|search for|show me|look up|order|status of|about)\s+(.+)/i);
        if (afterFind) {
          searchTerm = afterFind[1].trim();
        } else {
          // Use the whole message as search term
          searchTerm = lowerMessage;
        }
      }
      
      // Clean up search term
      searchTerm = searchTerm.replace(/order(?:s)?|status|find|search|show me|for/gi, '').trim();
      
      if (searchTerm) {
        return await searchOrders(searchTerm);
      }
    }
    
    // Handle estimated completion requests
    if (lowerMessage.includes('when') || 
        lowerMessage.includes('completion') || 
        lowerMessage.includes('estimate') || 
        lowerMessage.includes('finish') || 
        lowerMessage.includes('ready') ||
        lowerMessage.includes('complete')) {
      
      // Try to extract order number if specified
      const orderNumberMatch = lowerMessage.match(/#(\w+)/);
      if (orderNumberMatch) {
        return await getEstimatedCompletion(orderNumberMatch[1]);
      } else {
        return { 
          text: 'To check the estimated completion time, please specify an order number. For example, "When will order #12345 be completed?"' 
        };
      }
    }
    
    // Handle other types of messages
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      return { 
        text: 'Hello! How can I help you today? You can ask me to find information about your orders.' 
      };
    }
    
    if (lowerMessage.includes('help')) {
      return { 
        text: 'I can help you find information about your orders. Try asking me something like:\n\n• "Find order #12345"\n• "What\'s the status of my order ABC123"\n• "Search for my logo design order"\n• "Show me my recent orders"' 
      };
    }
    
    if (lowerMessage.includes('thank')) {
      return { 
        text: 'You\'re welcome! Is there anything else I can help you with?' 
      };
    }
    
    // Default response for unrecognized messages
    return { 
      text: 'I\'m not sure I understand. You can ask me to find your orders by number or name. For example, "Find order #12345" or "What\'s the status of my logo design order?"' 
    };
  };

  const getRecentOrders = async () => {
    try {
      const response = await api.get('/api/orders/recent');
      const orders = response.data || [];
      
      if (orders.length === 0) {
        return { 
          text: 'You don\'t have any recent orders. Would you like to create a new order?' 
        };
      }
      
      return {
        text: `Here are your ${orders.length} most recent orders:`,
        orders: orders
      };
    } catch (error) {
      console.error('Error fetching recent orders:', error);
      return { 
        text: 'Sorry, I encountered an error while fetching your recent orders. Please try again later.' 
      };
    }
  };

  const getEstimatedCompletion = async (orderNumber) => {
    try {
      // Search for the specific order
      const response = await api.get(`/api/orders/chatbot?search=${encodeURIComponent(orderNumber)}`);
      const orders = response.data.orders || [];
      
      if (orders.length === 0) {
        return { 
          text: `I couldn't find any orders matching the number "${orderNumber}". Please check the order number and try again.` 
        };
      }
      
      const order = orders[0];
      
      if (order.status === 'Completed') {
        return {
          text: `Order #${order.orderNumber} has already been completed.`,
          orders: [order]
        };
      }
      
      if (order.estimatedCompletion) {
        const estimatedDate = new Date(order.estimatedCompletion);
        const formattedDate = estimatedDate.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        
        return {
          text: `Order #${order.orderNumber}: ${order.title} is estimated to be completed by ${formattedDate}.`,
          orders: [order]
        };
      } else {
        // Calculate a rough estimate based on status
        const baseMessage = `Order #${order.orderNumber}: ${order.title} is currently in "${order.status}" status.`;
        let estimateMessage = '';
        
        switch (order.status) {
          case 'Submitted':
            estimateMessage = 'We typically begin processing new orders within 1-2 business days.';
            break;
          case 'Designing':
            estimateMessage = 'The design phase usually takes 3-5 business days to complete.';
            break;
          case 'In Prepress':
            const progress = order.stages?.prepress?.progress || 0;
            if (progress > 0) {
              estimateMessage = `The prepress phase is ${Math.round(progress)}% complete and typically takes 5-7 business days total.`;
            } else {
              estimateMessage = 'The prepress phase typically takes 5-7 business days to complete.';
            }
            break;
          case 'Ready for Delivery':
            estimateMessage = 'Your order is ready and should be delivered within 1-3 business days.';
            break;
          default:
            estimateMessage = 'Our team is working on it and will update the estimated completion date soon.';
        }
        
        return {
          text: `${baseMessage} ${estimateMessage}`,
          orders: [order]
        };
      }
    } catch (error) {
      console.error('Error getting estimated completion:', error);
      return { 
        text: 'Sorry, I encountered an error while checking the estimated completion time. Please try again later.' 
      };
    }
  };

  const searchOrders = async (searchTerm) => {
    try {
      // Use the specialized chatbot API endpoint
      const response = await api.get(`/api/orders/chatbot?search=${encodeURIComponent(searchTerm)}`);
      const orders = response.data.orders || [];
      
      if (orders.length === 0) {
        return { 
          text: `I couldn't find any orders matching "${searchTerm}". Please check the order number or name and try again.` 
        };
      }
      
      if (orders.length === 1) {
        // Found exactly one order
        const order = orders[0];
        const nextStepInfo = order.nextStep ? `\n\nNext step: ${order.nextStep}` : '';
        const prepressProgress = order.stages?.prepress?.progress ? 
          `\nPrepress progress: ${Math.round(order.stages.prepress.progress)}%` : '';
        
        return {
          text: `I found order #${order.orderNumber}: ${order.title}\n\nCurrent status: ${order.status}${getOrderStageDetails(order)}${prepressProgress}${nextStepInfo}`,
          orders: [order]
        };
      }
      
      // Found multiple orders
      return {
        text: `I found ${orders.length} orders matching "${searchTerm}":`,
        orders: orders
      };
    } catch (error) {
      console.error('Error searching orders:', error);
      return { 
        text: 'Sorry, I encountered an error while searching for orders. Please try again later.' 
      };
    }
  };

  const getOrderStageDetails = (order) => {
    if (!order || !order.stages) return '';

    let details = '';
    
    // Add review stage details if applicable
    if (order.stages.review && order.stages.review.status !== 'N/A') {
      details += `\nReview: ${order.stages.review.status}`;
    }
    
    // Add prepress stage details if applicable
    if (order.stages.prepress && order.stages.prepress.status !== 'N/A') {
      details += `\nPrepress: ${order.stages.prepress.status}`;
      
      // Add prepress sub-processes if in progress
      if (order.stages.prepress.status === 'In Progress' && order.stages.prepress.subProcesses) {
        const subProcesses = order.stages.prepress.subProcesses;
        details += '\nPrepress steps:';
        if (subProcesses.ripping) details += `\n- Ripping: ${subProcesses.ripping.status}`;
        if (subProcesses.laserImaging) details += `\n- Laser Imaging: ${subProcesses.laserImaging.status}`;
        if (subProcesses.exposure) details += `\n- Exposure: ${subProcesses.exposure.status}`;
        if (subProcesses.washout) details += `\n- Washout: ${subProcesses.washout.status}`;
        if (subProcesses.drying) details += `\n- Drying: ${subProcesses.drying.status}`;
        if (subProcesses.finishing) details += `\n- Finishing: ${subProcesses.finishing.status}`;
      }
    }
    
    // Add production stage details if applicable
    if (order.stages.production && order.stages.production.status !== 'N/A') {
      details += `\nProduction: ${order.stages.production.status}`;
    }
    
    // Add delivery stage details if applicable
    if (order.stages.delivery && order.stages.delivery.status !== 'N/A') {
      details += `\nDelivery: ${order.stages.delivery.status}`;
      if (order.stages.delivery.trackingNumber) {
        details += `\nTracking: ${order.stages.delivery.trackingNumber}`;
      }
    }
    
    return details;
  };

  // Format chat message with support for newlines
  const formatChatMessage = (text) => {
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index !== text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <>
      {/* Chat toggle button */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 p-4 bg-primary-600 rounded-full shadow-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all z-40"
      >
        {isOpen ? (
          <XMarkIcon className="h-6 w-6 text-white" />
        ) : (
          <ChatBubbleLeftRightIcon className="h-6 w-6 text-white" />
        )}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-lg shadow-xl flex flex-col z-30 border border-gray-200">
          {/* Chat header */}
          <div className="px-4 py-3 bg-primary-600 text-white rounded-t-lg flex justify-between items-center">
            <div className="flex items-center">
              <ChatBubbleLeftRightIcon className="h-5 w-5 mr-2" />
              <h3 className="font-medium">Order Assistant</h3>
            </div>
            <button onClick={toggleChat} className="text-white hover:text-gray-200">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>

          {/* Chat messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="text-sm">{formatChatMessage(message.text)}</div>
                    
                    {/* Order results list */}
                    {message.orders && message.orders.length > 1 && (
                      <div className="mt-2 space-y-2">
                        {message.orders.map(order => (
                          <div key={order._id} className="bg-white p-2 rounded border border-gray-200 text-sm">
                            <div className="font-medium">#{order.orderNumber}: {order.title}</div>
                            <div className="text-xs flex justify-between mt-1">
                              <span>Status: {order.status}</span>
                              <Link 
                                to={`/client/orders/${order._id}`} 
                                className="text-primary-600 hover:text-primary-800"
                              >
                                View Details
                              </Link>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Single order result with link */}
                    {message.orders && message.orders.length === 1 && (
                      <div className="mt-2">
                        <Link 
                          to={`/client/orders/${message.orders[0]._id}`} 
                          className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
                        >
                          <span>View Order Details</span>
                          <span className="ml-1 text-xs">→</span>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="max-w-[80%] p-3 rounded-lg bg-gray-100 text-gray-800">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat input */}
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
              <input
                type="text"
                ref={inputRef}
                value={inputValue}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Ask about your orders..."
                className="flex-1 bg-transparent outline-none text-sm"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim()}
                className={`ml-2 ${!inputValue.trim() ? 'text-gray-400' : 'text-primary-600 hover:text-primary-800'}`}
              >
                <PaperAirplaneIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="text-xs text-gray-500 mt-1 px-1">
              Type a message to search for orders by number or name.
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot; 