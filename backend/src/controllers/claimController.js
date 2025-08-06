import asyncHandler from 'express-async-handler';
import Claim from '../models/claimModel.js';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import { createSystemNotification } from './notificationController.js';
import File from '../models/fileModel.js';

// @desc    Create new claim
// @route   POST /api/claims
// @access  Private/Client
const createClaim = asyncHandler(async (req, res) => {
  const {
    order,
    title,
    description,
    claimType,
    severity,
  } = req.body;

  // Validation
  if (!order || !title || !description || !claimType) {
    res.status(400);
    throw new Error('Please provide all required fields');
  }

  // Check if order exists
  const orderExists = await Order.findById(order);
  if (!orderExists) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if client owns the order
  if (orderExists.client.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to create claim for this order');
  }

  // Generate claim number
  const date = new Date();
  const year = date.getFullYear().toString().substr(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const count = await Claim.countDocuments();
  const claimNumber = `CLM-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;

  try {
    // Create claim with manually generated claim number
    const claim = await Claim.create({
      claimNumber,
      order,
      client: req.user.id,
      title,
      description,
      claimType,
      severity: severity || 'Medium',
      status: 'Submitted',
      history: [
        {
          action: 'Claim Created',
          user: req.user.id,
          details: 'Claim submitted by client',
        },
      ],
    });

    if (claim) {
      // Create notification for managers about new claim
      const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
      for (const manager of managers) {
        await createSystemNotification(
          manager._id,
          'New Claim Filed',
          `${req.user.name} has filed a new claim: ${claim.title}`,
          'claim',
          claim._id,
          'warning',
          `/manager/claims/${claim._id}`
        );
      }
      
      res.status(201).json(claim);
    } else {
      res.status(400);
      throw new Error('Invalid claim data');
    }
  } catch (error) {
    console.error('Error creating claim:', error);
    res.status(400);
    if (error.name === 'ValidationError') {
      throw new Error(`Validation error: ${error.message}`);
    } else if (error.code === 11000) {
      // Handle duplicate key error (likely duplicate claim number)
      throw new Error('A claim with this number already exists. Please try again.');
    } else {
      throw new Error('Could not create claim. Please try again.');
    }
  }
});

// @desc    Get all claims
// @route   GET /api/claims
// @access  Private
const getClaims = asyncHandler(async (req, res) => {
  let query = {};

  // Filter claims based on user role
  if (req.user.role === 'client') {
    // Clients can only see their own claims
    query.client = req.user.id;
  } else if (req.user.role === 'employee') {
    // Employees can see claims assigned to them
    query.assignedTo = req.user.id;
  }
  // Managers and admins can see all claims

  // Apply filters if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  if (req.query.severity) {
    query.severity = req.query.severity;
  }

  if (req.query.claimType) {
    query.claimType = req.query.claimType;
  }

  if (req.query.order) {
    query.order = req.query.order;
  }

  // Filter by client - for managers viewing specific client's claims
  if (req.query.client && (req.user.role === 'manager' || req.user.role === 'admin')) {
    query.client = req.query.client;
  }

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  // Search by claim number or title
  if (req.query.search) {
    query.$or = [
      { claimNumber: { $regex: req.query.search, $options: 'i' } },
      { title: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const claims = await Claim.find(query)
    .populate('client', 'name email company')
    .populate('order', 'orderNumber title')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await Claim.countDocuments(query);

  res.json({
    claims,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Get claim by ID
// @route   GET /api/claims/:id
// @access  Private
const getClaimById = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id)
    .populate('client', 'name email company')
    .populate('order', 'orderNumber title status')
    .populate('assignedTo', 'name email')
    .populate('resolution.resolvedBy', 'name email')
    .populate('comments.author', 'name email')
    .populate({
      path: 'files',
      populate: {
        path: 'uploadedBy',
        select: 'name email role'
      }
    });

  if (claim) {
    // Check if user has permission to view this claim
    if (
      req.user.role === 'client' &&
      claim.client._id.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to view this claim');
    }

    if (
      req.user.role === 'employee' &&
      claim.assignedTo &&
      claim.assignedTo._id.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to view this claim');
    }

    res.json(claim);
  } else {
    res.status(404);
    throw new Error('Claim not found');
  }
});

// @desc    Update claim
// @route   PUT /api/claims/:id
// @access  Private
const updateClaim = asyncHandler(async (req, res) => {
  const claim = await Claim.findById(req.params.id);

  if (!claim) {
    res.status(404);
    throw new Error('Claim not found');
  }

  // Check permissions
  if (
    req.user.role === 'client' &&
    claim.client.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to update this claim');
  }

  // Clients can only update certain fields and only if claim is in certain statuses
  if (
    req.user.role === 'client' &&
    !['Submitted', 'Under Review'].includes(claim.status)
  ) {
    res.status(400);
    throw new Error('Claim cannot be modified at this stage');
  }

  // Update fields based on request body
  const updatedFields = {};
  
  // Fields that can be updated by clients
  if (req.user.role === 'client') {
    if (req.body.title) updatedFields.title = req.body.title;
    if (req.body.description) updatedFields.description = req.body.description;
    if (req.body.severity) updatedFields.severity = req.body.severity;
  } 
  // Fields that can be updated by employees and managers
  else {
    // Allow updating any field provided in the request
    Object.keys(req.body).forEach(key => {
      // Don't allow changing client or claimNumber
      if (key !== 'client' && key !== 'claimNumber' && key !== 'order') {
        updatedFields[key] = req.body[key];
      }
    });
  }

  // Add history entry
  const historyEntry = {
    action: 'Claim Updated',
    user: req.user.id,
    details: `Claim updated by ${req.user.role}`,
  };

  // Update the claim
  const updatedClaim = await Claim.findByIdAndUpdate(
    req.params.id,
    { 
      ...updatedFields,
      $push: { history: historyEntry } 
    },
    { new: true, runValidators: true }
  );

  res.json(updatedClaim);
});

// @desc    Update claim status
// @route   PUT /api/claims/:id/status
// @access  Private/Manager
const updateClaimStatus = asyncHandler(async (req, res) => {
  const { status, resolution } = req.body;
  const claim = await Claim.findById(req.params.id)
    .populate('client', 'name')
    .populate('order', 'orderNumber assignedTo');

  if (!claim) {
    res.status(404);
    throw new Error('Claim not found');
  }

  // Only employees and managers can update status
  if (req.user.role === 'client') {
    res.status(403);
    throw new Error('Not authorized to update claim status');
  }

  // Update fields
  claim.status = status;
  if (resolution) {
    claim.resolution = resolution;
  }

  if (status === 'Resolved' || status === 'Closed') {
    claim.resolvedAt = Date.now();
    claim.resolvedBy = req.user.id;
  }

  await claim.save();

  // Create notification for the client
  await createSystemNotification(
    claim.client._id.toString(),
    'Claim Status Update',
    `Your claim "${claim.title}" has been ${status.toLowerCase()}`,
    'claim',
    claim._id,
    status === 'Resolved' ? 'success' : 'info',
    `/client/claims/${claim._id}`
  );

  // If claim is assigned to an employee, notify them too (unless they made the change)
  if (claim.assignedTo && claim.assignedTo.toString() !== req.user.id) {
    await createSystemNotification(
      claim.assignedTo,
      'Claim Status Update',
      `Claim on order #${claim.order.orderNumber} has been updated to "${status}"`,
      'claim',
      claim._id,
      'info',
      `/employee/claims/${claim._id}`
    );
  }

  // If the order has an assigned employee, notify them as well
  if (claim.order && claim.order.assignedTo && 
      claim.order.assignedTo.toString() !== req.user.id &&
      (!claim.assignedTo || claim.assignedTo.toString() !== claim.order.assignedTo.toString())) {
    await createSystemNotification(
      claim.order.assignedTo,
      'Claim Status Update on Your Order',
      `A claim on order #${claim.order.orderNumber} has been updated to "${status}"`,
      'claim',
      claim._id,
      'info',
      `/employee/claims/${claim._id}`
    );
  }

  // If the update was made by employee, notify all managers
  if (req.user.role === 'employee') {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
    for (const manager of managers) {
      await createSystemNotification(
        manager._id,
        'Claim Status Updated by Employee',
        `${req.user.name} updated claim status to "${status}" for order #${claim.order.orderNumber}`,
        'claim',
        claim._id,
        'info',
        `/manager/claims/${claim._id}`
      );
    }
  }

  res.json(claim);
});

