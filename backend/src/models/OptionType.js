// OptionType model - Represents option types like "Color", "Size"
import mongoose from 'mongoose';

const OptionTypeSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    enum: ['Color', 'Size', 'Material', 'Style'], // Common option types
    index: true
  },
  sortOrder: {
    type: Number,
    default: 0
  },
  // Optional: Allow custom option types in the future
  isCustom: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Index for efficient queries
OptionTypeSchema.index({ productId: 1, sortOrder: 1 });

// Ensure unique option type per product (e.g., only one "Color" option type per product)
OptionTypeSchema.index({ productId: 1, name: 1 }, { unique: true });

export default mongoose.model('OptionType', OptionTypeSchema);

