import asyncHandler from 'express-async-handler';
import StockItem from '../models/stockItemModel.js';
import StockMovement from '../models/stockMovementModel.js';
import AcidSolution from '../models/acidSolutionModel.js';
import { isLow } from '../utils/inventoryLogic.js';

const solventSnapshot = async () => {
  try {
    const rec = await AcidSolution.getCurrentMonthRecord();
    const capacity = rec.barrelCapacity || 200;
    return {
      currentLiters: rec.currentLiters,
      totalBarrels: rec.totalBarrels,
      barrelCapacity: capacity,
      litersPerM2: rec.litersPerM2,
      // Low = less than one barrel left
      low: rec.currentLiters < capacity,
    };
  } catch (err) {
    return null;
  }
};

const withFlags = (item) => ({ ...item.toObject(), low: isLow(item) });

// @desc    Stock overview (plate material + solvent)
// @route   GET /api/inventory
// @access  Prepress or manager
export const getInventory = asyncHandler(async (req, res) => {
  const items = await StockItem.find().sort({ material: 1, thickness: 1 });
  res.json({ items: items.map(withFlags), solvent: await solventSnapshot() });
});

// @desc    Only the things running low (for the manager dashboard)
// @route   GET /api/inventory/low
// @access  Manager
export const getLowStock = asyncHandler(async (req, res) => {
  const items = (await StockItem.find({ isActive: true })).filter(isLow).map(withFlags);
  const solvent = await solventSnapshot();
  res.json({ items, solvent: solvent?.low ? solvent : null });
});

// @desc    Add a stock item (material + thickness)
// @route   POST /api/inventory
// @access  Manager
export const createStockItem = asyncHandler(async (req, res) => {
  const { material, thickness, quantity = 0, lowStockThreshold = 0 } = req.body || {};
  const exists = await StockItem.findOne({ material, thickness: Number(thickness) });
  if (exists) {
    res.status(400);
    throw new Error('That material and thickness is already in stock tracking.');
  }
  const item = await StockItem.create({
    material,
    thickness: Number(thickness),
    quantity: Number(quantity) || 0,
    lowStockThreshold: Math.max(0, Number(lowStockThreshold) || 0),
  });
  if (item.quantity) {
    await StockMovement.create({
      item: item._id,
      delta: item.quantity,
      reason: 'adjustment',
      user: req.user._id,
      note: 'Opening stock',
      quantityAfter: item.quantity,
    });
  }
  res.status(201).json(withFlags(item));
});

// @desc    Change the alert level or switch an item off
// @route   PUT /api/inventory/:id
// @access  Manager
export const updateStockItem = asyncHandler(async (req, res) => {
  const item = await StockItem.findById(req.params.id);
  if (!item) {
    res.status(404);
    throw new Error('Stock item not found');
  }
  if (req.body.lowStockThreshold !== undefined) item.lowStockThreshold = Math.max(0, Number(req.body.lowStockThreshold) || 0);
  if (req.body.isActive !== undefined) item.isActive = Boolean(req.body.isActive);
  await item.save();
  res.json(withFlags(item));
});

// @desc    Record stock received
// @route   POST /api/inventory/:id/receive
// @access  Manager
export const receiveStock = asyncHandler(async (req, res) => {
  const item = await StockItem.findById(req.params.id);
  const qty = Number(req.body?.quantity);
  if (!item) {
    res.status(404);
    throw new Error('Stock item not found');
  }
  if (!(qty > 0)) {
    res.status(400);
    throw new Error('The quantity received must be greater than 0.');
  }
  item.quantity = Math.round((item.quantity + qty) * 10000) / 10000;
  await item.save();
  await StockMovement.create({
    item: item._id,
    delta: qty,
    reason: 'received',
    user: req.user._id,
    note: req.body?.note,
    quantityAfter: item.quantity,
  });
  res.json(withFlags(item));
});

// @desc    Set the counted quantity (stock take)
// @route   POST /api/inventory/:id/adjust
// @access  Manager
export const adjustStock = asyncHandler(async (req, res) => {
  const item = await StockItem.findById(req.params.id);
  const counted = Number(req.body?.quantity);
  if (!item) {
    res.status(404);
    throw new Error('Stock item not found');
  }
  if (!Number.isFinite(counted)) {
    res.status(400);
    throw new Error('Enter the counted quantity.');
  }
  const delta = Math.round((counted - item.quantity) * 10000) / 10000;
  item.quantity = counted;
  await item.save();
  await StockMovement.create({
    item: item._id,
    delta,
    reason: 'adjustment',
    user: req.user._id,
    note: req.body?.note || 'Stock count',
    quantityAfter: item.quantity,
  });
  res.json(withFlags(item));
});

// @desc    History of one item
// @route   GET /api/inventory/:id/movements
// @access  Prepress or manager
export const getMovements = asyncHandler(async (req, res) => {
  const movements = await StockMovement.find({ item: req.params.id })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate('order', 'orderNumber')
    .populate('user', 'name');
  res.json(movements);
});
