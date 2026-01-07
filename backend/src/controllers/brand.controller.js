import Product from "../models/Product.js";

// List products created by the authenticated brand
export const listMyProducts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Product.find({ createdBy: req.user.id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Product.countDocuments({ createdBy: req.user.id })
    ]);

    res.json({
      products: items,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + items.length < total
      }
    });
  } catch (error) {
    console.error("List brand products error:", error);
    res.status(500).json({ message: "Failed to fetch products" });
  }
};

// Create a new product (requires admin approval)
export const createProduct = async (req, res) => {
  let productData = null; // Declare outside try for error logging
  
  try {
    const {
      title,
      subtitle,
      description,
      category,
      subCategory,
      gender,
      tags = [],
      styleTags = [],
      brandName,
      pricing = {},
      inventory = {},
      media = {},
      variants = {},
      shipping = {},
      merchandising = {},
      seo = {},
      status = 'draft',
      slug,
      variantData
    } = req.body;

    // Validation
    if (!title || pricing?.price === undefined || !category) {
      return res.status(400).json({ 
        message: "Missing required fields: title, price, category" 
      });
    }

    // Normalize category - map mens/womens to men/women for consistency
    // Also handle "Men's Fashion", "Women's Fashion" etc.
    let normalizedCategory = String(category).toLowerCase().trim();
    // Handle "men's fashion", "women's fashion" type values - check for common patterns
    if (normalizedCategory.includes("men's") || normalizedCategory.includes('mens') || (normalizedCategory.includes('men') && !normalizedCategory.includes('women'))) {
      normalizedCategory = 'men';
    } else if (normalizedCategory.includes("women's") || normalizedCategory.includes('womens') || normalizedCategory.includes('women')) {
      normalizedCategory = 'women';
    }
    // Normalize plural forms to singular to match shop category pages
    if (normalizedCategory === 'mens') normalizedCategory = 'men';
    if (normalizedCategory === 'womens') normalizedCategory = 'women';
    
    // Validate the normalized category matches Product schema enum
    const validCategories = ['mens', 'womens', 'hoodies', 't-shirts', 'accessories', 'men', 'women', 'cups'];
    if (!validCategories.includes(normalizedCategory)) {
      return res.status(400).json({ 
        message: `Invalid category: ${category}. Must be one of: mens, womens, men, women, hoodies, t-shirts, accessories, cups` 
      });
    }
    
    // Build product data
    productData = {
      title: title.trim(),
      subtitle: subtitle?.trim() || undefined,
      description: description?.trim() || '',
      price: parseFloat(pricing.price),
      discountPrice: (pricing.discountPrice !== null && pricing.discountPrice !== undefined && pricing.discountPrice !== '') ? parseFloat(pricing.discountPrice) : undefined,
      compareAtPrice: (pricing.compareAtPrice !== null && pricing.compareAtPrice !== undefined && pricing.compareAtPrice !== '') ? parseFloat(pricing.compareAtPrice) : undefined,
      currency: pricing.currency || 'INR',
      category: normalizedCategory,
      subCategory: subCategory?.trim() || undefined,
      gender: gender || 'unisex',
      tags: Array.isArray(tags) ? tags : (tags.split ? tags.split(',').map(t => t.trim()).filter(Boolean) : []),
      styleTags: Array.isArray(styleTags) ? styleTags : (styleTags.split ? styleTags.split(',').map(t => t.trim()).filter(Boolean) : []),
      brandName: brandName?.trim() || undefined,
      
      // Inventory
      stock: inventory.stockQty || inventory.stock || 0,
      sku: inventory.sku || undefined,
      barcode: inventory.barcode || undefined,
      availabilityStatus: inventory.availabilityStatus || 'in_stock',
      
      // Media
      images: media.galleryImages || [],
      mainImage: media.mainImage || (media.galleryImages?.[0]),
      
      // Variants
      variants: [], // Will be populated below if provided
      colors: variants.colors ? (Array.isArray(variants.colors) ? variants.colors : variants.colors.split(',').map(c => c.trim()).filter(Boolean)) : [],
      sizes: variants.sizes || [],
      
      // Product attributes
      fit: variants.fit || undefined,
      material: variants.material || undefined,
      fabricComposition: variants.fabricComposition || undefined,
      pattern: variants.pattern || undefined,
      neckType: variants.neckType || undefined,
      sleeveLength: variants.sleeveLength || undefined,
      season: variants.season || 'all-season',
      occasion: Array.isArray(variants.occasion) ? variants.occasion : (variants.occasion ? variants.occasion.split(',').map(o => o.trim()).filter(Boolean) : []),
      customizable: variants.customizable || false,
      designArea: variants.designArea || undefined,
      careInstructions: merchandising.careInstructions || undefined,
      
      // Shipping
      weight: shipping.weight ? parseInt(shipping.weight) : undefined,
      dimensions: shipping.dimensions || undefined,
      deliveryEstimateDays: shipping.deliveryEstimateDays || shipping.deliveryEstimate || undefined,
      dispatchTimeRange: shipping.dispatchTimeRange || undefined,
      shippingTimeEstimate: shipping.shippingTimeEstimate || undefined,
      returnPolicy: shipping.returnPolicy || undefined,
      returnPolicySummary: shipping.returnPolicySummary || undefined,
      returnWindowDays: shipping.returnWindowDays || 7,
      cashOnDeliveryAvailable: shipping.cashOnDeliveryAvailable !== undefined ? shipping.cashOnDeliveryAvailable : true,
      
      // Merchandising
      badges: merchandising.badges || [],
      
      // SEO
      seoTitle: seo.seoTitle?.trim() || undefined,
      seoDescription: seo.seoDescription?.trim() || undefined,
      slug: seo.slug?.trim() || slug?.trim() || undefined,
      
      // Status
      status: status === 'published' ? 'pending_review' : status, // Force review for published
      isApproved: status === 'published' ? false : false, // Always false until admin approves
      
      createdBy: req.user.id
    };

    // Build variants array if sizes and colors are provided
    // Check if variantData is provided from frontend (per-variant stock/pricing/SKU)
    const perVariantData = variantData || variants?.variantData || {};
    
    if (productData.sizes.length > 0 && productData.colors.length > 0) {
      productData.variants = [];
      for (const size of productData.sizes) {
        for (const color of productData.colors) {
          const variantKey = `${color}-${size}`;
          const customVariant = perVariantData[variantKey];
          
          productData.variants.push({
            size,
            color,
            stock: customVariant?.stock !== undefined && customVariant?.stock !== null ? parseInt(customVariant.stock, 10) : parseInt(productData.stock, 10),
            price: customVariant?.price ? parseFloat(customVariant.price) : undefined,
            sku: customVariant?.sku || (productData.sku ? `${productData.sku}-${size}-${color}` : undefined),
            images: customVariant?.image ? [customVariant.image] : undefined
          });
        }
      }
    } else if (productData.sizes.length > 0) {
      // Only sizes, no colors
      productData.variants = productData.sizes.map(size => {
        const variantKey = `-${size}`;
        const customVariant = perVariantData[variantKey];
        return {
          size,
          stock: customVariant?.stock !== undefined && customVariant?.stock !== null ? parseInt(customVariant.stock, 10) : parseInt(productData.stock, 10),
          price: customVariant?.price ? parseFloat(customVariant.price) : undefined,
          sku: customVariant?.sku || (productData.sku ? `${productData.sku}-${size}` : undefined)
        };
      });
    } else if (productData.colors.length > 0) {
      // Only colors, no sizes
      productData.variants = productData.colors.map(color => {
        const variantKey = `${color}-`;
        const customVariant = perVariantData[variantKey];
        return {
          color,
          stock: customVariant?.stock !== undefined && customVariant?.stock !== null ? parseInt(customVariant.stock, 10) : parseInt(productData.stock, 10),
          price: customVariant?.price ? parseFloat(customVariant.price) : undefined,
          sku: customVariant?.sku || (productData.sku ? `${productData.sku}-${color}` : undefined)
        };
      });
    }
    
    // Generate slug if not provided
    if (!productData.slug && productData.title) {
      productData.slug = productData.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    } else if (productData.slug) {
      productData.slug = productData.slug
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }
    
    // Ensure slug is not empty (Product schema has unique sparse index on slug)
    if (!productData.slug || productData.slug.trim() === '') {
      // Generate a fallback slug from title or use timestamp
      productData.slug = productData.title 
        ? productData.title.toLowerCase().replace(/[^\w]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now()
        : `product-${Date.now()}`;
    }

    // Check for duplicate slug before creating
    if (productData.slug) {
      const existingSlug = await Product.findOne({ slug: productData.slug });
      if (existingSlug) {
        // Append timestamp to make slug unique
        productData.slug = `${productData.slug}-${Date.now()}`;
      }
    }

    const product = await Product.create(productData);

    res.status(201).json({
      message: status === 'draft' 
        ? "Product saved as draft" 
        : "Product submitted for approval",
      product
    });
  } catch (error) {
    console.error("Create product error:", error);
    console.error("Error stack:", error.stack);
    if (productData) {
      // Safely stringify productData, excluding circular references
      try {
        const safeData = JSON.parse(JSON.stringify(productData, (key, value) => {
          // Remove circular references and large arrays
          if (key === 'createdBy' && typeof value === 'object') return '[User Object]';
          if (Array.isArray(value) && value.length > 10) return `[Array of ${value.length} items]`;
          return value;
        }));
        console.error("Product data that failed:", JSON.stringify(safeData, null, 2));
      } catch (stringifyError) {
        console.error("Could not stringify product data");
      }
    }
    
    // Handle specific Mongoose validation errors
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      return res.status(400).json({ 
        message: "Product validation failed",
        errors: validationErrors
      });
    }
    
    // Handle duplicate key errors (e.g., duplicate slug)
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern || {})[0] || 'field';
      return res.status(400).json({ 
        message: `Duplicate ${field}. A product with this ${field} already exists.`
      });
    }
    
    res.status(500).json({ 
      message: "Failed to create product",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Update a product owned by the brand
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      category,
      tags,
      pricing,
      inventory,
      media,
      variants,
      shipping,
      status
    } = req.body;

    const product = await Product.findOne({ _id: id, createdBy: req.user.id });

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    // Build updates object
    const updates = {};
    
    if (title !== undefined) updates.title = title.trim();
    if (description !== undefined) updates.description = description?.trim() || '';
    if (category !== undefined) {
      let normalizedCat = String(category).toLowerCase();
      // Normalize plural forms to singular to match shop category pages
      if (normalizedCat === 'mens') normalizedCat = 'men';
      if (normalizedCat === 'womens') normalizedCat = 'women';
      updates.category = normalizedCat;
    }
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean);
    }
    if (pricing?.price !== undefined) updates.price = parseFloat(pricing.price);
    if (pricing?.discountPrice !== undefined) {
      updates.discountPrice = pricing.discountPrice ? parseFloat(pricing.discountPrice) : undefined;
    }
    if (inventory?.stockQty !== undefined) updates.stock = parseInt(inventory.stockQty);
    if (inventory?.sku !== undefined) updates.sku = inventory.sku;
    if (media?.mainImage !== undefined) updates.mainImage = media.mainImage;
    if (media?.galleryImages !== undefined) updates.images = media.galleryImages;
    if (variants?.colors !== undefined) {
      updates.colors = Array.isArray(variants.colors) 
        ? variants.colors 
        : variants.colors.split(',').map(c => c.trim()).filter(Boolean);
    }
    if (variants?.sizes !== undefined) updates.sizes = variants.sizes;
    if (variants?.material !== undefined) updates.material = variants.material;
    if (variants?.customizable !== undefined) updates.customizable = variants.customizable;
    if (variants?.designArea !== undefined) updates.designArea = variants.designArea;
    if (shipping?.weight !== undefined) updates.weight = parseInt(shipping.weight);
    if (shipping?.dimensions !== undefined) updates.dimensions = shipping.dimensions;
    if (shipping?.deliveryEstimateDays !== undefined) {
      updates.deliveryEstimateDays = shipping.deliveryEstimateDays;
    }
    if (shipping?.returnPolicy !== undefined) updates.returnPolicy = shipping.returnPolicy;
    if (status !== undefined) {
      updates.status = status === 'published' ? 'pending_review' : status;
    }

    // Rebuild variants if sizes/colors changed
    if (updates.sizes || updates.colors || variants) {
      const finalSizes = updates.sizes || product.sizes || [];
      const finalColors = updates.colors || product.colors || [];
      
      if (finalSizes.length > 0 && finalColors.length > 0) {
        updates.variants = [];
        for (const size of finalSizes) {
          for (const color of finalColors) {
            updates.variants.push({
              size,
              color,
              stock: updates.stock || product.stock || 0,
              sku: (updates.sku || product.sku) ? `${updates.sku || product.sku}-${size}-${color}` : undefined
            });
          }
        }
      } else if (finalSizes.length > 0) {
        updates.variants = finalSizes.map(size => ({
          size,
          stock: updates.stock || product.stock || 0,
          sku: (updates.sku || product.sku) ? `${updates.sku || product.sku}-${size}` : undefined
        }));
      } else if (finalColors.length > 0) {
        updates.variants = finalColors.map(color => ({
          color,
          stock: updates.stock || product.stock || 0,
          sku: (updates.sku || product.sku) ? `${updates.sku || product.sku}-${color}` : undefined
        }));
      }
    }

    // Any change requires re-approval (unless status is draft)
    if (updates.status !== 'draft') {
      updates.isApproved = false;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({ 
      message: updates.status === 'pending_review' 
        ? "Product updated and sent for re-approval" 
        : "Product updated successfully",
      product: updatedProduct
    });
  } catch (error) {
    console.error("Update product error:", error);
    res.status(500).json({ 
      message: "Failed to update product",
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Delete a product owned by the brand
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findOneAndDelete({ _id: id, createdBy: req.user.id });
    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("Delete product error:", error);
    res.status(500).json({ message: "Failed to delete product" });
  }
};

