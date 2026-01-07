// middleware/rateLimiter.js - Rate limiting middleware
import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // 100 requests per window
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting in test mode
    if (process.env.NODE_ENV === 'test') return true;
    // Skip rate limiting for health checks
    return req.path === '/api/health' || req.path === '/api/ready';
  }
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 login attempts per window
  message: { message: 'Too many login attempts, please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  skip: () => process.env.NODE_ENV === 'test', // Skip in test mode
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many login attempts, please try again after 15 minutes.' 
    });
  }
});

// Rate limiter for signup
export const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.SIGNUP_RATE_LIMIT || '10'), // 10 signups per hour per IP (configurable via env)
  message: { message: 'Too many signup attempts. Please try again in an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test mode
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many signup attempts. Please try again in an hour.' 
    });
  }
});

// Rate limiter for password reset
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 password reset attempts per hour
  message: { message: 'Too many password reset attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test mode
  handler: (req, res) => {
    res.status(429).json({ 
      message: 'Too many password reset attempts, please try again later.' 
    });
  }
});

// Rate limiter for file uploads
export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 upload requests per window
  message: 'Too many file upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiter for unauthenticated signup uploads
export const signupUploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 upload requests per hour per IP (for signup process)
  message: 'Too many file upload requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test', // Skip in test mode
});

