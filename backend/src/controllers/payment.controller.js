// Payment controller - Razorpay integration
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.js';
import WebhookEvent from '../models/WebhookEvent.js';
import logger from '../utils/logger.js';

// Initialize Razorpay instance
let razorpayInstance = null;

const initializeRazorpay = () => {
  if (!razorpayInstance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      logger.warn('Razorpay credentials not configured. Payment features will be disabled.');
      return null;
    }

    razorpayInstance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });
    logger.info('Razorpay initialized successfully');
  }
  return razorpayInstance;
};

/**
 * Create a Razorpay order
 * POST /api/payments/create-order
 */
export const createPaymentOrder = async (req, res) => {
  try {
    const razorpay = initializeRazorpay();
    if (!razorpay) {
      return res.status(503).json({
        message: 'Payment gateway not configured. Please contact support.',
        error: 'PAYMENT_GATEWAY_NOT_CONFIGURED'
      });
    }

    const { amount, currency = 'INR', receipt, notes = {} } = req.body;

    // Validate amount
    if (!amount || amount < 1) {
      return res.status(400).json({ message: 'Invalid amount. Minimum amount is 1 INR.' });
    }

    // Razorpay amounts are in paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    // Create Razorpay order
    const options = {
      amount: amountInPaise,
      currency: currency.toUpperCase(),
      receipt: receipt || `order_${Date.now()}_${req.user.id}`,
      notes: {
        userId: req.user.id.toString(),
        ...notes
      }
    };

    const razorpayOrder = await razorpay.orders.create(options);

    logger.info('Razorpay order created', {
      orderId: razorpayOrder.id,
      amount: amountInPaise,
      userId: req.user.id
    });

    res.json({
      message: 'Payment order created successfully',
      order: {
        id: razorpayOrder.id,
        entity: razorpayOrder.entity,
        amount: razorpayOrder.amount,
        amount_due: razorpayOrder.amount_due,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        key: process.env.RAZORPAY_KEY_ID, // Public key for frontend
        name: 'The Kapda Co.',
        description: 'Premium Customizable Fashion'
      }
    });
  } catch (error) {
    logger.error('Create payment order error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      message: 'Failed to create payment order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Verify payment signature
 * POST /api/payments/verify
 */
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        message: 'Missing required payment verification fields'
      });
    }

    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    
    if (!webhookSecret) {
      logger.error('Razorpay webhook secret not configured');
      return res.status(500).json({
        message: 'Payment verification configuration error'
      });
    }

    // Generate signature for verification
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    // Verify signature
    const isSignatureValid = generatedSignature === razorpay_signature;

    if (!isSignatureValid) {
      logger.warn('Payment signature verification failed', {
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id,
        userId: req.user?.id
      });
      return res.status(400).json({
        message: 'Payment verification failed. Invalid signature.',
        paymentId: null
      });
    }

    logger.info('Payment verified successfully', {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      userId: req.user?.id
    });

    res.json({
      message: 'Payment verified successfully',
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      verified: true
    });
  } catch (error) {
    logger.error('Payment verification error', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });

    res.status(500).json({
      message: 'Payment verification failed',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Handle Razorpay webhook events
 * POST /api/payments/webhook
 */
export const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET;
    
    if (!webhookSecret) {
      logger.error('Razorpay webhook secret not configured');
      return res.status(500).json({ message: 'Webhook configuration error' });
    }

    // Verify webhook signature
    const razorpaySignature = req.headers['x-razorpay-signature'];
    if (!razorpaySignature) {
      return res.status(400).json({ message: 'Missing webhook signature' });
    }

    const rawBody = req.rawBody;
    const text = Buffer.isBuffer(rawBody) ? rawBody.toString('utf8') : JSON.stringify(req.body);
    const generatedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');

    if (generatedSignature !== razorpaySignature) {
      logger.warn('Webhook signature verification failed', {
        received: razorpaySignature.substring(0, 10) + '...',
        generated: generatedSignature.substring(0, 10) + '...'
      });
      return res.status(400).json({ message: 'Invalid webhook signature' });
    }

    const event = req.body;
    const eventId = event.event?.id || event.id || `${event.event}_${Date.now()}`;
    const entityId = event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || eventId;

    // Replay protection - check if event already processed
    try {
      const existingEvent = await WebhookEvent.findOne({ 
        eventId,
        entityId 
      });

      if (existingEvent) {
        logger.info('Duplicate webhook event detected', {
          eventId,
          entityId,
          orderId: existingEvent.orderId,
          eventType: event.event
        });
        return res.status(200).json({ 
          message: 'Event already processed',
          orderId: existingEvent.orderId 
        });
      }
    } catch (replayCheckError) {
      logger.error('Error checking for duplicate webhook event', {
        error: replayCheckError.message,
        eventId,
        entityId
      });
      // Continue processing if replay check fails (don't block webhook)
    }

    logger.info('Razorpay webhook received', {
      event: event.event,
      eventId,
      orderId: event.payload?.order?.entity?.id,
      paymentId: event.payload?.payment?.entity?.id
    });

    let processedOrderId = null;

    // Handle different webhook events
    try {
      switch (event.event) {
        case 'payment.captured':
          processedOrderId = await handlePaymentCaptured(event.payload);
          break;
        case 'payment.failed':
          processedOrderId = await handlePaymentFailed(event.payload);
          break;
        case 'order.paid':
          processedOrderId = await handleOrderPaid(event.payload);
          break;
        default:
          logger.info('Unhandled webhook event', { event: event.event });
      }

      // Store processed event for replay protection
      if (eventId && entityId) {
        try {
          await WebhookEvent.create({
            eventId,
            entityId,
            orderId: processedOrderId,
            eventType: event.event,
            processedAt: new Date()
          });
        } catch (storeError) {
          // Ignore duplicate key errors (race condition)
          if (storeError.code !== 11000) {
            logger.error('Error storing webhook event', {
              error: storeError.message,
              eventId,
              entityId
            });
          }
        }
      }
    } catch (processingError) {
      logger.error('Error processing webhook event', {
        error: processingError.message,
        event: event.event,
        eventId,
        entityId
      });
      // Always return 200 to Razorpay to prevent retries
      return res.status(200).json({ 
        message: 'Webhook received (processing error logged)',
        status: 'error'
      });
    }

    // Always return 200 to Razorpay (even if processing fails)
    res.status(200).json({ status: 'success' });
  } catch (error) {
    logger.error('Webhook handling error', {
      error: error.message,
      stack: error.stack
    });
    res.status(500).json({ message: 'Webhook processing failed' });
  }
};

