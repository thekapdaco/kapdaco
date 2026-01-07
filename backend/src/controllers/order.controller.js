// controllers/order.controller.js
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Commission from "../models/Commission.js";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { sendOrderConfirmation } from "../services/email.service.js";
import Razorpay from 'razorpay';
import crypto from 'crypto';
import mongoose from 'mongoose';

// Initialize Razorpay instance
let razorpayInstance = null;

const initializeRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return null;
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
  }
  return razorpayInstance;
};

// Create a new order (called after successful payment)
export const createOrder = async (req, res) => {
  try {
    const { 
      items, 
      productId, 
      quantity = 1, 
      priceAtPurchase, 
      shippingAddress, 
      paymentId, 
      paymentMethod, 
      total,
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;
    const userId = req.user.id;

    // Check for idempotency key
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        logger.info('Duplicate order request detected', {
          idempotencyKey,
          orderId: existingOrder._id,
          userId
        });
        const populatedOrder = await Order.findById(existingOrder._id)
          .populate('items.productId', 'title mainImage price')
          .populate('productId', 'title mainImage');
        return res.status(200).json({
          message: 'Order already exists',
          order: populatedOrder,
          duplicate: true
        });
      }
    }

    // CRITICAL: Verify payment before creating order
    if (paymentId || razorpay_payment_id) {
      const razorpay = initializeRazorpay();
      if (!razorpay) {
        return res.status(503).json({
          message: 'Payment gateway not configured',
          error: 'PAYMENT_GATEWAY_NOT_CONFIGURED'
        });
      }

      // Verify payment signature
      if (razorpay_order_id && razorpay_payment_id && razorpay_signature) {
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
        const text = `${razorpay_order_id}|${razorpay_payment_id}`;
        const generatedSignature = crypto
          .createHmac('sha256', webhookSecret)
          .update(text)
          .digest('hex');

        if (generatedSignature !== razorpay_signature) {
          logger.warn('Payment signature verification failed', {
            orderId: razorpay_order_id,
            userId
          });
          return res.status(400).json({
            message: 'Payment verification failed'
          });
        }

        // Verify payment status with Razorpay
        try {
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          if (payment.status !== 'captured' && payment.status !== 'authorized') {
            return res.status(400).json({
              message: `Payment not successful`
            });
          }

          // Verify amount matches
          const paymentAmount = payment.amount / 100; // Convert from paise
          const orderTotal = total || 0;
          if (orderTotal > 0 && Math.abs(paymentAmount - orderTotal) > 0.01) {
            logger.error('Payment amount mismatch', {
              paymentAmount,
              orderTotal,
              userId
            });
            return res.status(400).json({
              message: 'Payment amount does not match'
            });
          }
        } catch (razorpayError) {
          logger.error('Razorpay payment fetch error', {
            error: razorpayError.message,
            paymentId: razorpay_payment_id
          });
          return res.status(400).json({
            message: 'Failed to verify payment with payment gateway'
          });
        }
      } else if (paymentId) {
        // If only paymentId provided, verify it exists and is successful
        // This is a fallback for non-Razorpay payments
        logger.warn('Payment verification incomplete', { paymentId, userId });
      }
    } else {
      // For COD orders, paymentId is not required
      if (paymentMethod !== 'cod') {
        return res.status(400).json({
          message: 'Payment verification required for non-COD orders'
        });
      }
    }

    // Support both new items[] format and legacy single productId format
    let orderItems = [];
    
    if (items && Array.isArray(items) && items.length > 0) {
      // New format: items[] array
      orderItems = items;
    } else if (productId && priceAtPurchase) {
      // Legacy format: single productId (backward compatibility)
      orderItems = [{
        productId,
        quantity,
        price: priceAtPurchase
      }];
    } else {
      return res.status(400).json({ 
        message: "Missing required fields: either items[] array or productId with priceAtPurchase" 
      });
    }

    // Validate and process each item
    const processedItems = [];
    let orderTotal = 0;
    const designerMap = new Map(); // Track designers for commission calculation

    for (const item of orderItems) {
      const product = await Product.findById(item.productId).populate('createdBy', 'role name');
      if (!product) {
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (!product.isApproved || product.status !== 'published') {
        return res.status(400).json({ 
          message: `Product ${product.title || item.productId} is not available for purchase` 
        });
      }

      // Check inventory - support both variant-specific and total stock
      const itemQuantity = item.quantity || 1;
      
      if (item.variantId && product.variants && product.variants.length > 0) {
        // Check variant-specific stock
        const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
        if (!variant) {
          return res.status(400).json({ message: `Variant not found for product ${product.title}` });
        }
        if (variant.stock !== undefined && variant.stock < itemQuantity) {
          return res.status(400).json({ message: `Insufficient stock for variant in product ${product.title}` });
        }
      } else if (product.stock !== undefined && product.stock < itemQuantity) {
        // Check total product stock
        return res.status(400).json({ message: `Insufficient stock for product ${product.title}` });
      }

      // CRITICAL: Validate price hasn't changed (prevent price tampering)
      // Use price from item (snapshot from cart) if available, otherwise use current product price
      let finalItemPrice = item.price || product.price || 0;
      
      // Warn if price has changed significantly (more than 10% difference)
      // This helps detect price manipulation attempts
      // Only validate if both prices are available
      if (item.price && product.price && item.price !== product.price) {
        const priceDifference = Math.abs(item.price - product.price);
        const pricePercentageChange = (priceDifference / product.price) * 100;
        
        if (pricePercentageChange > 10) {
          logger.warn('Price mismatch detected in order', {
            productId: product._id,
            cartPrice: item.price,
            currentPrice: product.price,
            percentageChange: pricePercentageChange.toFixed(2),
            userId
          });
          // Use the lower price to favor the customer (prevent overcharging)
          // In production, you might want to reject the order or require re-validation
          finalItemPrice = Math.min(item.price, product.price);
          
          if (finalItemPrice !== item.price) {
            logger.info('Using lower price for order item', {
              productId: product._id,
              originalPrice: item.price,
              finalPrice: finalItemPrice
            });
          }
        }
      }
      
      const itemTotal = finalItemPrice * itemQuantity;
      orderTotal += itemTotal;

      processedItems.push({
        productId: item.productId,
        quantity: itemQuantity,
        size: item.size,
        color: item.color,
        variantId: item.variantId,
        price: finalItemPrice, // Use validated price
        customDesign: item.customDesign,
        customDesignData: item.customDesignData
      });

      // Track designer for commission calculation
      if (product.createdBy && product.createdBy.role === 'designer') {
        const designerId = product.createdBy._id.toString();
        if (!designerMap.has(designerId)) {
          designerMap.set(designerId, {
            designerId: product.createdBy._id,
            products: [],
            total: 0
          });
        }
        const designerEntry = designerMap.get(designerId);
        designerEntry.products.push({
          productId: product._id,
          quantity: itemQuantity,
          price: finalItemPrice,
          commissionType: product.commissionType || 'percentage',
          commissionRate: product.commissionRate || 30
        });
        designerEntry.total += itemTotal;
      }
    }

    // Use provided total or calculate from items
    const finalTotal = total || orderTotal;

    // Determine assigned designer (use first designer if all items are from same designer)
    let assignedDesigner = null;
    if (designerMap.size === 1) {
      assignedDesigner = Array.from(designerMap.values())[0].designerId;
    }

    // Start MongoDB transaction for atomic order creation
    const session = await mongoose.startSession();
    
    let order;
    let transactionSupported = true;
    
    try {
      await session.withTransaction(async () => {
        // Create order within transaction
        const orderData = {
          userId,
          items: processedItems,
          // Legacy fields for backward compatibility
          productId: processedItems.length === 1 ? processedItems[0].productId : null,
          quantity: processedItems.reduce((sum, item) => sum + item.quantity, 0),
          priceAtPurchase: processedItems.length === 1 ? processedItems[0].price : undefined,
          assignedDesigner,
          total: finalTotal,
          status: 'processing',
          shippingAddress: shippingAddress || {},
          paymentId: paymentId || razorpay_payment_id || null,
          paymentMethod: paymentMethod || 'card',
          paymentStatus: (paymentId || razorpay_payment_id) ? 'paid' : 'pending',
          idempotencyKey: idempotencyKey || undefined
        };

        const orderArray = await Order.create([orderData], { session });
        order = orderArray[0];

      // Update product stock atomically within transaction
      for (const item of processedItems) {
        const itemQuantity = item.quantity || 1;

        if (item.variantId) {
          // Atomic update for variant stock with optimistic locking
          const updatedProduct = await Product.findOneAndUpdate(
            { 
              _id: item.productId,
              'variants._id': item.variantId,
              'variants.stock': { $gte: itemQuantity } // Only update if stock sufficient
            },
            { 
              $inc: { 'variants.$.stock': -itemQuantity }
            },
            { 
              new: true,
              session // Use session for transaction
            }
          );

          if (!updatedProduct) {
            throw new Error(`Insufficient stock for variant in product. Please refresh and try again.`);
          }
        } else {
          // Atomic update for product-level stock with optimistic locking
          const updatedProduct = await Product.findOneAndUpdate(
            { 
              _id: item.productId,
              stock: { $gte: itemQuantity } // Only update if stock sufficient
            },
            { 
              $inc: { stock: -itemQuantity }
            },
            { 
              new: true,
              session // Use session for transaction
            }
          );

          if (!updatedProduct) {
            throw new Error(`Insufficient stock for product. Please refresh and try again.`);
          }
        }
      }

      // Create commissions within transaction
      const commissions = [];
      for (const [designerId, designerData] of designerMap.entries()) {
        let totalCommissionAmount = 0;

        // Calculate commission for each product
        for (const productData of designerData.products) {
          let commissionAmount;
          if (productData.commissionType === 'percentage') {
            commissionAmount = Math.round((productData.price * productData.quantity * productData.commissionRate) / 100);
          } else {
            commissionAmount = productData.commissionRate * productData.quantity;
          }
          totalCommissionAmount += commissionAmount;

          commissions.push({
            orderId: order._id,
            designerId: designerData.designerId,
            productId: productData.productId,
            orderTotal: productData.price * productData.quantity,
            quantity: productData.quantity,
            unitPrice: productData.price,
            commissionType: productData.commissionType,
            commissionRate: productData.commissionRate,
            commissionAmount: commissionAmount,
            status: 'pending'
          });
        }

        // Update designer's total earnings within transaction
        if (totalCommissionAmount > 0) {
          await User.findByIdAndUpdate(
            designerData.designerId,
            { $inc: { totalEarnings: totalCommissionAmount } },
            { session }
          );
        }
      }

        if (commissions.length > 0) {
          await Commission.create(commissions, { session });
        }

        logger.info('Order transaction committed successfully', { orderId: order._id, userId });
      });
    } catch (transactionError) {
      // Check if error is due to transaction not being supported
      if (transactionError.message && transactionError.message.includes('replica set')) {
        logger.warn('Transactions not supported, proceeding without transaction', {
          error: transactionError.message
        });
        
        // Fallback: Create order without transaction (less safe but works in test environments)
        const orderData = {
          userId,
          items: processedItems,
          productId: processedItems.length === 1 ? processedItems[0].productId : null,
          quantity: processedItems.reduce((sum, item) => sum + item.quantity, 0),
          priceAtPurchase: processedItems.length === 1 ? processedItems[0].price : undefined,
          assignedDesigner,
          total: finalTotal,
          status: 'processing',
          shippingAddress: shippingAddress || {},
          paymentId: paymentId || razorpay_payment_id || null,
          paymentMethod: paymentMethod || 'card',
          paymentStatus: (paymentId || razorpay_payment_id) ? 'paid' : 'pending',
          idempotencyKey: idempotencyKey || undefined
        };

        order = await Order.create(orderData);

        // Update stock without transaction (atomic operations still work)
        for (const item of processedItems) {
          const itemQuantity = item.quantity || 1;
          const updatedProduct = await Product.findOneAndUpdate(
            { 
              _id: item.productId,
              stock: { $gte: itemQuantity }
            },
            { 
              $inc: { stock: -itemQuantity }
            },
            { new: true }
          );

          if (!updatedProduct) {
            // Rollback: delete order if stock update failed
            await Order.findByIdAndDelete(order._id);
            return res.status(400).json({ 
              message: `Insufficient stock for product. Please refresh and try again.` 
            });
          }
        }

        // Create commissions without transaction
        const commissions = [];
        for (const [designerId, designerData] of designerMap.entries()) {
          let totalCommissionAmount = 0;
          for (const productData of designerData.products) {
            let commissionAmount;
            if (productData.commissionType === 'percentage') {
              commissionAmount = Math.round((productData.price * productData.quantity * productData.commissionRate) / 100);
            } else {
              commissionAmount = productData.commissionRate * productData.quantity;
            }
            totalCommissionAmount += commissionAmount;
            commissions.push({
              orderId: order._id,
              designerId: designerData.designerId,
              productId: productData.productId,
              orderTotal: productData.price * productData.quantity,
              quantity: productData.quantity,
              unitPrice: productData.price,
              commissionType: productData.commissionType,
              commissionRate: productData.commissionRate,
              commissionAmount: commissionAmount,
              status: 'pending'
            });
          }
          if (totalCommissionAmount > 0) {
            await User.findByIdAndUpdate(
              designerData.designerId,
              { $inc: { totalEarnings: totalCommissionAmount } }
            );
          }
        }
        if (commissions.length > 0) {
          await Commission.create(commissions);
        }
      } else {
        // Handle other transaction errors
        const errorMessage = transactionError.message || 'Order creation failed';
        if (errorMessage.includes('Insufficient stock')) {
          return res.status(400).json({ message: errorMessage });
        }
        logger.error('Order creation transaction failed', {
          error: transactionError.message,
          stack: transactionError.stack,
          userId
        });
        throw transactionError;
      }
    } finally {
      session.endSession();
    }

    // Populate items with product details for response
    const populatedOrder = await Order.findById(order._id)
      .populate('items.productId', 'title mainImage price')
      .populate('productId', 'title mainImage'); // Legacy field

    // Generate invoice number and save to order
    const { generateInvoiceNumber } = await import('../services/invoice.service.js');
    if (!order.invoiceNumber) {
      order.invoiceNumber = generateInvoiceNumber(order);
      order.invoiceGeneratedAt = new Date();
      await order.save();
    }

    logger.info('Order created successfully', { orderId: order._id, userId, itemCount: processedItems.length, invoiceNumber: order.invoiceNumber });
    
    // Audit log order creation
    try {
      const { auditOrderCreated } = await import('../utils/auditLogger.js');
      await auditOrderCreated(order, req);
    } catch (auditError) {
      // Don't fail if audit logging fails
      logger.error('Failed to audit order creation', { error: auditError.message });
    }
    
    // Clear cart after successful order (outside transaction - can retry if fails)
    try {
      const Cart = (await import('../models/Cart.js')).default;
      await Cart.findOneAndUpdate(
        { userId },
        { items: [], updatedAt: new Date() }
      );
      logger.info('Cart cleared after order creation', { orderId: order._id, userId });
    } catch (cartError) {
      logger.error('Failed to clear cart after order', {
        orderId: order._id,
        userId,
        error: cartError.message
      });
      // Don't fail order if cart clear fails - can retry later
    }
    
    // Send order confirmation email with invoice (fire and forget)
    try {
      const user = await User.findById(userId).select('name email');
      if (user && user.email) {
        // Generate invoice PDF for email attachment
        const { generateInvoicePDF } = await import('../services/invoice.service.js');
        let invoiceBuffer = null;
        
        try {
          invoiceBuffer = await generateInvoicePDF(populatedOrder, user);
          logger.info('Invoice PDF generated for email', { orderId: order._id, invoiceNumber: order.invoiceNumber });
        } catch (invoiceError) {
          logger.error('Failed to generate invoice PDF for email', { 
            error: invoiceError.message, 
            orderId: order._id 
          });
          // Continue without invoice attachment if generation fails
        }

        // Send email with invoice attachment
        sendOrderConfirmation(populatedOrder, user, invoiceBuffer, order.invoiceNumber).catch(err => {
          logger.error('Failed to send order confirmation email', { error: err.message, orderId: order._id });
        });
      }
    } catch (emailError) {
      logger.error('Error sending order confirmation email', { error: emailError.message, orderId: order._id });
      // Don't fail order creation if email fails
    }
    
    res.status(201).json({
      message: "Order created successfully",
      order: populatedOrder
    });
  } catch (error) {
    const userId = req.user?.id;
    logger.error("Create order error", { error: error.message, stack: error.stack, userId });
    
    // Handle duplicate idempotency key
    if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
      const existingOrder = await Order.findOne({ 
        idempotencyKey: req.body.idempotencyKey || req.headers['idempotency-key']
      });
      if (existingOrder) {
        const populatedOrder = await Order.findById(existingOrder._id)
          .populate('items.productId', 'title mainImage price')
          .populate('productId', 'title mainImage');
        return res.status(200).json({
          message: 'Order already exists',
          order: populatedOrder,
          duplicate: true
        });
      }
    }
    
    res.status(500).json({ 
      message: "Failed to create order", 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get user's orders
export const getMyOrders = async (req, res) => {
  try {
    const { page = 1, limit = 20, status = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let filter = { userId: req.user.id };
    if (status !== 'all') {
      filter.status = status;
    }

    const orders = await Order
      .find(filter)
      .populate('items.productId', 'title mainImage price')
      .populate('productId', 'title mainImage price') // Legacy field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        hasNext: skip + orders.length < total
      }
    });
  } catch (error) {
    logger.error("Get orders error", { error: error.message, userId: req.user.id });
    res.status(500).json({ message: "Failed to fetch orders" });
  }
};

// Get single order
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id)
      .populate('items.productId', 'title mainImage price description')
      .populate('productId', 'title mainImage price description') // Legacy field
      .populate('userId', 'name email')
      .populate('assignedDesigner', 'name designerName');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify ownership
    if (order.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.json({ order });
  } catch (error) {
    console.error("Get order error:", error);
    res.status(500).json({ message: "Failed to fetch order" });
  }
};

