/**
 * Audit Logger Utility
 * Centralized logging for critical actions
 */
import AuditLog from '../models/AuditLog.js';
import logger from './logger.js';

/**
 * Create an audit log entry
 * @param {Object} options - Audit log options
 * @param {string} options.action - Action type (e.g., 'order.created')
 * @param {Object} options.actor - Actor information
 * @param {Object} options.target - Target information
 * @param {Object} options.details - Action-specific details
 * @param {Object} options.changes - Before/after changes
 * @param {string} options.requestId - Request ID for tracing
 * @param {string} options.status - Action status ('success', 'failure', 'partial')
 * @param {Error} options.error - Error object if action failed
 * @param {Object} options.metadata - Additional metadata
 * @param {Object} req - Express request object (optional, for extracting context)
 */
export const createAuditLog = async (options, req = null) => {
  try {
    const {
      action,
      actor,
      target,
      details = {},
      changes = {},
      requestId,
      status = 'success',
      error = null,
      metadata = {}
    } = options;

    // Extract request context if req is provided
    const auditEntry = {
      action,
      actor: {
        userId: actor?.userId || req?.user?.id || null,
        role: actor?.role || req?.user?.role || 'system',
        ipAddress: actor?.ipAddress || req?.ip || req?.connection?.remoteAddress || null,
        userAgent: actor?.userAgent || req?.headers?.['user-agent'] || null
      },
      target: target || {},
      details,
      changes,
      requestId: requestId || req?.requestId || null,
      status,
      metadata
    };

    // Add error information if present
    if (error) {
      auditEntry.error = {
        message: error.message || String(error),
        code: error.code || null,
        stack: process.env.NODE_ENV === 'development' ? error.stack : null
      };
    }

    // Save audit log (fire and forget - don't block request)
    AuditLog.create(auditEntry).catch(err => {
      // Log error but don't fail the request
      logger.error('Failed to create audit log', {
        error: err.message,
        action,
        requestId: auditEntry.requestId
      });
    });

    // Also log to application logger for immediate visibility
    if (status === 'failure' || error) {
      logger.error('Audit: Action failed', {
        action,
        actor: auditEntry.actor,
        target: auditEntry.target,
        error: error?.message
      });
    } else {
      logger.info('Audit: Action performed', {
        action,
        actor: auditEntry.actor,
        target: auditEntry.target
      });
    }

  } catch (err) {
    // Never throw - audit logging should never break the application
    logger.error('Error in audit logger', {
      error: err.message,
      stack: err.stack
    });
  }
};

/**
 * Convenience functions for common audit actions
 */
export const auditOrderCreated = async (order, req) => {
  await createAuditLog({
    action: 'order.created',
    target: {
      type: 'order',
      id: order._id,
      reference: order.invoiceNumber || order._id.toString()
    },
    details: {
      orderId: order._id,
      userId: order.userId,
      total: order.total,
      itemCount: order.items?.length || 0,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus
    },
    metadata: {
      status: order.status
    }
  }, req);
};

export const auditOrderUpdated = async (order, oldStatus, newStatus, req) => {
  await createAuditLog({
    action: 'order.updated',
    target: {
      type: 'order',
      id: order._id,
      reference: order.invoiceNumber || order._id.toString()
    },
    details: {
      orderId: order._id,
      statusChange: `${oldStatus} -> ${newStatus}`
    },
    changes: {
      before: { status: oldStatus },
      after: { status: newStatus }
    }
  }, req);
};

export const auditOrderCancelled = async (order, reason, req) => {
  await createAuditLog({
    action: 'order.cancelled',
    target: {
      type: 'order',
      id: order._id,
      reference: order.invoiceNumber || order._id.toString()
    },
    details: {
      orderId: order._id,
      reason: reason || 'No reason provided',
      refundProcessed: !!order.refundId
    }
  }, req);
};

export const auditPaymentProcessed = async (paymentId, orderId, amount, status, req) => {
  await createAuditLog({
    action: status === 'success' ? 'payment.processed' : 'payment.verified',
    target: {
      type: 'payment',
      id: paymentId,
      reference: orderId?.toString()
    },
    details: {
      paymentId,
      orderId,
      amount,
      status
    }
  }, req);
};

export const auditUserAction = async (action, targetUserId, details, req) => {
  await createAuditLog({
    action: `user.${action}`,
    target: {
      type: 'user',
      id: targetUserId
    },
    details
  }, req);
};

export const auditStockUpdate = async (productId, variantId, oldStock, newStock, reason, req) => {
  await createAuditLog({
    action: 'stock.updated',
    target: {
      type: 'stock',
      id: productId,
      reference: variantId?.toString()
    },
    details: {
      productId,
      variantId,
      oldStock,
      newStock,
      reason
    },
    changes: {
      before: { stock: oldStock },
      after: { stock: newStock }
    }
  }, req);
};

