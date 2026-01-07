// routes/address.routes.js
import { Router } from 'express';
import { body } from 'express-validator';
import { auth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from '../controllers/address.controller.js';

const router = Router();

// All routes require authentication
router.use(auth);

// Get all addresses
router.get('/', getAddresses);

// Add new address
router.post(
  '/',
  [
    body('street').trim().notEmpty().withMessage('Street address is required').isLength({ max: 200 }).withMessage('Street address must be less than 200 characters'),
    body('city').trim().notEmpty().withMessage('City is required').isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    body('postalCode').trim().notEmpty().withMessage('Postal code is required').matches(/^\d{5,10}$/).withMessage('Postal code must be 5-10 digits'),
    body('country').trim().notEmpty().withMessage('Country is required').isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    body('phone').trim().notEmpty().withMessage('Phone number is required').matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    body('label').optional().trim().isLength({ max: 50 }).withMessage('Label must be less than 50 characters'),
    body('state').optional().trim().isLength({ max: 100 }).withMessage('State must be less than 100 characters'),
    body('fullName').optional().trim().isLength({ max: 100 }).withMessage('Full name must be less than 100 characters'),
    body('addressLine2').optional().trim().isLength({ max: 200 }).withMessage('Address line 2 must be less than 200 characters'),
    body('landmark').optional().trim().isLength({ max: 100 }).withMessage('Landmark must be less than 100 characters'),
    body('addressType').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
    body('isDefault').optional().isBoolean(),
  ],
  handleValidationErrors,
  addAddress
);

// Update address
router.patch(
  '/:id',
  [
    body('street').optional().trim().notEmpty().isLength({ max: 200 }).withMessage('Street address must be less than 200 characters'),
    body('city').optional().trim().notEmpty().isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    body('postalCode').optional().trim().notEmpty().matches(/^\d{5,10}$/).withMessage('Postal code must be 5-10 digits'),
    body('country').optional().trim().notEmpty().isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    body('phone').optional().trim().notEmpty().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    body('label').optional().trim().isLength({ max: 50 }).withMessage('Label must be less than 50 characters'),
    body('state').optional().trim().isLength({ max: 100 }).withMessage('State must be less than 100 characters'),
    body('fullName').optional().trim().isLength({ max: 100 }).withMessage('Full name must be less than 100 characters'),
    body('addressLine2').optional().trim().isLength({ max: 200 }).withMessage('Address line 2 must be less than 200 characters'),
    body('landmark').optional().trim().isLength({ max: 100 }).withMessage('Landmark must be less than 100 characters'),
    body('addressType').optional().isIn(['home', 'work', 'other']).withMessage('Invalid address type'),
    body('isDefault').optional().isBoolean(),
  ],
  handleValidationErrors,
  updateAddress
);

// Delete address
router.delete('/:id', deleteAddress);

// Set default address
router.patch('/:id/default', setDefaultAddress);

export default router;

