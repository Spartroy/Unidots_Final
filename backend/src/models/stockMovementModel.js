import mongoose from 'mongoose';

// Every change to stock, so the quantity can always be explained.
const stockMovementSchema = mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
    delta: { type: Number, required: true }, // positive = added, negative = used
    reason: { type: String, enum: ['received', 'order-use', 'adjustment'], required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    note: { type: String, maxlength: 500 },
    quantityAfter: Number,
  },
  { timestamps: true }
);

export default mongoose.model('StockMovement', stockMovementSchema);
