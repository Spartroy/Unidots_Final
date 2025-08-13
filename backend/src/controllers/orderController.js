import asyncHandler from 'express-async-handler';
import Order from '../models/orderModel.js';
import User from '../models/userModel.js';
import Claim from '../models/claimModel.js';
import { createSystemNotification } from './notificationController.js';
import mongoose from 'mongoose';

// @desc    Create new order
// @route   POST /api/orders
// @access  Private/Client
const createOrder = asyncHandler(async (req, res) => {
  console.log('Creating new order, request body:', req.body);
  
  const {
    title,
    description,
    orderType,
    specifications,
    deadline,
    priority,
  } = req.body;

  // Enhanced validation with specific error messages
  if (!title) {
    res.status(400);
    throw new Error('Order title is required');
  }
  
  if (!orderType) {
    res.status(400);
    throw new Error('Order type is required');
  }
  
  if (!specifications) {
    res.status(400);
    throw new Error('Order specifications are required');
  }
  
  if (!deadline) {
    res.status(400);
    throw new Error('Order deadline is required');
  }

  // Validate specifications
  if (!specifications.material) {
    res.status(400);
    throw new Error('Material specification is required');
  }
  
  if (!specifications.materialThickness) {
    res.status(400);
    throw new Error('Material thickness is required');
  }
  
  if (!specifications.dimensions || !specifications.dimensions.width || !specifications.dimensions.height) {
    res.status(400);
    throw new Error('Dimensions (width and height) are required');
  }
  
  if (!specifications.colors) {
    res.status(400);
    throw new Error('Number of colors is required');
  }
  
  if (!specifications.printingMode) {
    res.status(400);
    throw new Error('Printing mode is required');
  }
  
  // Optional: package type exists but not required
  if (specifications.packageType && ![
    'Central Seal',
    '2 Side Seal',
    '3 Side Seal',
    'Custom Pouch',
    'Label',
    'Other'
  ].includes(specifications.packageType)) {
    res.status(400);
    throw new Error('Invalid package type');
  }

  try {
    // Calculate estimated price
    let materialPriceFactor = 0.77; // Default to 1.7 thickness
    
    // Set material price factor based on thickness
    if (specifications.materialThickness === 1.14) {
      materialPriceFactor = 0.75;
    } else if (specifications.materialThickness === 1.7) {
      materialPriceFactor = 0.85;
    } else if (specifications.materialThickness === 2.54) {
      materialPriceFactor = 0.95;
    }
    
    // Count number of colors used (including custom colors)
    const cmykWeight = specifications.usedColors && specifications.usedColors.includes('CMYK Combined') ? 4 : 0;
    const otherColorsCount = specifications.usedColors ? specifications.usedColors.filter(c => c !== 'CMYK Combined').length : 0;
    const numberOfCustomColors = specifications.customColors?.length > 0 ? specifications.customColors.filter(color => color.trim() !== '').length : 0;
    const totalColorsUsed = Math.max(cmykWeight + otherColorsCount + numberOfCustomColors, 1);
    
    // Calculate total area with repeats
    const totalHeight = specifications.dimensions.height * (specifications.dimensions.heightRepeatCount || 1);
    const totalWidth = specifications.dimensions.width * (specifications.dimensions.widthRepeatCount || 1);
    
    // Calculate estimated price using the formula
    const estimatedPrice = ((totalHeight * totalWidth * totalColorsUsed) * materialPriceFactor).toFixed(2);
    
    // Generate order number
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await Order.countDocuments();
    const orderNumber = `ORD-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;

    console.log('Creating order with number:', orderNumber);

    // Create order with estimated price
    const order = await Order.create({
      orderNumber,
      title,
      description,
      orderType,
      specifications,
      deadline,
      priority: priority || 'Medium',
      client: req.user.id,
      cost: {
        estimatedCost: parseFloat(estimatedPrice),
        currency: 'USD'
      },
      history: [
        {
          action: 'Order Created',
          user: req.user.id,
          details: 'Order submitted by client',
        },
      ],
    });

    if (order) {
      console.log('Order created successfully:', order._id);
      
      // Auto-assign designer if client has a defaultDesigner set
      try {
        const clientUser = await User.findById(req.user.id);
        if (clientUser?.defaultDesigner) {
          const designer = await User.findById(clientUser.defaultDesigner);
          if (designer && designer.role === 'employee') {
            order.assignedTo = designer._id;
            order.history.push({
              action: 'Order Assigned',
              user: req.user.id,
              details: `Auto-assigned to ${designer.name} (client default designer)`
            });
            await order.save();
            // Notify the assigned designer
            await createSystemNotification(
              designer._id,
              'New Order Assignment',
              `You have been auto-assigned to order #${order.orderNumber}`,
              'order',
              order._id,
              'info',
              `/employee/orders/${order._id}`
            );
          }
        }
      } catch (autoAssignErr) {
        console.error('Auto-assign default designer failed:', autoAssignErr.message);
      }
      
      try {
        // Create notification for managers about new order
        const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
        for (const manager of managers) {
          await createSystemNotification(
            manager._id,
            'New Order Created',
            `${req.user.name} has submitted a new order: ${order.title}`,
            'order',
            order._id,
            'info',
            `/manager/orders/${order._id}`
          );
        }
      } catch (notifyError) {
        console.error('Error sending notifications:', notifyError);
        // Don't fail the request if notifications fail
      }
      
      res.status(201).json(order);
    } else {
      res.status(400);
      throw new Error('Failed to create order');
    }
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500);
    throw new Error(`Error creating order: ${error.message}`);
  }
});

// @desc    Designer declares ripping complete and moves order to Prepress
// @route   PUT /api/orders/:id/ripping-complete
// @access  Private/Employee
const completeRippingAndStartPrepress = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  // Must be assigned designer or manager/admin
  if (
    !(req.user.role === 'manager' || req.user.role === 'admin') &&
    order.assignedTo?.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Order not assigned to you');
  }
  // Ensure design is completed first
  if (order.status !== 'Design Done' && order.status !== 'Designing') {
    res.status(400);
    throw new Error('Complete the design before declaring ripping');
  }

  // Mark production subprocess ripping as completed
  if (!order.stages.production.subProcesses) {
    order.stages.production.subProcesses = { ripping: {} };
  }
  order.stages.production.subProcesses.ripping.status = 'Completed';
  order.stages.production.subProcesses.ripping.completedAt = Date.now();
  order.stages.production.subProcesses.ripping.completedBy = req.user._id;

  // Update production stage status to completed
  order.stages.production.status = 'Completed';
  if (!order.stages.production.completionDate) {
    order.stages.production.completionDate = Date.now();
  }

  // Move to Prepress
  order.status = 'In Prepress';
  order.stages.prepress.status = 'In Progress';
  if (!order.stages.prepress.startDate) {
    order.stages.prepress.startDate = Date.now();
  }

  order.history.push({
    action: 'Ripping Completed',
    user: req.user.id,
    details: 'Designer completed ripping and moved order to Prepress',
  });

  await order.save();
  res.json(order);
});

// @desc    Courier claims an order for delivery
// @route   PUT /api/orders/:id/courier/claim
// @access  Private/Courier
const courierClaimOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.status !== 'Ready for Delivery') {
    res.status(400);
    throw new Error('Order is not ready for delivery');
  }
  order.stages.delivery.courierInfo = order.stages.delivery.courierInfo || {};
  order.stages.delivery.courierInfo.courier = req.user._id;
  order.history.push({ action: 'Courier Claimed', user: req.user.id, details: 'Courier assigned themselves to the order' });
  await order.save();
  res.json(order);
});

