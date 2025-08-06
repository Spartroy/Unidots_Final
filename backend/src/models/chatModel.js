import mongoose from 'mongoose';

const chatSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      role: {
        type: String,
        enum: ['client', 'employee', 'manager'],
        required: true,
      },
      joinedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    messages: [{
      id: {
        type: mongoose.Schema.Types.ObjectId,
        default: () => new mongoose.Types.ObjectId(),
      },
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
      content: {
        type: String,
        required: true,
      },
      messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'system'],
        default: 'text',
      },
      attachments: [{
        filename: String,
        fileUrl: String,
        fileType: String,
        fileSize: Number,
      }],
      timestamp: {
        type: Date,
        default: Date.now,
      },
      readBy: [{
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        readAt: {
          type: Date,
          default: Date.now,
        },
      }],
      editedAt: Date,
      deleted: {
        type: Boolean,
        default: false,
      },
    }],
    isActive: {
      type: Boolean,
      default: true,
    },
    lastMessage: {
      content: String,
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      timestamp: Date,
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: new Map(),
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
chatSchema.index({ orderId: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ 'messages.timestamp': -1 });

// Update lastMessage when a new message is added
chatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = {
      content: lastMsg.content,
      sender: lastMsg.sender,
      timestamp: lastMsg.timestamp,
    };
  }
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat; 