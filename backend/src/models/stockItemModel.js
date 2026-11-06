import mongoose from 'mongoose';

// Plate material in stock (square metres), by material and thickness.
const stockItemSchema = mongoose.Schema(
  {
    material: { type: String, enum: ['Flint', 'Strong', 'Taiwan', 'Other'], required: true },
    thickness: { type: Number, enum: [1.14, 1.7, 2.54], required: true },
    unit: { type: String, default: 'm2' },
    quantity: { type: Number, default: 0 },
    lowStockThreshold: { type: Number, default: 0, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

stockItemSchema.index({ material: 1, thickness: 1 }, { unique: true });

export default mongoose.model('StockItem', stockItemSchema);
