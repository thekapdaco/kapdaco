// Razorpay payment utility for frontend
/**
 * Open Razorpay checkout
 * @param {Object} options - Razorpay checkout options
 * @param {string} options.key - Razorpay key ID
 * @param {number} options.amount - Amount in paise (smallest currency unit)
 * @param {string} options.currency - Currency code (default: INR)
 * @param {string} options.order_id - Razorpay order ID
 * @param {string} options.name - Business name
 * @param {string} options.description - Order description
 * @param {Object} options.prefill - Prefill customer details
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 */
export const openRazorpayCheckout = async (options) => {
  // Load Razorpay script dynamically
  return new Promise((resolve, reject) => {
    // Check if Razorpay script is already loaded
    if (window.Razorpay) {
      createCheckout(options, resolve, reject);
      return;
    }

    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    
    script.onload = () => {
      createCheckout(options, resolve, reject);
    };
    
    script.onerror = () => {
      reject(new Error('Failed to load Razorpay checkout script'));
    };
    
    document.body.appendChild(script);
  });
};

/**
 * Create and open Razorpay checkout
 */
const createCheckout = (options, resolve, reject) => {
  try {
    const {
      key,
      amount,
      currency = 'INR',
      order_id,
      name = 'The Kapda Co.',
      description = 'Premium Customizable Fashion',
      prefill = {},
      onSuccess,
      onError,
    } = options;

    const razorpayOptions = {
      key: key,
      amount: amount,
      currency: currency,
      name: name,
      description: description,
      order_id: order_id,
      prefill: {
        email: prefill.email || '',
        contact: prefill.contact || '',
        name: prefill.name || '',
      },
      theme: {
        color: '#1a237e', // Kapda Co. navy blue
      },
      handler: function (response) {
        // Payment successful
        if (onSuccess) {
          onSuccess({
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_signature: response.razorpay_signature,
          });
        }
        resolve(response);
      },
      modal: {
        ondismiss: function () {
          // User closed the checkout without completing payment
          if (onError) {
            onError(new Error('Payment cancelled by user'));
          }
          reject(new Error('Payment cancelled'));
        },
      },
      config: {
        display: {
          blocks: {
            banks: {
              name: 'All payment methods',
              instruments: [
                {
                  method: 'card',
                },
                {
                  method: 'netbanking',
                },
                {
                  method: 'wallet',
                },
                {
                  method: 'upi',
                },
              ],
            },
          },
          sequence: ['block.banks'],
          preferences: {
            show_default_blocks: true,
          },
        },
      },
      // Note: International card restrictions are controlled in Razorpay dashboard settings
      // If you see "International cards are not supported" error, check your Razorpay dashboard:
      // Settings > Configurations > Payment Methods > Enable international cards
      // For test mode, use Indian test card: 5104 0600 0000 0008 (Mastercard)
    };

    const razorpay = new window.Razorpay(razorpayOptions);
    
    razorpay.on('payment.failed', function (response) {
      const errorMessage = response.error?.description || response.error?.reason || 'Payment failed';
      if (onError) {
        onError(new Error(errorMessage));
      }
      reject(new Error(errorMessage));
    });

    razorpay.open();
  } catch (error) {
    console.error('Razorpay checkout error:', error);
    if (onError) {
      onError(error);
    }
    reject(error);
  }
};

export default openRazorpayCheckout;