// Update order status with proper state transitions
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    // Define valid status transitions (production-grade order lifecycle)
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'canceled', 'refunded'];
    const statusTransitions = {
      'pending': ['processing', 'canceled'],
      'processing': ['shipped', 'canceled'],
      'shipped': ['delivered', 'canceled'],
      'delivered': ['refunded'], // Only refund after delivery
      'canceled': [], // Terminal state
      'refunded': [] // Terminal state
    };

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Store old status for audit logging
    const oldStatus = order.status;

    // Validate state transition (prevent invalid status changes)
    const allowedTransitions = statusTransitions[order.status] || [];
    if (order.status !== status && !allowedTransitions.includes(status)) {
      return res.status(400).json({ 
        message: `Cannot transition from ${order.status} to ${status}. Valid transitions: ${allowedTransitions.join(', ') || 'none'}` 
      });
    }

    // Initialize status history if it doesn't exist
    if (!order.statusHistory) {
      order.statusHistory = [];
    }

    // Add status change to history
    order.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user.id,
      notes: notes || `Status changed to ${status} by ${req.user.role}`
    });

    // Handle status-specific logic
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      // Approve pending commissions
      await Commission.updateMany(
        { orderId: order._id, status: 'pending' },
        { status: 'approved' }
      );
    }

    if (status === 'shipped') {
      order.shippedAt = new Date();
    }

    // If order is canceled/refunded, cancel commissions and potentially restore stock
    if (status === 'canceled' || status === 'refunded') {
      await Commission.updateMany(
        { orderId: order._id, status: { $in: ['pending', 'approved'] } },
        { status: 'cancelled' }
      );

      // Restore stock for canceled orders (if not already shipped)
      if (status === 'canceled' && oldStatus !== 'shipped' && oldStatus !== 'delivered') {
        try {
          const itemsToRestore = order.items && order.items.length > 0 
            ? order.items 
            : (order.productId ? [{ productId: order.productId, quantity: order.quantity || 1 }] : []);

          for (const item of itemsToRestore) {
            const productId = typeof item.productId === 'object' ? item.productId._id || item.productId : item.productId;
            const product = await Product.findById(productId);
            if (!product) continue;

            const quantity = item.quantity || 1;

            if (item.variantId && product.variants?.length > 0) {
              const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
              if (variant && variant.stock !== undefined) {
                variant.stock += quantity;
                await product.save();
              }
            } else if (product.stock !== undefined) {
              product.stock += quantity;
              await product.save();
            }
          }

          logger.info('Stock restored for canceled order', { orderId: id });
        } catch (stockError) {
          logger.error('Error restoring stock for canceled order', {
            orderId: id,
            error: stockError.message
          });
          // Don't fail status update if stock restoration fails
        }
      }
    }

    // Update order status
    order.status = status;
    await order.save();

    logger.info('Order status updated', {
      orderId: id,
      oldStatus,
      newStatus: status,
      changedBy: req.user.id,
      userRole: req.user.role
    });

    // Audit log the status change
    try {
      const { auditOrderUpdated } = await import('../utils/auditLogger.js');
      await auditOrderUpdated(order, oldStatus, status, req);
    } catch (auditError) {
      // Don't fail if audit logging fails
      logger.error('Failed to audit order status update', { error: auditError.message });
    }

    res.json({
      message: "Order status updated successfully",
      order
    });
  } catch (error) {
    logger.error("Update order status error", {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ message: "Failed to update order status" });
  }
};

