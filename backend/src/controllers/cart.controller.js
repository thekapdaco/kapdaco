import Cart from "../models/Cart.js";
import Product from "../models/Product.js";
import logger from "../utils/logger.js";

export const getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ userId: req.user.id }).populate("items.productId");
    if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });
    res.json(cart);
  } catch (error) {
    logger.error('Get cart error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to fetch cart' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1, size, color, variantId } = req.body;
    
    // Validate quantity
    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({ 
        message: 'Quantity must be between 1 and 10' 
      });
    }

    // Fetch product and validate stock
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!product.isApproved || product.status !== 'published') {
      return res.status(400).json({ 
        message: 'Product is not available for purchase' 
      });
    }

    // Check stock availability
    let availableStock = product.stock || 0;
    
    if (variantId && product.variants?.length > 0) {
      const variant = product.variants.find(v => v._id.toString() === variantId.toString());
      if (!variant) {
        return res.status(400).json({ message: 'Variant not found' });
      }
      availableStock = variant.stock !== undefined ? variant.stock : product.stock || 0;
    }

    // Check if adding this quantity would exceed stock
    let cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });

    const existing = cart.items.find(
      (i) => 
        i.productId.toString() === productId && 
        i.size === size && 
        i.color === color &&
        (variantId ? i.variantId?.toString() === variantId.toString() : !i.variantId)
    );

    const requestedQuantity = existing 
      ? existing.quantity + quantity 
      : quantity;

    if (requestedQuantity > availableStock) {
      return res.status(400).json({ 
        message: `Insufficient stock. Only ${availableStock} items available.`,
        availableStock 
      });
    }

    // Proceed with adding to cart
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.items.push({ productId, quantity, size, color, variantId });
    }

    cart.updatedAt = new Date();
    await cart.save();
    
    // Populate product details before returning
    const populatedCart = await Cart.findById(cart._id).populate("items.productId");
    res.status(201).json(populatedCart);
  } catch (error) {
    logger.error('Add to cart error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
};

export const updateItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;
    const cart = await Cart.findOne({ userId: req.user.id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const item = cart.items.id(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    if (quantity <= 0) {
      item.deleteOne();
    } else {
      // Validate quantity limit
      if (quantity > 10) {
        return res.status(400).json({ 
          message: 'Quantity cannot exceed 10 items per product' 
        });
      }

      // Validate stock availability
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: 'Product not found' });
      }

      let availableStock = product.stock || 0;
      
      if (item.variantId && product.variants?.length > 0) {
        const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
        if (variant && variant.stock !== undefined) {
          availableStock = variant.stock;
        }
      }

      if (quantity > availableStock) {
        return res.status(400).json({ 
          message: `Insufficient stock. Only ${availableStock} items available.`,
          availableStock 
        });
      }

      item.quantity = quantity;
    }

    cart.updatedAt = new Date();
    await cart.save();
    
    // Populate product details before returning
    const populatedCart = await Cart.findById(cart._id).populate("items.productId");
    res.json(populatedCart);
  } catch (error) {
    logger.error('Update cart item error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to update cart item' });
  }
};

export const removeItem = async (req, res) => {
  const { itemId } = req.params;
  const cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) return res.status(404).json({ message: "Cart not found" });

  const item = cart.items.id(itemId);
  if (!item) return res.status(404).json({ message: "Item not found" });

  item.deleteOne();
  cart.updatedAt = new Date();
  await cart.save();
  
  // Populate product details before returning
  const populatedCart = await Cart.findById(cart._id).populate("items.productId");
  res.json(populatedCart);
};

export const clearCart = async (req, res) => {
  const cart = await Cart.findOneAndUpdate(
    { userId: req.user.id },
    { items: [], updatedAt: new Date() },
    { new: true, upsert: true }
  );
  res.json(cart);
};

/**
 * Validate cart items before checkout
 * POST /api/cart/validate
 * Checks product availability, stock, and approval status
 */
export const validateCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ userId: req.user.id }).populate('items.productId');
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return res.status(400).json({ 
        message: 'Cart is empty',
        valid: false 
      });
    }

    const errors = [];
    const warnings = [];

    // Validate each cart item
    for (const item of cart.items) {
      // Skip items without productId
      if (!item.productId) {
        errors.push({
          itemId: item._id?.toString() || 'unknown',
          message: 'Cart item missing product ID'
        });
        continue;
      }

      // Handle both populated and non-populated productId
      let product = item.productId;
      
      // If productId is just an ObjectId (not populated) or null, fetch the product
      if (!product || typeof product === 'object' && (!product.title || !product._id)) {
        try {
          const productId = typeof product === 'object' && product._id ? product._id : product;
          product = await Product.findById(productId);
        } catch (err) {
          logger.error('Error fetching product for validation', {
            productId: item.productId,
            error: err.message
          });
          product = null;
        }
      }

      // Check if product exists
      if (!product) {
        errors.push({
          itemId: item._id?.toString() || 'unknown',
          message: 'Product not found',
          productId: (typeof item.productId === 'object' && item.productId?._id) ? item.productId._id.toString() : item.productId?.toString() || 'unknown'
        });
        continue;
      }

      // Check if product is approved and published
      if (!product.isApproved || product.status !== 'published') {
        errors.push({
          itemId: item._id,
          productTitle: product.title,
          message: `Product "${product.title}" is not available for purchase`,
          reason: !product.isApproved ? 'Product not approved' : 'Product not published'
        });
        continue;
      }

      // Validate stock - check variant-specific stock if variantId exists
      const itemQuantity = item.quantity || 1;
      
      if (item.variantId && product.variants && product.variants.length > 0) {
        // Check variant-specific stock
        const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
        if (!variant) {
          errors.push({
            itemId: item._id,
            productTitle: product.title,
            message: `Selected variant not found for "${product.title}"`
          });
          continue;
        }
        
        if (variant.stock !== undefined && variant.stock < itemQuantity) {
          errors.push({
            itemId: item._id,
            productTitle: product.title,
            message: `Insufficient stock for "${product.title}". Only ${variant.stock} available.`,
            availableStock: variant.stock,
            requestedQuantity: itemQuantity
          });
        } else if (variant.stock !== undefined && variant.stock === 0) {
          errors.push({
            itemId: item._id,
            productTitle: product.title,
            message: `"${product.title}" is out of stock`,
            availableStock: 0
          });
        }
      } else if (product.stock !== undefined) {
        // Check total product stock
        if (product.stock < itemQuantity) {
          errors.push({
            itemId: item._id,
            productTitle: product.title,
            message: `Insufficient stock for "${product.title}". Only ${product.stock} available.`,
            availableStock: product.stock,
            requestedQuantity: itemQuantity
          });
        } else if (product.stock === 0) {
          errors.push({
            itemId: item._id,
            productTitle: product.title,
            message: `"${product.title}" is out of stock`,
            availableStock: 0
          });
        }
      }

      // Check if price is valid
      if (!product.price || product.price <= 0) {
        warnings.push({
          itemId: item._id,
          productTitle: product.title,
          message: `Invalid price for "${product.title}"`
        });
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        valid: false,
        message: 'Cart validation failed',
        errors,
        warnings
      });
    }

    if (warnings.length > 0) {
      logger.warn('Cart validation warnings', { 
        userId: req.user.id, 
        warnings 
      });
    }

    res.json({
      valid: true,
      message: 'Cart is valid and ready for checkout',
      itemCount: cart.items.length,
      warnings: warnings.length > 0 ? warnings : undefined
    });
  } catch (error) {
    logger.error('Cart validation error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    res.status(500).json({
      valid: false,
      message: 'Failed to validate cart',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
