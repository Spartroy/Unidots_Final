import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import { getAuditLog } from '../controllers/auditController.js';

const router = express.Router();
router.get('/', protect, manager, getAuditLog);

export default router;
