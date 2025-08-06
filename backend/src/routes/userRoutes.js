import express from 'express'
const router = express.Router();
import {
  getUserProfile,
  updateUserProfile,
  updateUserPassword,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  createEmployee,
  updateUserStatus,
  getDashboardStats
} from '../controllers/userController.js';
import { protect, authorize, manager } from '../middleware/authMiddleware.js';

// Protected routes
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

// Password update route
router.route('/profile/password')
  .put(protect, updateUserPassword);

// Dashboard stats route
router.route('/dashboard-stats')
  .get(protect, manager, getDashboardStats);

// Admin/Manager routes
router.route('/')
  .get(protect, manager, getUsers);

// Route for managers to create employees and get employees list
router.route('/employees')
  .get(protect, manager, getUsers) // Get employees with role filter
  .post(protect, manager, createEmployee);

router.route('/:id')
  .get(protect, manager, getUserById)
  .put(protect, manager, updateUser)
  .delete(protect, manager, deleteUser);

// Route for updating user status
router.route('/:id/status')
  .put(protect, manager, updateUserStatus);

export default router;