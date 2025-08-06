import express from 'express';
const router = express.Router();
import {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} from '../controllers/notificationController.js';
import { protect, staff, manager } from '../middleware/authMiddleware.js';

// User notification routes
router.route('/')
  .get(protect, getUserNotifications)
  .post(protect, staff, createNotification);

// Mark all as read
router.route('/read-all')
  .put(protect, markAllAsRead);

// Single notification routes
router.route('/:id/read')
  .put(protect, markAsRead);

router.route('/:id')
  .delete(protect, deleteNotification);

export default router; 