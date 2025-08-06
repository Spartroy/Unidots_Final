import asyncHandler from 'express-async-handler';
import Chat from '../models/chatModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import { createSystemNotification } from './notificationController.js';

// @desc    Get or create chat for an order
// @route   GET /api/chats/order/:orderId
// @access  Private
const getOrCreateOrderChat = asyncHandler(async (req, res) => {
  const { orderId } = req.params;
  
  // Verify order exists
  const order = await Order.findById(orderId)
    .populate('client', 'name email role')
    .populate('assignedTo', 'name email role');
    
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check user permission to access this chat
  if (req.user.role === 'client' && order.client._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to access this chat');
  }
  
  // For employees, allow access more broadly - they can chat about orders they're working on
  // Only restrict if explicitly needed (e.g., sensitive orders)
  if (req.user.role === 'employee') {
    // For now, allow all employees to access chats
    // Later this can be refined based on business rules
    console.log(`Employee ${req.user.name} (${req.user.id}) accessing chat for order ${orderId}`);
    console.log(`Order assigned to: ${order.assignedTo}, Order stages assignments:`, {
      review: order.stages?.review?.assignedTo,
      prepress: order.stages?.prepress?.assignedTo,
      production: order.stages?.production?.assignedTo,
      delivery: order.stages?.delivery?.assignedTo
    });
    
    // Allow employee access - removed restrictive checks
    // Employees can communicate with clients about orders they're working on
  }

  // Find existing chat or create new one
  let chat = await Chat.findOne({ orderId })
    .populate('participants.user', 'name email role')
    .populate('messages.sender', 'name email role')
    .populate('lastMessage.sender', 'name email role');

  if (!chat) {
    // Create new chat
    const participants = [
      {
        user: order.client._id,
        role: 'client',
      }
    ];

    // Add the employee making the request if they're an employee
    if (req.user.role === 'employee') {
      participants.push({
        user: req.user.id,
        role: 'employee',
      });
    }

    // Also add assigned employee if exists and different from requesting employee
    if (order.assignedTo && order.assignedTo.toString() !== req.user.id) {
      participants.push({
        user: order.assignedTo._id,
        role: 'employee',
      });
    }

    chat = await Chat.create({
      orderId,
      participants,
      messages: [{
        sender: order.client._id,
        content: `Chat started for order #${order.orderNumber}: ${order.title}`,
        messageType: 'system',
      }],
    });

    // Populate the new chat
    chat = await Chat.findById(chat._id)
      .populate('participants.user', 'name email role')
      .populate('messages.sender', 'name email role')
      .populate('lastMessage.sender', 'name email role');
  } else {
    // If chat exists but employee is not a participant, add them
    const isParticipant = chat.participants.some(
      participant => participant.user._id.toString() === req.user.id
    );
    
    if (!isParticipant && req.user.role === 'employee') {
      chat.participants.push({
        user: req.user.id,
        role: req.user.role,
      });
      await chat.save();
      
      // Re-populate after adding participant
      chat = await Chat.findById(chat._id)
        .populate('participants.user', 'name email role')
        .populate('messages.sender', 'name email role')
        .populate('lastMessage.sender', 'name email role');
    }
  }

  res.json(chat);
});

