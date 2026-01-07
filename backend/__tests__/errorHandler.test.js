// __tests__/errorHandler.test.js
import { jest } from '@jest/globals';
import { standardErrorResponse, validationErrorResponse, successResponse } from '../src/utils/errorHandler.js';

describe('Error Handler Utilities', () => {
  const mockReq = {
    requestId: 'test-request-id-123'
  };

  let mockRes;

  beforeEach(() => {
    // Reset mock response for each test to ensure proper chaining
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  describe('standardErrorResponse', () => {
    it('should return standardized error format', () => {
      standardErrorResponse(mockReq, mockRes, 400, 'Test error');

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 400,
          message: 'Test error',
          requestId: 'test-request-id-123'
        }
      });
    });

    it('should include error details in development mode', () => {
      process.env.NODE_ENV = 'development';
      const testError = new Error('Test error details');
      testError.stack = 'Error stack trace';

      standardErrorResponse(mockReq, mockRes, 500, 'Internal error', testError);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 500,
          message: 'Internal error',
          requestId: 'test-request-id-123',
          details: 'Test error details',
          stack: 'Error stack trace'
        }
      });

      delete process.env.NODE_ENV;
    });

    it('should not include error details in production mode', () => {
      process.env.NODE_ENV = 'production';
      const testError = new Error('Test error details');

      standardErrorResponse(mockReq, mockRes, 500, 'Internal error', testError);

      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 500,
          message: 'Internal error',
          requestId: 'test-request-id-123'
        }
      });

      delete process.env.NODE_ENV;
    });

    it('should use "unknown" requestId if not provided', () => {
      const reqWithoutId = {};

      standardErrorResponse(reqWithoutId, mockRes, 400, 'Test error');

      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 400,
          message: 'Test error',
          requestId: 'unknown'
        }
      });
    });
  });

  describe('validationErrorResponse', () => {
    it('should return validation error format', () => {
      const mockErrors = {
        array: jest.fn().mockReturnValue([
          {
            path: 'email',
            param: 'email',
            msg: 'Invalid email format',
            value: 'invalid-email'
          },
          {
            path: 'password',
            param: 'password',
            msg: 'Password too short',
            value: '123'
          }
        ])
      };

      validationErrorResponse(mockReq, mockRes, mockErrors);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: {
          code: 400,
          message: 'Validation failed',
          requestId: 'test-request-id-123',
          errors: [
            {
              field: 'email',
              message: 'Invalid email format',
              value: 'invalid-email'
            },
            {
              field: 'password',
              message: 'Password too short',
              value: '123'
            }
          ]
        }
      });
    });
  });

  describe('successResponse', () => {
    it('should return success response with data', () => {
      const data = { id: 1, name: 'Test' };

      successResponse(mockReq, mockRes, 200, 'Success', data);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Success',
        requestId: 'test-request-id-123',
        data: { id: 1, name: 'Test' }
      });
    });

    it('should return success response without data', () => {
      successResponse(mockReq, mockRes, 201, 'Created');

      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Created',
        requestId: 'test-request-id-123'
      });
    });

    it('should default to 200 status code', () => {
      successResponse(mockReq, mockRes, undefined, 'Success');

      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });
});

