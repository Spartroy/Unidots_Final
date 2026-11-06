import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import { submitContactMessage, getContactMessages, updateContactMessage } from '../controllers/contactController.js';

const router = express.Router();

router.route('/').post(submitContactMessage).get(protect, manager, getContactMessages);
router.route('/:id').put(protect, manager, updateContactMessage);

export default router;
