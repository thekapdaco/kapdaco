// Payment routes
import { Router } from 'express';
import { 
  createPaymentOrder, 
  verifyPayment, 
  handleWebhook,
  getPaymentStatus 
} from '../controllers/payment.controller.js';
import { auth } from '../middleware/auth.js';

const router = Router();

// Webhook endpoint (no auth - Razorpay calls this directly)
router.post('/webhook', handleWebhook);

// All other routes require authentication
router.use(auth);

// Create Razorpay order
router.post('/create-order', createPaymentOrder);

// Verify payment signature
router.post('/verify', verifyPayment);

// Get payment status for an order
router.get('/status/:orderId', getPaymentStatus);

export default router;
