import express from 'express';
import { protect, manager, prepressOrManager } from '../middleware/authMiddleware.js';
import {
  getInventory,
  getLowStock,
  createStockItem,
  updateStockItem,
  receiveStock,
  adjustStock,
  getMovements,
} from '../controllers/inventoryController.js';

const router = express.Router();

router.route('/').get(protect, prepressOrManager, getInventory).post(protect, manager, createStockItem);
router.get('/low', protect, manager, getLowStock);
router.put('/:id', protect, manager, updateStockItem);
router.post('/:id/receive', protect, manager, receiveStock);
router.post('/:id/adjust', protect, manager, adjustStock);
router.get('/:id/movements', protect, prepressOrManager, getMovements);

export default router;
