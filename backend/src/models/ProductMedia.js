// ProductMedia model - Represents product images/media linked to colors/variants
import mongoose from 'mongoose';

const ProductMediaSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  // Link to specific variant (optional)
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product.variants',
    default: null
  },
  // Link to color option value (for color-based image galleries)
  colorOptionValueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OptionValue',
    default: null,
    index: true
  },
  url: {
    type: String,
    required: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  altText: {
    type: String,
    default: ''
  },
  // Media type
  type: {
    type: String,
    enum: ['image', 'video'],
    default: 'image'
  },
  // Optional: thumbnail URL for videos or optimized images
  thumbnailUrl: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Indexes for efficient queries
ProductMediaSchema.index({ productId: 1, sortOrder: 1 });
ProductMediaSchema.index({ colorOptionValueId: 1, sortOrder: 1 });
ProductMediaSchema.index({ variantId: 1 });

export default mongoose.model('ProductMedia', ProductMediaSchema);

