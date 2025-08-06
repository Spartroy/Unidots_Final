import mongoose from 'mongoose';

const claimSchema = mongoose.Schema(
  {
    claimNumber: {
      type: String,
      required: true,
      unique: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'Please add a title for the claim'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description of the issue'],
    },
    claimType: {
      type: String,
      required: true,
      enum: ['Quality Issue', 'Delivery Problem', 'Incorrect Specifications', 'Damage', 'Other'],
    },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    status: {
      type: String,
      required: true,
      enum: ['Submitted', 'Under Review', 'In Progress', 'Resolved', 'Rejected', 'Closed'],
      default: 'Submitted',
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    resolution: {
      action: {
        type: String,
        enum: ['Reprint', 'Refund', 'Discount', 'Replacement', 'No Action', 'Other'],
      },
      details: String,
      date: Date,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    comments: [
      {
        content: {
          type: String,
          required: true,
        },
        author: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    history: [
      {
        action: {
          type: String,
          required: true,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true,
        },
        details: {
          type: String,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Generate claim number before saving
claimSchema.pre('save', async function (next) {
  if (!this.claimNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.claimNumber = `CLM-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

const Claim = mongoose.model('Claim', claimSchema);
export default Claim;