// @desc    Assign claim to employee
// @route   PUT /api/claims/:id/assign
// @access  Private/Manager
const assignClaim = asyncHandler(async (req, res) => {
  const { employeeId, notes } = req.body;
  
  if (!employeeId) {
    res.status(400);
    throw new Error('Please provide employee ID');
  }

  // Verify employee exists and is an employee
  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'employee') {
    res.status(400);
    throw new Error('Invalid employee ID');
  }

  const claim = await Claim.findById(req.params.id)
    .populate('client', 'name')
    .populate('order', 'orderNumber assignedTo');
    
  if (!claim) {
    res.status(404);
    throw new Error('Claim not found');
  }

  // Only managers can assign claims
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to assign claims');
  }

  // Update the assigned employee
  claim.assignedTo = employeeId;
  
  // Update status to Under Review if it's still in Submitted status
  if (claim.status === 'Submitted') {
    claim.status = 'Under Review';
  }
  
  // Add history entry
  claim.history.push({
    action: 'Assignment Updated',
    user: req.user.id,
    details: `Claim assigned to ${employee.name}${notes ? ': ' + notes : ''}`,
  });

  await claim.save();

  // Notify the assigned employee
  await createSystemNotification(
    employeeId,
    'New Claim Assignment',
    `You have been assigned to handle claim: ${claim.title} for order #${claim.order.orderNumber}`,
    'claim',
    claim._id,
    'info',
    `/employee/claims/${claim._id}`
  );

  // Notify the client
  await createSystemNotification(
    claim.client._id.toString(),
    'Claim Update',
    `Your claim "${claim.title}" has been assigned to an employee for review`,
    'claim',
    claim._id,
    'info',
    `/client/claims/${claim._id}`
  );

  // If there's an employee assigned to the related order, notify them too
  if (claim.order && claim.order.assignedTo && 
      claim.order.assignedTo.toString() !== employeeId) {
    await createSystemNotification(
      claim.order.assignedTo,
      'Claim Assignment Update',
      `A claim on your order #${claim.order.orderNumber} has been assigned to ${employee.name}`,
      'claim',
      claim._id,
      'info',
      `/employee/claims/${claim._id}`
    );
  }

  // Notify other managers
  const managers = await User.find({ 
    role: { $in: ['manager', 'admin'] },
    _id: { $ne: req.user.id }
  });

  for (const manager of managers) {
    await createSystemNotification(
      manager._id,
      'Claim Assignment Update',
      `${req.user.name} assigned ${employee.name} to handle claim for order #${claim.order.orderNumber}`,
      'claim',
      claim._id,
      'info',
      `/manager/claims/${claim._id}`
    );
  }

  res.json(claim);
});

