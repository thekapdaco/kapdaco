# 🔧 Backend Critical Fixes - Implementation Guide
## 3-Day Production Hardening Sprint

**Status:** Ready for Implementation  
**Priority:** 🔴 Critical - Blocking Production Release

---

## 📅 Day 1: Critical Data Integrity Fixes

### Fix 1: Add Stock Validation to Cart Add

**File:** `backend/src/controllers/cart.controller.js`

**Current Code (Lines 11-34):**
```javascript
export const addToCart = async (req, res) => {
  const { productId, quantity = 1, size, color, variantId } = req.body;
  let cart = await Cart.findOne({ userId: req.user.id });
  if (!cart) cart = await Cart.create({ userId: req.user.id, items: [] });

  // ISSUE: No stock validation here
  const existing = cart.items.find(/* ... */);
  if (existing) existing.quantity += quantity;
  else cart.items.push({ productId, quantity, size, color, variantId });
  // ...
};
```

**Fixed Code:**
```javascript
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
    
    const populatedCart = await Cart.findById(cart._id).populate("items.productId");
    res.status(201).json(populatedCart);
  } catch (error) {
    logger.error('Add to cart error', { error: error.message, userId: req.user.id });
    res.status(500).json({ message: 'Failed to add item to cart' });
  }
};
```

**Testing:**
```javascript
// Test case 1: Add out-of-stock item
POST /api/cart/add
{ productId: "out_of_stock_id", quantity: 1 }
// Expected: 400 "Insufficient stock"

// Test case 2: Add quantity exceeding stock
POST /api/cart/add
{ productId: "low_stock_id", quantity: 100 }
// Expected: 400 "Insufficient stock. Only X items available."

// Test case 3: Add valid item
POST /api/cart/add
{ productId: "valid_id", quantity: 2 }
// Expected: 201 with cart
```

---

### Fix 2: Add Payment Verification Before Order Creation

**File:** `backend/src/controllers/order.controller.js`

**Add at the beginning of `createOrder` function:**

```javascript
export const createOrder = async (req, res) => {
  try {
    const { items, productId, quantity = 1, priceAtPurchase, shippingAddress, paymentId, paymentMethod, total, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const userId = req.user.id;

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
            message: 'Payment verification failed. Invalid signature.'
          });
        }

        // Verify payment status with Razorpay
        try {
          const payment = await razorpay.payments.fetch(razorpay_payment_id);
          if (payment.status !== 'captured' && payment.status !== 'authorized') {
            return res.status(400).json({
              message: `Payment not successful. Status: ${payment.status}`
            });
          }

          // Verify amount matches
          const paymentAmount = payment.amount / 100; // Convert from paise
          if (Math.abs(paymentAmount - total) > 0.01) {
            logger.error('Payment amount mismatch', {
              paymentAmount,
              orderTotal: total,
              userId
            });
            return res.status(400).json({
              message: 'Payment amount does not match order total'
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

    // Continue with existing order creation logic...
    // ... rest of the function
  } catch (error) {
    logger.error('Create order error', { error: error.message, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to create order' });
  }
};
```

**Add imports at top of file:**
```javascript
import crypto from 'crypto';
import Razorpay from 'razorpay';

// Add Razorpay initialization function
const initializeRazorpay = () => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};
```

---

### Fix 3: Add Idempotency Keys

**File 1:** `backend/src/models/Order.js`

**Add to OrderSchema:**
```javascript
const OrderSchema = new mongoose.Schema({
  // ... existing fields ...
  
  idempotencyKey: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    index: true
  },
  
  // ... rest of schema
}, { timestamps: true });

// Add TTL index for idempotency keys (clean up after 24 hours)
OrderSchema.index({ idempotencyKey: 1 }, { 
  expireAfterSeconds: 86400, // 24 hours
  partialFilterExpression: { idempotencyKey: { $exists: true } }
});
```

**File 2:** `backend/src/controllers/order.controller.js`

