import asyncHandler from 'express-async-handler';
import Notification from '../models/notificationModel.js';

// @desc    Create new notification
// @route   POST /api/notifications
// @access  Private
const createNotification = asyncHandler(async (req, res) => {
  const { title, message, type, entityType, entityId, user, link } = req.body;

  // Validation
  if (!title || !message || !entityType || !user) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Create notification
  const notification = await Notification.create({
    title,
    message,
    type: type || 'info',
    entityType,
    entityId: entityId || null,
    user,
    link: link || null
  });

  if (notification) {
    res.status(201).json(notification);
  } else {
    res.status(400);
    throw new Error('Invalid notification data');
  }
});

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = asyncHandler(async (req, res) => {
  const notifications = await Notification.find({ user: req.user.id })
    .sort({ createdAt: -1 });

  res.json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if notification belongs to user
  if (notification.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  notification.read = true;
  await notification.save();

  res.json(notification);
});

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
  await Notification.updateMany(
    { user: req.user.id, read: false },
    { read: true }
  );

  res.json({ message: 'All notifications marked as read' });
});

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    res.status(404);
    throw new Error('Notification not found');
  }

  // Check if notification belongs to user
  if (notification.user.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized');
  }

  await notification.remove();

  res.json({ message: 'Notification removed' });
});

// @desc    Create notification for event
// @route   Not exposed as API endpoint, used internally
// @access  Private
const createSystemNotification = async (
  userId,
  title,
  message,
  entityType,
  entityId,
  type = 'info',
  link = null
) => {
  try {
    await Notification.create({
      user: userId,
      title,
      message,
      type,
      entityType,
      entityId: entityId || null,
      link
    });
    return true;
  } catch (error) {
    console.error('Error creating system notification:', error);
    return false;
  }
};

export {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createSystemNotification
}; 