// @desc    Add comment to claim
// @route   POST /api/claims/:id/comments
// @access  Private
const addComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    res.status(400);
    throw new Error('Comment content is required');
  }

  const claim = await Claim.findById(req.params.id)
    .populate('client', 'name')
    .populate('order', 'orderNumber title assignedTo')
    .populate('assignedTo', 'name');
  
  if (!claim) {
    res.status(404);
    throw new Error('Claim not found');
  }

  // Check authorization
  if (req.user.role === 'client' && claim.client._id.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to comment on this claim');
  }

  // Add the comment
  const newComment = {
    content,
    author: req.user._id,
    createdAt: Date.now(),
  };

  claim.comments.push(newComment);
  await claim.save();

  // Determine who added the comment for better notification messages
  const commentedBy = req.user.role === 'client' ? 'Client' : 
                     req.user.role === 'employee' ? 'Employee' : 'Manager';

  // Notify claim owner (client) if comment is from staff
  if (req.user.role !== 'client') {
    await createSystemNotification(
      claim.client.toString(),
      'New Comment on Your Claim',
      `${req.user.name} commented on your claim: ${claim.title}`,
      'claim',
      claim._id,
      'info',
      `/client/claims/${claim._id}`
    );
  }

  // Notify assigned employee if comment is not from them
  if (claim.assignedTo && claim.assignedTo._id.toString() !== req.user.id) {
    await createSystemNotification(
      claim.assignedTo._id.toString(),
      'New Comment on Claim',
      `${req.user.name} commented on claim for order #${claim.order.orderNumber}`,
      'claim',
      claim._id,
      'info',
      `/employee/claims/${claim._id}`
    );
  }

  // Notify order's assigned employee if different from claim assignee
  if (claim.order && claim.order.assignedTo && 
      claim.order.assignedTo.toString() !== req.user.id &&
      (!claim.assignedTo || claim.assignedTo._id.toString() !== claim.order.assignedTo.toString())) {
    await createSystemNotification(
      claim.order.assignedTo,
      'New Comment on Claim for Your Order',
      `${req.user.name} commented on a claim for order #${claim.order.orderNumber}`,
      'claim',
      claim._id,
      'info',
      `/employee/claims/${claim._id}`
    );
  }

  // Notify managers if comment is from client or employee
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
    for (const manager of managers) {
      await createSystemNotification(
        manager._id,
        `New Comment on Claim by ${commentedBy}`,
        `${req.user.name} commented on claim for order #${claim.order.orderNumber}`,
        'claim',
        claim._id,
        'info',
        `/manager/claims/${claim._id}`
      );
    }
  }

  res.status(201).json({
    _id: claim._id,
    comments: claim.comments,
  });
});