// Cancel order (customer can cancel if not shipped)
export const cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const order = await Order.findById(id)
      .populate('items.productId');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify ownership (customer can only cancel their own orders)
    if (order.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to cancel this order" });
    }

    // Check if order can be cancelled
    const nonCancellableStatuses = ['shipped', 'delivered', 'canceled', 'refunded'];
    if (nonCancellableStatuses.includes(order.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel order. Order status is: ${order.status}. Orders can only be cancelled before shipping.` 
      });
    }

    // Restore stock for all items
    const itemsToRestore = order.items && order.items.length > 0 
      ? order.items 
      : (order.productId ? [{ productId: order.productId, quantity: order.quantity || 1 }] : []);

    for (const item of itemsToRestore) {
      try {
        const productId = typeof item.productId === 'object' ? item.productId._id || item.productId : item.productId;
        const product = await Product.findById(productId);
        if (!product) continue;

        const quantity = item.quantity || 1;

        if (item.variantId && product.variants && product.variants.length > 0) {
          // Restore variant-specific stock
          const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
          if (variant && variant.stock !== undefined) {
            variant.stock += quantity;
            await product.save();
          }
        } else if (product.stock !== undefined) {
          // Restore total product stock
          product.stock += quantity;
          await product.save();
        }
      } catch (err) {
        logger.error('Error restoring stock for cancelled order item', {
          productId: item.productId,
          error: err.message,
          orderId: id
        });
        // Continue with other items even if one fails
      }
    }

    // Cancel commissions
    await Commission.updateMany(
      { orderId: order._id, status: { $in: ['pending', 'approved'] } },
      { status: 'cancelled' }
    );

    // Add to status history
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    order.statusHistory.push({
      status: 'canceled',
      changedAt: new Date(),
      changedBy: userId,
      notes: reason ? `Cancelled: ${reason}` : 'Order cancelled by customer'
    });

    // Update order status
    order.status = 'canceled';
    order.cancelledAt = new Date();
    order.cancellationReason = reason || 'No reason provided';
    order.cancelledBy = userId;

    // Process refund if payment was made
    if (order.paymentStatus === 'paid' && order.paymentId) {
      try {
        // Import refund function to process refund
        const { processRefund } = await import('./payment.controller.js');
        const refundResult = await processRefund(
          order.paymentId, 
          order.total, 
          `Refund for cancelled order ${order._id}`
        );
        
        if (refundResult && refundResult.id) {
          order.refundId = refundResult.id;
          order.paymentStatus = 'refunded';
          logger.info('Refund processed successfully for cancelled order', {
            orderId: id,
            refundId: refundResult.id,
            amount: order.total
          });
        }
      } catch (refundError) {
        logger.error('Refund processing failed for cancelled order', {
          orderId: id,
          paymentId: order.paymentId,
          error: refundError.message
        });
        // Continue with cancellation even if refund fails (admin can process manually)
        // Order will remain as 'canceled' with paymentStatus 'paid' for manual refund
      }
    }

    await order.save();

    logger.info('Order cancelled successfully', {
      orderId: id,
      userId,
      reason: reason || 'No reason',
      refundProcessed: !!order.refundId
    });

    // Audit log order cancellation
    try {
      const { auditOrderCancelled } = await import('../utils/auditLogger.js');
      await auditOrderCancelled(order, reason, req);
    } catch (auditError) {
      // Don't fail if audit logging fails
      logger.error('Failed to audit order cancellation', { error: auditError.message });
    }

    // Populate before returning
    const populatedOrder = await Order.findById(id)
      .populate('items.productId', 'title mainImage price')
      .populate('userId', 'name email');

    res.json({
      message: "Order cancelled successfully",
      order: populatedOrder,
      refundProcessed: !!order.refundId
    });
  } catch (error) {
    logger.error("Cancel order error", {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ message: "Failed to cancel order" });
  }
};

// Re-order functionality - Create a new order from an existing order
export const reorder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Find the original order
    const originalOrder = await Order.findById(id)
      .populate('items.productId');

    if (!originalOrder) {
      return res.status(404).json({ message: "Original order not found" });
    }

    // Verify ownership
    if (originalOrder.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to reorder this order" });
    }

    // Validate that items are still available
    const availableItems = [];
    const unavailableItems = [];

    for (const item of originalOrder.items || []) {
      const productId = typeof item.productId === 'object' 
        ? item.productId._id 
        : item.productId;
      
      const product = await Product.findById(productId);
      
      if (!product || !product.isApproved || product.status !== 'published') {
        unavailableItems.push({
          productId,
          title: typeof item.productId === 'object' ? item.productId.title : 'Unknown',
          reason: !product ? 'Product not found' : 'Product no longer available'
        });
        continue;
      }

      // Check stock availability
      let availableStock = product.stock || 0;
      if (item.variantId && product.variants?.length > 0) {
        const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
        if (variant) {
          availableStock = variant.stock !== undefined ? variant.stock : product.stock || 0;
        }
      }

      const requestedQuantity = item.quantity || 1;
      if (availableStock < requestedQuantity) {
        unavailableItems.push({
          productId,
          title: typeof item.productId === 'object' ? item.productId.title : 'Unknown',
          reason: `Insufficient stock. Only ${availableStock} available.`,
          requestedQuantity,
          availableStock
        });
        // Add with available quantity if stock > 0
        if (availableStock > 0) {
          availableItems.push({
            ...item.toObject(),
            quantity: availableStock, // Use available stock instead
            adjusted: true
          });
        }
      } else {
        availableItems.push(item.toObject());
      }
    }

    if (availableItems.length === 0) {
      return res.status(400).json({
        message: "Cannot reorder: All items are unavailable",
        unavailableItems
      });
    }

    // Return items for frontend to add to cart (frontend will handle adding to cart)
    // This is safer than directly creating an order, as user might want to modify quantities
    res.json({
      message: availableItems.length === originalOrder.items.length 
        ? "All items are available for reorder"
        : "Some items are unavailable",
      availableItems,
      unavailableItems,
      // Include original order reference
      originalOrderId: originalOrder._id
    });

    logger.info('Re-order request processed', {
      orderId: id,
      userId,
      availableItemsCount: availableItems.length,
      unavailableItemsCount: unavailableItems.length
    });

  } catch (error) {
    logger.error("Reorder error", {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ message: "Failed to process reorder request" });
  }
};

// Generate and download invoice PDF
export const downloadInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    
    const order = await Order.findById(id)
      .populate('userId', 'name email phone')
      .populate('items.productId', 'title mainImage price');

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Verify ownership
    if (order.userId._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized" });
    }

    const user = await User.findById(order.userId._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate invoice PDF
    const { generateInvoicePDF, generateInvoiceNumber } = await import('../services/invoice.service.js');
    const pdfBuffer = await generateInvoicePDF(order, user);

    // Generate invoice number if not exists and save
    if (!order.invoiceNumber) {
      order.invoiceNumber = generateInvoiceNumber(order);
      order.invoiceGeneratedAt = new Date();
      await order.save();
    }

    // Set response headers
    const invoiceNumber = order.invoiceNumber || generateInvoiceNumber(order);
    const filename = `Invoice-${invoiceNumber}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    logger.info('Invoice downloaded', {
      orderId: id,
      invoiceNumber,
      userId: req.user.id
    });

    res.send(pdfBuffer);
  } catch (error) {
    logger.error("Download invoice error", {
      error: error.message,
      stack: error.stack,
      orderId: req.params.id,
      userId: req.user?.id
    });
    res.status(500).json({ message: "Failed to generate invoice" });
  }
};
