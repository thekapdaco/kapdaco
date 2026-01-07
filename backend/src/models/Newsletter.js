// models/Newsletter.js
import mongoose from "mongoose";

const NewsletterSchema = new mongoose.Schema(
  {
    email: { 
      type: String, 
      required: true, 
      unique: true, 
      lowercase: true,
      trim: true,
      index: true,
      validate: {
        validator: function(v) {
          return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
        },
        message: 'Please provide a valid email address'
      }
    },
    
    // Subscription preferences
    preferences: {
      newCollections: { type: Boolean, default: true },
      styleNotes: { type: Boolean, default: true },
      atelierUpdates: { type: Boolean, default: true },
      invites: { type: Boolean, default: false },
    },
    
    // Subscription status
    isActive: { type: Boolean, default: true },
    subscribedAt: { type: Date, default: Date.now },
    unsubscribedAt: Date,
    
    // Optional: Link to user account if they have one
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User",
      sparse: true,
      index: true
    },
    
    // Source tracking
    source: { type: String, default: 'website' }, // website, checkout, social, etc.
    
    // Metadata
    ipAddress: String,
    userAgent: String,
  },
  { timestamps: true }
);

// Index for finding active subscribers
NewsletterSchema.index({ email: 1, isActive: 1 });
NewsletterSchema.index({ subscribedAt: -1 });

// Note: Unique index for email is already defined at field level (unique: true)
// Avoid redefining the same unique index to prevent Mongoose duplicate index warnings.

const Newsletter = mongoose.model("Newsletter", NewsletterSchema);

export default Newsletter;