**Add at the beginning of `createOrder`:**
```javascript
export const createOrder = async (req, res) => {
  try {
    const idempotencyKey = req.headers['idempotency-key'] || req.body.idempotencyKey;
    
    // Check for existing order with same idempotency key
    if (idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey });
      if (existingOrder) {
        logger.info('Duplicate order request detected', {
          idempotencyKey,
          orderId: existingOrder._id,
          userId: req.user.id
        });
        return res.status(200).json({
          message: 'Order already exists',
          order: existingOrder,
          duplicate: true
        });
      }
    }

    // ... rest of order creation logic ...
    
    // Before saving order, add idempotency key
    const orderData = {
      // ... existing order data ...
      idempotencyKey: idempotencyKey || undefined
    };
    
    const order = await Order.create(orderData);
    // ... rest of function
  } catch (error) {
    // Handle duplicate key error
    if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
      const existingOrder = await Order.findOne({ idempotencyKey: req.body.idempotencyKey });
      if (existingOrder) {
        return res.status(200).json({
          message: 'Order already exists',
          order: existingOrder,
          duplicate: true
        });
      }
    }
    throw error;
  }
};
```

---

## 📅 Day 2: Transaction Safety & Race Conditions

### Fix 4: Add MongoDB Transactions

**File:** `backend/src/controllers/order.controller.js`

**Replace order creation section with transaction:**

```javascript
export const createOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // ... payment verification code from Fix 2 ...
    // ... idempotency check from Fix 3 ...

    // Process items and validate stock (within transaction)
    const processedItems = [];
    let orderTotal = 0;
    const designerMap = new Map();

    for (const item of orderItems) {
      const product = await Product.findById(item.productId)
        .populate('createdBy', 'role name')
        .session(session); // Use session for transaction

      if (!product) {
        await session.abortTransaction();
        return res.status(404).json({ message: `Product not found: ${item.productId}` });
      }

      if (!product.isApproved || product.status !== 'published') {
        await session.abortTransaction();
        return res.status(400).json({ 
          message: `Product ${product.title || item.productId} is not available for purchase` 
        });
      }

      const itemQuantity = item.quantity || 1;
      
      // Check stock with optimistic locking
      if (item.variantId && product.variants?.length > 0) {
        const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
        if (!variant) {
          await session.abortTransaction();
          return res.status(400).json({ message: `Variant not found for product ${product.title}` });
        }
        
        // Atomic stock check and update
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            _id: product._id,
            'variants._id': variant._id,
            'variants.stock': { $gte: itemQuantity } // Only update if stock sufficient
          },
          { 
            $inc: { 'variants.$.stock': -itemQuantity }
          },
          { 
            new: true,
            session // Use session
          }
        );

        if (!updatedProduct) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: `Insufficient stock for variant in product ${product.title}` 
          });
        }
      } else {
        // Atomic stock check and update for product-level stock
        const updatedProduct = await Product.findOneAndUpdate(
          { 
            _id: product._id,
            stock: { $gte: itemQuantity } // Only update if stock sufficient
          },
          { 
            $inc: { stock: -itemQuantity }
          },
          { 
            new: true,
            session // Use session
          }
        );

        if (!updatedProduct) {
          await session.abortTransaction();
          return res.status(400).json({ 
            message: `Insufficient stock for product ${product.title}` 
          });
        }
      }

      const itemPrice = item.price || product.price || 0;
      const itemTotal = itemPrice * itemQuantity;
      orderTotal += itemTotal;

      processedItems.push({
        productId: item.productId,
        quantity: itemQuantity,
        size: item.size,
        color: item.color,
        variantId: item.variantId,
        price: itemPrice,
        customDesign: item.customDesign,
        customDesignData: item.customDesignData
      });

      // Track designer for commission
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
          price: itemPrice,
          commissionType: product.commissionType || 'percentage',
          commissionRate: product.commissionRate || 30
        });
        designerEntry.total += itemTotal;
      }
    }

    const finalTotal = total || orderTotal;
    let assignedDesigner = null;
    if (designerMap.size === 1) {
      assignedDesigner = Array.from(designerMap.values())[0].designerId;
    }

    // Create order within transaction
    const order = await Order.create([{
      userId,
      items: processedItems,
      productId: processedItems.length === 1 ? processedItems[0].productId : null,
      quantity: processedItems.reduce((sum, item) => sum + item.quantity, 0),
      priceAtPurchase: processedItems.length === 1 ? processedItems[0].price : undefined,
      assignedDesigner,
      total: finalTotal,
      status: 'processing',
      shippingAddress: shippingAddress || {},
      paymentId: paymentId || null,
      paymentMethod: paymentMethod || 'card',
      paymentStatus: paymentId ? 'paid' : 'pending',
      idempotencyKey: idempotencyKey || undefined
    }], { session });

    // Create commissions within transaction
    const commissions = [];
    for (const [designerId, designerData] of designerMap.entries()) {
      const commissionAmount = (designerData.total * (designerData.products[0].commissionRate / 100));
      commissions.push({
        orderId: order[0]._id,
        designerId: designerData.designerId,
        amount: commissionAmount,
        products: designerData.products,
        status: 'pending'
      });
    }

    if (commissions.length > 0) {
      await Commission.create(commissions, { session });
    }

    // Commit transaction
    await session.commitTransaction();

    // Clear cart after successful order (outside transaction - can retry if fails)
    try {
      await Cart.findOneAndUpdate(
        { userId },
        { items: [], updatedAt: new Date() }
      );
    } catch (cartError) {
      logger.error('Failed to clear cart after order', {
        orderId: order[0]._id,
        userId,
        error: cartError.message
      });
      // Don't fail order if cart clear fails - can retry later
    }

    // Send order confirmation email (fire and forget)
    try {
      await sendOrderConfirmation(order[0], req.user);
    } catch (emailError) {
      logger.error('Failed to send order confirmation email', {
        orderId: order[0]._id,
        error: emailError.message
      });
    }

    res.status(201).json({
      message: 'Order created successfully',
      order: order[0]
    });

  } catch (error) {
    // Rollback transaction on any error
    await session.abortTransaction();
    
    logger.error('Create order error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    // Handle duplicate idempotency key
    if (error.code === 11000 && error.keyPattern?.idempotencyKey) {
      const existingOrder = await Order.findOne({ 
        idempotencyKey: req.body.idempotencyKey 
      });
      if (existingOrder) {
        return res.status(200).json({
          message: 'Order already exists',
          order: existingOrder,
          duplicate: true
        });
      }
    }

    res.status(500).json({ 
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
};
```

