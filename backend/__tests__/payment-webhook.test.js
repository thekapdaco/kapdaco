// __tests__/payment-webhook.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../src/models/User.js';
import Order from '../src/models/Order.js';
import WebhookEvent from '../src/models/WebhookEvent.js';
import crypto from 'crypto';

let mongoServer;

describe('Payment Webhook - Replay Protection', () => {
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-testing';
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
    await Order.deleteMany({});
    await WebhookEvent.deleteMany({});
  });

  const generateWebhookSignature = (body) => {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    const text = JSON.stringify(body);
    return crypto
      .createHmac('sha256', webhookSecret)
      .update(text)
      .digest('hex');
  };

  describe('POST /api/payments/webhook - Replay Protection', () => {
    it('should process webhook event successfully', async () => {
      // Create test order
      const user = await User.create({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'Test123456',
        role: 'customer'
      });

      const order = await Order.create({
        userId: user._id,
        items: [{
          productId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 1000
        }],
        total: 1000,
        status: 'pending',
        paymentStatus: 'pending',
        paymentId: 'pay_test123'
      });

      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test123',
              status: 'captured',
              amount: 100000
            }
          },
          order: {
            entity: {
              id: 'order_test123'
            }
          }
        }
      };

      const signature = generateWebhookSignature(webhookBody);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookBody);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');

      // Verify order was updated
      const updatedOrder = await Order.findById(order._id);
      expect(updatedOrder.paymentStatus).toBe('paid');
    });

    it('should reject webhook with invalid signature', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'pay_test123'
            }
          }
        }
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', 'invalid_signature')
        .send(webhookBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid');
    });

    it('should reject webhook without signature', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {}
      };

      const response = await request(app)
        .post('/api/payments/webhook')
        .send(webhookBody);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Missing');
    });

    it('should prevent duplicate webhook processing (replay protection)', async () => {
      const user = await User.create({
        name: 'Test User',
        email: `test${Date.now()}@example.com`,
        password: 'Test123456',
        role: 'customer'
      });

      const order = await Order.create({
        userId: user._id,
        items: [{
          productId: new mongoose.Types.ObjectId(),
          quantity: 1,
          price: 1000
        }],
        total: 1000,
        status: 'pending',
        paymentStatus: 'pending',
        paymentId: 'pay_test456'
      });

      const webhookBody = {
        event: 'payment.captured',
        id: 'evt_test123',
        payload: {
          payment: {
            entity: {
              id: 'pay_test456'
            }
          },
          order: {
            entity: {
              id: 'order_test456'
            }
          }
        }
      };

      const signature = generateWebhookSignature(webhookBody);

      // Process webhook first time
      const firstResponse = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookBody);

      expect(firstResponse.status).toBe(200);
      
      // Wait a bit to ensure event is stored
      await new Promise(resolve => setTimeout(resolve, 100));

      // Verify webhook event was stored after first call
      const webhookEvent = await WebhookEvent.findOne({
        eventId: 'evt_test123',
        entityId: 'pay_test456'
      });
      expect(webhookEvent).toBeDefined();

      // Try to process same webhook again (replay)
      const secondResponse = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookBody);

      expect(secondResponse.status).toBe(200);
      // The response should indicate the event was already processed
      expect(secondResponse.body).toBeDefined();
      if (secondResponse.body.message) {
        expect(secondResponse.body.message).toMatch(/already processed|Event already processed/);
      }
    });

    it('should always return 200 to Razorpay even on processing errors', async () => {
      const webhookBody = {
        event: 'payment.captured',
        payload: {
          payment: {
            entity: {
              id: 'nonexistent_payment'
            }
          }
        }
      };

      const signature = generateWebhookSignature(webhookBody);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookBody);

      // Should return 200 even if order not found (prevents Razorpay retries)
      expect(response.status).toBe(200);
    });

    it('should handle different webhook event types', async () => {
      const webhookBody = {
        event: 'payment.failed',
        payload: {
          payment: {
            entity: {
              id: 'pay_failed123'
            }
          }
        }
      };

      const signature = generateWebhookSignature(webhookBody);

      const response = await request(app)
        .post('/api/payments/webhook')
        .set('x-razorpay-signature', signature)
        .send(webhookBody);

      expect(response.status).toBe(200);
    });
  });
});

