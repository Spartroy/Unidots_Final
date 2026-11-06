import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { buildManagerOverview } from '../utils/managerOverview.js';

// @desc    Numbers for the manager dashboard
// @route   GET /api/orders/overview
// @access  Manager
export const getManagerOverview = asyncHandler(async (req, res) => {
  const orders = await Order.find()
    .select('orderNumber title status deadline assignedTo client createdAt')
    .populate('client', 'name')
    .populate('assignedTo', 'name')
    .lean();
  res.json(buildManagerOverview(orders));
});
