import asyncHandler from 'express-async-handler';
import Plate from '../models/plateModel.js';
import Order from '../models/orderModel.js';

// Helper: compute used and remaining areas in cm^2
const computePlateStats = (plate) => {
  const usableWidth = Math.max(0, plate.widthCm - (plate.marginLeftCm + plate.marginRightCm));
  const totalArea = plate.widthCm * plate.heightCm;
  const usableArea = usableWidth * plate.heightCm;
  const usedArea = plate.placements.reduce((sum, p) => sum + p.widthCm * p.heightCm, 0);
  const remainingArea = Math.max(0, usableArea - usedArea);
  const usedPct = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;
  const wastePct = totalArea > 0 ? (1 - usableArea / totalArea) * 100 : 0;
  return { totalArea, usableArea, usedArea, remainingArea, usedPct, wastePct };
};

// Simple first-fit placement algorithm scanning rows; accounts for left/right margins.
const findPlacementPosition = (plate, widthCm, heightCm) => {
  const marginLeft = plate.marginLeftCm;
  const marginRight = plate.marginRightCm;
  const usableX0 = marginLeft;
  const usableX1 = plate.widthCm - marginRight;
  const usableWidth = Math.max(0, usableX1 - usableX0);
  if (widthCm > usableWidth && heightCm > usableWidth) return null;

  const placedRects = plate.placements.map((p) => ({
    x: p.xCm,
    y: p.yCm,
    w: p.widthCm,
    h: p.heightCm,
  }));

  const candidatesY = new Set([0]);
  placedRects.forEach((r) => {
    candidatesY.add(r.y + r.h);
  });

  const fits = (x, y, w, h) => {
    if (x < usableX0) return false;
    if (x + w > usableX1) return false;
    if (y + h > plate.heightCm) return false;
    for (const r of placedRects) {
      const overlap = !(x + w <= r.x || r.x + r.w <= x || y + h <= r.y || r.y + r.h <= y);
      if (overlap) return false;
    }
    return true;
  };

  // Try without rotation first, then with rotation
  const tryDimensions = [
    { w: widthCm, h: heightCm, rotated: false },
    { w: heightCm, h: widthCm, rotated: true },
  ];

  for (const dim of tryDimensions) {
    if (dim.w > usableWidth && dim.h > usableWidth) continue;
    const sortedY = Array.from(candidatesY).sort((a, b) => a - b);
    for (const y of sortedY) {
      // Scan across usable width
      let x = usableX0;
      while (x + dim.w <= usableX1) {
        if (fits(x, y, dim.w, dim.h)) {
          return { xCm: x, yCm: y, widthCm: dim.w, heightCm: dim.h, rotated: dim.rotated };
        }
        // Move x to the right edge of the first overlapping rect at this y
        const blocking = placedRects
          .filter((r) => !(x + dim.w <= r.x || r.x + r.w <= x || y + dim.h <= r.y || r.y + r.h <= y))
          .sort((a, b) => a.x + a.w - (b.x + b.w));
        if (blocking.length === 0) {
          x += 1; // step by 1 cm
        } else {
          x = Math.max(x + 1, blocking[0].x + blocking[0].w);
        }
      }
    }
  }
  return null;
};

// Create a plate
const createPlate = asyncHandler(async (req, res) => {
  const { name, widthCm, heightCm, marginLeftCm = 2, marginRightCm = 2, material, materialThickness } = req.body;
  if (!widthCm || !heightCm) {
    res.status(400);
    throw new Error('widthCm and heightCm are required');
  }
  if (!material || !materialThickness) {
    res.status(400);
    throw new Error('material and materialThickness are required');
  }
  const plate = await Plate.create({ name, widthCm, heightCm, marginLeftCm, marginRightCm, material, materialThickness });
  res.status(201).json(plate);
});

