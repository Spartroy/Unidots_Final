import mongoose from 'mongoose';

const fileSchema = mongoose.Schema(
  {
    filename: {
      type: String,
      required: true,
    },
    originalname: {
      type: String,
      required: true,
    },
    mimetype: {
      type: String,
      required: true,
    },
    size: {
      type: Number,
      required: true,
    },
    path: {
      type: String,
      required: true,
    },
    fileType: {
      type: String,
      enum: ['design', 'reference', 'proof', 'claim', 'manager', 'prepress', 'employee', 'other'],
      default: 'other',
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    relatedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    relatedClaim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim',
    },
    relatedTask: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
    },
    version: {
      type: Number,
      default: 1,
    },
    previousVersions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    previewPath: {
      type: String,
    },
    metadata: {
      width: Number,
      height: Number,
      colorSpace: String,
      resolution: Number,
      additionalInfo: Object,
    },
    tags: [String],
    notes: String,
  },
  {
    timestamps: true,
  }
);

export default mongoose.model('File', fileSchema);

