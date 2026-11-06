import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import PriceList from '../models/priceListModel.js';
import User from '../models/userModel.js';
import { createSystemNotification } from './notificationController.js';
import { suggestQuote } from '../utils/pricing.js';
import { validateQuoteInput, validateResponseInput, statusAfterResponse } from '../utils/quoteLogic.js';

const clientIp = (req) => String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.ip || 'unknown';

// @desc    Suggested quote from the price list
// @route   GET /api/orders/:id/quote/suggest
// @access  Manager
export const getSuggestedQuote = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const priceList = await PriceList.getCurrent();
  res.json({ ...suggestQuote(order, priceList), currency: priceList.currency });
});

// @desc    Send (or re-send) a quote to the client
// @route   PUT /api/orders/:id/quote
// @access  Manager
export const sendQuote = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  const { amount, note, required } = req.body || {};
  const errors = validateQuoteInput({ amount, note, required }, order);
  if (errors.length) {
    res.status(400);
    throw new Error(errors.join(' '));
  }

  const priceList = await PriceList.getCurrent();
  order.quote = {
    status: 'Sent',
    required: Boolean(required),
    amount: Math.round(Number(amount) * 100) / 100,
    currency: priceList.currency || 'EGP',
    note: note ? String(note).trim() : undefined,
    sentAt: new Date(),
    sentBy: req.user._id,
  };

  // A required quote parks a new order until the client answers; an optional one releases it again.
  if (order.quote.required && order.status === 'Submitted') order.status = 'Awaiting Approval';
  if (!order.quote.required && order.status === 'Awaiting Approval') order.status = 'Submitted';

  order.history.push({
    action: 'Quote Sent',
    user: req.user._id,
    details: `Quote of ${order.quote.amount} ${order.quote.currency} sent${order.quote.required ? ' (client approval required before work starts)' : ''}.`,
  });
  await order.save();

  await createSystemNotification(
    order.client,
    'You have a new quote',
    `Order ${order.orderNumber}: ${order.quote.amount} ${order.quote.currency}${order.quote.required ? '. Please approve it so we can start.' : '.'}`,
    'order',
    order._id,
    'info',
    `/client/orders/${order._id}`
  );
  res.json(order);
});

// @desc    Client approves or rejects the quote
// @route   PUT /api/orders/:id/quote/respond
// @access  Client (owner of the order)
export const respondToQuote = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order || String(order.client) !== String(req.user._id)) {
    res.status(404);
    throw new Error('Order not found');
  }
  const { decision, signedName, reason } = req.body || {};
  const errors = validateResponseInput({ decision, signedName, reason }, order);
  if (errors.length) {
    res.status(400);
    throw new Error(errors.join(' '));
  }

  const now = new Date();
  order.quote.respondedAt = now;
  if (decision === 'approve') {
    order.quote.status = 'Approved';
    order.quote.rejectionReason = undefined;
    order.quote.approval = {
      signedName: String(signedName).trim().slice(0, 120),
      ip: clientIp(req),
      at: now,
      amount: order.quote.amount,
    };
    order.cost.finalCost = order.quote.amount;
    order.cost.currency = order.quote.currency;
  } else {
    order.quote.status = 'Rejected';
    order.quote.rejectionReason = reason ? String(reason).trim().slice(0, 1000) : undefined;
  }
  order.status = statusAfterResponse(order, decision);
  order.history.push({
    action: decision === 'approve' ? 'Quote Approved' : 'Quote Rejected',
    user: req.user._id,
    details:
      decision === 'approve'
        ? `Client approved ${order.quote.amount} ${order.quote.currency}, signed as "${order.quote.approval.signedName}".`
        : `Client rejected the quote${order.quote.rejectionReason ? `: ${order.quote.rejectionReason}` : '.'}`,
  });
  await order.save();

  // Tell the managers and the assigned designer
  const managers = await User.find({ role: { $in: ['manager', 'admin'] }, isActive: true }).select('_id');
  const recipients = new Set(managers.map((m) => String(m._id)));
  if (order.assignedTo) recipients.add(String(order.assignedTo));
  await Promise.all(
    [...recipients].map((id) =>
      createSystemNotification(
        id,
        decision === 'approve' ? 'Quote approved' : 'Quote rejected',
        `Order ${order.orderNumber}: the client ${decision === 'approve' ? 'approved' : 'rejected'} the quote.`,
        'order',
        order._id,
        decision === 'approve' ? 'success' : 'warning',
        `/manager/orders/${order._id}`
      )
    )
  );
  res.json(order);
});

// @desc    Read the price list
// @route   GET /api/price-list
// @access  Manager
export const getPriceList = asyncHandler(async (req, res) => {
  res.json(await PriceList.getCurrent());
});

// @desc    Update the price list
// @route   PUT /api/price-list
// @access  Manager
export const updatePriceList = asyncHandler(async (req, res) => {
  const doc = await PriceList.getCurrent();
  const { ratePerCm2PerColor = {}, minimumCharge } = req.body || {};
  for (const key of ['t114', 't170', 't254']) {
    if (ratePerCm2PerColor[key] !== undefined) {
      const v = Number(ratePerCm2PerColor[key]);
      if (!(v >= 0)) {
        res.status(400);
        throw new Error('Rates must be zero or more.');
      }
      doc.ratePerCm2PerColor[key] = v;
    }
  }
  if (minimumCharge !== undefined) {
    const v = Number(minimumCharge);
    if (!(v >= 0)) {
      res.status(400);
      throw new Error('The minimum charge must be zero or more.');
    }
    doc.minimumCharge = v;
  }
  doc.updatedBy = req.user._id;
  await doc.save();
  res.json(doc);
});