// @desc    Attach files to claim
// @route   PUT /api/claims/:id/attach-files
// @access  Private
const attachFilesToClaim = asyncHandler(async (req, res) => {
  const { fileIds } = req.body;
  
  if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
    res.status(400);
    throw new Error('Please provide at least one file ID');
  }

  const claim = await Claim.findById(req.params.id)
    .populate('client', 'name')
    .populate('order', 'orderNumber assignedTo');

  if (!claim) {
    res.status(404);
    throw new Error('Claim not found');
  }

  // Check authorization:
  // - Clients can only attach files to their own claims
  // - Employees can only attach files to claims assigned to them
  // - Managers can attach files to any claim
  let authorized = false;
  
  if (req.user.role === 'client' && claim.client._id.toString() === req.user.id) {
    authorized = true;
  } else if (req.user.role === 'employee' && claim.assignedTo && claim.assignedTo.toString() === req.user.id) {
    authorized = true;
  } else if (['manager', 'admin'].includes(req.user.role)) {
    authorized = true;
  }
  
  if (!authorized) {
    res.status(403);
    throw new Error('Not authorized to attach files to this claim');
  }
  
  // Add files to claim files array
  claim.files = [...new Set([...claim.files.map(id => id.toString()), ...fileIds])];
  
  // Add history entry
  claim.history.push({
    action: 'Files Attached',
    user: req.user.id,
    details: `${fileIds.length} file(s) attached by ${req.user.role === 'client' ? 'client' : req.user.name}`,
  });

  await claim.save();
  
  // Update relatedClaim field in each file
  for (const fileId of fileIds) {
    await File.findByIdAndUpdate(fileId, { 
      relatedClaim: claim._id,
      uploadedBy: req.user._id
    });
  }

  // Send notifications based on who uploaded the files
  if (req.user.role === 'client') {
    // Notify assigned employee if exists
    if (claim.assignedTo) {
      await createSystemNotification(
        claim.assignedTo.toString(),
        'Client Added Files to Claim',
        `${claim.client.name} added files to their claim: ${claim.title}`,
        'claim',
        claim._id,
        'info',
        `/employee/claims/${claim._id}`
      );
    }
    
    // Notify managers about client file upload
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
    for (const manager of managers) {
      await createSystemNotification(
        manager._id,
        'Client Added Files to Claim',
        `${claim.client.name} added files to their claim for order #${claim.order?.orderNumber || 'N/A'}`,
        'claim',
        claim._id,
        'info',
        `/manager/claims/${claim._id}`
      );
    }
  } else {
    // Notify the client when staff adds files
    await createSystemNotification(
      claim.client._id.toString(),
      'Files Added to Claim',
      `New files have been added to your claim: ${claim.title}`,
      'claim',
      claim._id,
      'info',
      `/client/claims/${claim._id}`
    );

    // Notify managers if uploaded by employee
    if (req.user.role === 'employee') {
      const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
      for (const manager of managers) {
        await createSystemNotification(
          manager._id,
          'Employee Added Files to Claim',
          `${req.user.name} added files to claim for order #${claim.order?.orderNumber || 'N/A'}`,
          'claim',
          claim._id,
          'info',
          `/manager/claims/${claim._id}`
        );
      }
    }
  }

  res.json(claim);
});

// @desc    Get recent claims
// @route   GET /api/claims/recent
// @access  Private/Manager/Admin
const getRecentClaims = asyncHandler(async (req, res) => {
  // Only managers and admins can view recent claims dashboard
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to view recent claims');
  }

  // Get recent claims (limit to 5)
  const claims = await Claim.find()
    .populate('client', 'name email company')
    .populate('order', 'orderNumber title')
    .populate('assignedTo', 'name email')
    .sort({ createdAt: -1 })
    .limit(5);

  res.json(claims);
});

export {
  createClaim,
  getClaims,
  getClaimById,
  updateClaim,
  updateClaimStatus,
  assignClaim,
  addComment,
  attachFilesToClaim,
  getRecentClaims,
};