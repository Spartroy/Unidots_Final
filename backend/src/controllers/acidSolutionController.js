import asyncHandler from 'express-async-handler';
import AcidSolution from '../models/acidSolutionModel.js';
import Order from '../models/orderModel.js';

// @desc    Get current acid solution status
// @route   GET /api/acid-solution/status
// @access  Private (Prepress staff)
const getAcidSolutionStatus = asyncHandler(async (req, res) => {
  const solutionRecord = await AcidSolution.getCurrentMonthRecord();
  
  // Calculate additional metrics
  const maxCapacity = solutionRecord.totalBarrels * solutionRecord.barrelCapacity;
  const fillPercentage = Math.max(0, (solutionRecord.currentLiters / maxCapacity) * 100);
  const remainingBarrels = Math.floor(solutionRecord.currentLiters / solutionRecord.barrelCapacity);
  const estimatedDaysRemaining = solutionRecord.monthlyStats.totalLitersUsed > 0 
    ? Math.floor(solutionRecord.currentLiters / (solutionRecord.monthlyStats.totalLitersUsed / new Date().getDate()))
    : 30; // Default if no usage yet
  
  res.json({
    ...solutionRecord.toObject(),
    metrics: {
      maxCapacity,
      fillPercentage: Math.round(fillPercentage * 100) / 100,
      remainingBarrels,
      estimatedDaysRemaining: Math.max(0, estimatedDaysRemaining),
      efficiency: solutionRecord.recyclingRate * 100
    }
  });
});

// @desc    Record acid solution usage for an order
// @route   POST /api/acid-solution/usage
// @access  Private (Prepress staff)
const recordAcidUsage = asyncHandler(async (req, res) => {
  const { orderId, areaProcessed } = req.body;
  
  if (!areaProcessed || areaProcessed <= 0) {
    res.status(400);
    throw new Error('Area processed is required and must be greater than 0');
  }
  
  // Verify order exists if orderId is provided (for manual entries, orderId can be null)
  if (orderId) {
    const order = await Order.findById(orderId);
    if (!order) {
      res.status(404);
      throw new Error('Order not found');
    }
  }
  
  const solutionRecord = await AcidSolution.getCurrentMonthRecord();
  const usage = await solutionRecord.addUsage(orderId, areaProcessed);
  
  res.status(201).json({
    message: orderId ? 'Acid solution usage recorded for order' : 'Manual acid solution usage recorded',
    usage,
    remainingLiters: solutionRecord.currentLiters,
    orderType: orderId ? 'order-based' : 'manual-entry'
  });
});

// @desc    Add/refill acid solution barrels
// @route   POST /api/acid-solution/refill
// @access  Private (Manager/Prepress)
const refillAcidSolution = asyncHandler(async (req, res) => {
  const { barrelCount } = req.body;
  
  if (!barrelCount || barrelCount <= 0) {
    res.status(400);
    throw new Error('Valid barrel count is required');
  }
  
  const solutionRecord = await AcidSolution.getCurrentMonthRecord();
  await solutionRecord.refillBarrels(barrelCount);
  
  res.json({
    message: `${barrelCount} barrels added successfully`,
    totalBarrels: solutionRecord.totalBarrels,
    currentLiters: solutionRecord.currentLiters
  });
});

// @desc    Get acid solution usage history
// @route   GET /api/acid-solution/history
// @access  Private (Prepress staff)
const getUsageHistory = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();
  
  const solutionRecord = await AcidSolution.findOne({ 
    month: targetMonth, 
    year: targetYear 
  }).populate('usageHistory.orderId', 'orderNumber title client');
  
  if (!solutionRecord) {
    res.status(404);
    throw new Error('No solution records found for the specified period');
  }
  
  res.json({
    month: targetMonth,
    year: targetYear,
    usageHistory: solutionRecord.usageHistory,
    monthlyStats: solutionRecord.monthlyStats
  });
});

