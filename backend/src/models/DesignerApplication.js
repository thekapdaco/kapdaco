// models/DesignerApplication.js
import mongoose from "mongoose";

const DesignerApplicationSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      unique: true, 
      index: true 
    },
    
    // Personal Information
    fullName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    country: { type: String, required: true },
    city: { type: String, required: true },
    dateOfBirth: Date,
    
    // Professional Information
    designerName: { type: String, required: true },
    bio: { type: String, required: true },
    experience: { type: String, required: true },
    designStyle: { type: String, required: true },
    specialties: [{ type: String, required: true }],
    inspiration: String,
    
    // Social Links
    instagram: String,
    behance: String,
    dribbble: String,
    website: String,
    
    // Business Information
    businessType: { type: String, required: true },
    panNumber: String,
    accountNumber: String,
    ifscCode: String,
    
    // Portfolio
    portfolioFiles: [String], // URLs of uploaded files
    portfolioDescription: String,
    
    // Application Status
    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending",
      index: true 
    },
    
    // Admin notes
    adminNotes: String,
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    
    // Legal confirmations
    agreeToTerms: { type: Boolean, required: true },
    agreeToCommission: { type: Boolean, required: true },
    ageConfirmation: { type: Boolean, required: true }
  },
  { timestamps: true }
);

// Indexes for admin filtering
DesignerApplicationSchema.index({ status: 1, createdAt: -1 });
DesignerApplicationSchema.index({ reviewedBy: 1 });

export default mongoose.model("DesignerApplication", DesignerApplicationSchema);