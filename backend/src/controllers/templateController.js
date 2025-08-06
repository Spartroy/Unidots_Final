import asyncHandler from 'express-async-handler';
import Template from '../models/templateModel.js';
import File from '../models/fileModel.js';
import Order from '../models/orderModel.js';

// @desc    Get all templates with filtering
// @route   GET /api/templates
// @access  Private (Employees, Managers)
const getTemplates = asyncHandler(async (req, res) => {
  const {
    category,
    subCategory,
    search,
    difficulty,
    sortBy = 'popularity',
    page = 1,
    limit = 20
  } = req.query;

  // Build filter object
  const filter = { isActive: true };
  
  if (category) filter.category = category;
  if (subCategory) filter.subCategory = subCategory;
  if (difficulty) filter.difficulty = difficulty;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
      { tags: { $in: [new RegExp(search, 'i')] } }
    ];
  }

  // Build sort object
  let sort = {};
  switch (sortBy) {
    case 'popularity':
      sort = { 'stats.usageCount': -1 };
      break;
    case 'newest':
      sort = { createdAt: -1 };
      break;
    case 'name':
      sort = { name: 1 };
      break;
    case 'fastest':
      sort = { estimatedTimeMinutes: 1 };
      break;
    default:
      sort = { 'stats.usageCount': -1 };
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const templates = await Template.find(filter)
    .populate('templateFile', 'filename originalname fileUrl')
    .populate('previewImage', 'filename originalname fileUrl')
    .populate('createdBy', 'name email')
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Template.countDocuments(filter);

  res.json({
    templates,
    pagination: {
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
      total,
      limit: parseInt(limit)
    },
    categories: await getTemplateCategories(),
    subCategories: await getTemplateSubCategories(category)
  });
});

// @desc    Get template by ID with full details
// @route   GET /api/templates/:id
// @access  Private (Employees, Managers)
const getTemplateById = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id)
    .populate('templateFile', 'filename originalname fileUrl fileSize mimeType')
    .populate('previewImage', 'filename originalname fileUrl')
    .populate('createdBy', 'name email role');

  if (!template || !template.isActive) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Update last used timestamp
  template.stats.lastUsed = new Date();
  await template.save();

  res.json(template);
});

// @desc    Create template from order (for managers)
// @route   POST /api/templates/from-order/:orderId
// @access  Private (Managers)
const createTemplateFromOrder = asyncHandler(async (req, res) => {
  if (req.user.role !== 'manager') {
    res.status(403);
    throw new Error('Only managers can create templates');
  }

  const { orderId } = req.params;
  const {
    name,
    description,
    category,
    subCategory,
    customizableElements,
    colorSchemes,
    tags,
    difficulty,
    estimatedTimeMinutes
  } = req.body;

  // Get the order to extract design files and specifications
  const order = await Order.findById(orderId)
    .populate('files')
    .populate('client', 'name email');

  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  // Find design files from the order
  const designFiles = order.files.filter(file => 
    file.uploadedBy?.role === 'employee' && 
    (file.fileType === 'design' || file.originalname.toLowerCase().includes('design'))
  );

  if (designFiles.length === 0) {
    res.status(400);
    throw new Error('No design files found in this order');
  }

  // Use the first design file as template file
  const templateFile = designFiles[0];

  // Extract flexography specifications from order
  const flexoSpecs = {
    recommendedColors: order.specifications.colors,
    printingMode: order.specifications.printingMode,
    recommendedMaterials: [order.specifications.material],
    materialThickness: [order.specifications.materialThickness],
    standardDimensions: {
      width: order.specifications.dimensions.width,
      height: order.specifications.dimensions.height,
      unit: order.specifications.dimensions.unit
    }
  };

  const template = await Template.create({
    name,
    description,
    category,
    subCategory,
    templateFile: templateFile._id,
    flexoSpecs,
    customizableElements: customizableElements || [],
    colorSchemes: colorSchemes || [],
    createdBy: req.user.id,
    tags: tags || [],
    difficulty: difficulty || 'Beginner',
    estimatedTimeMinutes: estimatedTimeMinutes || 30
  });

  await template.populate([
    { path: 'templateFile', select: 'filename originalname fileUrl' },
    { path: 'createdBy', select: 'name email' }
  ]);

  res.status(201).json(template);
});

// @desc    Use template for new order
// @route   POST /api/templates/:id/use
// @access  Private (Employees)
const useTemplate = asyncHandler(async (req, res) => {
  if (req.user.role !== 'employee') {
    res.status(403);
    throw new Error('Only employees can use templates');
  }

  const template = await Template.findById(req.params.id)
    .populate('templateFile');

  if (!template || !template.isActive) {
    res.status(404);
    throw new Error('Template not found');
  }

  const { 
    orderId, 
    customizations = {},
    selectedColorScheme,
    notes 
  } = req.body;

  // Verify the order exists and is assigned to this employee
  const order = await Order.findById(orderId);
  if (!order) {
    res.status(404);
    throw new Error('Order not found');
  }

  if (order.assignedTo.toString() !== req.user.id) {
    res.status(403);
    throw new Error('Order not assigned to you');
  }

  // Update template usage statistics
  template.stats.usageCount += 1;
  template.stats.lastUsed = new Date();
  await template.save();

  // Create a usage record for tracking
  const templateUsage = {
    templateId: template._id,
    orderId: order._id,
    employeeId: req.user.id,
    customizations,
    selectedColorScheme,
    notes,
    usedAt: new Date()
  };

  // Add template usage to order history
  order.history.push({
    action: 'Template Used',
    user: req.user.id,
    details: `Used template: ${template.name}${notes ? '. Notes: ' + notes : ''}`,
    templateUsage
  });

  await order.save();

  res.json({
    message: 'Template applied successfully',
    template: {
      id: template._id,
      name: template.name,
      category: template.category,
      subCategory: template.subCategory
    },
    order: {
      id: order._id,
      orderNumber: order.orderNumber,
      status: order.status
    },
    usage: templateUsage
  });
});

// @desc    Get template customization options
// @route   GET /api/templates/:id/customize
// @access  Private (Employees)
const getCustomizationOptions = asyncHandler(async (req, res) => {
  const template = await Template.findById(req.params.id);

  if (!template || !template.isActive) {
    res.status(404);
    throw new Error('Template not found');
  }

  // Extract customization metadata
  const customizationData = {
    templateId: template._id,
    templateName: template.name,
    elements: template.customizableElements,
    colorSchemes: template.colorSchemes,
    flexoSpecs: template.flexoSpecs,
    constraints: {
      maxColors: template.flexoSpecs.recommendedColors,
      printingMode: template.flexoSpecs.printingMode,
      recommendedMaterials: template.flexoSpecs.recommendedMaterials
    },
    estimatedTime: template.estimatedTimeMinutes
  };

  res.json(customizationData);
});

// @desc    Get template categories and subcategories
// @route   GET /api/templates/categories
// @access  Private
const getCategories = asyncHandler(async (req, res) => {
  const categories = await getTemplateCategories();
  const subCategories = {};

  for (const category of categories) {
    subCategories[category] = await getTemplateSubCategories(category);
  }

  res.json({
    categories,
    subCategories
  });
});



// Helper functions
const getTemplateCategories = async () => {
  return await Template.distinct('category', { isActive: true });
};

const getTemplateSubCategories = async (category) => {
  const filter = { isActive: true };
  if (category) filter.category = category;
  return await Template.distinct('subCategory', filter);
};

export {
  getTemplates,
  getTemplateById,
  createTemplateFromOrder,
  useTemplate,
  getCustomizationOptions,
  getCategories
}; 