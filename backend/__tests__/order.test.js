// __tests__/order.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Order from '../src/models/Order.js';
import Cart from '../src/models/Cart.js';
import { signToken } from '../src/utils/token.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { jest } from '@jest/globals';

// Create shared mock functions that will be reused
const mockOrdersCreate = jest.fn();
const mockPaymentsFetch = jest.fn();

// Mock Razorpay - must be a constructor function that accepts config
jest.mock('razorpay', () => {
  function MockRazorpay(config) {
    // Accept config but don't validate it in tests
    this.orders = {
      create: mockOrdersCreate,
    };
    this.payments = {
      fetch: mockPaymentsFetch,
    };
    return this;
  }
  
  return MockRazorpay;
});

let mongoServer;
let authToken;
let userId;
let testProduct;
let razorpayInstance;

// Helper for shipping address (must match validation requirements)
const testShippingAddress = {
  street: '123 Test St',
  city: 'Test City',
  state: 'Test State',
  postalCode: '12345',
  country: 'India',
  phone: '+911234567890',
  fullName: 'Test User'
};

describe('Order - Payment Verification, Idempotency & Transactions', () => {
  beforeAll(async () => {
    // Use standard MongoDB Memory Server (transactions will gracefully degrade if not supported)
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-testing';
    process.env.RAZORPAY_KEY_ID = 'test_key_id';
    process.env.RAZORPAY_KEY_SECRET = 'test_key_secret';
    process.env.RAZORPAY_WEBHOOK_SECRET = 'test_webhook_secret';
    process.env.NODE_ENV = 'test';
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.close();
    }
    
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.connection.dropDatabase();
      await mongoose.connection.close();
    }
    
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});

    // Create test user
    const user = await User.create({
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'Test123456',
      role: 'customer'
    });
    userId = user._id;
    authToken = signToken({ id: user._id, email: user.email, role: user.role });

    // Create test product
    testProduct = await Product.create({
      title: 'Test Product',
      price: 1000,
      stock: 10,
      isApproved: true,
      status: 'published',
      createdBy: userId,
      category: 't-shirts'
    });

    // Reset Razorpay mocks
    mockOrdersCreate.mockClear();
    mockPaymentsFetch.mockClear();
    
    // Create a new instance (controllers will create their own)
    razorpayInstance = new Razorpay({
      key_id: 'test_key_id',
      key_secret: 'test_key_secret'
    });
  });

  describe('POST /api/orders - Payment Verification', () => {
    it('should reject order creation without payment verification for non-COD', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'card',
          shippingAddress: testShippingAddress
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Payment verification required');
    });

    it('should accept COD orders without payment verification', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          shippingAddress: testShippingAddress
        });

      expect(response.status).toBe(201);
      expect(response.body.order).toBeDefined();
    });

    it('should verify Razorpay payment signature', async () => {
      const razorpay_order_id = 'order_test123';
      const razorpay_payment_id = 'pay_test123';
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const razorpay_signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(text)
        .digest('hex');

      // Mock successful payment
      mockPaymentsFetch.mockResolvedValue({
        id: razorpay_payment_id,
        status: 'captured',
        amount: 100000 // in paise (1000 INR)
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'card',
          shippingAddress: testShippingAddress,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        });

      expect(response.status).toBe(201);
      expect(response.body.order.paymentStatus).toBe('paid');
    });

    it('should reject order with invalid payment signature', async () => {
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'card',
          shippingAddress: testShippingAddress,
          razorpay_order_id: 'order_test123',
          razorpay_payment_id: 'pay_test123',
          razorpay_signature: 'invalid_signature'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Payment verification failed');
    });

    it('should reject order if payment status is not captured/authorized', async () => {
      const razorpay_order_id = 'order_test123';
      const razorpay_payment_id = 'pay_test123';
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const razorpay_signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(text)
        .digest('hex');

      // Mock failed payment
      mockPaymentsFetch.mockResolvedValue({
        id: razorpay_payment_id,
        status: 'failed',
        amount: 100000
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'card',
          shippingAddress: testShippingAddress,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Payment not successful');
    });

    it('should reject order if payment amount does not match', async () => {
      const razorpay_order_id = 'order_test123';
      const razorpay_payment_id = 'pay_test123';
      const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
      const text = `${razorpay_order_id}|${razorpay_payment_id}`;
      const razorpay_signature = crypto
        .createHmac('sha256', webhookSecret)
        .update(text)
        .digest('hex');

      // Mock payment with different amount
      mockPaymentsFetch.mockResolvedValue({
        id: razorpay_payment_id,
        status: 'captured',
        amount: 50000 // 500 INR, but order total is 1000 INR
      });

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'card',
          shippingAddress: testShippingAddress,
          razorpay_order_id,
          razorpay_payment_id,
          razorpay_signature
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('amount does not match');
    });
  });

  describe('POST /api/orders - Idempotency', () => {
    it('should return existing order when same idempotency key is used', async () => {
      const idempotencyKey = 'test-idempotency-key-123';

      // Create first order
      const firstResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          shippingAddress: testShippingAddress
        });

      expect(firstResponse.status).toBe(201);
      const firstOrderId = firstResponse.body.order._id;

      // Try to create duplicate order with same idempotency key
      const secondResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', idempotencyKey)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          shippingAddress: testShippingAddress
        });

      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.duplicate).toBe(true);
      expect(secondResponse.body.order._id).toEqual(firstOrderId.toString());
    });

    it('should create different orders with different idempotency keys', async () => {
      const firstResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', 'key-1')
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          shippingAddress: testShippingAddress
        });

      const secondResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .set('Idempotency-Key', 'key-2')
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          shippingAddress: testShippingAddress
        });

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(201);
      expect(firstResponse.body.order._id).not.toEqual(secondResponse.body.order._id);
    });

    it('should accept idempotency key in request body', async () => {
      const idempotencyKey = 'body-key-123';

      const firstResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          idempotencyKey,
          shippingAddress: testShippingAddress
        });

      const secondResponse = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          idempotencyKey,
          shippingAddress: testShippingAddress
        });

      expect(firstResponse.status).toBe(201);
      expect(secondResponse.status).toBe(200);
      expect(secondResponse.body.duplicate).toBe(true);
    });
  });

  describe('POST /api/orders - Transaction Safety', () => {
    it('should rollback stock update if order creation fails', async () => {
      const initialStock = testProduct.stock;

      // Try to create order with non-existent product ID (valid ObjectId format but doesn't exist)
      const fakeProductId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: fakeProductId,
            quantity: 1,
            price: 1000
          }],
          total: 1000,
          paymentMethod: 'cod',
          shippingAddress: testShippingAddress
        });

      // Should fail with 400 or 404 (product not found)
      expect([400, 404]).toContain(response.status);

      // Verify stock was not updated
      const product = await Product.findById(testProduct._id);
      expect(product.stock).toBe(initialStock);
    });

    it('should atomically update stock and create order', async () => {
      const initialStock = testProduct.stock;

      const response = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          items: [{
            productId: testProduct._id,
            quantity: 2,
            price: 1000
          }],
          total: 2000,
          paymentMethod: 'cod',
          shippingAddress: testShippingAddress
        });

      expect(response.status).toBe(201);

      // Verify stock was updated
      const product = await Product.findById(testProduct._id);
      expect(product.stock).toBe(initialStock - 2);

      // Verify order was created
      const order = await Order.findById(response.body.order._id);
      expect(order).toBeDefined();
      expect(order.items[0].quantity).toBe(2);
    });

    it('should prevent overselling with concurrent orders', async () => {
      const initialStock = testProduct.stock; // 10
      const orderQuantity = 6; // Each order requests 6 items

      // Create multiple concurrent order requests
      const promises = Array(3).fill(null).map(() =>
        request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            items: [{
              productId: testProduct._id,
              quantity: orderQuantity,
              price: 1000
            }],
            total: orderQuantity * 1000,
            paymentMethod: 'cod',
            shippingAddress: testShippingAddress
          })
      );

      const responses = await Promise.all(promises);

      // Log responses for debugging
      responses.forEach((r, i) => {
        if (r.status !== 201) {
          console.log(`Response ${i + 1}: Status ${r.status}`);
          console.log(`  Error:`, r.body?.message || 'No message');
          console.log(`  Full body:`, JSON.stringify(r.body, null, 2));
        }
      });

      // Only 1 order should succeed (6 items), 2 should fail (would exceed stock)
      const successful = responses.filter(r => r.status === 201);
      const failed = responses.filter(r => r.status === 400 || r.status === 409);

      // At least one should succeed due to atomic stock update
      // The others should fail due to insufficient stock
      expect(successful.length).toBe(1);
      expect(failed.length).toBe(2);

      // Verify stock was only decremented once
      const product = await Product.findById(testProduct._id);
      expect(product.stock).toBe(initialStock - orderQuantity);
    });
  });
});