// @desc    Courier updates delivery mode and details
// @route   PUT /api/orders/:id/courier/update
// @access  Private/Courier
const courierUpdateDelivery = asyncHandler(async (req, res) => {
  const { mode, destination, shipmentCompany, shipmentLabelFileId } = req.body;
  const order = await Order.findById(req.params.id);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  if (order.status !== 'Ready for Delivery' && order.stages.delivery.status !== 'In Progress') {
    res.status(400);
    throw new Error('Order not in delivery stage');
  }
  order.stages.delivery.courierInfo = order.stages.delivery.courierInfo || {};
  order.stages.delivery.courierInfo.mode = mode;
  order.stages.delivery.courierInfo.createdAt = new Date();
  if (mode === 'direct') {
    order.stages.delivery.courierInfo.destination = destination || {};
  } else if (mode === 'shipping-company') {
    order.stages.delivery.courierInfo.shipmentCompany = shipmentCompany || '';
    if (shipmentLabelFileId) {
      order.stages.delivery.courierInfo.shipmentLabelFileId = shipmentLabelFileId;
    }
  }
  order.history.push({ action: 'Courier Update', user: req.user.id, details: `Courier set mode: ${mode}` });
  await order.save();
  res.json(order);
});

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private
const getOrders = asyncHandler(async (req, res) => {
  let query = {};

  // Filter orders based on user role
  if (req.user.role === 'client') {
    // Clients can only see their own orders
    query.client = req.user.id;
  } else if (req.user.role === 'employee') {
    // Employees can see orders assigned to them
    query = {
      $or: [
        { assignedTo: req.user.id },
        { 'stages.review.assignedTo': req.user.id },
        { 'stages.prepress.assignedTo': req.user.id },
        { 'stages.production.assignedTo': req.user.id },
        { 'stages.delivery.assignedTo': req.user.id },
      ],
    };
  }
  // Managers and admins can see all orders

  // Apply filters if provided
  if (req.query.status) {
    query.status = req.query.status;
  }

  // Support status[ne] for excluding statuses
  if (req.query['status[ne]']) {
    query.status = { $ne: req.query['status[ne]'] };
  }

  if (req.query.priority) {
    query.priority = req.query.priority;
  }

  if (req.query.orderType) {
    query.orderType = req.query.orderType;
  }

  // Filter by client
  if (req.query.client) {
    query.client = req.query.client;
  }

  // Filter by assigned employee
  if (req.query.assignedTo) {
    if (req.query.assignedTo === 'not_null') {
      query.assignedTo = { $ne: null };
    } else if (req.query.assignedTo !== 'null') {
      query.assignedTo = req.query.assignedTo;
    }
  }

  // Support assignedTo[ne] for excluding null assignments
  if (req.query['assignedTo[ne]']) {
    if (req.query['assignedTo[ne]'] === 'null') {
      query.assignedTo = { $ne: null };
    }
  }

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    query.createdAt = {
      $gte: new Date(req.query.startDate),
      $lte: new Date(req.query.endDate),
    };
  }

  // Search by order number or title
  if (req.query.search) {
    query.$or = [
      { orderNumber: { $regex: req.query.search, $options: 'i' } },
      { title: { $regex: req.query.search, $options: 'i' } },
    ];
  }

  // Filter orders that have delivery method chosen
  if (req.query.hasDeliveryMethod === 'true') {
    query['stages.delivery.courierInfo.mode'] = { $exists: true, $ne: null };
  }

  // Pagination
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  const orders = await Order.find(query)
    .populate('client', 'name email company')
    .populate('assignedTo', 'name email department')
    .populate('stages.prepress.subProcesses.positioning.completedBy', 'name')
    .populate('stages.prepress.subProcesses.laserImaging.completedBy', 'name')
    .populate('stages.prepress.subProcesses.exposure.completedBy', 'name')
    .populate('stages.prepress.subProcesses.washout.completedBy', 'name')
    .populate('stages.prepress.subProcesses.drying.completedBy', 'name')
    .populate('stages.prepress.subProcesses.finishing.completedBy', 'name')
    .sort({ createdAt: -1 })
    .skip(startIndex)
    .limit(limit);

  // Get total count for pagination
  const total = await Order.countDocuments(query);

  res.json({
    orders,
    page,
    pages: Math.ceil(total / limit),
    total,
  });
});

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client', 'name email company phone address geoLocation')
    .populate('assignedTo', 'name email department position')
    .populate('stages.review.assignedTo', 'name email')
    .populate('stages.prepress.assignedTo', 'name email')
    .populate('stages.prepress.subProcesses.positioning.completedBy', 'name email department')
    .populate('stages.prepress.subProcesses.laserImaging.completedBy', 'name email department')
    .populate('stages.prepress.subProcesses.exposure.completedBy', 'name email department')
    .populate('stages.prepress.subProcesses.washout.completedBy', 'name email department')
    .populate('stages.prepress.subProcesses.drying.completedBy', 'name email department')
    .populate('stages.prepress.subProcesses.finishing.completedBy', 'name email department')
    .populate('stages.production.assignedTo', 'name email')
    .populate('stages.delivery.assignedTo', 'name email')
    .populate({
      path: 'files',
      populate: {
        path: 'uploadedBy',
        select: 'name email role'
      }
    })
    .populate('comments.author', 'name email role');

  if (order) {
    // Check if user has permission to view this order
    if (
      req.user.role === 'client' &&
      order.client._id.toString() !== req.user.id
    ) {
      res.status(403);
      throw new Error('Not authorized to view this order');
    }

    res.json(order);
  } else {
    res.status(404);
    throw new Error('Order not found');
  }
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private
const updateOrder = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check permissions
  if (
    req.user.role === 'client' &&
    order.client.toString() !== req.user.id
  ) {
    res.status(403);
    throw new Error('Not authorized to update this order');
  }

  // Clients can only update certain fields and only if order is in certain statuses
  if (
    req.user.role === 'client' &&
    !['Submitted', 'In Review'].includes(order.status)
  ) {
    res.status(400);
    throw new Error('Order cannot be modified at this stage');
  }

  // Update fields based on request body
  const updatedFields = {};
  
  // Fields that can be updated by clients
  if (req.user.role === 'client') {
    if (req.body.title) updatedFields.title = req.body.title;
    if (req.body.description) updatedFields.description = req.body.description;
    if (req.body.specifications) updatedFields.specifications = req.body.specifications;
  } 
  // Fields that can be updated by employees and managers
  else {
    // Allow updating any field provided in the request
    Object.keys(req.body).forEach(key => {
      // Don't allow changing client or orderNumber
      if (key !== 'client' && key !== 'orderNumber') {
        updatedFields[key] = req.body[key];
      }
    });
  }

  // Add history entry
  const historyEntry = {
    action: 'Order Updated',
    user: req.user.id,
    details: `Order updated by ${req.user.role}`,
  };

  // Update the order
  const updatedOrder = await Order.findByIdAndUpdate(
    req.params.id,
    { 
      ...updatedFields,
      $push: { history: historyEntry } 
    },
    { new: true, runValidators: true }
  );

  res.json(updatedOrder);
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
const updateOrderStatus = asyncHandler(async (req, res) => {
  console.log('========== UPDATE ORDER STATUS START ==========');
  console.log('Update request details:', {
    orderId: req.params.id,
    requestedStatus: req.body.status,
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role
    }
  });
  
  const { status, notes } = req.body;
  
  // Log the entire request body for debugging
  console.log('Request body:', req.body);
  
  const order = await Order.findById(req.params.id).populate('files');

  if (!order) {
    console.log('Order not found with ID:', req.params.id);
    res.status(404);
    throw new Error('Order not found');
  }
  
  console.log('Current order details:', {
    orderStatus: order.status,
    orderStages: {
      review: order.stages.review.status,
      prepress: order.stages.prepress.status,
      delivery: order.stages.delivery.status
    },
    clientId: order.client.toString()
  });

  // Special case for clients marking order as delivered or completed
  if (req.user.role === 'client' && (status === 'Delivered' || status === 'Completed')) {
    console.log('Client marking order as completed');
    
    // Check if order is in Ready for Delivery status
    if (order.status !== 'Ready for Delivery') {
      console.log('Error: Order not ready for completion. Current status:', order.status);
      res.status(403);
      throw new Error('Orders can only be marked as completed when they are Ready for Delivery');
    }

    // Verify client owns the order
    if (order.client.toString() !== req.user.id) {
      console.log('Error: Client does not own this order. Order client:', order.client.toString(), 'Request user:', req.user.id);
      res.status(403);
      throw new Error('You can only mark your own orders as completed');
    }

    console.log('Client allowed to mark order as completed');

    // Always update order status to Completed for consistency
    order.status = 'Completed';
    
    // Mark delivery as completed
    order.stages.delivery.status = 'Completed';
    if (!order.stages.delivery.completionDate) {
      order.stages.delivery.completionDate = Date.now();
    }
    
    // Add history entry
    order.history.push({
      action: 'Status Updated',
      user: req.user.id,
      details: 'Order marked as Completed by client',
    });
  }

  // Handle "Design Done" status specifically for employees
  else if (req.user.role === 'employee' && status === 'Design Done') {
    console.log('Employee marking design as completed');
    
    // Fetch fresh order data with populated files to ensure we have the latest files
    const freshOrder = await Order.findById(req.params.id)
      .populate({
        path: 'files',
        populate: {
          path: 'uploadedBy',
          select: 'name email role'
        }
      });
    
    // Check if order has associated files uploaded by this employee
    const hasCompletionFiles = freshOrder.files && freshOrder.files.length > 0 && freshOrder.files.some(file => {
      // Check if the file was uploaded by the current employee
      const uploadedByCurrentUser = file.uploadedBy && 
        (file.uploadedBy._id 
          ? file.uploadedBy._id.toString() === req.user.id 
          : file.uploadedBy.toString() === req.user.id);
      
      // Check if it's a completion file (design file or has completion-related notes)
      const isCompletionFile = file.fileType === 'design' || 
        (file.notes && (
          file.notes.toLowerCase().includes('final') || 
          file.notes.toLowerCase().includes('complete') ||
          file.notes.toLowerCase().includes('finished')
        ));
      
      return uploadedByCurrentUser && isCompletionFile;
    });
    
    // Check if order has design links added by this employee
    const hasDesignLinks = freshOrder.designLinks && freshOrder.designLinks.length > 0 && 
      freshOrder.designLinks.some(designLink => 
        designLink.addedBy && designLink.addedBy.toString() === req.user.id
      );
    
    console.log('Checking for completion files or design links:', {
      hasFiles: !!freshOrder.files && freshOrder.files.length > 0,
      filesCount: freshOrder.files?.length || 0,
      hasDesignLinks: !!freshOrder.designLinks && freshOrder.designLinks.length > 0,
      designLinksCount: freshOrder.designLinks?.length || 0,
      employeeId: req.user.id,
      hasCompletionFiles,
      hasDesignLinks,
      files: freshOrder.files?.map(f => ({
        id: f._id,
        uploadedBy: f.uploadedBy?._id || f.uploadedBy,
        isCurrentUser: f.uploadedBy?._id?.toString() === req.user.id || f.uploadedBy?.toString() === req.user.id,
        fileType: f.fileType,
        notes: f.notes
      })),
      designLinks: freshOrder.designLinks?.map(dl => ({
        link: dl.link,
        addedBy: dl.addedBy,
        isCurrentUser: dl.addedBy?.toString() === req.user.id
      }))
    });
    
    if (!hasCompletionFiles && !hasDesignLinks) {
      res.status(400);
      throw new Error('You must upload completion files OR provide a design link before marking a design as completed');
    }
    
    // Update order status to Design Done
    order.status = 'Design Done';
    
    // Mark production/design stage as completed
    order.stages.production.status = 'Completed';
    if (!order.stages.production.completionDate) {
      order.stages.production.completionDate = Date.now();
    }
    
    // Add history entry
    order.history.push({
      action: 'Status Updated',
      user: req.user.id,
      details: 'Design stage completed by employee',
    });
  }
  // For all other cases, only staff can update status
  else if (req.user.role === 'client') {
    res.status(403);
    throw new Error('Not authorized to update order status');
  }

  // Special handling for employees marking an order as completed (legacy handling)
  else if (status === 'Completed' && req.user.role === 'employee') {
    // Convert this to Design Done since employees should mark design as done
    console.log('Employee tried to mark order as Completed - converting to Design Done');
    
    // Fetch fresh order data with populated files to ensure we have the latest files
    const freshOrder = await Order.findById(req.params.id)
      .populate({
        path: 'files',
        populate: {
          path: 'uploadedBy',
          select: 'name email role'
        }
      });
    
    // Check if order has associated files uploaded by this employee
    const hasCompletionFiles = freshOrder.files && freshOrder.files.length > 0 && freshOrder.files.some(file => {
      // Check if the file was uploaded by the current employee
      const uploadedByCurrentUser = file.uploadedBy && 
        (file.uploadedBy._id 
          ? file.uploadedBy._id.toString() === req.user.id 
          : file.uploadedBy.toString() === req.user.id);
      
      // Check if it's a completion file (design file or has completion-related notes)
      const isCompletionFile = file.fileType === 'design' || 
        (file.notes && (
          file.notes.toLowerCase().includes('final') || 
          file.notes.toLowerCase().includes('complete') ||
          file.notes.toLowerCase().includes('finished')
        ));
      
      return uploadedByCurrentUser && isCompletionFile;
    });
    
    // Check if order has design links added by this employee
    const hasDesignLinks = freshOrder.designLinks && freshOrder.designLinks.length > 0 && 
      freshOrder.designLinks.some(designLink => 
        designLink.addedBy && designLink.addedBy.toString() === req.user.id
      );
    
    if (!hasCompletionFiles && !hasDesignLinks) {
      res.status(400);
      throw new Error('You must upload completion files OR provide a design link before marking an order as completed');
    }
    
    // Mark the design/production stage as completed and update the order status to "Design Done"
    order.stages.production.status = 'Completed';
    if (!order.stages.production.completionDate) {
      order.stages.production.completionDate = Date.now();
    }
    
    // Use the new "Design Done" status to indicate design is complete but order not advanced
    order.status = 'Design Done'; 
    
    console.log('Employee marked design stage as completed, updated order to Design Done status');
    
    // Add history entry
    order.history.push({
      action: 'Status Updated',
      user: req.user.id,
      details: 'Design stage completed by employee',
    });
  }
  else {
  // Update status
  order.status = status;
  
  // Add history entry
  order.history.push({
    action: 'Status Updated',
    user: req.user.id,
    details: `Status changed to ${status}${notes ? ': ' + notes : ''}`,
  });

  // Update stage status based on order status
  if (status === 'Designing') {
      // Set design/production stage to in progress (yellow)
      order.stages.production.status = 'In Progress';
      if (!order.stages.production.startDate) {
        order.stages.production.startDate = Date.now();
    }
  } else if (status === 'In Prepress') {
    // Start prepress stage without automatically marking design as completed
    order.stages.prepress.status = 'In Progress';
    if (!order.stages.prepress.startDate) {
      order.stages.prepress.startDate = Date.now();
    }
  } else if (status === 'Ready for Delivery') {
    // Only a manager can mark order as ready for delivery
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only managers can mark orders as ready for delivery');
    }
    
    // Mark prepress as completed if not already
    if (order.stages.prepress.status !== 'Completed') {
      order.stages.prepress.status = 'Completed';
      order.stages.prepress.completionDate = Date.now();
    }
    
    // The delivery stage starts when manager marks Ready for Delivery
    order.stages.delivery.status = 'In Progress';
    if (!order.stages.delivery.startDate) {
      order.stages.delivery.startDate = Date.now();
    }
  } else if (status === 'Delivered') {
    // For manager-initiated requests (client requests handled above)
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      res.status(403);
      throw new Error('Only managers can mark orders as delivered');
    }
    
    console.log('Manager marking order as delivered');
    
    // Mark delivery as completed
    order.stages.delivery.status = 'Completed';
    if (!order.stages.delivery.completionDate) {
      order.stages.delivery.completionDate = Date.now();
    }
  } else if (status === 'Completed') {
      // For managers, mark all relevant stages as completed
      order.stages.production.status = 'Completed';
      if (!order.stages.production.completionDate) {
        order.stages.production.completionDate = Date.now();
    }
    
      // Only mark prepress as completed if order has reached that stage
      if (order.status === 'In Prepress' || order.status === 'Ready for Delivery') {
    order.stages.prepress.status = 'Completed';
    if (!order.stages.prepress.completionDate) {
      order.stages.prepress.completionDate = Date.now();
        }
    }
    
      // Only mark delivery as completed if it has already been started
    if (order.stages.delivery.status === 'In Progress') {
      order.stages.delivery.status = 'Completed';
      order.stages.delivery.completionDate = Date.now();
      }
      
      // Only manager can set overall order status to Completed
      order.status = 'Completed';
    }
  }

  try {
    await order.save();
    console.log('Order successfully saved with status:', order.status);
    console.log('Updated order stages:', {
      review: order.stages.review?.status,
      prepress: order.stages.prepress?.status, 
      production: order.stages.production?.status,
      delivery: order.stages.delivery?.status
    });
  } catch (error) {
    console.error('Error saving order:', error.message);
    if (error.name === 'ValidationError') {
      console.error('Validation error details:', error.errors);
    }
    res.status(400);
    throw new Error(`Failed to save order: ${error.message}`);
  }

  // Create notification for the client
  try {
    await createSystemNotification(
      order.client.toString(),
      'Order Status Update',
      `Your order #${order.orderNumber} has been updated to: ${status}`,
      'order',
      order._id,
      status === 'Completed' || status === 'Delivered' ? 'success' : 'info',
      `/client/orders/${order._id}`
    );
  
    // If the order has an assigned employee, notify them of status changes (unless they made the change)
    if (order.assignedTo && req.user.id !== order.assignedTo.toString()) {
      await createSystemNotification(
        order.assignedTo,
        'Order Status Update',
        `Order #${order.orderNumber} status has been updated to ${status}`,
        'order',
        order._id,
        'info',
        `/employee/orders/${order._id}`
      );
    }
    
    // Check each stage for assigned employees and notify them too (if they didn't make the change)
    const stageAssignees = [];
    for (const stage of ['review', 'prepress', 'delivery']) {
      if (order.stages[stage]?.assignedTo && 
          order.stages[stage].assignedTo.toString() !== req.user.id &&
          !stageAssignees.includes(order.stages[stage].assignedTo.toString())) {
        stageAssignees.push(order.stages[stage].assignedTo.toString());
        await createSystemNotification(
          order.stages[stage].assignedTo,
          'Order Status Update',
          `Order #${order.orderNumber} status has been updated to ${status}`,
          'order',
          order._id,
          'info',
          `/employee/orders/${order._id}`
        );
      }
    }
  
    // Notify prepress users when an order is marked as "In Prepress"
    if (status === 'In Prepress') {
      // Find all users with department "prepress"
      const prepressUsers = await User.find({ department: 'prepress' });
      
      for (const prepressUser of prepressUsers) {
        // Skip if it's the user making the change
        if (prepressUser._id.toString() !== req.user.id) {
          await createSystemNotification(
            prepressUser._id,
            'New Prepress Order',
            `Order #${order.orderNumber} is now ready for prepress work`,
            'order',
            order._id,
            'info',
            `/prepress/orders/${order._id}`
          );
        }
      }
    }
  
    // If the update was made by an employee, notify all managers
    if (req.user.role === 'employee') {
      const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
      for (const manager of managers) {
        await createSystemNotification(
          manager._id,
          'Order Status Update by Employee',
          `${req.user.name} has updated order #${order.orderNumber} status to ${status}`,
          'order',
          order._id,
          'info',
          `/manager/orders/${order._id}`
        );
      }
    }
  } catch (notifyError) {
    console.error('Error sending notifications:', notifyError.message);
    // Don't fail the request if notifications fail
  }

  console.log('Returning order with status:', order.status);
  console.log('========== UPDATE ORDER STATUS END ==========');
  res.json(order);
});

