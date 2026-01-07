// Frontend utility functions for handling product variants and color-based images

/**
 * Get color option from product options
 */
export const getColorOption = (product) => {
  if (!product.options || !Array.isArray(product.options)) {
    return null;
  }
  return product.options.find(opt => opt.name === 'Color' || opt.name === 'color');
};

/**
 * Get size option from product options
 */
export const getSizeOption = (product) => {
  if (!product.options || !Array.isArray(product.options)) {
    return null;
  }
  return product.options.find(opt => opt.name === 'Size' || opt.name === 'size');
};

/**
 * Get all color values from product
 * Supports both new structured format and legacy format
 */
export const getColorValues = (product) => {
  const colorOption = getColorOption(product);
  
  if (colorOption && colorOption.values) {
    // New structured format
    return colorOption.values.map(val => ({
      id: val.id,
      value: val.value,
      hexCode: val.hexCode,
      swatchImageUrl: val.swatchImageUrl,
      label: val.value
    }));
  }
  
  // Legacy format fallback
  if (product.colors && Array.isArray(product.colors)) {
    return product.colors.map((color, index) => ({
      id: `color-${index}`,
      value: color,
      hexCode: null,
      swatchImageUrl: null,
      label: color
    }));
  }
  
  return [];
};

/**
 * Get all size values from product
 * Supports both new structured format and legacy format
 */
export const getSizeValues = (product) => {
  const sizeOption = getSizeOption(product);
  
  if (sizeOption && sizeOption.values) {
    // New structured format
    return sizeOption.values.map(val => ({
      id: val.id,
      value: val.value,
      label: val.value
    }));
  }
  
  // Legacy format fallback
  if (product.sizes && Array.isArray(product.sizes)) {
    return product.sizes.map((size, index) => ({
      id: `size-${index}`,
      value: size,
      label: size
    }));
  }
  
  return [];
};

// Helper: resolve a color "value" string from an id/value input
const resolveColorValue = (product, colorId) => {
  if (!colorId) return null;
  if (typeof colorId === 'object') {
    if (colorId.value) return colorId.value;
    if (colorId.id) return colorId.id;
  }
  const colors = getColorValues(product);
  const match = colors.find(c => c.id === colorId || c.value === colorId);
  return match ? match.value : (typeof colorId === 'string' ? colorId : null);
};

/**
 * Get media/images for a specific color
 * Supports both new structured format (media array) and legacy format
 */
export const getMediaForColor = (product, colorId) => {
  // If we have legacy imagesByColor map, use it first
  if (product.imagesByColor) {
    const colorValue = resolveColorValue(product, colorId);
    if (colorValue && product.imagesByColor[colorValue]) {
      return product.imagesByColor[colorValue];
    }
  }

  // New structured format: filter media by colorOptionValueId
  if (product.media && Array.isArray(product.media)) {
    const colorMedia = product.media.filter(m => 
      m.colorOptionValueId === colorId || 
      (typeof m.colorOptionValueId === 'object' && m.colorOptionValueId.toString() === colorId)
    );
    
    if (colorMedia.length > 0) {
      return colorMedia
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .map(m => m.url);
    }
  }
  
  // Legacy format fallback: check variants or use product images
  if (product.variants && Array.isArray(product.variants)) {
    const colorVariant = product.variants.find(v => {
      // Check if variant has this color in optionValueIds
      if (v.optionValueIds && Array.isArray(v.optionValueIds)) {
        return v.optionValueIds.some(id => {
          const idStr = typeof id === 'object' ? id.toString() : id.toString();
          return idStr === colorId;
        });
      }
      // Legacy: check color field
      if (v.color) {
        const colorValue = typeof colorId === 'object' ? colorId.value : colorId;
        return v.color === colorValue || v.color === colorId;
      }
      return false;
    });
    
    if (colorVariant && colorVariant.images && colorVariant.images.length > 0) {
      return colorVariant.images;
    }
  }
  
  // Final fallback: product-level images
  if (product.images && product.images.length > 0) {
    return product.images;
  }
  
  if (product.image) {
    return [product.image];
  }
  
  return [];
};

/**
 * Get available sizes for a selected color
 * Only shows sizes that have variants with the selected color
 */
