import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import Template from '../src/models/templateModel.js';
import User from '../src/models/userModel.js';

// Connect to MongoDB
const connectDB = async () => {
  try {
    console.log('Connecting to MongoDB...');
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Sample templates data
const sampleTemplates = [

  {
    name: 'Premium Rice Package',
    description: 'Elegant rice packaging design with traditional elements. Perfect for premium basmati and jasmine rice brands.',
    category: 'Food Packaging',
    subCategory: 'Rice Package',
    flexoSpecs: {
      recommendedColors: 4,
      printingMode: 'Surface Printing',
      recommendedMaterials: ['Flint', 'Strong'],
      materialThickness: [1.14, 1.7],
      standardDimensions: {
        width: 150,
        height: 220,
        unit: 'mm',
      },
    },
    customizableElements: [
      {
        elementId: 'brand-name',
        elementType: 'text',
        label: 'Brand Name',
        defaultValue: 'Premium Rice',
        constraints: {
          maxLength: 20,
          fontSize: { min: 12, max: 22 },
          position: { x: 0, y: 25, locked: false },
        },
      },
      {
        elementId: 'rice-variety',
        elementType: 'text',
        label: 'Rice Variety',
        defaultValue: 'Basmati Rice',
        constraints: {
          maxLength: 30,
          fontSize: { min: 10, max: 18 },
          position: { x: 0, y: 50, locked: false },
        },
      },
      {
        elementId: 'rice-image',
        elementType: 'image',
        label: 'Rice Image',
        defaultValue: '',
        constraints: {
          position: { x: 25, y: 85, locked: false },
        },
      },
      {
        elementId: 'origin-info',
        elementType: 'text',
        label: 'Origin Information',
        defaultValue: 'Premium Quality from India',
        constraints: {
          maxLength: 35,
          fontSize: { min: 8, max: 14 },
          position: { x: 0, y: 150, locked: false },
        },
      },
      {
        elementId: 'main-color',
        elementType: 'color',
        label: 'Main Color',
        defaultValue: '#D35400',
        constraints: {
          position: { x: 0, y: 0, locked: true },
        },
        colorOptions: [
          { name: 'Golden', hex: '#D35400', pantone: 'PMS 166', cmyk: { c: 0, m: 70, y: 100, k: 15 } },
          { name: 'Royal Blue', hex: '#2874A6', pantone: 'PMS 2925', cmyk: { c: 90, m: 60, y: 0, k: 0 } },
          { name: 'Deep Red', hex: '#A93226', pantone: 'PMS 1807', cmyk: { c: 20, m: 100, y: 100, k: 10 } },
        ],
      },
      {
        elementId: 'background-color',
        elementType: 'color',
        label: 'Background Color',
        defaultValue: '#FFFFFF',
        constraints: {
          position: { x: 0, y: 0, locked: true },
        },
      },
    ],
    colorSchemes: [
      {
        name: 'Golden Harvest',
        description: 'Warm golden colors representing quality rice',
        colors: [
          { name: 'Golden Orange', hex: '#D35400', pantone: 'PMS 166', application: 'primary', cmyk: { c: 0, m: 70, y: 100, k: 15 } },
          { name: 'Warm White', hex: '#FDF2E9', application: 'background', cmyk: { c: 2, m: 8, y: 15, k: 0 } },
          { name: 'Dark Brown', hex: '#6E2C00', application: 'text', cmyk: { c: 30, m: 85, y: 100, k: 30 } },
          { name: 'Light Gold', hex: '#F8C471', application: 'accent', cmyk: { c: 0, m: 30, y: 70, k: 0 } },
        ],
        isDefault: true,
      },
    ],
    tags: ['rice', 'food', 'grain', 'premium', 'traditional'],
    difficulty: 'Intermediate',
    estimatedTimeMinutes: 25,
  },

  {
    name: 'Fresh Juice Pouch',
    description: 'Refreshing juice pouch design perfect for fruit juices and health drinks.',
    category: 'Beverage Packaging',
    subCategory: 'Juice Pouch',
    flexoSpecs: {
      recommendedColors: 3,
      printingMode: 'Reverse Printing',
      recommendedMaterials: ['Flint', 'Taiwan'],
      materialThickness: [1.14, 1.7],
      standardDimensions: {
        width: 80,
        height: 120,
        unit: 'mm',
      },
    },
    customizableElements: [
      {
        elementId: 'juice-name',
        elementType: 'text',
        label: 'Juice Name',
        defaultValue: 'Fresh Orange',
        constraints: {
          maxLength: 20,
          fontSize: { min: 10, max: 18 },
          position: { x: 0, y: 20, locked: false },
        },
      },
      {
        elementId: 'fruit-type',
        elementType: 'text',
        label: 'Fruit Type',
        defaultValue: '100% Orange Juice',
        constraints: {
          maxLength: 25,
          fontSize: { min: 7, max: 12 },
          position: { x: 0, y: 40, locked: false },
        },
      },
      {
        elementId: 'main-color',
        elementType: 'color',
        label: 'Main Color',
        defaultValue: '#FF8C00',
        colorOptions: [
          { name: 'Orange', hex: '#FF8C00', pantone: 'PMS 144', cmyk: { c: 0, m: 50, y: 100, k: 0 } },
          { name: 'Apple Red', hex: '#DC143C', pantone: 'PMS 18-1664', cmyk: { c: 0, m: 100, y: 85, k: 5 } },
          { name: 'Grape Purple', hex: '#8E44AD', pantone: 'PMS 2612', cmyk: { c: 65, m: 85, y: 0, k: 0 } },
          { name: 'Tropical Yellow', hex: '#FFD700', pantone: 'PMS 116', cmyk: { c: 0, m: 15, y: 100, k: 0 } },
        ],
      },
    ],
    colorSchemes: [
      {
        name: 'Citrus Fresh',
        description: 'Fresh citrus colors for natural appeal',
        colors: [
          { name: 'Orange Zest', hex: '#FF8C00', pantone: 'PMS 144', application: 'primary', cmyk: { c: 0, m: 50, y: 100, k: 0 } },
          { name: 'Light Cream', hex: '#FFFACD', application: 'background', cmyk: { c: 0, m: 2, y: 20, k: 0 } },
          { name: 'Dark Orange', hex: '#FF6347', application: 'accent', cmyk: { c: 0, m: 70, y: 85, k: 0 } },
        ],
        isDefault: true,
      },
    ],
    tags: ['juice', 'beverage', 'fresh', 'fruit', 'healthy'],
    difficulty: 'Beginner',
    estimatedTimeMinutes: 20,
  },
  {
    name: 'Premium Coffee Package',
    description: 'Sophisticated coffee packaging design for premium coffee brands. Includes space for origin information and brewing instructions.',
    category: 'Food Packaging',
    subCategory: 'Coffee Package',
    flexoSpecs: {
      recommendedColors: 4,
      printingMode: 'Surface Printing',
      recommendedMaterials: ['Strong', 'Flint'],
      materialThickness: [1.7, 2.54],
      standardDimensions: {
        width: 100,
        height: 160,
        unit: 'mm',
      },
    },
    customizableElements: [
      {
        elementId: 'coffee-brand',
        elementType: 'text',
        label: 'Coffee Brand',
        defaultValue: 'Premium Roast',
        constraints: {
          maxLength: 20,
          fontSize: { min: 12, max: 20 },
          position: { x: 0, y: 20, locked: false },
        },
      },
      {
        elementId: 'coffee-origin',
        elementType: 'text',
        label: 'Origin',
        defaultValue: 'Ethiopian Highlands',
        constraints: {
          maxLength: 30,
          fontSize: { min: 8, max: 14 },
          position: { x: 0, y: 45, locked: false },
        },
      },
      {
        elementId: 'roast-level',
        elementType: 'text',
        label: 'Roast Level',
        defaultValue: 'Medium Roast',
        constraints: {
          maxLength: 15,
          fontSize: { min: 7, max: 12 },
          position: { x: 0, y: 65, locked: false },
        },
      },
      {
        elementId: 'brand-color',
        elementType: 'color',
        label: 'Brand Color',
        defaultValue: '#8B4513',
        colorOptions: [
          { name: 'Coffee Brown', hex: '#8B4513', pantone: 'PMS 476', cmyk: { c: 30, m: 70, y: 100, k: 25 } },
          { name: 'Rich Black', hex: '#2C1810', pantone: 'PMS Black 6', cmyk: { c: 50, m: 70, y: 80, k: 60 } },
          { name: 'Deep Gold', hex: '#B8860B', pantone: 'PMS 131', cmyk: { c: 15, m: 35, y: 100, k: 5 } },
          { name: 'Burgundy', hex: '#800020', pantone: 'PMS 188', cmyk: { c: 30, m: 100, y: 80, k: 30 } },
        ],
      },
    ],
    colorSchemes: [
      {
        name: 'Rich Coffee',
        description: 'Deep, rich colors reflecting premium coffee quality',
        colors: [
          { name: 'Coffee Brown', hex: '#8B4513', pantone: 'PMS 476', application: 'primary', cmyk: { c: 30, m: 70, y: 100, k: 25 } },
          { name: 'Cream', hex: '#F5F5DC', application: 'background', cmyk: { c: 5, m: 5, y: 15, k: 0 } },
          { name: 'Dark Brown', hex: '#654321', application: 'text', cmyk: { c: 40, m: 75, y: 100, k: 35 } },
          { name: 'Golden Accent', hex: '#DAA520', application: 'accent', cmyk: { c: 10, m: 30, y: 100, k: 5 } },
        ],
        isDefault: true,
      },
    ],
    tags: ['coffee', 'premium', 'beverage', 'roast', 'gourmet'],
    difficulty: 'Advanced',
    estimatedTimeMinutes: 35,
  },
  {
    name: 'Elegant Tea Package',
    description: 'Sophisticated tea packaging with traditional elements. Perfect for premium loose leaf and herbal teas.',
    category: 'Food Packaging',
    subCategory: 'Tea Package',
    flexoSpecs: {
      recommendedColors: 3,
      printingMode: 'Surface Printing',
      recommendedMaterials: ['Flint', 'Strong'],
      materialThickness: [1.14, 1.7],
      standardDimensions: {
        width: 85,
        height: 130,
        unit: 'mm',
      },
    },
    customizableElements: [
      {
        elementId: 'tea-name',
        elementType: 'text',
        label: 'Tea Name',
        defaultValue: 'Earl Grey',
        constraints: {
          maxLength: 20,
          fontSize: { min: 12, max: 20 },
          position: { x: 0, y: 20, locked: false },
        },
      },
      {
        elementId: 'tea-type',
        elementType: 'text',
        label: 'Tea Type',
        defaultValue: 'Black Tea Blend',
        constraints: {
          maxLength: 25,
          fontSize: { min: 7, max: 12 },
          position: { x: 0, y: 40, locked: false },
        },
      },
      {
        elementId: 'elegant-color',
        elementType: 'color',
        label: 'Elegant Color',
        defaultValue: '#2E8B57',
        colorOptions: [
          { name: 'Tea Green', hex: '#2E8B57', pantone: 'PMS 348', cmyk: { c: 80, m: 20, y: 100, k: 5 } },
          { name: 'Royal Purple', hex: '#663399', pantone: 'PMS 2612', cmyk: { c: 70, m: 85, y: 0, k: 0 } },
          { name: 'Deep Blue', hex: '#191970', pantone: 'PMS 2757', cmyk: { c: 100, m: 95, y: 0, k: 10 } },
          { name: 'Elegant Gold', hex: '#DAA520', pantone: 'PMS 131', cmyk: { c: 10, m: 30, y: 100, k: 5 } },
        ],
      },
    ],
    colorSchemes: [
      {
        name: 'Traditional Tea',
        description: 'Classic colors for premium tea experience',
        colors: [
          { name: 'Tea Green', hex: '#2E8B57', pantone: 'PMS 348', application: 'primary', cmyk: { c: 80, m: 20, y: 100, k: 5 } },
          { name: 'Ivory', hex: '#FFFFF0', application: 'background', cmyk: { c: 0, m: 0, y: 5, k: 0 } },
          { name: 'Dark Green', hex: '#006400', application: 'text', cmyk: { c: 100, m: 30, y: 100, k: 20 } },
        ],
        isDefault: true,
      },
    ],
    tags: ['tea', 'elegant', 'traditional', 'premium', 'herbal'],
    difficulty: 'Intermediate',
    estimatedTimeMinutes: 25,
  },
];

// Function to create a dummy template file reference
const createDummyFile = () => {
  // Return a dummy ObjectId for now
  // In a real scenario, you would create actual File documents
  return new mongoose.Types.ObjectId();
};

// Function to populate templates
const populateTemplates = async () => {
  try {
    console.log('Starting template population...');
    
    // Get a system user or create one for template creation
    let systemUser = await User.findOne({ email: 'system@unidots.com' });
    
    if (!systemUser) {
      console.log('Creating system user for templates...');
      systemUser = await User.create({
        name: 'System',
        email: 'system@unidots.com',
        password: 'systempassword123', // This will be hashed
        role: 'admin',
        isActive: false, // System user, not for login
      });
    }

    // Clear existing templates (optional)
    console.log('Clearing existing templates...');
    await Template.deleteMany({});

    // Create templates
    console.log('Creating sample templates...');
    
    for (let i = 0; i < sampleTemplates.length; i++) {
      const templateData = sampleTemplates[i];
      
      const template = await Template.create({
        ...templateData,
        templateFile: createDummyFile(),
        previewImage: createDummyFile(),
        createdBy: systemUser._id,
        stats: {
          usageCount: Math.floor(Math.random() * 50) + 1, // Random usage count
          lastUsed: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
          avgCustomizationTime: templateData.estimatedTimeMinutes + Math.floor(Math.random() * 10) - 5,
        },
      });

      console.log(`✓ Created template: ${template.name}`);
    }

    console.log(`\nSuccessfully created ${sampleTemplates.length} templates!`);
    console.log('\nTemplates created:');
    sampleTemplates.forEach((template, index) => {
      console.log(`${index + 1}. ${template.name} (${template.category} - ${template.subCategory})`);
    });

  } catch (error) {
    console.error('Error populating templates:', error);
    throw error;
  }
};

// Main execution function
const main = async () => {
  try {
    await connectDB();
    await populateTemplates();
    console.log('\n Template population completed successfully!');
    console.log('\n Note: Template files are dummy references. In production, you would upload actual design files.');
    process.exit(0);
  } catch (error) {
    console.error('Script execution failed:', error);
    process.exit(1);
  }
};

// Run the script
main(); 