// @desc    Calculate acid usage for order area
// @route   POST /api/acid-solution/calculate
// @access  Private (Prepress staff)
const calculateAcidUsage = asyncHandler(async (req, res) => {
  const { length, width, lengthRepeat, widthRepeat } = req.body;
  
  if (!length || !width || !lengthRepeat || !widthRepeat) {
    res.status(400);
    throw new Error('All dimensions and repeat values are required');
  }
  
  // Calculate total area using the provided formula
  const totalLengthCm = length * lengthRepeat;
  const totalWidthCm = width * widthRepeat;
  const totalAreaM2 = (totalLengthCm * totalWidthCm) / 10000; // Convert cm² to m²
  
  const solutionRecord = await AcidSolution.getCurrentMonthRecord();
  const litersNeeded = totalAreaM2 * solutionRecord.litersPerM2;
  const estimatedCost = totalAreaM2 * solutionRecord.costPerSquareMeter;
  
  res.json({
    dimensions: {
      length,
      width,
      lengthRepeat,
      widthRepeat,
      totalLengthCm,
      totalWidthCm
    },
    calculations: {
      totalAreaM2: Math.round(totalAreaM2 * 1000) / 1000, // Round to 3 decimal places
      litersNeeded: Math.round(litersNeeded * 100) / 100, // Round to 2 decimal places
      estimatedCost: Math.round(estimatedCost * 100) / 100
    }
  });
});

// @desc    Update acid solution settings
// @route   PUT /api/acid-solution/settings
// @access  Private (Manager)
const updateAcidSolutionSettings = asyncHandler(async (req, res) => {
  const { 
    costPerBarrel, 
    recyclingCostPerBarrel, 
    costPerSquareMeter, 
    litersPerM2, 
    recyclingRate 
  } = req.body;
  
  const solutionRecord = await AcidSolution.getCurrentMonthRecord();
  
  if (costPerBarrel !== undefined) solutionRecord.costPerBarrel = costPerBarrel;
  if (recyclingCostPerBarrel !== undefined) solutionRecord.recyclingCostPerBarrel = recyclingCostPerBarrel;
  if (costPerSquareMeter !== undefined) solutionRecord.costPerSquareMeter = costPerSquareMeter;
  if (litersPerM2 !== undefined) solutionRecord.litersPerM2 = litersPerM2;
  if (recyclingRate !== undefined) solutionRecord.recyclingRate = recyclingRate;
  
  await solutionRecord.save();
  
  res.json({
    message: 'Acid solution settings updated successfully',
    settings: {
      costPerBarrel: solutionRecord.costPerBarrel,
      recyclingCostPerBarrel: solutionRecord.recyclingCostPerBarrel,
      costPerSquareMeter: solutionRecord.costPerSquareMeter,
      litersPerM2: solutionRecord.litersPerM2,
      recyclingRate: solutionRecord.recyclingRate
    }
  });
});

// @desc    Get monthly reports with acid solution costs
// @route   GET /api/acid-solution/monthly-report
// @access  Private (Manager/Prepress)
const getMonthlyReport = asyncHandler(async (req, res) => {
  const { month, year } = req.query;
  const currentDate = new Date();
  const targetMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
  const targetYear = year ? parseInt(year) : currentDate.getFullYear();
  
  const solutionRecord = await AcidSolution.findOne({ 
    month: targetMonth, 
    year: targetYear 
  });
  
  if (!solutionRecord) {
    return res.json({
      month: targetMonth,
      year: targetYear,
      acidSolutionCosts: 0,
      ordersProcessed: 0,
      totalAreaProcessed: 0,
      litersUsed: 0
    });
  }
  
  // Calculate monthly operational costs (not full barrel purchase cost)
  // Only count recycling costs and actual consumption costs for this month
  const monthlyRecyclingCosts = solutionRecord.recyclingFrequency * solutionRecord.recyclingCostPerBarrel;
  const monthlyProcessingCosts = solutionRecord.monthlyStats.totalCost || 0;
  const totalMonthlyAcidCosts = monthlyRecyclingCosts;
  
  res.json({
    month: targetMonth,
    year: targetYear,
    acidSolutionCosts: totalMonthlyAcidCosts, // Monthly recycling costs only
    processingCosts: monthlyProcessingCosts, // Costs from actual processing
    ordersProcessed: solutionRecord.monthlyStats.ordersProcessed,
    totalAreaProcessed: solutionRecord.monthlyStats.totalAreaProcessed,
    litersUsed: solutionRecord.monthlyStats.totalLitersUsed,
    efficiency: {
      recyclingRate: solutionRecord.recyclingRate,
      costPerM2: solutionRecord.costPerSquareMeter,
      actualLitersConsumed: solutionRecord.monthlyStats.totalLitersUsed * (1 - solutionRecord.recyclingRate)
    }
  });
});

export {
  getAcidSolutionStatus,
  recordAcidUsage,
  refillAcidSolution,
  getUsageHistory,
  calculateAcidUsage,
  updateAcidSolutionSettings,
  getMonthlyReport
}; 