/**
 * Handle payment captured event
 * Returns orderId if order was found and updated
 */
const handlePaymentCaptured = async (payload) => {
  try {
    const payment = payload.payment?.entity;
    const order = payload.order?.entity;

    if (!payment || !order) {
      logger.warn('Payment captured event missing payment or order data');
      return null;
    }

    // Find order by Razorpay order ID (stored in notes or paymentId)
    const dbOrder = await Order.findOne({
      $or: [
        { paymentId: payment.id },
        { paymentId: order.id }
      ]
    });

    if (dbOrder) {
      dbOrder.paymentStatus = 'paid';
      dbOrder.paymentId = payment.id;
      if (dbOrder.status === 'pending') {
        dbOrder.status = 'processing';
      }
      await dbOrder.save();

      logger.info('Order payment status updated', {
        orderId: dbOrder._id,
        paymentId: payment.id
      });
      return dbOrder._id;
    } else {
      logger.warn('Order not found for payment captured event', {
        paymentId: payment.id,
        razorpayOrderId: order.id
      });
    }
    return null;
  } catch (error) {
    logger.error('Error handling payment captured', { error: error.message });
    throw error; // Re-throw to be caught by webhook handler
  }
};

/**
 * Handle payment failed event
 * Returns orderId if order was found and updated
 */
const handlePaymentFailed = async (payload) => {
  try {
    const payment = payload.payment?.entity;
    const order = payload.order?.entity;

    if (!payment || !order) {
      return null;
    }

    const dbOrder = await Order.findOne({
      $or: [
        { paymentId: payment.id },
        { paymentId: order.id }
      ]
    });

    if (dbOrder) {
      dbOrder.paymentStatus = 'failed';
      await dbOrder.save();

      logger.info('Order payment status updated to failed', {
        orderId: dbOrder._id,
        paymentId: payment.id
      });
      return dbOrder._id;
    }
    return null;
  } catch (error) {
    logger.error('Error handling payment failed', { error: error.message });
    throw error; // Re-throw to be caught by webhook handler
  }
};

