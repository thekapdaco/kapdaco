/**
 * Standardized Error Response Handler
 * Ensures consistent error format across all API endpoints
 */

/**
 * Send standardized error response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code
 * @param {string} message - Error message
 * @param {Error} error - Optional error object for development details
 */
export const standardErrorResponse = (req, res, statusCode, message, error = null) => {
  const response = {
    error: {
      code: statusCode,
      message,
      requestId: req.requestId || 'unknown'
    }
  };

  // Include error details in development mode
  if (process.env.NODE_ENV === 'development' && error) {
    response.error.details = error.message;
    if (error.stack) {
      response.error.stack = error.stack;
    }
  }

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Array} errors - Array of validation errors from express-validator
 */
export const validationErrorResponse = (req, res, errors) => {
  return res.status(400).json({
    error: {
      code: 400,
      message: 'Validation failed',
      requestId: req.requestId || 'unknown',
      errors: errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        value: err.value
      }))
    }
  });
};

/**
 * Send success response with optional data
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {number} statusCode - HTTP status code (default: 200)
 * @param {string} message - Success message
 * @param {Object} data - Optional data to include
 */
export const successResponse = (req, res, statusCode, message, data = null) => {
  const response = {
    message,
    requestId: req.requestId || 'unknown'
  };

  if (data !== null) {
    response.data = data;
  }

  // Default to 200 if statusCode is not provided or is undefined/null
  const finalStatusCode = (statusCode !== undefined && statusCode !== null) ? statusCode : 200;
  return res.status(finalStatusCode).json(response);
};

