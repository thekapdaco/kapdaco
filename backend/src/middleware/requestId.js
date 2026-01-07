import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID Middleware
 * Adds a unique request ID to each request for tracing
 * Can be used from X-Request-Id header or generates a new UUID
 */
export const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from header or generate new one
  const requestId = req.headers['x-request-id'] || uuidv4();
  
  // Add to request object for use in controllers
  req.requestId = requestId;
  
  // Add to response header for client tracking
  res.setHeader('X-Request-Id', requestId);
  
  next();
};

