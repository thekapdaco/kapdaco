// Utility functions for variant resolution and product structure
import OptionType from '../models/OptionType.js';
import OptionValue from '../models/OptionValue.js';
import ProductMedia from '../models/ProductMedia.js';
import logger from './logger.js';

/**
 * Get all option types and values for a product
 * Returns structured option data for frontend
 */
export const getProductOptions = async (productId) => {
  try {
    const optionTypes = await OptionType.find({ productId })
      .sort({ sortOrder: 1, name: 1 });

    const optionsData = await Promise.all(
      optionTypes.map(async (optionType) => {
        const values = await OptionValue.find({ optionTypeId: optionType._id })
          .sort({ sortOrder: 1, value: 1 });

        return {
          id: optionType._id.toString(),
          name: optionType.name,
          values: values.map(ov => ({
            id: ov._id.toString(),
            value: ov.value,
            hexCode: ov.hexCode || null,
            swatchImageUrl: ov.swatchImageUrl || null
          }))
        };
      })
    );

    return optionsData;
  } catch (error) {
    logger.error('Error getting product options', { productId, error: error.message });
    return [];
  }
};

/**
 * Get all media/images for a product, optionally filtered by color
 */
export const getProductMedia = async (productId, colorOptionValueId = null) => {
  try {
    const filter = { productId };
    
    if (colorOptionValueId) {
      filter.colorOptionValueId = colorOptionValueId;
    }

    const media = await ProductMedia.find(filter)
      .sort({ sortOrder: 1, createdAt: 1 });

    return media.map(m => ({
      id: m._id.toString(),
      url: m.url,
      colorOptionValueId: m.colorOptionValueId?.toString() || null,
      variantId: m.variantId?.toString() || null,
      sortOrder: m.sortOrder,
      altText: m.altText || '',
      type: m.type || 'image',
      thumbnailUrl: m.thumbnailUrl || null
    }));
  } catch (error) {
    logger.error('Error getting product media', { productId, error: error.message });
    return [];
  }
};

/**
 * Resolve variant from selected option values
 */
export const resolveVariant = (variants, selectedOptionValueIds) => {
  if (!variants || variants.length === 0) {
    return null;
  }

  // Convert selectedOptionValueIds to strings for comparison
  const selectedIds = selectedOptionValueIds.map(id => id.toString());

  // Find variant that matches all selected option values
  const variant = variants.find(v => {
    if (!v.optionValueIds || v.optionValueIds.length === 0) {
      return false;
    }

    const variantIds = v.optionValueIds.map(id => 
      typeof id === 'object' ? id.toString() : id.toString()
    );

    // Check if all selected IDs are in variant's optionValueIds
    return selectedIds.every(id => variantIds.includes(id));
  });

  return variant || null;
};

/**
 * Get available sizes for a selected color
 */
export const getAvailableSizesForColor = (variants, colorOptionValueId, sizeOptionTypeId) => {
  if (!variants || !colorOptionValueId) {
    return [];
  }

  const colorId = colorOptionValueId.toString();
  
  // Find all variants that include the selected color
  const colorVariants = variants.filter(v => {
    if (!v.optionValueIds || v.optionValueIds.length === 0) {
      return false;
    }
    
    return v.optionValueIds.some(id => {
      const idStr = typeof id === 'object' ? id.toString() : id.toString();
      return idStr === colorId;
    });
  });

  // Extract size option values from these variants
  const sizeOptionValueIds = new Set();
  
  colorVariants.forEach(variant => {
    variant.optionValueIds?.forEach(optValId => {
      // Need to check if this option value is a size
      // This will be enhanced when we have option type context
      sizeOptionValueIds.add(optValId);
    });
  });

  return Array.from(sizeOptionValueIds);
};

/**
 * Transform product to new structured format for API response
 */
export const transformProductForAPI = async (product, includeMedia = true) => {
  try {
    const productId = product._id || product.id;

    // Get options (optionTypes and optionValues)
    const options = await getProductOptions(productId);

    // Get media
    const media = includeMedia ? await getProductMedia(productId) : [];

    // Transform variants to new format
    const variants = (product.variants || []).map(variant => {
      const optionValueIds = variant.optionValueIds || [];
      
      // Backwards compatibility: if no optionValueIds, try to derive from legacy fields
      if (optionValueIds.length === 0 && (variant.color || variant.size)) {
        // This will be populated during migration
        // For now, return empty array
      }

      return {
        id: variant._id?.toString() || variant.id?.toString(),
        sku: variant.sku || '',
        price: variant.price || product.price || product.discountPrice || 0,
        stock: variant.stock !== undefined ? variant.stock : (product.stock || 0),
        optionValueIds: optionValueIds.map(id => 
          typeof id === 'object' ? id.toString() : id.toString()
        ),
        // Legacy fields for backwards compatibility
        size: variant.size || null,
        color: variant.color || null,
        isDefault: variant.isDefault || false
      };
    });

    return {
      id: productId.toString(),
      title: product.title,
      description: product.description,
      basePrice: product.price || 0,
      discountPrice: product.discountPrice || null,
      category: product.category,
      tags: product.tags || [],
      options,
      variants,
      media,
      // Legacy fields for backwards compatibility
      images: product.images || [],
      mainImage: product.mainImage || product.images?.[0] || null,
      colors: product.colors || [],
      sizes: product.sizes || [],
      usesNewVariantSystem: product.usesNewVariantSystem || false
    };
  } catch (error) {
    logger.error('Error transforming product for API', {
      productId: product._id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Get media/images for a specific color
 */
export const getMediaForColor = async (productId, colorOptionValueId) => {
  const allMedia = await getProductMedia(productId, colorOptionValueId);
  
  // Sort by sortOrder
  return allMedia.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
};

