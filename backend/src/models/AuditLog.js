import mongoose from 'mongoose';

/**
 * Audit Log Model
 * Tracks critical actions for security, compliance, and debugging
 */
const AuditLogSchema = new mongoose.Schema({
  // Action details
  action: {
    type: String,
    required: true,
    enum: [
      'order.created',
      'order.updated',
      'order.cancelled',
      'order.refunded',
      'payment.processed',
      'payment.verified',
      'payment.refunded',
      'user.created',
      'user.updated',
      'user.deleted',
      'user.suspended',
      'user.password_changed',
      'product.created',
      'product.updated',
      'product.deleted',
      'product.approved',
      'product.rejected',
      'cart.cleared',
      'admin.action',
      'auth.login',
      'auth.logout',
      'auth.failed_login',
      'UNAUTHORIZED_ACCESS_ATTEMPT',
      'UNAUTHORIZED_ROLE_ACCESS',
      'INACTIVE_USER_ACCESS_ATTEMPT',
      'stock.updated',
      'stock.restored',
      'commission.created',
      'commission.approved',
      'commission.cancelled'
    ],
    index: true
  },
  
  // Actor (who performed the action)
  actor: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    role: {
      type: String,
      enum: ['customer', 'designer', 'admin', 'brand', 'system']
    },
    ipAddress: String,
    userAgent: String
  },
  
  // Target (what was affected)
  target: {
    type: {
      type: String,
      enum: ['order', 'user', 'product', 'payment', 'cart', 'stock', 'commission', 'auth']
    },
    id: mongoose.Schema.Types.ObjectId,
    reference: String // Additional reference like order number, email, etc.
  },
  
  // Action details
  details: {
    type: mongoose.Schema.Types.Mixed, // Flexible object for action-specific data
    default: {}
  },
  
  // Change tracking
  changes: {
    before: mongoose.Schema.Types.Mixed,
    after: mongoose.Schema.Types.Mixed
  },
  
  // Request context
  requestId: String, // Link to request ID for tracing
  status: {
    type: String,
    enum: ['success', 'failure', 'partial'],
    default: 'success'
  },
  
  // Error information (if action failed)
  error: {
    message: String,
    code: String,
    stack: String
  },
  
  // Metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

// Indexes for common queries
AuditLogSchema.index({ action: 1, createdAt: -1 });
AuditLogSchema.index({ 'actor.userId': 1, createdAt: -1 });
AuditLogSchema.index({ 'target.type': 1, 'target.id': 1 });
AuditLogSchema.index({ requestId: 1 });
AuditLogSchema.index({ createdAt: -1 });

// TTL index - retain audit logs for 1 year (365 days)
AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 31536000 });

export default mongoose.model('AuditLog', AuditLogSchema);

