import express from 'express';
import {
  getTemplates,
  getTemplateById,
  createTemplateFromOrder,
  useTemplate,
  getCustomizationOptions,
  getCategories
} from '../controllers/templateController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes (require authentication)
router.use(protect);

// Get template categories and subcategories
router.get('/categories', getCategories);

// Get all templates with filtering and pagination
router.get('/', getTemplates);

// Get specific template by ID
router.get('/:id', getTemplateById);

// Get customization options for a template
router.get('/:id/customize', getCustomizationOptions);

// Use template for an order (employees only)
router.post('/:id/use', useTemplate);

// Create template from completed order (managers only)
router.post('/from-order/:orderId', createTemplateFromOrder);

export default router; 