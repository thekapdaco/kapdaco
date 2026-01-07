// routes/review.routes.js
import { Router } from 'express';
import { body, param, query } from 'express-validator';
import {
  getProductReviews,
  getMyReview,
  createReview,
  updateReview,
  deleteReview,
  flagReview,
  unflagReview
} from '../controllers/review.controller.js';
import { auth } from '../middleware/auth.js';
import { isAdmin } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';

const router = Router();

// Public routes - Get reviews for a product
router.get(
  '/product/:productId',
  [
    param('productId').isMongoId().withMessage('Invalid product ID'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('Limit must be between 1 and 50'),
    query('sort').optional().isIn(['newest', 'oldest', 'rating-high', 'rating-low']).withMessage('Invalid sort option'),
    query('includeFlagged').optional().isBoolean().withMessage('includeFlagged must be a boolean')
  ],
  handleValidationErrors,
  getProductReviews
);

// Authenticated routes - Get user's own review for a product
router.get(
  '/product/:productId/my-review',
  auth,
  [
    param('productId').isMongoId().withMessage('Invalid product ID')
  ],
  handleValidationErrors,
  getMyReview
);

// Authenticated routes - Create review
router.post(
  '/',
  auth,
  [
    body('productId').isMongoId().withMessage('Invalid product ID'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
  ],
  handleValidationErrors,
  createReview
);

// Authenticated routes - Update review
router.patch(
  '/:reviewId',
  auth,
  [
    param('reviewId').isMongoId().withMessage('Invalid review ID'),
    body('rating').optional().isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('comment').optional().trim().isLength({ max: 1000 }).withMessage('Comment must be less than 1000 characters')
  ],
  handleValidationErrors,
  updateReview
);

// Authenticated routes - Delete review
router.delete(
  '/:reviewId',
  auth,
  [
    param('reviewId').isMongoId().withMessage('Invalid review ID')
  ],
  handleValidationErrors,
  deleteReview
);

// Authenticated routes - Flag review (any user can flag)
router.post(
  '/:reviewId/flag',
  auth,
  [
    param('reviewId').isMongoId().withMessage('Invalid review ID')
  ],
  handleValidationErrors,
  flagReview
);

// Admin routes - Unflag review
router.post(
  '/:reviewId/unflag',
  auth,
  isAdmin,
  [
    param('reviewId').isMongoId().withMessage('Invalid review ID')
  ],
  handleValidationErrors,
  unflagReview
);

export default router;

