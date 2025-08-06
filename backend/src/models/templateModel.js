import mongoose from 'mongoose';

const templateSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Food Packaging',
        'Beverage Packaging', 
        'Personal Care',
        'Pharmaceutical',
        'Industrial',
        'Custom'
      ],
    },
    subCategory: {
      type: String,
      required: true,
      enum: [
        'Rice Package',
        'Juice Pouch',
        'Coffee Package',
        'Tea Package',
     
      ],
    },
    // Template file information
    templateFile: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
      required: true,
    },
    previewImage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'File',
    },
    // Flexography-specific properties
    flexoSpecs: {
      recommendedColors: {
        type: Number,
        min: 1,
        max: 8,
        default: 4,
      },
      printingMode: {
        type: String,
        enum: ['Surface Printing', 'Reverse Printing', 'Both'],
        default: 'Surface Printing',
      },
      recommendedMaterials: [{
        type: String,
        enum: ['Flint', 'Strong', 'Taiwan', 'Other'],
      }],
      materialThickness: [{
        type: Number,
        enum: [1.14, 1.7, 2.54],
      }],
      // Standard dimensions for this template type
      standardDimensions: {
        width: Number,
        height: Number,
        unit: {
          type: String,
          enum: ['mm', 'cm', 'inch'],
          default: 'mm',
        },
      },
    },
    // Customizable elements in the template
    customizableElements: [{
      elementId: {
        type: String,
        required: true,
      },
      elementType: {
        type: String,
        enum: ['text', 'color', 'image', 'logo', 'background'],
        required: true,
      },
      label: {
        type: String,
        required: true,
      },
      defaultValue: String,
      colorOptions: [{
        name: String,
        hex: String,
        cmyk: {
          c: Number,
          m: Number,
          y: Number,
          k: Number,
        },
        pantone: String,
      }],
      constraints: {
        maxLength: Number,
        fontSize: {
          min: Number,
          max: Number,
        },
        position: {
          x: Number,
          y: Number,
          locked: {
            type: Boolean,
            default: false,
          },
        },
      },
    }],
    // Pre-defined color schemes
    colorSchemes: [{
      name: {
        type: String,
        required: true,
      },
      description: String,
      colors: [{
        name: String,
        hex: String,
        cmyk: {
          c: Number,
          m: Number,
          y: Number,
          k: Number,
        },
        pantone: String,
        application: String, // Where this color is used (background, text, accent, etc.)
      }],
      isDefault: {
        type: Boolean,
        default: false,
      },
    }],
    // Usage statistics
    stats: {
      usageCount: {
        type: Number,
        default: 0,
      },
      lastUsed: Date,
      avgCustomizationTime: Number, // in minutes
    },
    // Template metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    version: {
      type: String,
      default: '1.0',
    },
    tags: [{
      type: String,
      trim: true,
    }],
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
    },
    estimatedTimeMinutes: {
      type: Number,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

// Index for better search performance
templateSchema.index({ category: 1, subCategory: 1, isActive: 1 });
templateSchema.index({ tags: 1 });
templateSchema.index({ 'stats.usageCount': -1 });

// Virtual for full template info
templateSchema.virtual('popularity').get(function() {
  return this.stats.usageCount || 0;
});

export default mongoose.model('Template', templateSchema); 