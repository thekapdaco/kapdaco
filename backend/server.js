// server.js - Complete backend server setup
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

// Import middleware
import { apiLimiter } from './src/middleware/rateLimiter.js';
import { requestIdMiddleware } from './src/middleware/requestId.js';

// Import routes
import authRoutes from './src/routes/auth.js';
import designerAppRoutes from './src/routes/designerApp.routes.js';
import designerRoutes from './src/routes/designer.routes.js';
import brandRoutes from './src/routes/brand.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import uploadRoutes from './src/routes/uploads.js';
import publicRoutes from './src/routes/public.js';
import cartRoutes from './src/routes/cart.routes.js';
import orderRoutes from './src/routes/order.routes.js';
import addressRoutes from './src/routes/address.routes.js';
import paymentRoutes from './src/routes/payment.routes.js';
import reviewRoutes from './src/routes/review.routes.js';

// ES6 module setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from backend root
dotenv.config();

// Validate critical environment variables
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('❌ JWT_SECRET must be at least 32 characters');
  console.error('   Generate one with: openssl rand -base64 32');
  process.exit(1);
}

if (!process.env.MONGODB_URI && process.env.NODE_ENV === 'production') {
  console.error('❌ MONGODB_URI is required in production');
  process.exit(1);
}

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware - Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      imgSrc: ["'self'", 'https://res.cloudinary.com', 'data:', 'https:'],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      fontSrc: ["'self'", 'https:', 'data:'],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  crossOriginEmbedderPolicy: false, // Allow Cloudinary images
}));

// CORS configuration
// SECURITY: In production, require CORS_ALLOWED_ORIGINS or CLIENT_URL
if (process.env.NODE_ENV === 'production') {
  if (!process.env.CORS_ALLOWED_ORIGINS && !process.env.CLIENT_URL) {
    console.error('❌ CORS_ALLOWED_ORIGINS or CLIENT_URL is required in production');
    process.exit(1);
  }
}

const allowedOrigins = process.env.CORS_ALLOWED_ORIGINS 
  ? process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : process.env.CLIENT_URL 
    ? [process.env.CLIENT_URL]
    : ['http://localhost:5173', 'http://localhost:3000']; // Development fallback

const normalizeOrigin = (value) => {
  if (!value) return value;
  return value.trim().replace(/\/+$/, '').toLowerCase();
};

