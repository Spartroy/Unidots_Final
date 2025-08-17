import React, { useState, useEffect, useRef, useContext } from 'react';
import { toast } from 'react-toastify';
import api from '../../utils/api';
import AuthContext from '../../context/AuthContext';
import {
  ChatBubbleLeftRightIcon,
  PaperAirplaneIcon,
  UserCircleIcon,
  CheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const OrderChat = ({ orderId, isVisible = true }) => {
  const { user } = useContext(AuthContext);
  const [chat, setChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (orderId && isVisible) {
      fetchOrCreateChat();
    }
  }, [orderId, isVisible]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchOrCreateChat = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/chats/order/${orderId}`);
      setChat(response.data);
      setMessages(response.data.messages || []);
      
      // Mark messages as read
      if (response.data._id) {
        await api.put(`/api/chats/${response.data._id}/read`);
      }
    } catch (error) {
      console.error('Error fetching chat:', error);
      if (error.response?.status === 403) {
        toast.error('You do not have permission to access this chat. Please contact your manager if you should be assigned to this order.');
      } else if (error.response?.status === 404) {
        toast.error('Order not found or chat could not be created.');
      } else {
        toast.error('Failed to load chat. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !chat) return;

    try {
      setSending(true);
      const response = await api.post(`/api/chats/${chat._id}/messages`, {
        content: newMessage.trim(),
        messageType: 'text'
      });

      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const isMyMessage = (message) => {
    return message.sender?._id === user.id || message.sender === user.id;
  };

  const getMessageStatusIcon = (message) => {
    if (isMyMessage(message)) {
      const isRead = message.readBy && message.readBy.some(read => read.user !== user.id);
      return isRead ? (
        <CheckIcon className="h-3 w-3 text-blue-500" />
      ) : (
        <ClockIcon className="h-3 w-3 text-gray-400" />
      );
    }
    return null;
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full min-h-[500px] sm:min-h-[600px] lg:min-h-[700px] flex flex-col">
      {/* Chat Header */}
      <div className="px-4 py-3 bg-gray-50 rounded-t-lg border-b border-gray-200 flex items-center">
        <ChatBubbleLeftRightIcon className="h-5 w-5 text-gray-400 mr-2" />
        <div>
          <h3 className="text-sm font-medium text-gray-900">Order Communication</h3>
          <p className="text-xs text-gray-500">
            {chat?.participants?.length || 0} participants
          </p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {loading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <ChatBubbleLeftRightIcon className="h-12 w-12 mb-2 text-gray-300" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Start a conversation about this order</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <div
              key={message.id || index}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'} mb-2`}
            >
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${
                message.messageType === 'system' 
                  ? 'bg-gray-100 text-gray-600 text-xs italic mx-auto rounded-md'
                  : isMyMessage(message)
                  ? 'bg-blue-500 text-white rounded-br-md'
                  : 'bg-gray-100 text-gray-900 rounded-bl-md'
              }`}>
                {/* Sender name for non-system, non-own messages */}
                {message.messageType !== 'system' && !isMyMessage(message) && (
                  <div className="flex items-center mb-1">
                    <UserCircleIcon className="h-4 w-4 mr-1 text-gray-500" />
                    <span className="text-xs font-medium text-gray-600">
                      {message.sender?.name || 'Unknown'}
                    </span>
                  </div>
                )}
                
                {/* Message content */}
                <div className="text-sm leading-relaxed">{message.content}</div>
                
                {/* Message time and status */}
                <div className={`flex items-center justify-end mt-1 text-xs ${
                  isMyMessage(message) ? 'text-blue-100' : 'text-gray-500'
                }`}>
                  <span className="mr-1">{formatTime(message.timestamp)}</span>
                  {getMessageStatusIcon(message)}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
        <form onSubmit={sendMessage} className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
            disabled={sending || !chat}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || !chat}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <PaperAirplaneIcon className="h-4 w-4" />
            )}
          </button>
        </form>
        
        {user.role === 'client' && (
          <p className="text-xs text-gray-500 mt-2">
            Chat directly with the employee assigned to your order
          </p>
        )}
        {user.role === 'employee' && (
          <p className="text-xs text-gray-500 mt-2">
            Communicate with the client about this order
          </p>
        )}
      </div>
    </div>
  );
};

export default OrderChat; 