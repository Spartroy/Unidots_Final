import mongoose from 'mongoose';

const platePlacementSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    widthCm: { type: Number, required: true },
    heightCm: { type: Number, required: true },
    xCm: { type: Number, required: true },
    yCm: { type: Number, required: true },
    rotated: { type: Boolean, default: false },
    placedAt: { type: Date, default: Date.now },
    placedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { _id: false }
);

const plateSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    widthCm: { type: Number, required: true },
    heightCm: { type: Number, required: true },
    marginLeftCm: { type: Number, default: 2 },
    marginRightCm: { type: Number, default: 2 },
    material: { type: String, required: true, enum: ['Flint', 'Strong', 'Taiwan', 'Other'] },
    materialThickness: { type: Number, required: true, enum: [1.14, 1.7, 2.54] },
    status: { type: String, enum: ['Active', 'Completed'], default: 'Active' },
    placements: [platePlacementSchema],
    completedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model('Plate', plateSchema);


