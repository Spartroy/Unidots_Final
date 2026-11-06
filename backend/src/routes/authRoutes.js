import express from 'express';
const router = express.Router();
import {
  registerUser,
  loginUser,
} from '../controllers/authController.js';
import { loginLimiter, registerLimiter } from '../middleware/rateLimiters.js';

// Public routes
router.post('/login', loginLimiter, loginUser);

// Client registration is public, employee/manager registration requires manager privileges
router.post('/register', registerLimiter, registerUser);

export default router; 