// @desc    Assign order stage to employee
// @route   PUT /api/orders/:id/assign
// @access  Private/Manager
const assignOrderStage = asyncHandler(async (req, res) => {
  const { stage, employeeId, notes } = req.body;
  
  if (!stage || !employeeId) {
    res.status(400);
    throw new Error('Please provide stage and employee ID');
  }

  // Verify employee exists and is an employee
  const employee = await User.findById(employeeId);
  if (!employee || employee.role !== 'employee') {
    res.status(400);
    throw new Error('Invalid employee ID');
  }

  const order = await Order.findById(req.params.id)
    .populate('client', 'name');
    
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only managers can assign tasks
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to assign tasks');
  }

  // Update the assigned employee for the specified stage
  if (!['review', 'prepress', 'production', 'delivery'].includes(stage)) {
    res.status(400);
    throw new Error('Invalid stage');
  }

  order.stages[stage].assignedTo = employeeId;
  
  // Add history entry
  order.history.push({
    action: 'Assignment Updated',
    user: req.user.id,
    details: `${stage} stage assigned to ${employee.name}${notes ? ': ' + notes : ''}`,
  });

  await order.save();

  // Create notification for the assigned employee
  await createSystemNotification(
    employeeId,
    'Order Stage Assignment',
    `You have been assigned to the ${stage} stage of order #${order.orderNumber}`,
    'order',
    order._id,
    'info',
    `/employee/orders/${order._id}`
  );

  // Notify the client
  await createSystemNotification(
    order.client._id.toString(),
    'Order Update',
    `Your order #${order.orderNumber} is now in the ${stage} stage`,
    'order',
    order._id,
    'info',
    `/client/orders/${order._id}`
  );

  // If there's a primary employee assigned to the order, notify them too
  if (order.assignedTo && order.assignedTo.toString() !== employeeId) {
    await createSystemNotification(
      order.assignedTo,
      'Order Stage Assignment Update',
      `${employee.name} has been assigned to the ${stage} stage of order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/employee/orders/${order._id}`
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
      'Order Stage Assignment Update',
      `${req.user.name} assigned ${employee.name} to the ${stage} stage of order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/manager/orders/${order._id}`
    );
  }

  res.json(order);
});

