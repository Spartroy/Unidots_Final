import express from 'express';
const router = express.Router();
import {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  assignOrderStage,
  assignOrder,
  calculateOrderCost,
  getClientStats,
  getRecentOrders,
  addOrderComment,
  cancelOrder,
  updatePrepressProcess,
  completePrepressStage,
  getChatbotOrderData,
  submitDesignToOrder,
  getMonthlyReports,
  downloadMonthlyReportsCSV
} from '../controllers/orderController.js';
import { protect, client, staff, manager, prepress, prepressOrManager } from '../middleware/authMiddleware.js';

// Client dashboard routes (must be defined before the /:id routes to avoid conflicts)
router.route('/client-stats')
  .get(protect, client, getClientStats);

router.route('/recent')
  .get(protect, getRecentOrders);

// Monthly reports routes (must be defined before the /:id routes to avoid conflicts)
router.route('/monthly-reports')
  .get(protect, manager, getMonthlyReports);

router.route('/monthly-reports/csv')
  .get(protect, manager, downloadMonthlyReportsCSV);

// Chatbot endpoint
router.route('/chatbot')
  .get(protect, client, getChatbotOrderData);

// Client routes
router.route('/')
  .post(protect, client, createOrder)
  .get(protect, getOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrder);

// Client cancel order route
router.route('/:id/cancel')
  .put(protect, client, cancelOrder);

// Staff routes
router.route('/:id/status')
  .put(protect, updateOrderStatus);

// Manager routes
router.route('/:id/assign')
  .put(protect, manager, assignOrder);

router.route('/:id/assign-stage')
  .put(protect, manager, assignOrderStage);

// Cost calculation route
router.route('/:id/cost')
  .post(protect, calculateOrderCost);

// Comment routes
router.route('/:id/comments')
  .post(protect, addOrderComment);

// Prepress routes
router.route('/:id/prepress-process')
  .put(protect, prepressOrManager, updatePrepressProcess);

// Complete prepress stage
router.route('/:id/prepress-complete')
  .put(protect, prepressOrManager, completePrepressStage);

// Template design submission route (employees)
router.route('/:id/submit-design')
  .post(protect, staff, submitDesignToOrder);

export default router;