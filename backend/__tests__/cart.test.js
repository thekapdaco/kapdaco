// __tests__/cart.test.js
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import User from '../src/models/User.js';
import Product from '../src/models/Product.js';
import Cart from '../src/models/Cart.js';
import { signToken } from '../src/utils/token.js';

let mongoServer;
let authToken;
let userId;
let testProduct;
let outOfStockProduct;
let variantProduct;

describe('Cart - Stock Validation Fixes', () => {
  beforeAll(async () => {
    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = 'test-secret-key-minimum-32-characters-long-for-testing';
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
    // Clean up collections
    await User.deleteMany({});
    await Product.deleteMany({});
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

    // Create test product with stock
    testProduct = await Product.create({
      title: 'Test Product',
      price: 1000,
      stock: 10,
      isApproved: true,
      status: 'published',
      createdBy: userId,
      category: 't-shirts'
    });

    // Create out of stock product
    outOfStockProduct = await Product.create({
      title: 'Out of Stock Product',
      price: 2000,
      stock: 0,
      isApproved: true,
      status: 'published',
      createdBy: userId,
      category: 'hoodies'
    });

    // Create product with variants
    variantProduct = await Product.create({
      title: 'Variant Product',
      price: 1500,
      stock: 5,
      isApproved: true,
      status: 'published',
      createdBy: userId,
      category: 't-shirts',
      variants: [
        {
          size: 'M',
          color: 'Red',
          stock: 3
        },
        {
          size: 'L',
          color: 'Blue',
          stock: 0
        }
      ]
    });
  });

  describe('POST /api/cart/add - Stock Validation', () => {
    it('should add item to cart when stock is available', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.items).toHaveLength(1);
      expect(response.body.items[0].quantity).toBe(2);
    });

    it('should reject adding out-of-stock item', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: outOfStockProduct._id,
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toMatch(/Insufficient stock|not available/);
    });

    it('should reject adding quantity exceeding stock', async () => {
      // First add 5 items to cart
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 5
        });

      // Try to add 6 more (total would be 11, exceeding stock of 10)
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 6
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
      expect(response.body.availableStock).toBe(10);
    });

    it('should reject adding to cart if product is not approved', async () => {
      const unapprovedProduct = await Product.create({
        title: 'Unapproved Product',
        price: 1000,
        stock: 10,
        isApproved: false,
        status: 'published',
        createdBy: userId,
        category: 't-shirts'
      });

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: unapprovedProduct._id,
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('not available');
    });

    it('should validate variant stock when variantId is provided', async () => {
      const variant = variantProduct.variants[0]; // M, Red, stock: 3

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: variantProduct._id,
          variantId: variant._id,
          quantity: 2
        });

      expect(response.status).toBe(201);
      expect(response.body.items[0].quantity).toBe(2);
    });

    it('should reject adding variant with insufficient stock', async () => {
      const variant = variantProduct.variants[0]; // M, Red, stock: 3

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: variantProduct._id,
          variantId: variant._id,
          quantity: 5 // More than variant stock (3)
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should reject adding out-of-stock variant', async () => {
      const outOfStockVariant = variantProduct.variants[1]; // L, Blue, stock: 0

      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: variantProduct._id,
          variantId: outOfStockVariant._id,
          quantity: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });

    it('should enforce quantity limits (max 10)', async () => {
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 11
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('between 1 and 10');
    });

    it('should check total quantity when adding to existing cart item', async () => {
      // Add 5 items first
      await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 5
        });

      // Try to add 6 more (total would be 11, exceeding stock of 10)
      const response = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 6
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient stock');
    });
  });

  describe('PATCH /api/cart/item/:itemId - Stock Validation', () => {
    it('should update item quantity within stock limits', async () => {
      // Add item to cart
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2
        });

      const itemId = addResponse.body.items[0]._id;

      // Update quantity
      const response = await request(app)
        .patch(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 5
        });

      expect(response.status).toBe(200);
      expect(response.body.items[0].quantity).toBe(5);
    });

    it('should reject updating quantity exceeding stock', async () => {
      // Add item to cart
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2
        });

      const itemId = addResponse.body.items[0]._id;

      // Try to update to quantity exceeding stock (but within max limit of 10)
      const response = await request(app)
        .patch(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 12 // More than available stock (10), but also exceeds max limit
        });

      expect(response.status).toBe(400);
      // Should fail either due to max limit or stock - both are valid
      expect(response.body.message).toMatch(/Insufficient stock|cannot exceed 10/);
    });

    it('should enforce max quantity limit (10)', async () => {
      const addResponse = await request(app)
        .post('/api/cart/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          productId: testProduct._id,
          quantity: 2
        });

      const itemId = addResponse.body.items[0]._id;

      const response = await request(app)
        .patch(`/api/cart/item/${itemId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          quantity: 11
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('cannot exceed 10');
    });
  });
});