// @desc    Assign order to employee
// @route   PUT /api/orders/:id/assign
// @access  Private/Manager
const assignOrder = asyncHandler(async (req, res) => {
  const { employeeId } = req.body;
  
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

  const order = await Order.findById(req.params.id)
    .populate('client', 'name');
    
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Only managers can assign orders
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized to assign orders');
  }

  // Update the assigned employee for the order
  order.assignedTo = employeeId;
  
  // Add history entry
  order.history.push({
    action: 'Order Assigned',
    user: req.user.id,
    details: `Order assigned to ${employee.name}`
  });

  await order.save();

  // Notify the assigned employee
  await createSystemNotification(
    employeeId,
    'New Order Assignment',
    `You have been assigned to order #${order.orderNumber}`,
    'order',
    order._id,
    'info',
    `/employee/orders/${order._id}`
  );

  // Notify the client
  await createSystemNotification(
    order.client._id.toString(),
    'Order Update',
    `Your order #${order.orderNumber} has been assigned to an employee`,
    'order',
    order._id,
    'info',
    `/client/orders/${order._id}`
  );

  // Notify other managers
  const managers = await User.find({ 
    role: { $in: ['manager', 'admin'] },
    _id: { $ne: req.user.id }
  });

  for (const manager of managers) {
    await createSystemNotification(
      manager._id,
      'Order Assignment Update',
      `${req.user.name} assigned ${employee.name} to order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/manager/orders/${order._id}`
    );
  }

  res.json(order);
});

// @desc    Calculate order cost
// @route   POST /api/orders/calculate-cost
// @access  Private
const calculateOrderCost = asyncHandler(async (req, res) => {
  const { material, dimensions, quantity, colors, finishType, orderType } = req.body;

  if (!material || !dimensions || !quantity || !colors) {
    res.status(400);
    throw new Error('Please provide all required specifications');
  }

  // Base cost calculation (this would be replaced with actual business logic)
  let baseCost = 0;
  
  // Material cost factors (example values)
  const materialCosts = {
    'Paper': 0.05,
    'Vinyl': 0.15,
    'PVC': 0.20,
    'Polyester': 0.25,
    'Other': 0.10
  };
  
  // Calculate area in square cm
  const width = dimensions.width;
  const height = dimensions.height;
  let area = width * height;
  
  // Convert to square cm if needed
  if (dimensions.unit === 'mm') {
    area = area / 100; // mm² to cm²
  } else if (dimensions.unit === 'inch') {
    area = area * 6.4516; // inch² to cm²
  }
  
  // Calculate material cost
  const materialCostFactor = materialCosts[material] || materialCosts['Other'];
  const materialCost = area * materialCostFactor;
  
  // Color cost (more colors = more expensive)
  const colorCost = colors * 10; // $10 per color
  
  // Finish cost
  let finishCost = 0;
  if (finishType === 'Glossy') {
    finishCost = area * 0.02;
  } else if (finishType === 'Matte') {
    finishCost = area * 0.015;
  } else if (finishType === 'Semi-Glossy') {
    finishCost = area * 0.018;
  }
  
  // Order type multiplier
  let orderTypeMultiplier = 1;
  if (orderType === 'Rush') {
    orderTypeMultiplier = 1.5;
  } else if (orderType === 'Standard') {
    orderTypeMultiplier = 1;
  } else if (orderType === 'Economy') {
    orderTypeMultiplier = 0.8;
  }
  
  // Quantity discount
  let quantityDiscount = 1;
  if (quantity >= 1000) {
    quantityDiscount = 0.7; // 30% discount for 1000+ units
  } else if (quantity >= 500) {
    quantityDiscount = 0.8; // 20% discount for 500+ units
  } else if (quantity >= 100) {
    quantityDiscount = 0.9; // 10% discount for 100+ units
  }
  
  // Calculate total cost per unit
  const costPerUnit = (materialCost + colorCost + finishCost) * orderTypeMultiplier;
  
  // Calculate total cost with quantity discount
  const totalCost = costPerUnit * quantity * quantityDiscount;
  
  // Round to 2 decimal places
  const finalCost = Math.round(totalCost * 100) / 100;
  
  res.json({
    estimatedCost: finalCost,
    currency: 'USD',
    breakdown: {
      materialCost: materialCost * quantity,
      colorCost: colorCost * quantity,
      finishCost: finishCost * quantity,
      orderTypeMultiplier,
      quantityDiscount,
      costPerUnit,
    },
  });
});

