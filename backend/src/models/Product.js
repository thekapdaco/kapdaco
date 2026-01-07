import mongoose from 'mongoose';

const VariantSchema = new mongoose.Schema({
  // New structure: optionValueIds array (references to OptionValue)
  optionValueIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OptionValue'
  }],
  
  // Legacy fields (for backwards compatibility - will be migrated gradually)
  size: String,
  color: String,
  
  stock: { 
    type: Number, 
    default: 0,
    min: [0, 'Variant stock cannot be negative'], // Prevent negative stock
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Variant stock cannot be negative'
    }
  },
  sku: String,
  price: Number, // Optional price override for this variant
  
  // Legacy: variant-specific images (new system uses ProductMedia)
  images: [String],
  
  slug: String, // URL-friendly identifier for the variant
  isDefault: { type: Boolean, default: false }, // Mark default variant
}, { _id: true }); // Enable _id for variants so we can use it as variantId

const ProductSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subtitle: String, // Product tagline
  description: String,
  price: { type: Number, required: true, min: 0 },
  discountPrice: Number, // Sale/discounted price
  compareAtPrice: Number, // MRP/Original price for discount display
  currency: { type: String, default: 'INR' },
  category: { 
    type: String, 
    index: true,
    enum: ['mens', 'womens', 'hoodies', 't-shirts', 'accessories', 'men', 'women', 'cups'],
    // Note: 'mens' and 'womens' are normalized to 'men' and 'women' in controllers
  },
  subCategory: String, // e.g., "Graphic Tees", "Oversized Hoodies"
  gender: {
    type: String,
    enum: ['men', 'women', 'unisex', 'kids'],
    default: 'unisex',
    index: true
  },
  targetAudience: String, // Marketing target
  tags: [{ type: String, index: true }],
  styleTags: [{ type: String, index: true }], // street, minimal, graphic, vintage, etc.
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  brandName: String, // Brand name (if different from seller)
  rating: { type: Number, default: 0 },
  isApproved: { type: Boolean, default: false, index: true },
  status: {
    type: String,
    enum: ['draft', 'pending_review', 'published'],
    default: 'draft',
    index: true
  },
  availabilityStatus: {
    type: String,
    enum: ['in_stock', 'out_of_stock', 'pre_order', 'low_stock'],
    default: 'in_stock',
    index: true
  },
  
  // Inventory
  stock: { 
    type: Number, 
    default: 0,
    min: [0, 'Stock cannot be negative'], // Prevent negative stock at schema level
    validate: {
      validator: function(v) {
        return v >= 0;
      },
      message: 'Stock cannot be negative'
    }
  }, // Total stock or default stock
  sku: String, // Product SKU
  barcode: String, // Barcode/EAN for inventory
  
  // Images (legacy - new system uses ProductMedia model)
  images: [String], // Array of image URLs
  mainImage: String, // Primary image URL
  imagesByColor: { type: Map, of: [String] }, // Color-variant specific images
  modelShots: [String], // Model wearing product
  detailShots: [String], // Close-up detail images
  
  // Variants (sizes, colors, stock per variant)
  variants: [VariantSchema],
  
  // Default variant reference (new structure)
  defaultVariantId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null
  },
  
  // Legacy fields (for backwards compatibility)
  colors: [String], // Available colors
  sizes: [String], // Available sizes (XS, S, M, L, XL, XXL)
  
  // Flag to indicate if product uses new variant system
  usesNewVariantSystem: {
    type: Boolean,
    default: false
  },
  
  // Product attributes / filters
  fit: {
    type: String,
    enum: ['oversized', 'regular', 'slim', 'relaxed'],
    index: true
  },
  material: String, // e.g., "100% Cotton"
  fabricComposition: String, // Detailed composition
  occasion: [{ type: String }], // casual, streetwear, party, formal, gym
  careInstructions: String, // Washing and care instructions
  pattern: {
    type: String,
    enum: ['solid', 'printed', 'striped', 'checkered', 'abstract', 'graphic']
  },
  neckType: {
    type: String,
    enum: ['round', 'v-neck', 'crew', 'polo', 'hoodie']
  },
  sleeveLength: {
    type: String,
    enum: ['full', 'half', 'sleeveless', 'three-quarter']
  },
  season: {
    type: String,
    enum: ['summer', 'winter', 'spring', 'autumn', 'all-season'],
    default: 'all-season'
  },
  
  // Product details
  customizable: { type: Boolean, default: false },
  designArea: String, // Customization area dimensions
  
  // Shipping
  weight: Number, // in grams
  dimensions: String, // e.g., "32 x 25 x 2 cm"
  deliveryEstimateDays: String, // e.g., "5-7 business days"
  dispatchTimeRange: String, // e.g., "2-4 business days"
  shippingTimeEstimate: String, // Total shipping time estimate
  returnPolicy: String,
  returnPolicySummary: String, // Brief return policy
  returnWindowDays: { type: Number, default: 7 }, // Days for returns
  cashOnDeliveryAvailable: { type: Boolean, default: true },
  
  // Merchandising
  badges: [{ type: String }], // bestseller, new, limited_edition, sale
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  completeTheLook: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  
  // SEO
  seoTitle: String, // Custom SEO title
  seoDescription: String, // Meta description
  slug: String, // URL-friendly identifier
  
  // Design reference (if product is from designer marketplace)
  designRef: { type: mongoose.Schema.Types.ObjectId, ref: 'Design' },
  
  // Commission settings (for designer products)
  commissionType: {
    type: String,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  commissionRate: { type: Number, default: 30 }, // Percentage (e.g., 30) or fixed amount in INR
}, { timestamps: true });

// Indexes for better query performance
ProductSchema.index({ isApproved: 1, status: 1 });
ProductSchema.index({ category: 1, isApproved: 1 });
ProductSchema.index({ createdBy: 1, status: 1 });
ProductSchema.index({ gender: 1, category: 1 });
ProductSchema.index({ fit: 1, category: 1 });
ProductSchema.index({ availabilityStatus: 1, status: 1 });
ProductSchema.index({ slug: 1 }, { unique: true, sparse: true });

export default mongoose.model('Product', ProductSchema);