const normalizedAllowedOrigins = allowedOrigins.map(normalizeOrigin);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (platform health checks, server-to-server, Postman)
    if (!origin) {
      return callback(null, true);
    }
    
    // In development and test, be more permissive with localhost
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
    }
    
    const normalizedOrigin = normalizeOrigin(origin);

    // Check if origin is in allowed list
    if (normalizedAllowedOrigins.includes(normalizedOrigin)) {
      callback(null, true);
    } else {
      // Use console.warn in CORS callback (logger import would be async)
      if (process.env.NODE_ENV === 'production') {
        // In production, only log to avoid exposing allowed origins
        console.warn(`CORS: Origin ${origin} not allowed`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Cookie parser middleware (required for HTTP-only cookies)
app.use(cookieParser());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request ID middleware (add before routes for tracing)
app.use(requestIdMiddleware);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Serve static files (uploaded files)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Track connection state to prevent reconnection loops
let isConnecting = false;
let connectionRetryCount = 0;
const maxConnectionRetries = 3;

// Database connection with fallback to local MongoDB
const connectDB = async (retryCount = 0) => {
  // Prevent multiple simultaneous connection attempts
  if (isConnecting) {
    return;
  }

  // If already connected, don't reconnect
  const currentState = mongoose.connection.readyState;
  if (currentState === 1) { // 1 = connected
    return;
  }

  // If connecting (state 2), wait a bit
  if (currentState === 2) { // 2 = connecting
    return;
  }

  // Close any existing connection before reconnecting
  if (currentState !== 0) { // 0 = disconnected
    try {
      await mongoose.connection.close();
    } catch (err) {
      // Ignore close errors
    }
  }

  isConnecting = true;
  const atlasUri = process.env.MONGODB_URI;
  const localUri = 'mongodb://127.0.0.1:27017/kapda-co';
  const maxRetries = 5;
  const retryDelay = 5000; // 5 seconds

  const tryConnect = async (uri, label) => {
    try {
      await mongoose.connect(uri, { 
        autoIndex: true,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000,
      });
      console.log(`✅ MongoDB connected successfully (${label})`);
      isConnecting = false;
      return true;
    } catch (error) {
      const errorMsg = error?.message || error.toString();
      console.error(`❌ MongoDB connection failed (${label}):`, errorMsg);
      
      // Provide helpful error messages
      if (errorMsg.includes('authentication failed') || errorMsg.includes('bad auth')) {
        console.error('💡 Authentication Error - Please verify:');
        console.error('   1. Username and password are correct in MongoDB Atlas');
        console.error('   2. Database user exists in MongoDB Atlas → Database Access');
        console.error('   3. User has read/write permissions to the database');
        console.error('   4. Password special characters are properly encoded in connection string');
      } else if (errorMsg.includes('ENOTFOUND') || errorMsg.includes('getaddrinfo')) {
        console.error('💡 Network Error - Please verify:');
        console.error('   1. Your IP address is whitelisted in MongoDB Atlas → Network Access');
        console.error('   2. You can add 0.0.0.0/0 for development (allows all IPs)');
      }
      
      isConnecting = false;
      return false;
    }
  };

  // Try Atlas first if configured
  if (atlasUri) {
    const ok = await tryConnect(atlasUri, 'PRIMARY');
    if (ok) return;
    console.warn('⚠️ Falling back to local MongoDB...');
  }

  // Try local MongoDB
  const localOk = await tryConnect(localUri, 'LOCAL');
  if (localOk) return;

  // If both failed, retry in development mode
  if (process.env.NODE_ENV === 'development' && retryCount < maxRetries) {
    console.warn(`⚠️ MongoDB connection failed. Retrying in ${retryDelay/1000}s... (${retryCount + 1}/${maxRetries})`);
    console.warn('💡 Make sure MongoDB is running:');
    console.warn('   - Local: mongod (or start MongoDB service)');
    console.warn('   - Atlas: Set MONGODB_URI in backend/api/.env');
    setTimeout(() => {
      isConnecting = false; // Reset flag before retry
      connectDB(retryCount + 1);
    }, retryDelay);
    return;
  }
  
  // Reset connecting flag if we're done retrying
  isConnecting = false;

  // In production, exit if can't connect
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ Unable to connect to MongoDB (both PRIMARY and LOCAL failed).');
    console.error('   Server cannot start without database in production.');
    process.exit(1);
  } else {
    // In development, allow server to start but warn
    console.error('❌ Unable to connect to MongoDB (both PRIMARY and LOCAL failed).');
    console.error('⚠️  Server will start but database operations will fail.');
    console.error('💡 To fix:');
    console.error('   1. Install MongoDB: https://www.mongodb.com/try/download/community');
    console.error('   2. Start MongoDB service: mongod');
    console.error('   3. OR set MONGODB_URI in backend/api/.env for MongoDB Atlas');
  }
};

// Connect to database (non-blocking in development, skip in test)
if (process.env.NODE_ENV !== 'test') {
  connectDB();
}

// Handle MongoDB connection events (skip in test mode)
if (process.env.NODE_ENV !== 'test') {
  mongoose.connection.on('connected', () => {
    console.log('✅ MongoDB connection established');
    connectionRetryCount = 0; // Reset retry count on successful connection
    isConnecting = false;
  });

  mongoose.connection.on('disconnected', () => {
    if (isConnecting) return; // Prevent multiple reconnection attempts
    console.warn('⚠️  MongoDB disconnected.');
    
    // Only attempt reconnection if we were previously connected
    if (mongoose.connection.readyState === 0 && connectionRetryCount < maxConnectionRetries) {
      isConnecting = true;
      connectionRetryCount++;
      console.warn(`   Attempting to reconnect... (${connectionRetryCount}/${maxConnectionRetries})`);
      setTimeout(() => {
        isConnecting = false;
        connectDB();
      }, 5000);
    } else if (connectionRetryCount >= maxConnectionRetries) {
      console.error('❌ Max reconnection attempts reached. Please check MongoDB connection.');
      console.error('💡 Options:');
      console.error('   1. Start local MongoDB: mongod');
      console.error('   2. Set MONGODB_URI in backend/api/.env for MongoDB Atlas');
    }
  });

  mongoose.connection.on('error', (err) => {
    console.error('❌ MongoDB error:', err.message);
    isConnecting = false;
  });
}

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/designer-app', designerAppRoutes);
app.use('/api/designer', designerRoutes);
app.use('/api/brand', brandRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/uploads', uploadRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/reviews', reviewRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Readiness check endpoint
app.get('/api/ready', async (req, res) => {
  try {
    // Check database connection
    const dbState = mongoose.connection.readyState;
    // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
    
    if (dbState !== 1) {
      return res.status(503).json({
        status: 'not ready',
        database: 'disconnected',
        readyState: dbState
      });
    }
    
    // Ping database to ensure it's responsive
    await mongoose.connection.db.admin().ping();
    
    res.json({
      status: 'ready',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      database: 'error',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// NOTE: Frontend is served separately on Hostinger VPS
// Backend is API-only - do not serve static frontend files

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(e => e.message);
    return res.status(400).json({ message: 'Validation Error', errors });
  }
  
  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }
  
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({ message: `${field} already exists` });
  }
  
  res.status(500).json({ 
    message: 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found' });
});

// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received, closing server gracefully...`);
  
  // Close HTTP server
  if (server) {
    server.close(() => {
      console.log('HTTP server closed');
    });
  }
  
  // Close MongoDB connection
  try {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err);
  }
  
  process.exit(0);
};

// Start server (skip in test environment)
let server;
if (process.env.NODE_ENV !== 'test') {
  server = app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🌐 API Base URL: http://localhost:${PORT}/api`);
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}

export default app;