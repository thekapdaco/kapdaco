// middleware/auth.js
// Production-grade authentication and authorization middleware
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "../utils/logger.js";
import { createAuditLog } from "../utils/auditLogger.js";

/**
 * Basic authentication middleware
 * SECURITY: Validates JWT token and ensures user is active
 * Logs unauthorized access attempts for security monitoring
 */
export const auth = async (req, res, next) => {
  try {
    // SECURITY: Read token from HTTP-only cookie (preferred) or Authorization header (fallback for compatibility)
    const token = req.cookies?.token || req.header("Authorization")?.replace("Bearer ", "");
    const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
    const requestId = req.requestId || 'unknown';
    
    // SECURITY CHECK 1: Token must exist
    if (!token) {
      // Log unauthorized access attempt (no token)
      logger.warn('Unauthorized access attempt - no token', {
        ipAddress,
        path: req.path,
        method: req.method,
        requestId
      });
      
      // Audit log for security monitoring
      createAuditLog({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        actor: { userId: null, ipAddress },
        target: { type: 'auth', path: req.path },
        details: {
          reason: 'No token provided',
          path: req.path,
          method: req.method
        },
        requestId,
        status: 'failure'
      }, req);
      
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    // SECURITY CHECK 2: Verify token signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (jwtError) {
      // Token is invalid, expired, or malformed
      logger.warn('Invalid token attempt', {
        ipAddress,
        path: req.path,
        method: req.method,
        error: jwtError.name, // 'TokenExpiredError', 'JsonWebTokenError', etc.
        requestId
      });
      
      createAuditLog({
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        actor: { userId: null, ipAddress },
        target: { type: 'auth', path: req.path },
        details: {
          reason: `Invalid token: ${jwtError.name}`,
          path: req.path,
          method: req.method
        },
        requestId,
        status: 'failure'
      }, req);
      
      return res.status(401).json({ 
        message: jwtError.name === 'TokenExpiredError' 
          ? "Token expired. Please login again." 
          : "Invalid token." 
      });
    }

    // SECURITY CHECK 3: User must exist in database
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      logger.warn('Token for non-existent user', {
        userId: decoded.id,
        ipAddress,
        path: req.path,
        method: req.method,
        requestId
      });
      
      return res.status(401).json({ message: "Invalid token." });
    }

    // SECURITY CHECK 4: User must be active (not suspended/deactivated)
    if (!user.isActive) {
      logger.warn('Inactive user access attempt', {
        userId: user._id,
        userRole: user.role,
        ipAddress,
        path: req.path,
        method: req.method,
        requestId
      });
      
      createAuditLog({
        action: 'INACTIVE_USER_ACCESS_ATTEMPT',
        actor: { userId: user._id.toString(), role: user.role, ipAddress },
        target: { type: 'auth', path: req.path },
        details: {
          reason: 'User account is inactive',
          userRole: user.role,
          path: req.path,
          method: req.method
        },
        requestId,
        status: 'failure'
      }, req);
      
      return res.status(401).json({ message: "Account is inactive. Please contact support." });
    }

    // SECURITY: Attach user to request object for use in route handlers
    req.user = user;
    next();
  } catch (error) {
    // Unexpected error during authentication
    logger.error('Auth middleware error', {
      error: error.message,
      stack: error.stack,
      path: req.path,
      method: req.method,
      requestId: req.requestId
    });
    
    res.status(500).json({ message: "Authentication error. Please try again." });
  }
};

/**
 * Role-based authorization middleware functions
 * SECURITY: These MUST be called after auth() middleware to ensure req.user exists
 * All unauthorized access attempts are logged for security monitoring
 */