// @desc    Get client dashboard stats
// @route   GET /api/orders/client-stats
// @access  Private/Client
const getClientStats = asyncHandler(async (req, res) => {
  // Ensure the user is a client
  if (req.user.role !== 'client') {
    res.status(403);
    throw new Error('Access denied. Only clients can access this resource.');
  }

  try {
    // Get total number of orders
    const totalOrders = await Order.countDocuments({ client: req.user.id });

    // Get submitted orders (in early stages)
    const submittedOrders = await Order.countDocuments({ 
      client: req.user.id,
      status: 'Submitted'
    });

    // Get in design orders
    const inDesignOrders = await Order.countDocuments({ 
      client: req.user.id,
      status: 'Designing'
    });

    // Get in prepress orders
    const inPrepressOrders = await Order.countDocuments({ 
      client: req.user.id,
      status: { $in: ['In Prepress', 'Delivering'] }
    });

    // Get completed orders
    const completedOrders = await Order.countDocuments({ 
      client: req.user.id,
      status: 'Completed'
    });

    // Get total claims
    const totalClaims = await Claim.countDocuments({ client: req.user.id });

    // Return stats
    res.json({
      totalOrders,
      submittedOrders,
      inDesignOrders,
      inPrepressOrders,
      completedOrders,
      totalClaims
    });
  } catch (error) {
    console.error('Error fetching client stats:', error);
    res.status(500);
    throw new Error('Failed to fetch client statistics');
  }
});

// @desc    Get recent orders for manager dashboard
// @route   GET /api/orders/recent
// @access  Private/Manager
const getRecentOrders = asyncHandler(async (req, res) => {
  try {
    // Allow customizing the limit via query parameter
    const limit = parseInt(req.query.limit) || (req.user.role === 'manager' || req.user.role === 'admin' ? 4 : 5);
    
    // If user is client, only show their orders
    if (req.user.role === 'client') {
      // Get most recent orders for this client
      const recentOrders = await Order.find({ client: req.user.id })
        .sort({ createdAt: -1 })
        .limit(limit)
    .populate('client', 'name email company phone address geoLocation')
        .populate('stages.prepress.subProcesses.positioning.completedBy', 'name')
        .populate('stages.prepress.subProcesses.laserImaging.completedBy', 'name')
        .populate('stages.prepress.subProcesses.exposure.completedBy', 'name')
        .populate('stages.prepress.subProcesses.washout.completedBy', 'name')
        .populate('stages.prepress.subProcesses.drying.completedBy', 'name')
        .populate('stages.prepress.subProcesses.finishing.completedBy', 'name');

      return res.json(recentOrders);
    } 
    
    // For managers/employees, show all recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('client', 'name email company')
      .populate('stages.prepress.subProcesses.positioning.completedBy', 'name')
      .populate('stages.prepress.subProcesses.laserImaging.completedBy', 'name')
      .populate('stages.prepress.subProcesses.exposure.completedBy', 'name')
      .populate('stages.prepress.subProcesses.washout.completedBy', 'name')
      .populate('stages.prepress.subProcesses.drying.completedBy', 'name')
      .populate('stages.prepress.subProcesses.finishing.completedBy', 'name');

    res.json(recentOrders);
  } catch (error) {
    console.error('Error fetching recent orders:', error);
    res.status(500);
    throw new Error('Failed to fetch recent orders');
  }
});

// @desc    Add comment to order
// @route   POST /api/orders/:id/comments
// @access  Private
const addOrderComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    res.status(400);
    throw new Error('Comment content is required');
  }

  const order = await Order.findById(req.params.id)
    .populate('client', 'name email')
    .populate('assignedTo', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Add the comment
  const newComment = {
    content,
    author: req.user._id,
    createdAt: Date.now(),
  };

  order.comments.push(newComment);

  // Also add to history
  order.history.push({
    action: 'Comment Added',
    user: req.user._id,
    details: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
    timestamp: Date.now(),
  });

  await order.save();

  // Fetch the updated order with populated comments
  const updatedOrder = await Order.findById(req.params.id)
    .populate('client', 'name email')
    .populate('assignedTo', 'name email')
    .populate('comments.author', 'name email role');
  
  // Determine who to notify based on who added the comment
  const commentedBy = req.user.role === 'client' ? 'Client' : 
                     req.user.role === 'employee' ? 'Employee' : 'Manager';
  
  // Notify the client if comment wasn't added by them
  if (req.user.id !== order.client.toString()) {
    await createSystemNotification(
      order.client.toString(),
      'New Comment on Your Order',
      `${req.user.name} commented on order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/client/orders/${order._id}`
    );
  }
  
  // Notify the assigned employee if comment wasn't added by them
  if (order.assignedTo && req.user.id !== order.assignedTo.toString()) {
    await createSystemNotification(
      order.assignedTo,
      'New Comment on Order',
      `${req.user.name} commented on order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/employee/orders/${order._id}`
    );
  }
  
  // Collect all stage assignees to notify
  const stageAssignees = [];
  for (const stage of ['review', 'prepress', 'production', 'delivery']) {
    if (order.stages[stage]?.assignedTo && 
        order.stages[stage].assignedTo.toString() !== req.user.id &&
        !stageAssignees.includes(order.stages[stage].assignedTo.toString())) {
      stageAssignees.push(order.stages[stage].assignedTo.toString());
      await createSystemNotification(
        order.stages[stage].assignedTo,
        'New Comment on Order',
        `${req.user.name} commented on order #${order.orderNumber}`,
        'order',
        order._id,
        'info',
        `/employee/orders/${order._id}`
      );
    }
  }
  
  // If comment was added by client or employee, notify all managers
  if (req.user.role !== 'manager' && req.user.role !== 'admin') {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
    for (const manager of managers) {
      if (manager._id.toString() !== req.user.id) {
        await createSystemNotification(
          manager._id,
          `New Comment on Order by ${commentedBy}`,
          `${req.user.name} commented on order #${order.orderNumber}`,
          'order',
          order._id,
          'info',
          `/manager/orders/${order._id}`
        );
      }
    }
  }

  res.status(201).json(updatedOrder.comments[updatedOrder.comments.length - 1]);
});

