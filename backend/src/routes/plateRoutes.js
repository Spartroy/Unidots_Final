import express from 'express';
import { protect, prepressOrManager } from '../middleware/authMiddleware.js';
import {
  createPlate,
  getPlates,
  getPlateById,
  simulatePlacement,
  addPlacement,
  removePlacement,
  completePlate,
  getPlateStats,
} from '../controllers/plateController.js';

const router = express.Router();

router.route('/')
  .post(protect, prepressOrManager, createPlate)
  .get(protect, prepressOrManager, getPlates);

router.route('/stats')
  .get(protect, prepressOrManager, getPlateStats);

router.route('/:id')
  .get(protect, prepressOrManager, getPlateById);

router.route('/:id/simulate')
  .post(protect, prepressOrManager, simulatePlacement);

router.route('/:id/placements')
  .post(protect, prepressOrManager, addPlacement)
  .delete(protect, prepressOrManager, removePlacement);

router.route('/:id/complete')
  .put(protect, prepressOrManager, completePlate);

export default router;


