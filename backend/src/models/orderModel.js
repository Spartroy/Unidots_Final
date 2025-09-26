import mongoose from 'mongoose';

const orderSchema = mongoose.Schema(
  {
    orderNumber: {
      type: String,
      required: true,
      unique: true,
    },
    client: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
    },
    description: {
      type: String,
    },
    orderType: {
      type: String,
      enum: ['New Order', 'Existing', 'Existing With Changes'],
      default: 'New Order',
    },
    specifications: {
      // Package type (bag/pouch/label style)
      packageType: {
        type: String,
        enum: [
          'Central Seal',
          '2 Side Seal',
          '3 Side Seal',
          'Custom Pouch',
          'Label',
          'Other'
        ],
        default: 'Other',
      },
      // Color specifications
      colors: {
        type: Number,
        default: 1,
      },
      usedColors: {
        type: [{
          type: String,
          enum: ['Cyan', 'Magenta', 'Yellow', 'Black', 'CMYK Combined', 'Red', 'Blue', 'Green', 'Golden', 'Silver', 'White', 'Other'],
        }],
        default: [],
      },
      customColors: [{
        type: String,
      }],
      
      // Printing mode
      printingMode: {
        type: String,
        enum: ['Surface Printing', 'Reverse Printing'],
        default: 'Surface Printing',
      },
      
      // Dimensions
      dimensions: {
        width: {
          type: Number,
        },
        widthRepeatCount: {
          type: Number,
          default: 1,
        },
        height: {
          type: Number,
        },
        heightRepeatCount: {
          type: Number,
          default: 1,
        },
        unit: {
          type: String,
          enum: ['mm', 'cm', 'inch'],
          default: 'mm',
        },
      },
      
      // Material specifications
      material: {
        type: String,
        enum: ['Flint', 'Strong', 'Taiwan','Other'],
      },
      materialThickness: {
        type: Number,
        enum: [1.14, 1.7, 2.54],
      },
      
      // Distortion field
      distortion: {
        type: Number,
        min: 0,
        max: 100,
      },
      
      // Job path field
      jobPath: {
        type: String,
      },
      
      // Legacy fields - kept for backward compatibility
      quantity: {
        type: Number,
        default: 1,
      },
      finishType: {
        type: String,
        enum: ['Matte', 'Glossy', 'Semi-Glossy', 'None'],
        default: 'None',
      },
      additionalDetails: {
        type: String,
      },
    },
    files: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'File',
      },
    ],
    status: {
      type: String,
      required: true,
      enum: [
        'Submitted',
        'Designing',
        'Design Done',
        'In Review',
        'In Prepress',
        'Ready for Delivery',
        'Delivering',
        'Completed',
        'Cancelled',
        'On Hold',
      ],
      default: 'Submitted',
    },
    stages: {
      review: {
        status: {
          type: String,
          enum: ['Pending', 'In Progress', 'Completed', 'Rejected', 'N/A'],
          default: 'Pending',
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        startDate: Date,
        completionDate: Date,
        notes: String,
      },
      prepress: {
        status: {
          type: String,
          enum: ['Pending', 'In Progress', 'Completed', 'Rejected', 'N/A'],
          default: 'Pending',
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        startDate: Date,
        completionDate: Date,
        notes: String,
        subProcesses: {
          positioning: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          backExposure: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          laserImaging: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          mainExposure: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          washout: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          drying: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          postExposure: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          uvcExposure: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          },
          finishing: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          }
        }
      },
      production: {
        status: {
          type: String,
          enum: ['Pending', 'In Progress', 'Completed', 'Rejected', 'N/A'],
          default: 'Pending',
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        startDate: Date,
        completionDate: Date,
        notes: String,
        subProcesses: {
          ripping: {
            status: {
              type: String,
              enum: ['Pending', 'Completed'],
              default: 'Pending'
            },
            completedAt: Date,
            completedBy: {
              type: mongoose.Schema.Types.ObjectId,
              ref: 'User'
            }
          }
        }
      },
      delivery: {
        status: {
          type: String,
          enum: ['Pending', 'In Progress', 'Completed', 'N/A'],
          default: 'Pending',
        },
        assignedTo: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        startDate: Date,
        completionDate: Date,
        completedBy: {
          _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: String,
          email: String,
          role: String
        },
        trackingNumber: String,
        deliveryMethod: String,
        notes: String,
      courierInfo: {
        courier: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        assignedCourier: {
          _id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          name: String,
          email: String,
          phone: String
        },
        mode: { type: String, enum: ['direct', 'shipping-company', 'client-collection'] },
        // Direct delivery fields
        destination: {
          street: String,
          city: String,
          state: String,
          postalCode: String,
          country: String,
        },
        // Shipping company fields
        shipmentLabelFileId: { type: mongoose.Schema.Types.ObjectId, ref: 'File' },
        shipmentCompany: String,
        createdAt: { type: Date },
      },
      },
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium',
    },
    deadline: {
      type: Date,
    },
    cost: {
      estimatedCost: {
        type: Number,
        default: 0,
      },
      finalCost: {
        type: Number,
      },
      currency: {
        type: String,
        default: 'USD',
      },
      breakdown: {
        type: Object,
      },
    },
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
    // Design Submissions from Templates
    designSubmissions: [{
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      templateId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Template',
        required: true,
      },
      customizations: {
        type: Object,
        default: {},
      },
      uploadedImages: {
        type: Object,
        default: {},
      },
      submittedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      submittedAt: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        default: '',
      },
      status: {
        type: String,
        enum: ['Submitted', 'Approved', 'Rejected', 'Revision Requested'],
        default: 'Submitted',
      },
      clientFeedback: {
        type: String,
        default: '',
      },
      approvedAt: Date,
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    }],
    // Design Links provided by designers
    designLinks: [{
      link: {
        type: String,
        required: true,
      },
      addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      addedAt: {
        type: Date,
        default: Date.now,
      },
      notes: {
        type: String,
        default: '',
      },
    }],
  },
  {
    timestamps: true,
  }
);

// Generate order number before saving
orderSchema.pre('save', async function (next) {
  if (!this.orderNumber) {
    const date = new Date();
    const year = date.getFullYear().toString().substr(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD-${year}${month}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

const Order = mongoose.model('Order', orderSchema);
export default Order;