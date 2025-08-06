import express from 'express';
const router = express.Router();
import {
  registerUser,
  loginUser,
} from '../controllers/authController.js';
import { protect, manager } from '../middleware/authMiddleware.js';

// Public routes
router.post('/login', loginUser);

// Client registration is public, employee/manager registration requires manager privileges
router.post('/register', registerUser);

export default router; 