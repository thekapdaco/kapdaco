// routes/auth.js - Authentication endpoints
import { Router } from 'express';
import { body, param } from 'express-validator';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';
import { handleValidationErrors } from '../middleware/validation.js';
import { authLimiter, signupLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = Router();

// Register new user
router.post('/signup', 
  signupLimiter,
  [
    body('name')
      .trim()
      .escape()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role')
      .optional()
      .isIn(['customer', 'designer', 'seller', 'brand', 'admin'])
      .withMessage('Invalid role'),
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('dateOfBirth').optional().isISO8601().withMessage('Invalid date of birth format'),
    body('city').optional().trim().isLength({ max: 100 }).withMessage('City must be less than 100 characters'),
    body('country').optional().trim().isLength({ max: 100 }).withMessage('Country must be less than 100 characters'),
    // Brand signup validation
    body('businessInfo.businessName').optional().trim().isLength({ max: 100 }).withMessage('Business name must be less than 100 characters'),
    body('businessInfo.brandName').optional().trim().isLength({ max: 100 }).withMessage('Brand name must be less than 100 characters'),
    body('businessInfo.brandTagline').optional().trim().isLength({ max: 150 }).withMessage('Brand tagline must be less than 150 characters'),
    body('businessInfo.businessDescription').optional().trim().isLength({ min: 50, max: 1000 }).withMessage('Business description must be between 50 and 1000 characters'),
    body('businessInfo.aboutBrand').optional().trim().isLength({ max: 2000 }).withMessage('About brand must be less than 2000 characters'),
    body('businessInfo.originCountry').optional().trim().isLength({ max: 100 }).withMessage('Origin country must be less than 100 characters'),
    body('businessInfo.originCity').optional().trim().isLength({ max: 100 }).withMessage('Origin city must be less than 100 characters'),
    body('businessInfo.supportEmail').optional().isEmail().withMessage('Invalid support email format'),
    body('businessInfo.supportPhone').optional().matches(/^\+?[1-9]\d{1,14}$/).withMessage('Invalid support phone format'),
    body('businessInfo.socialLinks.instagram').optional().isURL().withMessage('Invalid Instagram URL'),
    body('businessInfo.socialLinks.facebook').optional().isURL().withMessage('Invalid Facebook URL'),
    body('businessInfo.socialLinks.twitter').optional().isURL().withMessage('Invalid Twitter URL'),
    body('businessInfo.socialLinks.website').optional().isURL().withMessage('Invalid website URL'),
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { name, email, password, role = 'customer', phone, accountType, businessInfo } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists with this email' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const base = {
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: ['customer', 'designer', 'seller', 'brand', 'admin'].includes(role) ? role : 'customer',
      phone
    };

    if (role === 'seller' || role === 'brand') {
      base.sellerProfile = {
        accountType: accountType || 'individual',
        businessName: businessInfo?.businessName,
        businessDescription: businessInfo?.businessDescription,
        businessCategory: businessInfo?.businessCategory,
        businessRegNumber: businessInfo?.businessRegNumber,
        taxId: businessInfo?.taxId,
        yearsInBusiness: businessInfo?.yearsInBusiness,
        businessAddress: businessInfo?.businessAddress,
        billingAddress: businessInfo?.billingAddress,
        bankAccountNumber: businessInfo?.bankAccountNumber,
        routingNumber: businessInfo?.routingNumber,
        paymentProcessor: businessInfo?.paymentProcessor,
        currency: businessInfo?.currency,
        returnPolicy: businessInfo?.returnPolicy,
        shippingPolicy: businessInfo?.shippingPolicy,
        storeLogo: businessInfo?.storeLogo,
        storeBanner: businessInfo?.storeBanner
      };
    }

    const user = await User.create(base);

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie for security (prevents XSS attacks)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    };
    res.cookie('token', token, cookieOptions);

    // Return user data without password (don't send token in response body)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      createdAt: user.createdAt
    };

    res.status(201).json({
      message: 'User registered successfully',
      user: userData
    });

    // Send welcome email (fire and forget)
    try {
      const { sendWelcomeEmail } = await import('../services/email.service.js');
      sendWelcomeEmail(user).catch(err => {
        console.error('Failed to send welcome email:', err.message);
      });
    } catch (emailError) {
      // Don't fail registration if email fails
      console.error('Error sending welcome email:', emailError.message);
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login',
  authLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
    body('password')
      .notEmpty()
      .withMessage('Password is required'),
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
      console.error('JWT_SECRET is not configured');
      return res.status(500).json({ message: 'Server configuration error' });
    }

    // Check MongoDB connection - wait if connecting, fail if disconnected
    const dbState = mongoose.connection.readyState;
    if (dbState === 1) {
      // Connected - proceed
    } else if (dbState === 2) {
      // Connecting - wait up to 5 seconds for connection
      let waited = 0;
      const maxWait = 5000; // 5 seconds
      const checkInterval = 100; // Check every 100ms
      
      while (mongoose.connection.readyState === 2 && waited < maxWait) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        waited += checkInterval;
      }
      
      // Check again after waiting
      if (mongoose.connection.readyState !== 1) {
        console.error('MongoDB still connecting after wait. State:', mongoose.connection.readyState);
        return res.status(503).json({ 
          message: 'Database connection is still establishing. Please try again in a moment.',
          error: 'DATABASE_CONNECTING'
        });
      }
    } else {
      // Disconnected (0) or disconnecting (3) - return error
      console.error('MongoDB not connected. Connection state:', dbState);
      return res.status(503).json({ 
        message: 'Database connection unavailable. Please try again in a moment.',
        error: 'DATABASE_NOT_CONNECTED'
      });
    }

    // Find user by email (password is included by default in User model)
    const user = await User.findOne({ 
      email: email.toLowerCase().trim(),
      isActive: true 
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Validate password exists
    if (!user.password) {
      console.error('User found but password field is missing');
      return res.status(500).json({ message: 'Server error: user data incomplete' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set HTTP-only cookie for security (prevents XSS attacks)
    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    };
    res.cookie('token', token, cookieOptions);

    // Return user data without password (don't send token in response body)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      bio: user.bio,
      designerName: user.designerName,
      isActive: user.isActive,
      createdAt: user.createdAt
    };

    res.json({
      message: 'Login successful',
      user: userData
    });
  } catch (error) {
    console.error('Login error:', error);
    // Provide more detailed error in development
    const errorMessage = process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Server error during login';
    res.status(500).json({ message: errorMessage });
  }
});

