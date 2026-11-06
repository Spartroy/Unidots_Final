import asyncHandler from 'express-async-handler';
import AuditLog from '../models/auditLogModel.js';
import Order from '../models/orderModel.js';
import { canViewOrder, isManager } from '../utils/orderVisibility.js';

const escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// @desc    Activity log with filters
// @route   GET /api/audit
// @access  Manager
export const getAuditLog = asyncHandler(async (req, res) => {
  const { entityType, entityId, actor, outcome, action, from, to } = req.query;
  const q = {};
  if (entityType) q.entityType = entityType;
  if (entityId) q.entityId = String(entityId);
  if (actor) q.actor = actor;
  if (outcome) q.outcome = outcome;
  if (action) q.action = { $regex: `^${escapeRegex(action)}` };
  if (from || to) {
    q.createdAt = {};
    if (from) q.createdAt.$gte = new Date(from);
    if (to) q.createdAt.$lte = new Date(to);
  }
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, parseInt(req.query.limit, 10) || 25);
  const [events, total] = await Promise.all([
    AuditLog.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    AuditLog.countDocuments(q),
  ]);
  res.json({ events, page, pages: Math.ceil(total / limit), total });
});

// Events that stay internal and are not shown to clients
const INTERNAL = /^(Stock|Courier Claimed)/;

// @desc    One order's timeline, trimmed for the caller's role
// @route   GET /api/orders/:id/timeline
// @access  Anyone who may see the order
export const getOrderTimeline = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id).populate('history.user', 'name role').select('client assignedTo status stages history orderNumber');
  if (!order || !canViewOrder(req.user, order)) {
    res.status(404);
    throw new Error('Order not found');
  }
  let entries = (order.history || []).map((h) => ({
    at: h.timestamp,
    action: h.action,
    details: h.details,
    actor: h.user ? { name: h.user.name, role: h.user.role } : null,
    source: 'order',
  }));
  if (req.user.role === 'client') entries = entries.filter((e) => !INTERNAL.test(e.action));
  if (req.user.role === 'courier') entries = entries.filter((e) => /^(Status|Courier|Shipment|Delivery)/.test(e.action));

  if (isManager(req.user)) {
    // Managers also see reads and denied attempts recorded in the activity log
    const extra = await AuditLog.find({ entityType: { $in: ['file', 'order', 'quote'] }, entityId: { $in: [String(order._id)] } }).sort({ createdAt: 1 });
    extra.forEach((e) =>
      entries.push({ at: e.createdAt, action: e.action, details: e.details, outcome: e.outcome, actor: e.actorName ? { name: e.actorName, role: e.actorRole } : null, source: 'audit' })
    );
  }
  entries.sort((a, b) => new Date(a.at) - new Date(b.at));
  res.json({ orderNumber: order.orderNumber, entries });
});
