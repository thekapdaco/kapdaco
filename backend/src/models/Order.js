import mongoose from 'mongoose';

// Item schema for order items
const OrderItemSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  quantity: { 
    type: Number, 
    required: true,
    min: 1
  },
  size: String,
  color: String,
  variantId: { 
    type: mongoose.Schema.Types.ObjectId 
  },
  price: { 
    type: Number, 
    required: true 
  }, // Snapshot at purchase
  customDesign: String, // URL or base64 for customized items
  customDesignData: {
    front: String,
    back: String
  }
}, { _id: false }); // Don't create separate _id for items

const OrderSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      required: true, 
      index: true 
    },
    
    // Multiple items support - array of order items
    items: [OrderItemSchema],
    
    // Legacy fields for backward compatibility (deprecated, use items[] instead)
    // Keep these temporarily for migration but they're not required
    productId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Product', 
      index: true,
      // Not required - can be null for new orders using items[]
      default: null
    },
    quantity: { 
      type: Number, 
      default: 1 
    },
    
    assignedDesigner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User', 
      index: true 
    },
    
    status: { 
      type: String, 
      enum: ['pending', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'], 
      default: 'pending', 
      index: true 
    },
    
    // Price snapshot for earnings (legacy - now calculated from items)
    priceAtPurchase: { 
      type: Number 
    },
    
    total: { 
      type: Number, 
      required: true 
    }, // Total order amount (sum of all items)
    
    shippingAddress: {
      street: String,
      addressLine2: String,
      landmark: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
      fullName: String
    },
    
    billingAddress: {
      street: String,
      addressLine2: String,
      landmark: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
      phone: String,
      fullName: String
    },
    sameAsShipping: { type: Boolean, default: true },
    shippingAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'User.addresses' },
    billingAddressId: { type: mongoose.Schema.Types.ObjectId, ref: 'User.addresses' },
    
    deliveryOption: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard'
    },
    
    paymentId: String,
    paymentMethod: {
      type: String,
      enum: ['card', 'upi', 'cod', 'wallet', 'netbanking'],
      default: 'card'
    },
    paymentStatus: { 
      type: String, 
      enum: ['pending', 'paid', 'failed', 'refunded'], 
      default: 'pending' 
    },
    
    couponCode: String, // Applied coupon code
    giftMessage: String, // Gift message (optional)
    orderNotes: String, // Special instructions
    gstNumber: String, // GST number (B2B orders)
    
    // Shipping & Tracking Information
    trackingNumber: String,
    carrier: String, // e.g., "FedEx", "DHL", "India Post", "DTDC"
    shippedAt: Date,
    estimatedDelivery: Date,
    deliveredAt: Date,
    
    // Order status history (for tracking changes)
    statusHistory: [{
      status: String,
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: String
    }],
    
    // Cancellation information
    cancelledAt: Date,
    cancellationReason: String,
    cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    refundId: String, // Razorpay refund ID if refund was processed
    
    // Invoice information
    invoiceNumber: String,
    invoiceGeneratedAt: Date,
    
    // Idempotency key for preventing duplicate orders
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true // Allow null values but enforce uniqueness when present
    },
  },
  { timestamps: true }
);


// Virtual to get total items count
OrderSchema.virtual('totalItems').get(function() {
  if (this.items && this.items.length > 0) {
    return this.items.reduce((sum, item) => sum + (item.quantity || 0), 0);
  }
  // Fallback to legacy quantity
  return this.quantity || 0;
});

// Ensure virtuals are included in JSON output
OrderSchema.set('toJSON', { virtuals: true });

// Index for common queries
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model('Order', OrderSchema);