/**
 * Handle order paid event
 * Returns orderId if order was found and updated
 */
const handleOrderPaid = async (payload) => {
  try {
    const order = payload.order?.entity;
    if (!order) return null;

    const dbOrder = await Order.findOne({
      paymentId: order.id
    });

    if (dbOrder && dbOrder.paymentStatus !== 'paid') {
      dbOrder.paymentStatus = 'paid';
      if (dbOrder.status === 'pending') {
        dbOrder.status = 'processing';
      }
      await dbOrder.save();

      logger.info('Order marked as paid via webhook', {
        orderId: dbOrder._id,
        razorpayOrderId: order.id
      });
      return dbOrder._id;
    }
    return null;
  } catch (error) {
    logger.error('Error handling order paid', { error: error.message });
    throw error; // Re-throw to be caught by webhook handler
  }
};

/**
 * Get payment status
 * GET /api/payments/status/:orderId
 */
export const getPaymentStatus = async (req, res) => {
  try {
    const { orderId } = req.params;

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order
    if (order.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json({
      orderId: order._id,
      paymentStatus: order.paymentStatus,
      paymentId: order.paymentId,
      status: order.status
    });
  } catch (error) {
    logger.error('Get payment status error', {
      error: error.message,
      orderId: req.params.orderId
    });
    res.status(500).json({ message: 'Failed to get payment status' });
  }
};

/**
 * Process refund for a payment
 * Can be called internally or via API
 */
export const processRefund = async (paymentId, amount, notes = '') => {
  try {
    const razorpay = initializeRazorpay();
    if (!razorpay) {
      throw new Error('Razorpay not configured');
    }

    // Amount in paise (smallest currency unit)
    const amountInPaise = Math.round(amount * 100);

    const refundOptions = {
      payment_id: paymentId,
      amount: amountInPaise,
      speed: 'normal', // or 'optimum' for faster refunds
      notes: {
        reason: notes || 'Order cancellation refund'
      }
    };

    const refund = await razorpay.payments.refund(paymentId, {
      amount: amountInPaise,
      speed: 'normal',
      notes: {
        reason: notes || 'Order cancellation refund'
      }
    });

    logger.info('Refund processed successfully', {
      refundId: refund.id,
      paymentId,
      amount: amountInPaise
    });

    return refund;
  } catch (error) {
    logger.error('Refund processing error', {
      error: error.message,
      paymentId,
      amount
    });
    throw error;
  }
};

/**
 * Process refund via API endpoint
 * POST /api/payments/refund
 */
export const refundPayment = async (req, res) => {
  try {
    const { paymentId, amount, orderId, notes } = req.body;

    if (!paymentId) {
      return res.status(400).json({ message: 'Payment ID is required' });
    }

    // If orderId is provided, verify ownership and get amount
    let refundAmount = amount;
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Check ownership (only customer or admin can refund)
      if (order.userId.toString() !== req.user.id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Unauthorized' });
      }

      if (!refundAmount) {
        refundAmount = order.total;
      }
    }

    if (!refundAmount || refundAmount <= 0) {
      return res.status(400).json({ message: 'Valid refund amount is required' });
    }

    const refund = await processRefund(paymentId, refundAmount, notes);

    // Update order if orderId provided
    if (orderId) {
      const order = await Order.findById(orderId);
      if (order) {
        order.refundId = refund.id;
        order.paymentStatus = 'refunded';
        order.status = 'refunded';
        
        if (!order.statusHistory) {
          order.statusHistory = [];
        }
        order.statusHistory.push({
          status: 'refunded',
          changedAt: new Date(),
          changedBy: req.user.id,
          notes: `Refund processed: ${refund.id}`
        });

        await order.save();
      }
    }

    res.json({
      message: 'Refund processed successfully',
      refund: {
        id: refund.id,
        amount: refund.amount,
        status: refund.status,
        paymentId: refund.payment_id
      }
    });
  } catch (error) {
    logger.error('Refund payment error', {
      error: error.message,
      stack: error.stack,
      paymentId: req.body.paymentId
    });

    res.status(500).json({
      message: 'Failed to process refund',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
