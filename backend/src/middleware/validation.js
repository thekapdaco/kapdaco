// middleware/validation.js - Input validation middleware
import { validationResult } from 'express-validator';

/**
 * Middleware to handle validation errors
 * Returns detailed error information for debugging
 */
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path || err.param || err.location,
      message: err.msg,
      value: err.value,
      location: err.location
    }));
    
    // Log validation errors in development for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('Validation errors:', errorDetails);
    }
    
    return res.status(400).json({
      message: 'Validation failed',
      errors: errorDetails
    });
  }
  next();
};