export const getAvailableSizesForColor = (product, colorId) => {
  if (!product.variants || !Array.isArray(product.variants)) {
    // No variants, return all sizes
    return getSizeValues(product);
  }
  
  // Find all variants that include the selected color
  const colorVariants = product.variants.filter(variant => {
    // New format: check optionValueIds
    if (variant.optionValueIds && Array.isArray(variant.optionValueIds)) {
      return variant.optionValueIds.some(id => {
        const idStr = typeof id === 'object' ? id.toString() : id.toString();
        return idStr === colorId;
      });
    }
    
    // Legacy format: check color field
    if (variant.color) {
      const colorValue = resolveColorValue(product, colorId);
      return variant.color === colorValue || variant.color === colorId;
    }
    
    return false;
  });
  
  if (colorVariants.length === 0) {
    // No variants for this color, return all sizes
    return getSizeValues(product);
  }
  
  // Extract size option values from these variants
  const sizeOption = getSizeOption(product);
  const availableSizeIds = new Set();
  
  colorVariants.forEach(variant => {
    if (variant.optionValueIds && Array.isArray(variant.optionValueIds)) {
      // New format: get size option value from variant
      const sizeOptionValueIds = variant.optionValueIds.filter(id => {
        // This is simplified - in production, you'd check if the option value
        // belongs to the Size option type
        return true; // Will be enhanced with proper option type checking
      });
      sizeOptionValueIds.forEach(id => availableSizeIds.add(id));
    } else if (variant.size) {
      // Legacy format: use size string
      availableSizeIds.add(variant.size);
    }
  });
  
  // Return size values that are available
  const allSizes = getSizeValues(product);
  return allSizes.filter(size => {
    if (sizeOption) {
      // New format: match by ID
      return availableSizeIds.has(size.id);
    } else {
      // Legacy format: match by value
      return availableSizeIds.has(size.value);
    }
  });
};

/**
 * Resolve variant from selected color and size
 */
export const resolveVariant = (product, colorId, sizeId) => {
  // Support calling with an object { colorId, sizeId }
  if (colorId && typeof colorId === 'object' && colorId.colorId) {
    sizeId = colorId.sizeId;
    colorId = colorId.colorId;
  }

  if (!product.variants || !Array.isArray(product.variants)) {
    return null;
  }
  
  // Find variant that matches both color and size
  const variant = product.variants.find(v => {
    // New format: check optionValueIds
    if (v.optionValueIds && Array.isArray(v.optionValueIds)) {
      const optionIds = (v.optionValueIds || [])
        .map(id => {
          if (!id) return null;
          return typeof id === 'object' && id.toString ? id.toString() : String(id);
        })
        .filter(Boolean);

      const colorIdStr = colorId
        ? (typeof colorId === 'object' && colorId.id ? colorId.id.toString() : colorId.toString())
        : null;
      const sizeIdStr = sizeId
        ? (typeof sizeId === 'object' && sizeId.id ? sizeId.id.toString() : sizeId.toString())
        : null;
      
      if (!colorIdStr || !sizeIdStr) return false;
      
      return optionIds.includes(colorIdStr) && optionIds.includes(sizeIdStr);
    }
    
    // Legacy format: check color and size fields
    if (v.color && v.size) {
      const colorValue = typeof colorId === 'object' ? colorId.value || colorId.id : colorId;
      const sizeValue = typeof sizeId === 'object' ? sizeId.value || sizeId.id : sizeId;
      
      return (v.color === colorValue || v.color === colorId) &&
             (v.size === sizeValue || v.size === sizeId);
    }
    
    return false;
  });
  
  return variant || null;
};

/**
 * Get default color (first color or specified default)
 */
export const getDefaultColor = (product) => {
  const colors = getColorValues(product);
  return colors.length > 0 ? colors[0] : null;
};

/**
 * Get default size for a color
 */
export const getDefaultSizeForColor = (product, colorId) => {
  const availableSizes = getAvailableSizesForColor(product, colorId);
  return availableSizes.length > 0 ? availableSizes[0] : null;
};

/**
 * Check if product uses new variant system
 */
export const usesNewVariantSystem = (product) => {
  return product.usesNewVariantSystem === true || 
         (product.options && Array.isArray(product.options) && product.options.length > 0) ||
         (product.media && Array.isArray(product.media) && product.media.length > 0);
};

/**
 * Format product for display (handles both new and legacy formats)
 */
export const formatProductForDisplay = (product) => {
  const isNewSystem = usesNewVariantSystem(product);
  
  return {
    id: product.id || product._id,
    title: product.title || product.name,
    description: product.description,
    basePrice: product.basePrice || product.price || 0,
    discountPrice: product.discountPrice,
    // Variant system
    usesNewVariantSystem: isNewSystem,
    options: product.options || [],
    variants: product.variants || [],
    media: product.media || [],
    // Legacy fields (for backwards compatibility)
    colors: product.colors || [],
    sizes: product.sizes || [],
    images: product.images || [],
    imagesByColor: product.imagesByColor || {},
    mainImage: product.mainImage || product.image || product.images?.[0],
    // Other fields
    category: product.category,
    brand: product.brand,
    rating: product.rating,
    // Inventory (legacy)
    inventory: product.inventory || {}
  };
};