// Get current user (verify token)
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select('-password');

    if (!user || !user.isActive) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Return user data in consistent format
    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      username: user.username,
      isActive: user.isActive,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.patch('/profile', 
  auth,
  [
    body('name')
      .optional()
      .trim()
      .escape()
      .isLength({ min: 2, max: 50 })
      .withMessage('Name must be between 2 and 50 characters'),
    body('bio')
      .optional()
      .trim()
      .escape()
      .isLength({ max: 500 })
      .withMessage('Bio must be less than 500 characters'),
    body('phone')
      .optional()
      .trim()
      .matches(/^\+?[1-9]\d{1,14}$/)
      .withMessage('Please provide a valid phone number'),
    body('city')
      .optional()
      .trim()
      .escape()
      .isLength({ max: 100 })
      .withMessage('City must be less than 100 characters'),
    body('country')
      .optional()
      .trim()
      .escape()
      .isLength({ max: 100 })
      .withMessage('Country must be less than 100 characters'),
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const allowedUpdates = ['name', 'bio', 'phone', 'city', 'country'];
    const updates = {};

    // Filter allowed updates
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

// Change password
router.patch('/change-password',
  auth,
  passwordResetLimiter,
  [
    body('currentPassword')
      .notEmpty()
      .withMessage('Current password is required'),
    body('newPassword')
      .isLength({ min: 8 })
      .withMessage('New password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  handleValidationErrors,
  async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.findByIdAndUpdate(req.user.id, {
      password: hashedPassword
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
});

// Logout - Clear server-side session state (cart, wishlist, etc.)
router.post('/logout', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Clear user's cart on logout (production-grade behavior)
    // Note: In a production system, you might want to preserve cart for guest checkout
    // For now, we clear it to ensure data consistency
    try {
      const Cart = (await import('../models/Cart.js')).default;
      await Cart.findOneAndUpdate(
        { userId },
        { items: [], updatedAt: new Date() },
        { upsert: false } // Don't create cart if it doesn't exist
      );
    } catch (cartError) {
      // Log but don't fail logout if cart clear fails
      const logger = (await import('../utils/logger.js')).default;
      logger.error('Error clearing cart on logout', { error: cartError.message, userId });
    }

    // Clear HTTP-only cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    
    res.json({ 
      message: 'Logged out successfully'
    });
  } catch (error) {
    const logger = (await import('../utils/logger.js')).default;
    logger.error('Logout error', { error: error.message, userId: req.user?.id });
    // Even if there's an error, allow logout to proceed and clear cookie
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      path: '/'
    });
    res.json({ message: 'Logged out successfully' });
  }
});

// Forgot password - Request password reset
router.post('/forgot-password',
  passwordResetLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Please provide a valid email address'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;

      const user = await User.findOne({ email: email.toLowerCase() });
      
      // Always return success to prevent email enumeration
      if (!user) {
        return res.json({ 
          message: 'If an account exists with this email, a password reset link has been sent.' 
        });
      }

      // Generate reset token
      const crypto = await import('crypto');
      const resetToken = crypto.default.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Save reset token to user
      user.resetToken = resetToken;
      user.resetTokenExpiry = resetTokenExpiry;
      await user.save();

      // Send password reset email (fire and forget)
      try {
        const { sendPasswordReset } = await import('../services/email.service.js');
        sendPasswordReset(user, resetToken).catch(err => {
          console.error('Failed to send password reset email:', err.message);
        });
      } catch (emailError) {
        console.error('Error sending password reset email:', emailError.message);
      }

      res.json({ 
        message: 'If an account exists with this email, a password reset link has been sent.' 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: 'Server error during password reset request' });
    }
  }
);

// Reset password - Reset password with token
router.post('/reset-password',
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token, password } = req.body;

      // Find user with valid reset token
      const user = await User.findOne({
        resetToken: token,
        resetTokenExpiry: { $gt: new Date() } // Token not expired
      });

      if (!user) {
        return res.status(400).json({ 
          message: 'Invalid or expired reset token. Please request a new password reset.' 
        });
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Update password and clear reset token
      user.password = hashedPassword;
      user.resetToken = null;
      user.resetTokenExpiry = null;
      await user.save();

      res.json({ message: 'Password has been reset successfully. You can now log in with your new password.' });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: 'Failed to reset password' });
    }
  }
);

export default router;