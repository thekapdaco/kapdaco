// OptionValue model - Represents specific values like "Blue", "XL"
import mongoose from 'mongoose';

const OptionValueSchema = new mongoose.Schema({
  optionTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'OptionType',
    required: true,
    index: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true // For efficient filtering by product
  },
  value: {
    type: String,
    required: true,
    trim: true
  },
  // For Color option values
  hexCode: {
    type: String,
    match: /^#[0-9A-Fa-f]{6}$/, // Valid hex color code
    default: null
  },
  swatchImageUrl: {
    type: String,
    default: null // Optional color swatch image
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

// Indexes for efficient queries
OptionValueSchema.index({ optionTypeId: 1, sortOrder: 1 });
// For product-level queries
// Removed redundant single-field productId index to avoid duplicate with field-level index

// Ensure unique value per option type (e.g., only one "Blue" color per product)
OptionValueSchema.index({ optionTypeId: 1, value: 1 }, { unique: true });

export default mongoose.model('OptionValue', OptionValueSchema);