---

### Fix 5: Secure Webhook Handling

**File:** `backend/src/controllers/payment.controller.js`

**Update `handleWebhook` function:**

```javascript
import WebhookEvent from '../models/WebhookEvent.js'; // Create this model

export const handleWebhook = async (req, res) => {
  try {
    // 1. Verify webhook signature
    const signature = req.headers['x-razorpay-signature'];
    if (!signature) {
      logger.warn('Webhook request missing signature', {
        headers: req.headers,
        body: req.body
      });
      return res.status(401).json({ message: 'Missing signature' });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    if (!webhookSecret) {
      logger.error('Webhook secret not configured');
      return res.status(500).json({ message: 'Webhook configuration error' });
    }

    // Verify signature
    const crypto = await import('crypto');
    const text = JSON.stringify(req.body);
    const generatedSignature = crypto.default
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== signature) {
      logger.warn('Webhook signature verification failed', {
        received: signature.substring(0, 10) + '...',
        generated: generatedSignature.substring(0, 10) + '...'
      });
      return res.status(401).json({ message: 'Invalid signature' });
    }

    // 2. Replay protection - check if event already processed
    const eventId = req.body.event?.id || req.body.id;
    const entityId = req.body.payload?.payment?.entity?.id || req.body.payload?.order?.entity?.id;

    if (eventId) {
      const existingEvent = await WebhookEvent.findOne({ 
        eventId,
        entityId 
      });

      if (existingEvent) {
        logger.info('Duplicate webhook event detected', {
          eventId,
          entityId,
          orderId: existingEvent.orderId
        });
        return res.status(200).json({ 
          message: 'Event already processed',
          orderId: existingEvent.orderId 
        });
      }
    }

    // 3. Process webhook based on event type
    const eventType = req.body.event;
    const payment = req.body.payload?.payment?.entity;
    const order = req.body.payload?.order?.entity;

    if (eventType === 'payment.captured' || eventType === 'payment.authorized') {
      // Update order payment status
      if (payment?.order_id) {
        const orderId = payment.order_id;
        const updatedOrder = await Order.findOneAndUpdate(
          { paymentId: orderId },
          { 
            paymentStatus: 'paid',
            paymentId: payment.id
          },
          { new: true }
        );

        if (updatedOrder) {
          // Store processed event
          await WebhookEvent.create({
            eventId: eventId || payment.id,
            entityId: payment.id,
            orderId: updatedOrder._id,
            eventType,
            processedAt: new Date()
          });

          logger.info('Payment webhook processed', {
            paymentId: payment.id,
            orderId: updatedOrder._id
          });
        }
      }
    }

    // Always return 200 to Razorpay (even if processing fails)
    res.status(200).json({ message: 'Webhook received' });

  } catch (error) {
    logger.error('Webhook processing error', {
      error: error.message,
      stack: error.stack,
      body: req.body
    });
    
    // Always return 200 to Razorpay to prevent retries
    res.status(200).json({ message: 'Webhook received (processing error logged)' });
  }
};
```

