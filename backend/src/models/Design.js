// models/Design.js
import mongoose from "mongoose";

const DesignSchema = new mongoose.Schema(
  {
    designerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    
    title: { type: String, required: true },
    description: String,
    
    // Design files
    imageUrl: { type: String, required: true }, // Main design image
    files: [{
      url: String,
      type: String, // 'image', 'vector', 'mockup'
      size: Number,
      filename: String
    }],
    
    // Categorization
    category: { 
      type: String, 
      required: true,
      enum: ["t-shirt", "mug", "poster", "sticker", "phone-case", "tote-bag", "hoodie", "other"]
    },
    tags: [String],
    specialties: [String], // From designer's specialties
    
    // Pricing
    basePrice: { type: Number, required: true }, // Designer's cut
    
    // Status
    status: { 
      type: String, 
      enum: ["draft", "pending", "approved", "rejected", "inactive"], 
      default: "draft",
      index: true 
    },
    
    // Admin review
    adminNotes: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    
    // Stats
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    sales: { type: Number, default: 0 },
    
    // SEO
    slug: { type: String, unique: true, sparse: true },
    
    // Visibility
    isPublic: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false }
  },
  { timestamps: true }
);

// Indexes for public browsing
DesignSchema.index({ status: 1, isPublic: 1, createdAt: -1 });
DesignSchema.index({ designerId: 1, status: 1 });
DesignSchema.index({ category: 1, status: 1 });
DesignSchema.index({ tags: 1, status: 1 });

export default mongoose.model("Design", DesignSchema);