// @desc    Cancel an order by client
// @route   PUT /api/orders/:id/cancel
// @access  Private/Client
const cancelOrder = asyncHandler(async (req, res) => {
  const { reason } = req.body;
  const order = await Order.findById(req.params.id);

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Ensure the order belongs to the client making the request
  if (order.client.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Not authorized to cancel this order');
  }

  // Check if order can be cancelled - only allow cancellation for early stages
  const cancellableStatuses = ['Submitted', 'In Review'];
  if (!cancellableStatuses.includes(order.status)) {
    res.status(400);
    throw new Error('Order cannot be cancelled at this stage');
  }

  // Update status to Cancelled
  order.status = 'Cancelled';
  
  // Add history entry
  order.history.push({
    action: 'Order Cancelled',
    user: req.user.id,
    details: reason ? `Cancelled by client: ${reason}` : 'Cancelled by client',
  });

  // Update stage status
  if (order.stages.review.status === 'Pending' || order.stages.review.status === 'In Progress') {
    order.stages.review.status = 'N/A';
  }

  await order.save();

  // Notify managers about the cancellation
  const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
  for (const manager of managers) {
    await createSystemNotification(
      manager._id,
      'Order Cancelled',
      `Order #${order.orderNumber} has been cancelled by the client`,
      'order',
      order._id,
      'warning',
      `/manager/orders/${order._id}`
    );
  }

  // If the order has an assigned employee, notify them as well
  if (order.assignedTo) {
    await createSystemNotification(
      order.assignedTo,
      'Order Cancelled',
      `Order #${order.orderNumber} has been cancelled by the client`,
      'order',
      order._id,
      'warning',
      `/employee/orders/${order._id}`
    );
  }

  // Notify any employees assigned to specific stages
  const stageAssignees = [];
  for (const stage of ['review', 'prepress', 'production', 'delivery']) {
    if (order.stages[stage]?.assignedTo && 
        !stageAssignees.includes(order.stages[stage].assignedTo.toString())) {
      stageAssignees.push(order.stages[stage].assignedTo.toString());
      await createSystemNotification(
        order.stages[stage].assignedTo,
        'Order Cancelled',
        `Order #${order.orderNumber} has been cancelled by the client`,
        'order',
        order._id,
        'warning',
        `/employee/orders/${order._id}`
      );
    }
  }

  res.json(order);
});

// @desc    Update prepress sub-process status
// @route   PUT /api/orders/:id/prepress-process
// @access  Private/Prepress only
const updatePrepressProcess = asyncHandler(async (req, res) => {
  const { subProcess, status } = req.body;
  
  console.log('Updating prepress process:', { 
    orderId: req.params.id, 
    subProcess, 
    status, 
    user: req.user.name,
    userRole: req.user.role,
    userDepartment: req.user.department
  });
  
  if (!subProcess || !status) {
    console.log('Missing required fields:', { subProcess, status });
    res.status(400);
    throw new Error('Please provide sub-process and status');
  }
  
  // Validate sub-process
  const validSubProcesses = ['positioning', 'laserImaging', 'exposure', 'washout', 'drying', 'finishing'];
  if (!validSubProcesses.includes(subProcess)) {
    console.log('Invalid sub-process:', subProcess);
    res.status(400);
    throw new Error('Invalid sub-process');
  }
  
  // Validate status
  if (status !== 'Completed' && status !== 'Pending') {
    console.log('Invalid status:', status);
    res.status(400);
    throw new Error('Invalid status');
  }
  
  const order = await Order.findById(req.params.id)
    .populate('client', 'name')
    .populate('assignedTo', 'name');
    
  if (!order) {
    console.log('Order not found:', req.params.id);
    res.status(404);
    throw new Error('Order not found');
  }
  
  console.log('Order current status:', order.status);
  
  // Ensure order is in the prepress stage
  if (order.status !== 'In Prepress') {
    res.status(400);
    throw new Error('Order must be in "In Prepress" stage to update prepress processes');
  }
  
  // Permissions: Prepress staff or managers/admins can update prepress subprocesses
  // Designers should not update any prepress subprocess (they handle ripping under production)
  const isPrepressUser = req.user.role === 'prepress' || req.user.department === 'prepress';
  if (!isPrepressUser) {
    res.status(403);
    throw new Error('Only prepress can update this prepress process');
  }

  // Update the sub-process status
  order.stages.prepress.subProcesses[subProcess].status = status;
  
  // If marking as completed, set completion date
  if (status === 'Completed') {
    order.stages.prepress.subProcesses[subProcess].completedAt = Date.now();
    // Add the user who completed this subprocess
    order.stages.prepress.subProcesses[subProcess].completedBy = req.user._id;
  }
  
  // Check if all sub-processes are completed to suggest moving to next stage
  let allCompleted = true;
  for (const process of validSubProcesses) {
    if (order.stages.prepress.subProcesses[process].status !== 'Completed') {
      allCompleted = false;
      break;
    }
  }
  
  // Automatically mark prepress stage as completed if all subprocesses are complete
  if (allCompleted && order.stages.prepress.status !== 'Completed') {
    order.stages.prepress.status = 'Completed';
    order.stages.prepress.completionDate = Date.now();
  }
  
  // Add to history
  order.history.push({
    action: `Prepress ${subProcess} ${status === 'Completed' ? 'completed' : 'reset'}`,
    user: req.user.id,
    details: `Prepress sub-process ${subProcess} marked as ${status}`,
  });
  
  await order.save();
  
  // Create notification for the manager
  if (status === 'Completed') {
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
    
    for (const manager of managers) {
      await createSystemNotification(
        manager._id,
        'Prepress Update',
        `${req.user.name} has completed the ${subProcess} process for order #${order.orderNumber}`,
        'order',
        order._id,
        'info',
        `/manager/orders/${order._id}`
      );
    }
  }
  
  // Create notification for the client if all prepress processes are completed
  if (allCompleted) {
    await createSystemNotification(
      order.client.toString(),
      'Order Update',
      `All prepress processes have been completed for your order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/client/orders/${order._id}`
    );
    
    // Notify managers
    const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
    for (const manager of managers) {
      await createSystemNotification(
        manager._id,
        'Prepress Complete',
        `All prepress processes have been completed for order #${order.orderNumber}. Ready for next stage.`,
        'order',
        order._id,
        'success',
        `/manager/orders/${order._id}`
      );
    }
    
    // Notify the assigned designer that prepress is complete and they can choose delivery method
    if (order.assignedTo) {
      await createSystemNotification(
        order.assignedTo,
        'Prepress Complete - Choose Delivery Method',
        `Prepress work for order #${order.orderNumber} has been completed. You can now choose the delivery method.`,
        'order',
        order._id,
        'success',
        `/employee/orders/${order._id}`
      );
    }
  }
  
  res.json(order);
});

// @desc    Mark prepress stage as completed
// @route   PUT /api/orders/:id/prepress-complete
// @access  Private/Prepress
const completePrepressStage = asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('client', 'name')
    .populate('assignedTo', 'name');
    
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  // Ensure the order is in the prepress stage
  if (order.status !== 'In Prepress') {
    res.status(400);
    throw new Error('Order must be in "In Prepress" stage to mark prepress as completed');
  }
  
  // Make sure all prepress subprocesses are completed
  const subProcesses = order.stages.prepress.subProcesses;
  const allSubProcessesCompleted = 
    subProcesses.positioning?.status === 'Completed' &&
    subProcesses.laserImaging?.status === 'Completed' &&
    subProcesses.exposure?.status === 'Completed' &&
    subProcesses.washout?.status === 'Completed' &&
    subProcesses.drying?.status === 'Completed' &&
    subProcesses.finishing?.status === 'Completed';
    
  if (!allSubProcessesCompleted) {
    res.status(400);
    throw new Error('All prepress sub-processes must be completed first');
  }
  
  // Mark prepress stage as completed
  order.stages.prepress.status = 'Completed';
  order.stages.prepress.completionDate = Date.now();
  
  // Add to history
  order.history.push({
    action: 'Prepress Completed',
    user: req.user.id,
    details: 'Prepress stage marked as completed',
  });
  
  await order.save();
  
  // Notify managers that prepress is completed and the order is ready for next stage
  const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
  for (const manager of managers) {
    await createSystemNotification(
      manager._id,
      'Prepress Completed',
      `Prepress work for order #${order.orderNumber} has been completed and is ready for delivery`,
      'order',
      order._id,
      'success',
      `/manager/orders/${order._id}`
    );
  }
  
  // Notify the client
  await createSystemNotification(
    order.client.toString(),
    'Order Update',
    `Prepress work for your order #${order.orderNumber} has been completed`,
    'order',
    order._id,
    'info',
    `/client/orders/${order._id}`
  );
  
  res.json(order);
});

