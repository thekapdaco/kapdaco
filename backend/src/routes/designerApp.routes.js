import { Router } from "express";
import { body } from "express-validator";
import { auth, isAdmin } from "../middleware/auth.js";
import { handleValidationErrors } from "../middleware/validation.js";
import { submitApplication, myApplication, approveApplication } from "../controllers/designerApp.controller.js";

const r = Router();
r.post("/apply", 
  auth,
  [
    body('name').trim().notEmpty().withMessage('Designer name is required').isLength({ max: 100 }).withMessage('Designer name must be less than 100 characters'),
    body('fullName').optional().trim().isLength({ max: 50 }).withMessage('Full name must be less than 50 characters'),
    body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name must be less than 50 characters'),
    body('email').optional().isEmail().withMessage('Invalid email format'),
    body('bio').trim().notEmpty().withMessage('Bio is required').isLength({ min: 120, max: 500 }).withMessage('Bio must be between 120 and 500 characters'),
    body('longBio').optional().trim().isLength({ max: 2000 }).withMessage('Extended bio must be less than 2000 characters'),
    body('portfolioUrl').optional().isURL().withMessage('Invalid portfolio URL'),
    body('instagram').optional().isURL().withMessage('Invalid Instagram URL'),
    body('instagramHandle').optional().matches(/^@?[a-zA-Z0-9._]+$/).withMessage('Invalid Instagram handle format'),
    body('behance').optional().isURL().withMessage('Invalid Behance URL'),
    body('dribbble').optional().isURL().withMessage('Invalid Dribbble URL'),
    body('website').optional().isURL().withMessage('Invalid website URL'),
    body('specialties').isArray({ min: 1 }).withMessage('Select at least one specialty'),
    body('specialties.*').trim().isLength({ max: 50 }).withMessage('Each specialty must be less than 50 characters'),
    body('styleTags').optional().isArray().withMessage('Style tags must be an array'),
    body('styleTags.*').optional().trim().isLength({ max: 30 }).withMessage('Each style tag must be less than 30 characters'),
    body('designStyle').trim().notEmpty().withMessage('Design style is required').isLength({ max: 500 }).withMessage('Design style must be less than 500 characters'),
    body('experience').optional().isIn(['emerging', 'established', 'collective']).withMessage('Invalid experience level'),
    body('metadata.city').optional().trim().isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    body('metadata.country').optional().trim().isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    body('metadata.phone').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid phone number format'),
    body('metadata.businessType').optional().isIn(['individual', 'business', 'collective']).withMessage('Invalid business type'),
  ],
  handleValidationErrors,
  submitApplication
);
r.get("/me", auth, myApplication);

// Admin approval
r.patch("/approve", auth, isAdmin, approveApplication);

export default r;
