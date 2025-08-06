import mongoose from 'mongoose';

const acidSolutionSchema = mongoose.Schema({
  // Inventory tracking
  totalBarrels: {
    type: Number,
    required: true,
    default: 0
  },
  barrelCapacity: {
    type: Number,
    required: true,
    default: 200 // liters per barrel
  },
  currentLiters: {
    type: Number,
    required: true,
    default: 0
  },
  
  // Cost tracking
  costPerBarrel: {
    type: Number,
    required: true,
    default: 35000 // cost per barrel
  },
  recyclingCostPerBarrel: {
    type: Number,
    required: true,
    default: 800 // cost to recycle per barrel
  },
  costPerSquareMeter: {
    type: Number,
    required: true,
    default: 424.44 // calculated cost per m²
  },
  
  // Production data
  monthlyProductionM2: {
    type: Number,
    required: true,
    default: 450 // m² per month
  },
  litersPerM2: {
    type: Number,
    required: true,
    default: 10 // liters needed per m²
  },
  recyclingRate: {
    type: Number,
    required: true,
    default: 0.70 // 70% recycling efficiency
  },
  recyclingFrequency: {
    type: Number,
    required: true,
    default: 30 // times per month
  },
  
  // Monthly tracking
  month: {
    type: Number,
    required: true
  },
  year: {
    type: Number,
    required: true
  },
  
  // Usage history
  usageHistory: [{
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: false, // Allow null for manual entries
      default: null
    },
    litersUsed: {
      type: Number,
      required: true
    },
    cost: {
      type: Number,
      required: true
    },
    areaProcessed: {
      type: Number,
      required: true // in m²
    },
    processedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Monthly statistics
  monthlyStats: {
    totalLitersUsed: {
      type: Number,
      default: 0
    },
    totalCost: {
      type: Number,
      default: 0
    },
    totalAreaProcessed: {
      type: Number,
      default: 0
    },
    ordersProcessed: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Compound index for month/year queries
acidSolutionSchema.index({ year: 1, month: 1 }, { unique: true });

// Static method to get current month's record
acidSolutionSchema.statics.getCurrentMonthRecord = async function() {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  const year = now.getFullYear();
  
  let record = await this.findOne({ month, year });
  
  if (!record) {
    // Create new record for current month
    record = await this.create({
      month,
      year,
      totalBarrels: 6, // Default 6 barrels per month
      currentLiters: 1200, // Default full capacity
    });
  }
  
  return record;
};

// Method to add usage record
acidSolutionSchema.methods.addUsage = async function(orderId, areaProcessed) {
  const litersUsed = areaProcessed * this.litersPerM2;
  const cost = areaProcessed * this.costPerSquareMeter;
  
  // Add to usage history
  this.usageHistory.push({
    orderId,
    litersUsed,
    cost,
    areaProcessed,
    processedAt: new Date()
  });
  
  // Update monthly stats
  this.monthlyStats.totalLitersUsed += litersUsed;
  this.monthlyStats.totalCost += cost;
  this.monthlyStats.totalAreaProcessed += areaProcessed;
  this.monthlyStats.ordersProcessed += 1;
  
  // Update current liters (considering recycling)
  const actualConsumption = litersUsed * (1 - this.recyclingRate);
  this.currentLiters -= actualConsumption;
  
  await this.save();
  
  return {
    litersUsed,
    cost,
    areaProcessed
  };
};

// Method to refill barrels
acidSolutionSchema.methods.refillBarrels = async function(barrelCount) {
  this.totalBarrels += barrelCount;
  this.currentLiters += (barrelCount * this.barrelCapacity);
  await this.save();
};

const AcidSolution = mongoose.model('AcidSolution', acidSolutionSchema);

export default AcidSolution; 