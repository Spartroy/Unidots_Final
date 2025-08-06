import express from 'express';
const router = express.Router();
import {
  getAcidSolutionStatus,
  recordAcidUsage,
  refillAcidSolution,
  getUsageHistory,
  calculateAcidUsage,
  updateAcidSolutionSettings,
  getMonthlyReport
} from '../controllers/acidSolutionController.js';
import { protect, authorize, manager, prepressOrManager } from '../middleware/authMiddleware.js';

// Routes accessible to prepress staff and managers
router.route('/status')
  .get(protect, prepressOrManager, getAcidSolutionStatus);

router.route('/usage')
  .post(protect, prepressOrManager, recordAcidUsage);

router.route('/history')
  .get(protect, prepressOrManager, getUsageHistory);

router.route('/calculate')
  .post(protect, prepressOrManager, calculateAcidUsage);

router.route('/monthly-report')
  .get(protect, prepressOrManager, getMonthlyReport);

// Manager and Prepress routes
router.route('/refill')
  .post(protect, prepressOrManager, refillAcidSolution);

router.route('/settings')
  .put(protect, manager, updateAcidSolutionSettings);

export default router; 