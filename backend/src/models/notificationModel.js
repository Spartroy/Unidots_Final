import mongoose from 'mongoose';

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['info', 'success', 'warning', 'error'],
      default: 'info'
    },
    entityType: {
      type: String,
      enum: ['order', 'task', 'claim', 'user', 'system'],
      required: true
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: false
    },
    read: {
      type: Boolean,
      default: false
    },
    link: {
      type: String,
      required: false
    }
  },
  {
    timestamps: true
  }
);

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification; 