// Admin role check
export const isAdmin = (req, res, next) => {
  // SECURITY: Ensure auth middleware was called first
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const requestId = req.requestId || 'unknown';

  if (req.user.role !== "admin") {
    // Log unauthorized role access attempt
    logger.warn('Unauthorized role access attempt', {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRole: 'admin',
      ipAddress,
      path: req.path,
      method: req.method,
      requestId
    });

    // Audit log for security monitoring
    createAuditLog({
      action: 'UNAUTHORIZED_ROLE_ACCESS',
      actor: { userId: req.user._id.toString(), role: req.user.role, ipAddress },
      target: { type: 'auth', path: req.path },
      details: {
        userRole: req.user.role,
        requiredRole: 'admin',
        path: req.path,
        method: req.method
      },
      requestId,
      status: 'failure'
    }, req);

    return res.status(403).json({ message: "Access denied. Admin role required." });
  }
  next();
};

// Designer role check
export const isDesigner = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const requestId = req.requestId || 'unknown';

  if (req.user.role !== "designer") {
    logger.warn('Unauthorized role access attempt', {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRole: 'designer',
      ipAddress,
      path: req.path,
      method: req.method,
      requestId
    });

    createAuditLog({
      action: 'UNAUTHORIZED_ROLE_ACCESS',
      actor: { userId: req.user._id.toString(), role: req.user.role, ipAddress },
      target: { type: 'auth', path: req.path },
      details: {
        userRole: req.user.role,
        requiredRole: 'designer',
        path: req.path,
        method: req.method
      },
      requestId,
      status: 'failure'
    }, req);

    return res.status(403).json({ message: "Access denied. Designer role required." });
  }
  next();
};

// Designer or Admin role check
export const isDesignerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const requestId = req.requestId || 'unknown';

  if (!["designer", "admin"].includes(req.user.role)) {
    logger.warn('Unauthorized role access attempt', {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRoles: ['designer', 'admin'],
      ipAddress,
      path: req.path,
      method: req.method,
      requestId
    });

    createAuditLog({
      action: 'UNAUTHORIZED_ROLE_ACCESS',
      actor: { userId: req.user._id.toString(), role: req.user.role, ipAddress },
      target: { type: 'auth', path: req.path },
      details: {
        userRole: req.user.role,
        requiredRoles: ['designer', 'admin'],
        path: req.path,
        method: req.method
      },
      requestId,
      status: 'failure'
    }, req);

    return res.status(403).json({ message: "Access denied. Designer or Admin role required." });
  }
  next();
};

// Brand role check
export const isBrand = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const requestId = req.requestId || 'unknown';

  if (req.user.role !== "brand") {
    logger.warn('Unauthorized role access attempt', {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRole: 'brand',
      ipAddress,
      path: req.path,
      method: req.method,
      requestId
    });

    createAuditLog({
      action: 'UNAUTHORIZED_ROLE_ACCESS',
      actor: { userId: req.user._id.toString(), role: req.user.role, ipAddress },
      target: { type: 'auth', path: req.path },
      details: {
        userRole: req.user.role,
        requiredRole: 'brand',
        path: req.path,
        method: req.method
      },
      requestId,
      status: 'failure'
    }, req);

    return res.status(403).json({ message: "Access denied. Brand role required." });
  }
  next();
};

// Brand or Admin role check
export const isBrandOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: "Authentication required." });
  }

  const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'] || 'unknown';
  const requestId = req.requestId || 'unknown';

  if (!["brand", "admin"].includes(req.user.role)) {
    logger.warn('Unauthorized role access attempt', {
      userId: req.user._id,
      userRole: req.user.role,
      requiredRoles: ['brand', 'admin'],
      ipAddress,
      path: req.path,
      method: req.method,
      requestId
    });

    createAuditLog({
      action: 'UNAUTHORIZED_ROLE_ACCESS',
      actor: { userId: req.user._id.toString(), role: req.user.role, ipAddress },
      target: { type: 'auth', path: req.path },
      details: {
        userRole: req.user.role,
        requiredRoles: ['brand', 'admin'],
        path: req.path,
        method: req.method
      },
      requestId,
      status: 'failure'
    }, req);

    return res.status(403).json({ message: "Access denied. Brand or Admin role required." });
  }
  next();
};