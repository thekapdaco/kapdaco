// models/User.js
import mongoose from "mongoose";

const AddressSchema = new mongoose.Schema({
  label: { 
    type: String, 
    required: true,
    default: 'Home'
  }, // e.g., "Home", "Office"
  fullName: String, // Receiver full name (if different from user)
  street: { 
    type: String, 
    required: true 
  },
  addressLine2: String, // Apartment, suite, etc.
  landmark: String, // Nearby landmark
  city: { 
    type: String, 
    required: true 
  },
  state: { 
    type: String, 
    default: '' 
  },
  postalCode: { 
    type: String, 
    required: true 
  },
  country: { 
    type: String, 
    required: true,
    default: 'India'
  },
  phone: { 
    type: String, 
    required: true 
  },
  addressType: {
    type: String,
    enum: ['home', 'work', 'other'],
    default: 'home'
  },
  isDefault: { 
    type: Boolean, 
    default: false 
  }
}, { _id: true });

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { 
      type: String, 
      enum: ["customer", "designer", "seller", "brand", "admin"], 
      default: "customer",
      index: true 
    },
    username: { type: String, unique: true, sparse: true }, // Designer handle
    isActive: { type: Boolean, default: true },
    
    // Profile fields
    phone: String,
    country: String,
    city: String,
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say']
    },
    marketingOptIn: { type: Boolean, default: false },
    firstName: String,
    lastName: String,

    // Shipping addresses array
    addresses: [AddressSchema],
    
    // Seller-specific profile (populated when role becomes 'seller' or 'brand')
    sellerProfile: {
      accountType: { type: String, enum: ['individual', 'business'], default: 'individual' },
      businessName: String,
      brandName: String, // Brand name (may differ from business name)
      brandSlug: String, // URL-friendly brand identifier
      brandTagline: String, // Short brand tagline
      businessDescription: String,
      aboutBrand: String, // Longer brand bio
      businessCategory: String,
      brandCategory: {
        type: String,
        enum: ['streetwear', 'premium', 'luxury', 'sustainable', 'vintage', 'other']
      },
      originCountry: String, // Brand origin country
      originCity: String, // Brand origin city
      businessRegNumber: String,
      taxId: String,
      yearsInBusiness: String,
      businessAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
      },
      billingAddress: {
        street: String,
        city: String,
        state: String,
        postalCode: String,
        country: String
      },
      bankAccountNumber: String,
      routingNumber: String,
      paymentProcessor: String,
      currency: String,
      returnPolicy: String,
      defaultReturnPolicy: String, // Default return policy
      shippingPolicy: String,
      defaultShippingPolicy: String, // Default shipping policy
      storeLogo: String,
      storeBanner: String,
      heroBanner: String, // Brand banner image
      socialLinks: {
        instagram: String,
        facebook: String,
        twitter: String,
        website: String
      },
      supportEmail: String, // Customer support email
      supportPhone: String // Customer support phone
    },
    
    // Designer-specific fields (populated when role becomes 'designer')
    bio: String, // Short bio (500 chars)
    longBio: String, // Extended bio
    designerName: String, // Display name
    portfolioUrl: String,
    instagram: String, // Full Instagram URL
    instagramHandle: String, // Instagram username/handle
    behance: String,
    dribbble: String,
    website: String,
    styleTags: [{ type: String }], // Design style tags
    profileImage: String, // Profile picture URL
    bannerImage: String, // Banner image URL
    portfolioLinks: {
      behance: String,
      dribbble: String,
      website: String
    },
    commissionModel: String, // Commission structure description
    
    // Stats (calculated fields)
    totalSales: { type: Number, default: 0 },
    totalEarnings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    
    // Password reset fields
    resetToken: { type: String, default: null },
    resetTokenExpiry: { type: Date, default: null }
  },
  { timestamps: true }
);

// Index for designer discovery
UserSchema.index({ role: 1, isActive: 1 });

export default mongoose.model("User", UserSchema);
