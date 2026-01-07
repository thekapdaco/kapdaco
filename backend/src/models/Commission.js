// models/Commission.js
import mongoose from "mongoose";

const CommissionSchema = new mongoose.Schema(
  {
    // Order reference
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    
    // Designer who created the product
    designerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    
    // Product that was sold
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
      index: true,
    },
    
    // Commission calculation
    orderTotal: { type: Number, required: true }, // Total order amount
    quantity: { type: Number, default: 1 }, // Quantity sold
    unitPrice: { type: Number, required: true }, // Price per unit at time of sale
    
    // Commission type and amount
    commissionType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "percentage",
    },
    commissionRate: { type: Number, default: 30 }, // Percentage (e.g., 30) or fixed amount
    commissionAmount: { type: Number, required: true }, // Calculated commission in INR
    
    // Status tracking
    status: {
      type: String,
      enum: ["pending", "approved", "paid", "cancelled"],
      default: "pending",
      index: true,
    },
    
    // Payout tracking
    payoutDate: Date, // When commission was paid out
    payoutBatchId: String, // Batch ID for payout processing
    payoutTransactionId: String, // External transaction ID
    
    // Metadata
    notes: String, // Admin notes
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Indexes for efficient queries
CommissionSchema.index({ designerId: 1, status: 1 });
CommissionSchema.index({ status: 1, createdAt: -1 });
CommissionSchema.index({ orderId: 1 });

// Calculate commission amount before saving
CommissionSchema.pre("save", function (next) {
  if (this.isModified("commissionType") || this.isModified("commissionRate") || this.isModified("orderTotal")) {
    if (this.commissionType === "percentage") {
      this.commissionAmount = Math.round((this.orderTotal * this.commissionRate) / 100);
    } else {
      this.commissionAmount = this.commissionRate * this.quantity;
    }
  }
  this.updatedAt = new Date();
  next();
});

export default mongoose.model("Commission", CommissionSchema);

