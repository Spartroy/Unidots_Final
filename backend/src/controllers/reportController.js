import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import { buildClientReport } from '../utils/clientReport.js';

// @desc    The signed-in client's own monthly report
// @route   GET /api/orders/client-report?year=2026
// @access  Client
export const getClientReport = asyncHandler(async (req, res) => {
  const year = parseInt(req.query.year, 10) || new Date().getUTCFullYear();
  const orders = await Order.find({ client: req.user._id }).select('createdAt status quote cost');
  res.json(buildClientReport(orders, year));
});
