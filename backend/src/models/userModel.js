import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please add a name'],
    },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        'Please add a valid email',
      ],
    },
    password: {
      type: String,
      required: [true, 'Please add a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['client', 'employee', 'manager', 'admin', 'prepress', 'courier'],
      default: 'client',
    },
    company: {
      type: String,
      required: function() {
        return this.role === 'client';
      },
    },
    phone: {
      type: String,
      required: function() {
        return this.role === 'client' && this.isNew;
      },
    },
    address: {
      street: {
        type: String,
        required: function() {
          return this.role === 'client' && this.isNew;
        },
      },
      city: {
        type: String,
        required: function() {
          return this.role === 'client' && this.isNew;
        },
      },
      state: {
        type: String,
        required: function() {
          return this.role === 'client' && this.isNew;
        },
      },
      postalCode: {
        type: String,
        required: function() {
          return this.role === 'client' && this.isNew;
        },
      },
      country: {
        type: String,
        required: function() {
          return this.role === 'client' && this.isNew;
        },
      },
    },
    // Optional geolocation for clients to share delivery pin
    geoLocation: {
      latitude: { type: Number },
      longitude: { type: Number }
    },
    department: {
      type: String,
      enum: ['design', 'prepress', 'production', 'sales', 'management', 'none'],
      default: 'none',
      required: function() {
        return this.role === 'employee' || this.role === 'manager';
      },
    },
    profileImage: {
      type: String,
    },
    // Preferred/default designer for client (auto-assign new orders)
    defaultDesigner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLogin: {
      type: Date,
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date,
  },
  {
    timestamps: true,
  }
);

// Encrypt password using bcrypt
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Pre-save middleware to handle migration of old client accounts
userSchema.pre('save', async function(next) {
  // Initialize address fields for existing clients if they don't have address
  if (this.role === 'client' && !this.isNew) {
    // Check if address is missing or is a string (old format)
    if (!this.address || typeof this.address === 'string') {
      // Convert string address to structured format or initialize empty
      const oldAddress = this.address || '';
      this.address = {
        street: oldAddress,
        city: '',
        state: '',
        postalCode: '',
        country: ''
      };
    }
    
    // Ensure phone exists for old clients
    if (!this.phone) {
      this.phone = '';
    }
  }
  next();
});

export default mongoose.model('User', userSchema);