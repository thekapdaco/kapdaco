// controllers/newsletter.controller.js
import Newsletter from '../models/Newsletter.js';
import { sendNewsletterWelcomeEmail } from '../services/email.service.js';
import logger from '../utils/logger.js';

/**
 * Subscribe email to newsletter
 */
export const subscribe = async (req, res) => {
  try {
    const { email, preferences = {}, source = 'website' } = req.body;

    // Validate email
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide a valid email address' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if already subscribed
    let subscriber = await Newsletter.findOne({ email: normalizedEmail });

    if (subscriber) {
      if (subscriber.isActive) {
        // Already subscribed and active
        return res.status(200).json({ 
          success: true, 
          message: 'You are already subscribed to our newsletter!',
          subscribed: true
        });
      } else {
        // Previously unsubscribed, reactivate
        subscriber.isActive = true;
        subscriber.subscribedAt = new Date();
        subscriber.unsubscribedAt = undefined;
        subscriber.preferences = {
          newCollections: preferences.newCollections !== undefined ? preferences.newCollections : true,
          styleNotes: preferences.styleNotes !== undefined ? preferences.styleNotes : true,
          atelierUpdates: preferences.atelierUpdates !== undefined ? preferences.atelierUpdates : true,
          invites: preferences.invites !== undefined ? preferences.invites : false,
        };
        subscriber.source = source;
        subscriber.ipAddress = req.ip;
        subscriber.userAgent = req.get('user-agent');
        await subscriber.save();

        // Send welcome email
        await sendNewsletterWelcomeEmail({
          email: normalizedEmail,
          preferences: subscriber.preferences
        });

        return res.status(200).json({ 
          success: true, 
          message: 'Welcome back! You have been resubscribed to our newsletter.',
          subscribed: true
        });
      }
    }

    // Create new subscription
    subscriber = new Newsletter({
      email: normalizedEmail,
      preferences: {
        newCollections: preferences.newCollections !== undefined ? preferences.newCollections : true,
        styleNotes: preferences.styleNotes !== undefined ? preferences.styleNotes : true,
        atelierUpdates: preferences.atelierUpdates !== undefined ? preferences.atelierUpdates : true,
        invites: preferences.invites !== undefined ? preferences.invites : false,
      },
      source,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
      userId: req.user?._id, // If user is logged in, link to their account
    });

    await subscriber.save();

    // Send welcome email
    await sendNewsletterWelcomeEmail({
      email: normalizedEmail,
      preferences: subscriber.preferences
    });

    logger.info('Newsletter subscription created', { email: normalizedEmail });

    return res.status(201).json({ 
      success: true, 
      message: 'Successfully subscribed to The Kapda Society newsletter!',
      subscribed: true
    });
  } catch (error) {
    logger.error('Newsletter subscription error', { 
      error: error.message, 
      stack: error.stack 
    });

    // Handle duplicate key error (unique email constraint)
    if (error.code === 11000 || error.name === 'MongoServerError') {
      return res.status(200).json({ 
        success: true, 
        message: 'You are already subscribed to our newsletter!',
        subscribed: true
      });
    }

    return res.status(500).json({ 
      success: false, 
      message: 'Failed to subscribe to newsletter. Please try again later.' 
    });
  }
};

/**
 * Unsubscribe email from newsletter
 */
export const unsubscribe = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscriber = await Newsletter.findOne({ email: normalizedEmail });

    if (!subscriber) {
      return res.status(404).json({ 
        success: false, 
        message: 'Email not found in our newsletter list' 
      });
    }

    if (!subscriber.isActive) {
      return res.status(200).json({ 
        success: true, 
        message: 'You are already unsubscribed from our newsletter' 
      });
    }

    subscriber.isActive = false;
    subscriber.unsubscribedAt = new Date();
    await subscriber.save();

    logger.info('Newsletter unsubscription', { email: normalizedEmail });

    return res.status(200).json({ 
      success: true, 
      message: 'Successfully unsubscribed from newsletter' 
    });
  } catch (error) {
    logger.error('Newsletter unsubscription error', { 
      error: error.message 
    });

    return res.status(500).json({ 
      success: false, 
      message: 'Failed to unsubscribe. Please try again later.' 
    });
  }
};

/**
 * Get subscription status (for checking if email is subscribed)
 */
export const getSubscriptionStatus = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email address is required' 
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const subscriber = await Newsletter.findOne({ email: normalizedEmail });

    if (!subscriber) {
      return res.status(200).json({ 
        subscribed: false,
        message: 'Email not found in newsletter list' 
      });
    }

    return res.status(200).json({ 
      subscribed: subscriber.isActive,
      preferences: subscriber.preferences,
      subscribedAt: subscriber.subscribedAt
    });
  } catch (error) {
    logger.error('Get subscription status error', { 
      error: error.message 
    });

    return res.status(500).json({ 
      success: false, 
      message: 'Failed to check subscription status' 
    });
  }
};

