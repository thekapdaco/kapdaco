import mongoose from 'mongoose';

const WebhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  eventType: String,
  processedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Unique index on eventId + entityId to prevent duplicates
WebhookEventSchema.index({ eventId: 1, entityId: 1 }, { unique: true });

// TTL index - clean up after 30 days
WebhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('WebhookEvent', WebhookEventSchema);

