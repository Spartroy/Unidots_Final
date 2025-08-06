import express from 'express';
const router = express.Router();
import {
  createTask,
  getTasks,
  getTaskById,
  updateTask,
  deleteTask,
  completeTask,
  assignTask,
  getRecentTasks,
  getAssignedTasks,
  addTaskComment,
  getTaskComments,
  getTaskFiles
} from '../controllers/taskController.js';
import { protect, staff, manager } from '../middleware/authMiddleware.js';

// Dashboard routes
router.route('/recent')
  .get(protect, getRecentTasks);

router.route('/assigned')
  .get(protect, getAssignedTasks);

// Staff routes
router.route('/')
  .get(protect, getTasks);

router.route('/:id')
  .get(protect, getTaskById)
  .put(protect, updateTask);

router.route('/:id/complete')
  .put(protect, staff, completeTask);

// Manager routes
router.route('/')
  .post(protect, manager, createTask);

router.route('/:id')
  .delete(protect, manager, deleteTask);

router.route('/:id/assign')
  .put(protect, manager, assignTask);

// Comment routes
router.route('/:id/comments')
  .get(protect, getTaskComments)
  .post(protect, addTaskComment);

// File routes
router.route('/:id/files')
  .get(protect, getTaskFiles);

export default router;