// @desc    Get order data for chatbot
// @route   GET /api/orders/chatbot
// @access  Private/Client
const getChatbotOrderData = asyncHandler(async (req, res) => {
  // Ensure the user is a client
  if (req.user.role !== 'client') {
    res.status(403);
    throw new Error('Access denied. Only clients can access this resource.');
  }

  try {
    const { search } = req.query;
    
    if (!search) {
      return res.status(400).json({ 
        message: 'Search term is required' 
      });
    }
    
    // Search by order number or title for this client only
    const query = {
      client: req.user.id,
      $or: [
        { orderNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
      ]
    };
    
    const orders = await Order.find(query)
      .populate('client', 'name email company')
      .populate('assignedTo', 'name email department position')
      .populate('stages.prepress.subProcesses.positioning.completedBy', 'name')
      .populate('stages.prepress.subProcesses.laserImaging.completedBy', 'name')
      .populate('stages.prepress.subProcesses.exposure.completedBy', 'name')
      .populate('stages.prepress.subProcesses.washout.completedBy', 'name')
      .populate('stages.prepress.subProcesses.drying.completedBy', 'name')
      .populate('stages.prepress.subProcesses.finishing.completedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5); // Limit to top 5 matches for performance
    
    // Transform the data into a more chatbot-friendly format
    const transformedOrders = orders.map(order => {
      const prepressProgress = calculatePrepressProgress(order);
      
      return {
        _id: order._id,
        orderNumber: order.orderNumber,
        title: order.title,
        status: order.status,
        createdAt: order.createdAt,
        stages: {
          review: order.stages.review,
          prepress: {
            ...order.stages.prepress,
            progress: prepressProgress,
          },
          production: order.stages.production,
          delivery: order.stages.delivery,
        },
        nextStep: determineNextStep(order),
        estimatedCompletion: order.estimatedCompletion,
      };
    });
    
    res.json({
      orders: transformedOrders,
      count: transformedOrders.length,
    });
  } catch (error) {
    console.error('Error fetching chatbot order data:', error);
    res.status(500);
    throw new Error('Failed to fetch order data for chatbot');
  }
});

// Helper function to calculate prepress progress
const calculatePrepressProgress = (order) => {
  if (!order?.stages?.prepress?.subProcesses) return 0;
  
  const subProcesses = order.stages.prepress.subProcesses;
  let completedCount = 0;
  let totalCount = 0;
  
  // Check each subprocess
  if (subProcesses.positioning) {
    totalCount++;
    if (subProcesses.positioning.status === 'Completed') completedCount++;
  }
  if (subProcesses.laserImaging) {
    totalCount++;
    if (subProcesses.laserImaging.status === 'Completed') completedCount++;
  }
  if (subProcesses.exposure) {
    totalCount++;
    if (subProcesses.exposure.status === 'Completed') completedCount++;
  }
  if (subProcesses.washout) {
    totalCount++;
    if (subProcesses.washout.status === 'Completed') completedCount++;
  }
  if (subProcesses.drying) {
    totalCount++;
    if (subProcesses.drying.status === 'Completed') completedCount++;
  }
  if (subProcesses.finishing) {
    totalCount++;
    if (subProcesses.finishing.status === 'Completed') completedCount++;
  }
  
  return totalCount > 0 ? (completedCount / totalCount) * 100 : 0;
};

// Helper function to determine next step in order process
const determineNextStep = (order) => {
  if (!order || !order.status) return 'Order submission';
  
  switch (order.status) {
    case 'Submitted':
      return 'Design and review';
    case 'Designing':
      return 'Complete design phase';
    case 'Design Done':
    case 'In Review':
      return 'Prepress processing';
    case 'In Prepress':
      return 'Complete prepress processing';
    case 'Ready for Delivery':
      return 'Delivery';
    case 'Delivering':
      return 'Complete delivery';
    case 'Completed':
      return 'Order is complete';
    case 'Cancelled':
      return 'Order was cancelled';
    case 'On Hold':
      return 'Order is on hold';
    default:
      return 'Processing order';
  }
};

// @desc    Submit design to order
// @route   POST /api/orders/:id/submit-design
// @access  Private/Employee
const submitDesignToOrder = asyncHandler(async (req, res) => {
  const { templateId, customizations, uploadedImages, notes } = req.body;
  
  if (!templateId) {
    res.status(400);
    throw new Error('Template ID is required');
  }

  const order = await Order.findById(req.params.id)
    .populate('client', 'name email');
    
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Check if order is assigned to the employee making the submission
  if (order.assignedTo?.toString() !== req.user.id && req.user.role === 'employee') {
    res.status(403);
    throw new Error('Order not assigned to you');
  }

  // Create design submission
  const designSubmission = {
    id: new mongoose.Types.ObjectId(),
    templateId,
    customizations: customizations || {},
    uploadedImages: uploadedImages || {},
    submittedBy: req.user.id,
    submittedAt: new Date(),
    notes: notes || '',
    status: 'Submitted'
  };

  // Add to order's design submissions
  if (!order.designSubmissions) {
    order.designSubmissions = [];
  }
  order.designSubmissions.push(designSubmission);

  // Update order status if needed
  if (order.status === 'Submitted' || order.status === 'Designing') {
    order.status = 'In Review';
  }

  // Add history entry
  order.history.push({
    action: 'Design Submitted',
    user: req.user.id,
    details: `Design template submitted for review${notes ? ': ' + notes : ''}`,
  });

  await order.save();

  // Notify the client
  await createSystemNotification(
    order.client._id,
    'Design Submitted for Review',
    `A design has been submitted for your order #${order.orderNumber}. Please review and provide feedback.`,
    'order',
    order._id,
    'info',
    `/client/orders/${order._id}`
  );

  // Notify managers
  const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
  for (const manager of managers) {
    await createSystemNotification(
      manager._id,
      'Design Submission by Employee',
      `${req.user.name} submitted a design for order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/manager/orders/${order._id}`
    );
  }

  res.status(201).json({
    message: 'Design submitted successfully',
    order: order,
    designSubmission: designSubmission
  });
});

// @desc    Get monthly reports of completed orders
// @route   GET /api/orders/monthly-reports
// @access  Private/Manager
const getMonthlyReports = asyncHandler(async (req, res) => {
  const { month, year, page = 1, limit = 25 } = req.query;

  if (!month || !year) {
    res.status(400);
    throw new Error('Month and year are required');
  }

  // Convert month and year to date range
  const startDate = new Date(year, month - 1, 1); // month - 1 because Date uses 0-indexed months
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of the month

  try {
    // Build query for completed orders within the specified month
    const query = {
      status: 'Completed',
      updatedAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Calculate pagination
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    // Get total count for pagination
    const total = await Order.countDocuments(query);
    const pages = Math.ceil(total / limitNumber);

    // Fetch orders with client information
    const orders = await Order.find(query)
      .populate('client', 'name email companyName')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    // Transform orders to include the required report fields
    const reportData = orders.map(order => ({
      _id: order._id,
      orderNumber: order.orderNumber,
      title: order.title,
      createdAt: order.createdAt,
      completedAt: order.updatedAt,
      clientName: order.client?.name || order.client?.companyName || 'Unknown Client',
      material: order.specifications?.material,
      materialThickness: order.specifications?.materialThickness,
      dimensions: order.specifications?.dimensions,
      colors: order.specifications?.colors,
      estimatedPrice: order.cost?.estimatedCost || 0
    }));

    res.json({
      orders: reportData,
      page: pageNumber,
      pages,
      total,
      month: parseInt(month),
      year: parseInt(year)
    });
  } catch (error) {
    console.error('Error fetching monthly reports:', error);
    res.status(500);
    throw new Error('Failed to fetch monthly reports');
  }
});

// @desc    Download monthly reports as CSV
// @route   GET /api/orders/monthly-reports/csv
// @access  Private/Manager
const downloadMonthlyReportsCSV = asyncHandler(async (req, res) => {
  const { month, year } = req.query;

  if (!month || !year) {
    res.status(400);
    throw new Error('Month and year are required');
  }

  // Convert month and year to date range
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  try {
    // Build query for completed orders within the specified month
    const query = {
      status: 'Completed',
      updatedAt: {
        $gte: startDate,
        $lte: endDate
      }
    };

    // Fetch all orders for the month (no pagination for CSV download)
    const orders = await Order.find(query)
      .populate('client', 'name email companyName')
      .sort({ updatedAt: -1 })
      .lean();

    // Create CSV content
    const csvHeaders = [
      'Order ID',
      'Order Name',
      'Order Date',
      'Completion Date',
      'Client Name',
      'Material',
      'Material Thickness (mm)',
      'Dimensions',
      'Repeat Count',
      'Number of Colors',
      'Estimated Price ($)'
    ];

    const csvRows = orders.map(order => {
      const dimensions = order.specifications?.dimensions;
      const dimensionString = dimensions 
        ? `${dimensions.width}x${dimensions.height} ${dimensions.unit || 'mm'}`
        : 'Not specified';
      
      const repeatCount = dimensions
        ? `${dimensions.widthRepeatCount || 1}x${dimensions.heightRepeatCount || 1}`
        : '1x1';

      return [
        order.orderNumber || '',
        order.title || '',
        order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '',
        order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : '',
        order.client?.name || order.client?.companyName || 'Unknown Client',
        order.specifications?.material || '',
        order.specifications?.materialThickness || '',
        dimensionString,
        repeatCount,
        order.specifications?.colors || '',
        order.cost?.estimatedCost || 0
      ];
    });

    // Convert to CSV format
    const csvContent = [
      csvHeaders.join(','),
      ...csvRows.map(row => 
        row.map(field => 
          // Escape fields that contain commas, quotes, or newlines
          typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))
            ? `"${field.replace(/"/g, '""')}"` 
            : field
        ).join(',')
      )
    ].join('\n');

    // Set headers for file download
    const monthNames = [
      'january', 'february', 'march', 'april', 'may', 'june',
      'july', 'august', 'september', 'october', 'november', 'december'
    ];
    const filename = `monthly-report-${monthNames[month - 1]}-${year}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  } catch (error) {
    console.error('Error generating CSV report:', error);
    res.status(500);
    throw new Error('Failed to generate CSV report');
  }
});

// @desc    Designer chooses delivery method after prepress completion
// @route   POST /api/orders/:id/choose-delivery
// @access  Private/Employee
const chooseDeliveryMethod = asyncHandler(async (req, res) => {
  const { deliveryMethod, shipmentCompany, tempAddress } = req.body;
  
  if (!deliveryMethod || !['direct', 'shipping-company', 'client-collection'].includes(deliveryMethod)) {
    res.status(400);
    throw new Error('Valid delivery method is required (direct, shipping-company, or client-collection)');
  }
  
  if (deliveryMethod === 'shipping-company') {
    // Set Middle East as the fixed shipment company
    shipmentCompany = 'Middle East';
  }
  
  const order = await Order.findById(req.params.id)
    .populate('client', 'name email address')
    .populate('assignedTo', 'name role department');
    
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }
  
  console.log('Debug - Order ID:', order._id);
  console.log('Debug - Order Assigned To:', order.assignedTo);
  console.log('Debug - Order Assigned To Type:', typeof order.assignedTo);
  
  // Check if the user is the assigned designer
  console.log('Debug - User ID:', req.user.id);
  console.log('Debug - User Role:', req.user.role);
  console.log('Debug - Assigned To:', order.assignedTo?._id?.toString());
  console.log('Debug - Assigned To String:', order.assignedTo?.toString());
  console.log('Debug - Comparison:', order.assignedTo?.toString() === req.user.id);
  
  // Check if the user is the assigned designer or has manager/admin role
  const isAssignedDesigner = order.assignedTo && (
    order.assignedTo._id?.toString() === req.user.id || 
    order.assignedTo.toString() === req.user.id
  );
  const isManagerOrAdmin = req.user.role === 'manager' || req.user.role === 'admin';
  const isStaffMember = ['employee', 'manager', 'admin', 'prepress'].includes(req.user.role);
  
  // Allow any staff member to choose delivery method (reasonable workflow)
  if (!isStaffMember) {
    res.status(403);
    throw new Error('Only staff members can choose delivery method');
  }
  
  // Log who is choosing the delivery method
  console.log('Debug - User choosing delivery method:', req.user.name, req.user.role, 'Assigned to:', order.assignedTo?.name);
  
  // Check if prepress is completed
  if (order.stages.prepress.status !== 'Completed') {
    res.status(400);
    throw new Error('Prepress must be completed before choosing delivery method');
  }
  
  // Update order status and delivery information
  order.status = 'Ready for Delivery';
  order.stages.delivery.status = 'In Progress';
  order.stages.delivery.startDate = Date.now();
  
  // Set delivery method in courierInfo
  if (!order.stages.delivery.courierInfo) {
    order.stages.delivery.courierInfo = {};
  }
  order.stages.delivery.courierInfo.mode = deliveryMethod;
  order.stages.delivery.courierInfo.createdAt = new Date();
  
  if (deliveryMethod === 'direct') {
    // For direct delivery, use temporary address if provided, otherwise use client address
    if (tempAddress && tempAddress.trim()) {
      order.stages.delivery.courierInfo.destination = {
        street: tempAddress.trim(),
        city: '',
        state: '',
        postalCode: '',
        country: '',
      };
    } else if (order.client.address) {
      order.stages.delivery.courierInfo.destination = {
        street: order.client.address.street || '',
        city: order.client.address.city || '',
        state: order.client.address.state || '',
        postalCode: order.client.address.postalCode || '',
        country: order.client.address.country || '',
      };
    }
  } else if (deliveryMethod === 'client-collection') {
    // For client self-collection, use client address
    if (order.client.address) {
      order.stages.delivery.courierInfo.destination = {
        street: order.client.address.street || '',
        city: order.client.address.city || '',
        state: order.client.address.state || '',
        postalCode: order.client.address.postalCode || '',
        country: order.client.address.country || '',
      };
    }
  } else if (deliveryMethod === 'shipping-company') {
    order.stages.delivery.courierInfo.shipmentCompany = 'Middle East';
  }
  
  // Add to history
  const deliveryMethodText = deliveryMethod === 'direct' ? 'direct handover' : 
                            deliveryMethod === 'client-collection' ? 'client self-collection' : 
                            'shipping company (Middle East)';
  
  order.history.push({
    action: 'Delivery Method Chosen',
    user: req.user.id,
    details: `Designer chose ${deliveryMethodText}${deliveryMethod === 'direct' && tempAddress ? ` with temporary address: ${tempAddress}` : ''}`,
  });
  
  await order.save();
  
  // Notify client about delivery method choice
  const notificationMessage = deliveryMethod === 'direct' ? 
    `Your order #${order.orderNumber} will be delivered via direct handover${tempAddress ? ` to: ${tempAddress}` : ''}` :
    deliveryMethod === 'client-collection' ? 
    `Your order #${order.orderNumber} is ready for self-collection` :
    `Your order #${order.orderNumber} will be delivered via Middle East shipping company`;
  
  await createSystemNotification(
    order.client._id,
    'Delivery Method Selected',
    notificationMessage,
    'order',
    order._id,
    'info',
    `/client/orders/${order._id}`
  );
  

  
  // Notify managers
  const managers = await User.find({ role: { $in: ['manager', 'admin'] } });
  for (const manager of managers) {
    await createSystemNotification(
      manager._id,
      'Delivery Method Chosen',
      `${req.user.name} has chosen ${deliveryMethod} delivery for order #${order.orderNumber}`,
      'order',
      order._id,
      'info',
      `/manager/orders/${order._id}`
    );
  }
  
  // Notify couriers about new delivery orders
  const couriers = await User.find({ role: 'courier' });
  for (const courier of couriers) {
    let courierMessage = '';
    if (deliveryMethod === 'direct') {
      courierMessage = `Order #${order.orderNumber} is ready for direct handover delivery`;
    } else if (deliveryMethod === 'client-collection') {
      courierMessage = `Order #${order.orderNumber} is ready for client self-collection`;
    } else if (deliveryMethod === 'shipping-company') {
      courierMessage = `Order #${order.orderNumber} is ready for delivery via Middle East`;
    }
    
    await createSystemNotification(
      courier._id,
      'New Delivery Order',
      courierMessage,
      'order',
      order._id,
      'info',
      `/courier/orders/${order._id}`
    );
  }
  
  res.json(order);
});

export {
  createOrder,
  getOrders,
  getOrderById,
  updateOrder,
  updateOrderStatus,
  // add new export once created
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
  downloadMonthlyReportsCSV,
  completeRippingAndStartPrepress,
  courierClaimOrder,
  courierUpdateDelivery,
  chooseDeliveryMethod
};