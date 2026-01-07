import { Router } from "express";
import { body } from "express-validator";
import { auth, isBrand } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { listMyProducts, createProduct, updateProduct, deleteProduct } from "../controllers/brand.controller.js";

const router = Router();

// Brand-only routes
router.use(auth, isBrand);

router.get('/products', listMyProducts);

router.post('/products',
  [
    body('title').trim().notEmpty().withMessage('Product title is required').isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('subtitle').optional().trim().isLength({ max: 100 }).withMessage('Subtitle must be less than 100 characters'),
    body('description').trim().notEmpty().withMessage('Description is required').isLength({ min: 1, max: 5000 }).withMessage('Description must be between 1 and 5000 characters'),
    body('category').notEmpty().withMessage('Category is required').trim().isLength({ min: 1, max: 50 }).withMessage('Category must be between 1 and 50 characters'),
    body('subCategory').optional().trim().isLength({ max: 100 }).withMessage('Sub-category must be less than 100 characters'),
    body('gender').optional().isIn(['unisex', 'men', 'women', 'kids']).withMessage('Invalid gender value'),
    body('brandName').optional().trim().isLength({ max: 100 }).withMessage('Brand name must be less than 100 characters'),
    body('pricing.price').isFloat({ min: 0.01, max: 1000000 }).withMessage('Price must be between 0.01 and 1,000,000'),
    body('pricing.discountPrice').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0.01 }).withMessage('Discount price must be greater than 0'),
    body('pricing.compareAtPrice').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0.01 }).withMessage('Compare at price must be greater than 0'),
    body('inventory.stockQty').optional().isInt({ min: 0, max: 100000 }).withMessage('Stock quantity must be between 0 and 100,000'),
    body('inventory.sku').optional().trim().isLength({ max: 50 }).withMessage('SKU must be less than 50 characters'),
    body('inventory.barcode').optional().matches(/^\d{8,14}$/).withMessage('Barcode must be 8-14 digits'),
    body('inventory.availabilityStatus').optional().isIn(['in_stock', 'out_of_stock', 'pre_order', 'low_stock']).withMessage('Invalid availability status'),
    body('media.mainImage').notEmpty().withMessage('Main image is required').trim().isLength({ min: 1 }).withMessage('Main image URL cannot be empty'),
    body('variants.fit').optional().isIn(['oversized', 'regular', 'slim', 'relaxed']).withMessage('Invalid fit value'),
    body('variants.pattern').optional().isIn(['solid', 'printed', 'striped', 'checkered', 'abstract', 'graphic']).withMessage('Invalid pattern value'),
    body('variants.season').optional().isIn(['all-season', 'summer', 'winter', 'spring', 'autumn']).withMessage('Invalid season value'),
    body('shipping.weight').optional().isInt({ min: 0, max: 50000 }).withMessage('Weight must be between 0 and 50,000 grams'),
    body('shipping.dimensions').optional().trim().isLength({ max: 100 }).withMessage('Dimensions must be less than 100 characters'),
    body('shipping.returnWindowDays').optional().isInt({ min: 0, max: 365 }).withMessage('Return window must be between 0 and 365 days'),
    body('shipping.returnPolicy').optional().trim().isLength({ max: 2000 }).withMessage('Return policy must be less than 2000 characters'),
    body('shipping.returnPolicySummary').optional().trim().isLength({ max: 200 }).withMessage('Return policy summary must be less than 200 characters'),
    body('seo.slug').optional().matches(/^[a-z0-9-]+$/).withMessage('Slug must contain only lowercase letters, numbers, and hyphens').isLength({ max: 100 }).withMessage('Slug must be less than 100 characters'),
    body('seo.seoTitle').optional().trim().isLength({ max: 60 }).withMessage('SEO title should be less than 60 characters'),
    body('seo.seoDescription').optional().trim().isLength({ max: 160 }).withMessage('SEO description should be less than 160 characters'),
    body('status').optional().isIn(['draft', 'pending_review', 'published']).withMessage('Invalid status'),
  ],
  handleValidationErrors,
  createProduct
);

router.patch('/products/:id',
  [
    body('title').optional().trim().isLength({ max: 200 }).withMessage('Title must be less than 200 characters'),
    body('subtitle').optional().trim().isLength({ max: 100 }).withMessage('Subtitle must be less than 100 characters'),
    body('description').optional().trim().isLength({ min: 10, max: 5000 }).withMessage('Description must be between 10 and 5000 characters'),
    body('pricing.price').optional().isFloat({ min: 0.01, max: 1000000 }).withMessage('Price must be between 0.01 and 1,000,000'),
    body('pricing.discountPrice').optional().isFloat({ min: 0.01 }).withMessage('Discount price must be greater than 0'),
    body('inventory.stockQty').optional().isInt({ min: 0, max: 100000 }).withMessage('Stock quantity must be between 0 and 100,000'),
  ],
  handleValidationErrors,
  updateProduct
);

router.delete('/products/:id', deleteProduct);

export default router;