**Create WebhookEvent Model:** `backend/src/models/WebhookEvent.js`

```javascript
import mongoose from 'mongoose';

const WebhookEventSchema = new mongoose.Schema({
  eventId: {
    type: String,
    required: true,
    index: true
  },
  entityId: {
    type: String,
    required: true,
    index: true
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    index: true
  },
  eventType: String,
  processedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Unique index on eventId + entityId to prevent duplicates
WebhookEventSchema.index({ eventId: 1, entityId: 1 }, { unique: true });

// TTL index - clean up after 30 days
WebhookEventSchema.index({ processedAt: 1 }, { expireAfterSeconds: 2592000 });

export default mongoose.model('WebhookEvent', WebhookEventSchema);
```

---

## 📅 Day 3: Production Polish

### Fix 6: Add Request ID Middleware

**File:** `backend/src/middleware/requestId.js` (new file)

```javascript
import { v4 as uuidv4 } from 'uuid';

export const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from header or generate new one
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Add to request object
  req.requestId = requestId;
  
  // Add to response header
  res.setHeader('X-Request-Id', requestId);
  
  next();
};
```

**Update:** `backend/server.js`

```javascript
import { requestIdMiddleware } from './src/middleware/requestId.js';

// Add after body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestIdMiddleware); // Add this
```

**Update logger to include requestId:**

```javascript
// In all controllers, use:
logger.info('Operation', { 
  requestId: req.requestId,
  userId: req.user?.id,
  // ... other context
});
```

---

### Fix 7: Standardize Error Format

**File:** `backend/src/utils/errorHandler.js` (new file)

```javascript
export const standardErrorResponse = (req, res, statusCode, message, error = null) => {
  const response = {
    error: {
      code: statusCode,
      message,
      requestId: req.requestId || 'unknown'
    }
  };

  if (process.env.NODE_ENV === 'development' && error) {
    response.error.details = error.message;
    response.error.stack = error.stack;
  }

  return res.status(statusCode).json(response);
};

export const validationErrorResponse = (req, res, errors) => {
  return res.status(400).json({
    error: {
      code: 400,
      message: 'Validation failed',
      requestId: req.requestId || 'unknown',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    }
  });
};
```

**Update controllers to use standard format:**

```javascript
// Instead of:
res.status(400).json({ message: 'Error' });

// Use:
standardErrorResponse(req, res, 400, 'Error message');
```

---

## ✅ Testing Checklist

### Unit Tests
- [ ] Cart stock validation test
- [ ] Payment verification test
- [ ] Idempotency test
- [ ] Transaction rollback test

### Integration Tests
- [ ] Complete checkout flow
- [ ] Concurrent order creation
- [ ] Webhook replay protection
- [ ] Payment failure scenarios

### Load Tests
- [ ] 100 concurrent users
- [ ] Order creation under load
- [ ] Payment webhook handling
- [ ] Response time < 300ms

---

**Implementation Status:** Ready to execute  
**Estimated Time:** 3 days  
**Risk Level:** Low (all fixes are additive, non-breaking)


