import express from 'express';
const router = express.Router();
import {
  getOrCreateOrderChat,
  sendMessage,
  markMessagesAsRead,
  getUserChats,
  getChatById
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

// Get user's chats
router.route('/')
  .get(protect, getUserChats);

// Get or create chat for an order
router.route('/order/:orderId')
  .get(protect, getOrCreateOrderChat);

// Get chat by ID
router.route('/:chatId')
  .get(protect, getChatById);

// Send message to chat
router.route('/:chatId/messages')
  .post(protect, sendMessage);

// Mark messages as read
router.route('/:chatId/read')
  .put(protect, markMessagesAsRead);

export default router; 