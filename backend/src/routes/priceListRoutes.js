import express from 'express';
import { protect, manager } from '../middleware/authMiddleware.js';
import { getPriceList, updatePriceList } from '../controllers/quoteController.js';

const router = express.Router();
router.route('/').get(protect, manager, getPriceList).put(protect, manager, updatePriceList);

export default router;