// Get plates (optionally filter by status)
const getPlates = asyncHandler(async (req, res) => {
  const { status } = req.query;
  const query = status ? { status } : {};
  const plates = await Plate.find(query).sort({ createdAt: -1 });
  res.json(plates);
});

// Get plate by ID with stats
const getPlateById = asyncHandler(async (req, res) => {
  const plate = await Plate.findById(req.params.id).populate('placements.placedBy', 'name').populate('placements.order', 'orderNumber');
  if (!plate) {
    res.status(404);
    throw new Error('Plate not found');
  }
  const stats = computePlateStats(plate);
  res.json({ plate, stats });
});

// Simulate placement for a job size (cm)
const simulatePlacement = asyncHandler(async (req, res) => {
  const { widthCm, heightCm } = req.body;
  const plate = await Plate.findById(req.params.id);
  if (!plate) {
    res.status(404);
    throw new Error('Plate not found');
  }
  const pos = findPlacementPosition(plate, widthCm, heightCm);
  const stats = computePlateStats(plate);
  res.json({ fits: !!pos, position: pos, stats });
});

// Commit placement
const addPlacement = asyncHandler(async (req, res) => {
  const { widthCm, heightCm, orderId } = req.body;
  const plate = await Plate.findById(req.params.id);
  if (!plate) {
    res.status(404);
    throw new Error('Plate not found');
  }
  if (plate.status !== 'Active') {
    res.status(400);
    throw new Error('Plate is not active');
  }

  // If an orderId is provided, validate material and thickness compatibility
  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
    
    const orderMaterial = order.specifications?.material;
    const orderThickness = order.specifications?.materialThickness;
    
    if (orderMaterial !== plate.material) {
      res.status(400);
      throw new Error(`Order material (${orderMaterial}) does not match plate material (${plate.material})`);
    }
    
    if (orderThickness !== plate.materialThickness) {
      res.status(400);
      throw new Error(`Order thickness (${orderThickness}) does not match plate thickness (${plate.materialThickness})`);
    }
  }

  const pos = findPlacementPosition(plate, widthCm, heightCm);
  if (!pos) {
    res.status(400);
    throw new Error('Job does not fit on the plate');
  }
  plate.placements.push({
    order: orderId || undefined,
    widthCm: pos.widthCm,
    heightCm: pos.heightCm,
    xCm: pos.xCm,
    yCm: pos.yCm,
    rotated: pos.rotated,
    placedBy: req.user?._id,
  });
  await plate.save();
  const stats = computePlateStats(plate);
  res.status(201).json({ plate, stats, position: pos });
});

// Remove a placement by index
const removePlacement = asyncHandler(async (req, res) => {
  const { index } = req.body;
  const plate = await Plate.findById(req.params.id);
  if (!plate) {
    res.status(404);
    throw new Error('Plate not found');
  }
  if (index < 0 || index >= plate.placements.length) {
    res.status(400);
    throw new Error('Invalid placement index');
  }
  plate.placements.splice(index, 1);
  await plate.save();
  const stats = computePlateStats(plate);
  res.json({ plate, stats });
});

// Mark plate completed
const completePlate = asyncHandler(async (req, res) => {
  const plate = await Plate.findById(req.params.id);
  if (!plate) {
    res.status(404);
    throw new Error('Plate not found');
  }
  plate.status = 'Completed';
  plate.completedAt = new Date();
  await plate.save();
  res.json(plate);
});

// Historical stats simple aggregation
const getPlateStats = asyncHandler(async (req, res) => {
  const totalCount = await Plate.countDocuments();
  const completedCount = await Plate.countDocuments({ status: 'Completed' });
  const recent = await Plate.find().sort({ createdAt: -1 }).limit(10);
  res.json({ totalCount, completedCount, recent });
});

export {
  createPlate,
  getPlates,
  getPlateById,
  simulatePlacement,
  addPlacement,
  removePlacement,
  completePlate,
  getPlateStats,
};


