// routes/order.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { createOrder, getMyOrders, getOrder, updateOrderStatus, cancelOrder, downloadInvoice, reorder } from '../controllers/order.controller.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Create order (after payment)
router.post('/', 
  [
    body('items').isArray({ min: 1 }).withMessage('Order must contain at least one item'),
    body('items.*.productId').isMongoId().withMessage('Invalid product ID'),
    body('items.*.quantity').isInt({ min: 1, max: 100 }).withMessage('Quantity must be between 1 and 100'),
    body('shippingAddress.street').trim().notEmpty().withMessage('Street address is required').isLength({ max: 200 }).withMessage('Street address must be less than 200 characters'),
    body('shippingAddress.city').trim().notEmpty().withMessage('City is required').isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    body('shippingAddress.postalCode').trim().notEmpty().withMessage('Postal code is required').matches(/^\d{5,10}$/).withMessage('Postal code must be 5-10 digits'),
    body('shippingAddress.country').trim().notEmpty().withMessage('Country is required').isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    body('shippingAddress.phone').trim().notEmpty().withMessage('Phone number is required').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    body('shippingAddress.fullName').optional().trim().isLength({ max: 100 }).withMessage('Full name must be less than 100 characters'),
    body('shippingAddress.addressLine2').optional().trim().isLength({ max: 200 }).withMessage('Address line 2 must be less than 200 characters'),
    body('shippingAddress.landmark').optional().trim().isLength({ max: 100 }).withMessage('Landmark must be less than 100 characters'),
    body('shippingAddress.state').optional().trim().isLength({ max: 100 }).withMessage('State must be less than 100 characters'),
    body('billingAddress.street').optional().trim().isLength({ max: 200 }).withMessage('Street address must be less than 200 characters'),
    body('billingAddress.city').optional().trim().isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    body('billingAddress.postalCode').optional().matches(/^\d{5,10}$/).withMessage('Postal code must be 5-10 digits'),
    body('deliveryOption').optional().isIn(['standard', 'express', 'overnight', 'atelier']).withMessage('Invalid delivery option'),
    body('giftMessage').optional().trim().isLength({ max: 500 }).withMessage('Gift message must be less than 500 characters'),
    body('orderNotes').optional().trim().isLength({ max: 1000 }).withMessage('Order notes must be less than 1000 characters'),
    body('gstNumber').optional().matches(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/).withMessage('Invalid GST number format'),
    body('paymentMethod').optional().isIn(['card', 'cod', 'bank_transfer', 'upi']).withMessage('Invalid payment method'),
    body('total').isFloat({ min: 0.01 }).withMessage('Total must be greater than 0'),
  ],
  handleValidationErrors,
  createOrder
);

// Get user's orders
router.get('/', getMyOrders);

// Download invoice (must come before /:id route)
router.get('/:id/invoice', downloadInvoice);

// Get single order
router.get('/:id', getOrder);

// Update order status (for admin/designer)
router.patch('/:id/status', updateOrderStatus);

// Cancel order (customer can cancel if not shipped)
router.post('/:id/cancel', cancelOrder);

// Re-order - Get items from a previous order to add to cart
router.post('/:id/reorder', reorder);

export default router;