// @desc    Send message to order chat
// @route   POST /api/chats/:chatId/messages
// @access  Private
const sendMessage = asyncHandler(async (req, res) => {
  const { chatId } = req.params;
  const { content, messageType = 'text' } = req.body;

  if (!content || content.trim() === '') {
    res.status(400);
    throw new Error('Message content is required');
  }

  const chat = await Chat.findById(chatId)
    .populate('participants.user', 'name email role')
    .populate('orderId', 'orderNumber title client assignedTo');

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(
    participant => participant.user._id.toString() === req.user.id
  );

  if (!isParticipant && req.user.role !== 'manager' && req.user.role !== 'admin' && req.user.role !== 'employee') {
    res.status(403);
    throw new Error('Not authorized to send messages in this chat');
  }

  // Add user as participant if they're an employee, manager, or admin and not already a participant
  if (!isParticipant && (req.user.role === 'manager' || req.user.role === 'admin' || req.user.role === 'employee')) {
    chat.participants.push({
      user: req.user.id,
      role: req.user.role,
    });
  }

  // Create new message
  const newMessage = {
    sender: req.user.id,
    content: content.trim(),
    messageType,
    timestamp: new Date(),
  };

  chat.messages.push(newMessage);

  // Update unread counts for other participants
  chat.participants.forEach(participant => {
    if (participant.user._id.toString() !== req.user.id) {
      const userId = participant.user._id.toString();
      const currentCount = chat.unreadCount.get(userId) || 0;
      chat.unreadCount.set(userId, currentCount + 1);
    }
  });

  await chat.save();

  // Populate the new message
  await chat.populate('messages.sender', 'name email role');
  const populatedMessage = chat.messages[chat.messages.length - 1];

  // Send notifications to other participants
  for (const participant of chat.participants) {
    if (participant.user._id.toString() !== req.user.id) {
      await createSystemNotification(
        participant.user._id,
        'New Message',
        `${req.user.name} sent a message about order #${chat.orderId.orderNumber}`,
        'order',
        chat.orderId._id,
        'info',
        `/${participant.role}/orders/${chat.orderId._id}?tab=chat`
      );
    }
  }

  res.status(201).json(populatedMessage);
});

// @desc    Mark messages as read
// @route   PUT /api/chats/:chatId/read
// @access  Private
const markMessagesAsRead = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId);

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Check if user is a participant
  const isParticipant = chat.participants.some(
    participant => participant.user.toString() === req.user.id
  );

  if (!isParticipant) {
    res.status(403);
    throw new Error('Not authorized to access this chat');
  }

  // Reset unread count for this user
  chat.unreadCount.set(req.user.id, 0);

  // Mark recent messages as read by this user
  const now = new Date();
  chat.messages.forEach(message => {
    const alreadyRead = message.readBy.some(
      read => read.user.toString() === req.user.id
    );
    
    if (!alreadyRead && message.sender.toString() !== req.user.id) {
      message.readBy.push({
        user: req.user.id,
        readAt: now,
      });
    }
  });

  await chat.save();

  res.json({ message: 'Messages marked as read' });
});

// @desc    Get user's chats
// @route   GET /api/chats
// @access  Private
const getUserChats = asyncHandler(async (req, res) => {
  let query = {};

  if (req.user.role === 'client') {
    // Clients can only see chats for their orders
    const orders = await Order.find({ client: req.user.id }).select('_id');
    const orderIds = orders.map(order => order._id);
    query.orderId = { $in: orderIds };
  } else if (req.user.role === 'employee') {
    // Employees can see chats for orders assigned to them
    query['participants.user'] = req.user.id;
  } else {
    // Managers and admins can see all chats
    query = {};
  }

  const chats = await Chat.find(query)
    .populate('orderId', 'orderNumber title status')
    .populate('participants.user', 'name email role')
    .populate('lastMessage.sender', 'name email role')
    .sort({ updatedAt: -1 });

  res.json(chats);
});

// @desc    Get chat by ID
// @route   GET /api/chats/:chatId
// @access  Private
const getChatById = asyncHandler(async (req, res) => {
  const { chatId } = req.params;

  const chat = await Chat.findById(chatId)
    .populate('orderId', 'orderNumber title status client assignedTo')
    .populate('participants.user', 'name email role')
    .populate('messages.sender', 'name email role')
    .populate('lastMessage.sender', 'name email role');

  if (!chat) {
    res.status(404);
    throw new Error('Chat not found');
  }

  // Check authorization
  const isParticipant = chat.participants.some(
    participant => participant.user._id.toString() === req.user.id
  );

  if (!isParticipant && req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to access this chat');
  }

  res.json(chat);
});

export {
  getOrCreateOrderChat,
  sendMessage,
  markMessagesAsRead,
  getUserChats,
  getChatById
}; 