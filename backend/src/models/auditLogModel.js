import mongoose from 'mongoose';

// Append-only record of who did what, when, to which record. Nothing in the app edits or deletes these.
const auditLogSchema = mongoose.Schema(
  {
    actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    actorName: String,
    actorRole: String,
    action: { type: String, required: true, index: true }, // e.g. order.status, quote.approved, file.download, auth.login
    entityType: {
      type: String,
      enum: ['order', 'claim', 'task', 'file', 'user', 'auth', 'quote', 'inventory', 'pricelist', 'system'],
      required: true,
      index: true,
    },
    entityId: { type: String, index: true },
    entityLabel: String, // human label such as the order number
    details: { type: String, maxlength: 1000 },
    outcome: { type: String, enum: ['success', 'denied', 'failed'], default: 'success', index: true },
    ip: String,
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

auditLogSchema.index({ createdAt: -1 });

export default mongoose.model('AuditLog', auditLogSchema);
