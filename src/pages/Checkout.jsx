import React, { useMemo, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { trackBeginCheckout, trackPurchase } from '../lib/analytics';
import { openRazorpayCheckout } from '../lib/razorpay';
import { KCButton, KCInput, KCCard, LoadingSpinner } from '../components/ui';
import { Lock, CreditCard, Truck, CheckCircle2, AlertCircle } from 'lucide-react';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';

const steps = ['Address', 'Delivery', 'Payment'];

const initialForm = {
  name: '',
  email: '',
  phone: '',
  address: '',
  addressLine2: '',
  landmark: '',
  city: '',
  state: '',
  postalCode: '',
  country: '',
  deliveryMethod: 'express',
  deliveryOption: 'standard',
  paymentMethod: 'card',
  cardNumber: '',
  expiry: '',
  cvv: '',
  giftMessage: '',
  orderNotes: '',
  gstNumber: '',
  sameAsShipping: true,
};

const deliveryOptions = [
  { id: 'standard', title: 'Standard', desc: '3-5 business days', price: 0 },
  { id: 'express', title: 'Express', desc: '1-2 business days', price: 249 },
  { id: 'atelier', title: 'Atelier Pick-up', desc: 'Collect from Mumbai atelier', price: 0 },
];

const Checkout = () => {
  const { cart, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const items = cart?.items || [];
  const totals = cart?.totals || { subtotal: 0, shipping: 0, tax: 0, total: 0 };

  const [form, setForm] = useState(initialForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const selectedDelivery = deliveryOptions.find((opt) => opt.id === (form.deliveryOption || form.deliveryMethod)) || deliveryOptions[0];
  const savings = cart?.totals?.cartDiscount || 0;
  const tax = totals.tax || 0;
  const baseDiscounted = Math.max(0, totals.subtotal - savings);
  const finalTotal = Math.max(0, baseDiscounted + tax + selectedDelivery.price);

  const summaryLines = useMemo(() => ([
    { label: 'Subtotal', value: totals.subtotal },
    { label: 'Savings', value: -savings },
    { label: 'Shipping', value: selectedDelivery.price },
    { label: 'Tax', value: tax },
  ]), [totals, selectedDelivery.price, savings, tax]);

  const handleInput = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address._id);
    setForm((prev) => ({
      ...prev,
      name: prev.name || '', // Keep existing name if entered
      email: prev.email || '', // Keep existing email if entered
      phone: address.phone,
      address: address.street,
      addressLine2: address.addressLine2 || '',
      landmark: address.landmark || '',
      city: address.city,
      state: address.state || '',
      postalCode: address.postalCode,
      country: address.country,
    }));
  };

  const handleUseNewAddress = () => {
    setSelectedAddressId(null);
    setForm((prev) => ({
      ...prev,
      phone: '',
      address: '',
      city: '',
      state: '',
      postalCode: '',
      country: 'India',
    }));
  };

  // Load saved addresses
  useEffect(() => {
    if (isAuthenticated) {
      const loadAddresses = async () => {
        try {
          const response = await api('/api/addresses');
          setSavedAddresses(response.addresses || []);
          // Auto-select default address if available
          const defaultAddr = response.addresses?.find(addr => addr.isDefault);
          if (defaultAddr) {
            handleSelectAddress(defaultAddr);
          }
        } catch (err) {
          // Silently fail - user can still enter address manually
          console.warn('Failed to load saved addresses:', err);
        }
      };
      loadAddresses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]); // handleSelectAddress is stable, safe to omit from deps

  // Track checkout start when component mounts
  useEffect(() => {
    if (items.length > 0 && finalTotal > 0) {
      trackBeginCheckout(items, finalTotal);
    }
  }, [items.length, finalTotal]); // Track dependencies properly

  const nextStep = () => setStepIndex((prev) => Math.min(steps.length - 1, prev + 1));
  const prevStep = () => setStepIndex((prev) => Math.max(0, prev - 1));

  const validateAddressForm = () => {
    const errors = {};
    if (!form.name.trim()) errors.name = 'Full name is required';
    if (form.name.length > 100) errors.name = 'Name must be less than 100 characters';
    if (!form.email.trim()) errors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Invalid email format';
    if (!form.phone.trim()) errors.phone = 'Phone number is required';
    if (!/^\+?[1-9]\d{1,14}$/.test(form.phone)) errors.phone = 'Invalid phone number format';
    if (!form.address.trim()) errors.address = 'Street address is required';
    if (form.address.length > 200) errors.address = 'Street address must be less than 200 characters';
    if (form.addressLine2 && form.addressLine2.length > 200) 
      errors.addressLine2 = 'Address line 2 must be less than 200 characters';
    if (form.landmark && form.landmark.length > 100) 
      errors.landmark = 'Landmark must be less than 100 characters';
    if (!form.city.trim()) errors.city = 'City is required';
    if (form.city.length > 100) errors.city = 'City must be less than 100 characters';
    if (form.state && form.state.length > 100) errors.state = 'State must be less than 100 characters';
    if (!form.postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (!/^\d{5,10}$/.test(form.postalCode)) errors.postalCode = 'Postal code must be 5-10 digits';
    if (!form.country.trim()) errors.country = 'Country is required';
    if (form.country.length > 100) errors.country = 'Country must be less than 100 characters';
    if (form.giftMessage && form.giftMessage.length > 500) 
      errors.giftMessage = 'Gift message must be less than 500 characters';
    if (form.orderNotes && form.orderNotes.length > 1000) 
      errors.orderNotes = 'Order notes must be less than 1000 characters';
    if (form.gstNumber && !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(form.gstNumber))
      errors.gstNumber = 'Invalid GST number format (e.g., 29ABCDE1234F1Z5)';
    return errors;
  };

  const handleOrder = async () => {
    // Validate form
    const errors = validateAddressForm();
    if (Object.keys(errors).length > 0) {
      setError(Object.values(errors)[0]);
      setStepIndex(0); // Go back to address step
      return;
    }

    if (items.length === 0) {
      setError('Your cart is empty');
      return;
    }

    if (!isAuthenticated) {
      setError('Please log in to place an order');
      navigate('/login');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Build order items payload from cart
      const orderItems = items
        .map(item => {
          let productId = item.productId;
          let isCustomProduct = false;
          let originalProductId = productId;
          
          // Handle custom products: extract base productId from "custom-{productId}" format
          if (typeof productId === 'string' && productId.startsWith('custom-')) {
            productId = productId.replace('custom-', '');
            isCustomProduct = true;
            originalProductId = productId; // Store the original customize product ID
          }
          
          // Check if it's a valid MongoDB ObjectId
          const isMongoId = typeof productId === 'string' && /^[a-fA-F0-9]{24}$/.test(productId);
          
          // Custom products from customize page use numeric IDs (1, 2, etc.) which are not MongoDB ObjectIds
          // We need to find a base product in the database or use a placeholder
          // For now, we'll try to find a product by name/title, or use a generic custom product ID
          if (isCustomProduct && !isMongoId) {
            console.warn('Custom product without valid MongoDB productId:', {
              originalProductId: item.productId,
              extractedId: productId,
              item: item,
              title: item.title || item.name
            });
            
            // Try to find a matching product by title/name in the database
            // For now, we'll need to search for a product that matches the customize product
            // This is a temporary solution - ideally we should map customize IDs to database IDs
            // OR create a special "Custom Product" in the database
            
            // For immediate fix: We'll need backend support or a mapping
            // Let's include it with the customize product ID and let backend handle it
            // But since productId is required, we'll need to skip for now and show error
            throw new Error(
              `Custom product "${item.title || item.name}" cannot be ordered directly. ` +
              `Please contact support or add a regular product to your cart.`
            );
          }
          
          // Regular products with valid MongoDB ObjectIds
          if (!isMongoId) {
            console.warn('Skipping item with invalid productId:', { 
              productId: item.productId, 
              extractedId: productId,
              item: item 
            });
            return null;
          }
          
          return {
            productId: productId,
            quantity: item.quantity || 1,
            size: item.size,
            color: item.color,
            variantId: item.variantId,
            price: item.price || 0,
            customDesign: isCustomProduct || item.customization ? true : item.customDesign,
            customDesignData: item.customization || item.customDesignData || (isCustomProduct ? {
              previews: item.previews,
              customization: item.customization
            } : undefined)
          };
        })
        .filter(item => item !== null);

      if (orderItems.length === 0) {
        console.error('No valid order items after processing:', { 
          itemsCount: items.length, 
          items: items.map(i => ({ 
            productId: i.productId, 
            title: i.title || i.name,
            price: i.price 
          }))
        });
        throw new Error('No valid products in cart. Please add products before checkout.');
      }

      // Validate finalTotal is greater than 0
      if (finalTotal <= 0) {
        console.error('Invalid total amount:', { 
          finalTotal, 
          subtotal: totals.subtotal, 
          savings, 
          tax, 
          delivery: selectedDelivery.price 
        });
        throw new Error('Invalid order total. Please check your cart items.');
      }

      // Build order payload for later use
      const orderPayload = {
        items: orderItems,
        shippingAddress: {
          fullName: form.name,
          street: form.address,
          addressLine2: form.addressLine2 || '',
          landmark: form.landmark || '',
          city: form.city,
          state: form.state || '',
          postalCode: form.postalCode,
          country: form.country,
          phone: form.phone
        },
        billingAddress: form.sameAsShipping ? undefined : {
          fullName: form.name,
          street: form.address,
          addressLine2: form.addressLine2 || '',
          landmark: form.landmark || '',
          city: form.city,
          state: form.state || '',
          postalCode: form.postalCode,
          country: form.country,
          phone: form.phone
        },
        sameAsShipping: form.sameAsShipping,
        deliveryOption: form.deliveryOption || 'standard',
        paymentMethod: form.paymentMethod || 'card',
        giftMessage: form.giftMessage || undefined,
        orderNotes: form.orderNotes || undefined,
        gstNumber: form.gstNumber || undefined,
        total: finalTotal
      };

      // If payment method is COD or bank transfer, create order directly
      if (form.paymentMethod === 'cod' || form.paymentMethod === 'bank_transfer') {
        const response = await api('/api/orders', {
          method: 'POST',
          body: {
            ...orderPayload,
            paymentStatus: 'pending',
          }
        });

        const createdOrderId = response.order?._id || response.order?.id;
        setOrderId(createdOrderId);
        setSubmitted(true);
        
        trackPurchase(createdOrderId, orderItems, finalTotal, selectedDelivery.price, tax);
        await clearCart();
        setLoading(false);
        return;
      }

      // For card/UPI payments, create Razorpay order first
      // Convert finalTotal to paise (Razorpay expects amount in smallest currency unit)
      const amountInPaise = Math.round(finalTotal * 100);
      
      if (amountInPaise <= 0) {
        throw new Error('Invalid order amount. Please check your cart items.');
      }

      console.log('Creating Razorpay order:', { 
        finalTotal, 
        amountInPaise, 
        orderItemsCount: orderItems.length,
        items: orderItems.map(i => ({ productId: i.productId, price: i.price, quantity: i.quantity }))
      });

      const paymentOrderResponse = await api('/api/payments/create-order', {
        method: 'POST',
        body: {
          amount: finalTotal,
          currency: 'INR',
          receipt: `order_${Date.now()}`,
        }
      });

      if (!paymentOrderResponse.order) {
        throw new Error('Failed to initialize payment. Please try again.');
      }

      const razorpayOrder = paymentOrderResponse.order;

      // Open Razorpay checkout
      await openRazorpayCheckout({
        key: razorpayOrder.key,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: razorpayOrder.name,
        description: razorpayOrder.description,
        order_id: razorpayOrder.id,
        prefill: {
          email: form.email,
          contact: form.phone,
          name: form.name,
        },
        onSuccess: async (paymentResponse) => {
          try {
            setLoading(true);
            
            // Verify payment
            const verifyResponse = await api('/api/payments/verify', {
              method: 'POST',
              body: {
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature,
              }
            });

            if (!verifyResponse.paymentId) {
              throw new Error('Payment verification failed');
            }

            // Create order with payment ID
            const orderResponse = await api('/api/orders', {
              method: 'POST',
              body: {
                ...orderPayload,
                paymentId: verifyResponse.paymentId,
                paymentStatus: 'paid',
              }
            });

            const createdOrderId = orderResponse.order?._id || orderResponse.order?.id;
            setOrderId(createdOrderId);
            setSubmitted(true);
            
            trackPurchase(createdOrderId, orderItems, finalTotal, selectedDelivery.price, tax);
            await clearCart();
            setLoading(false);
          } catch (err) {
            console.error('Order creation after payment failed:', err);
            setError(err.message || 'Payment successful but order creation failed. Please contact support.');
            setLoading(false);
          }
        },
        onError: (error) => {
          console.error('Payment failed:', error);
          setError(error.message || 'Payment failed. Please try again.');
          setLoading(false);
        },
      });

      setLoading(false);
      
    } catch (err) {
      console.error('Payment initialization failed:', err);
      setError(err.message || 'Failed to initialize payment. Please try again.');
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <main className="kc-container py-20">
        <KCCard className="mx-auto max-w-xl space-y-6 text-center">
          <CheckCircle2 size={48} className="mx-auto text-[var(--kc-navy)]" />
          <h1 className="text-3xl font-serif">Order Confirmed</h1>
          <p className="text-sm text-[var(--kc-ink-2)]">
            Thank you for commissioning with The Kapda Co. Your atelier concierge will reach out within 24 hours with production timelines and delivery coordination.
          </p>
          {orderId && (
            <div className="rounded-[var(--kc-radius)] border border-white/25 bg-white/70 px-5 py-4 text-sm text-[var(--kc-ink-2)]">
              <p>Order ID: <strong className="text-[var(--kc-ink)]">{orderId.toString().slice(-8)}</strong></p>
            </div>
          )}
          <div className="rounded-[var(--kc-radius)] border border-white/25 bg-white/70 px-5 py-4 text-sm text-[var(--kc-ink-2)]">
            <p>Order receipt sent to <strong className="text-[var(--kc-ink)]">{form.email || 'your inbox'}</strong>.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <KCButton variant="primary" as={Link} to="/orders">
              View Orders
            </KCButton>
            <KCButton variant="ghost" as={Link} to="/shop">
              Continue Exploring
            </KCButton>
          </div>
        </KCCard>
      </main>
    );
  }

  return (
    <main className="kc-container space-y-10 py-16">
      <header className="space-y-4">
        <p className="kc-pill bg-white/60 text-[var(--kc-navy)]">Checkout</p>
        <h1 className="text-4xl md:text-5xl">Complete Your Order</h1>
        <p className="max-w-2xl text-[var(--kc-ink-2)]">
          Secure payment, global logistics, and atelier support. All fields marked with * are required.
        </p>
      </header>

      <StepIndicator current={stepIndex} />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="space-y-6">
          {error && (
            <div className="rounded-[var(--kc-radius)] border border-red-500/50 bg-red-500/10 px-4 py-3 flex items-start gap-3 text-red-600">
              <AlertCircle size={20} className="mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-semibold text-sm mb-1">Error</p>
                <p className="text-sm">{error}</p>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-700"
                aria-label="Dismiss error"
              >
                ×
              </button>
            </div>
          )}
          <AnimatePresence mode="wait">
            {stepIndex === 0 ? (
              <motion.div
                key="address"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE }}
                className="space-y-6"
                role="region"
                aria-labelledby="address-step-heading"
              >
                {/* Saved Addresses Selection */}
                {savedAddresses.length > 0 && (
                  <div className="form-card" style={{ padding: 'var(--kc-gap-lg)' }}>
                    <h3 className="text-lg font-semibold mb-4 text-[var(--kc-ink)]">Saved Addresses</h3>
                    <div className="space-y-3">
                      {savedAddresses.map((address) => (
                        <button
                          key={address._id}
                          type="button"
                          onClick={() => handleSelectAddress(address)}
                          className={`w-full text-left p-4 rounded-lg border transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 ${
                            selectedAddressId === address._id
                              ? 'border-[var(--kc-gold-200)] bg-[var(--kc-gold-200)]/10'
                              : 'border-white/25 hover:border-white/40'
                          }`}
                          aria-pressed={selectedAddressId === address._id}
                          aria-label={`Select address: ${address.label}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-[var(--kc-ink)]">{address.label}</p>
                              <p className="text-sm text-[var(--kc-ink-2)] mt-1">
                                {address.street}, {address.city}, {address.postalCode}
                              </p>
                              {address.isDefault && (
                                <span className="text-xs text-[var(--kc-gold-200)] mt-1 inline-block">Default</span>
                              )}
                            </div>
                            {selectedAddressId === address._id && (
                              <span className="text-[var(--kc-gold-200)]">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                      {selectedAddressId && (
                        <button
                          type="button"
                          onClick={handleUseNewAddress}
                          className="text-sm text-[var(--kc-gold-200)] hover:text-[var(--kc-gold-300)] transition-colors"
                        >
                          + Use a different address
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Address Form */}
                <div className="form-card" style={{ padding: 'var(--kc-gap-lg)' }}>
                  {savedAddresses.length > 0 && !selectedAddressId && (
                    <p className="text-sm text-[var(--kc-ink-2)] mb-4">Or enter a new address:</p>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 'var(--kc-gap-md)' }}>
                    <div style={{ gridColumn: '1 / -1' }} className="form-field">
                      <label className="form-label">Full Name *</label>
                      <input name="name" value={form.name} onChange={handleInput} placeholder="Priya Sharma" required className="form-input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Email *</label>
                      <input name="email" type="email" value={form.email} onChange={handleInput} placeholder="priya@kapdaco.com" required className="form-input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Phone *</label>
                      <input name="phone" value={form.phone} onChange={handleInput} placeholder="+91 98765 43210" required className="form-input" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }} className="form-field">
                      <label className="form-label">Street Address *</label>
                      <input name="address" value={form.address} onChange={handleInput} placeholder="Flat 1203, Aurum Residency" required className="form-input" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }} className="form-field">
                      <label className="form-label">Address Line 2 (Optional)</label>
                      <input name="addressLine2" value={form.addressLine2} onChange={handleInput} placeholder="Apartment, suite, unit, building, floor, etc." className="form-input" />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }} className="form-field">
                      <label className="form-label">Landmark (Optional)</label>
                      <input name="landmark" value={form.landmark} onChange={handleInput} placeholder="Nearby landmark for easy delivery" className="form-input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">City *</label>
                      <input name="city" value={form.city} onChange={handleInput} placeholder="Mumbai" required className="form-input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">State</label>
                      <input name="state" value={form.state} onChange={handleInput} placeholder="Maharashtra" className="form-input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Postal Code *</label>
                      <input name="postalCode" value={form.postalCode} onChange={handleInput} placeholder="400001" required className="form-input" />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Country *</label>
                      <input name="country" value={form.country} onChange={handleInput} placeholder="India" required className="form-input" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {stepIndex === 1 ? (
              <motion.div
                key="delivery"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE }}
                className="space-y-4"
                role="region"
                aria-labelledby="delivery-step-heading"
              >
                {deliveryOptions.filter(opt => opt.id !== 'atelier').map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, deliveryMethod: option.id, deliveryOption: option.id }))}
                  className={`flex w-full items-center justify-between rounded-[var(--kc-radius)] border px-4 py-4 text-left transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 ${
                    form.deliveryMethod === option.id
                      ? 'border-[var(--kc-navy)] bg-white/80 text-[var(--kc-navy)] shadow-[var(--kc-shadow-sm)]'
                      : 'border-white/25 text-[var(--kc-ink-2)] hover:text-[var(--kc-navy)]'
                  }`}
                  aria-pressed={form.deliveryMethod === option.id}
                  aria-label={`Select ${option.title} delivery`}
                >
                  <div>
                    <p className="text-sm font-semibold text-[var(--kc-navy)]">{option.title}</p>
                    <p className="text-xs text-[var(--kc-ink-2)]">{option.desc}</p>
                  </div>
                  <p className="text-sm font-semibold text-[var(--kc-navy)]">{option.price === 0 ? 'Included' : `₹${option.price}`}</p>
                </button>
              ))}
              <div className="rounded-[var(--kc-radius)] border border-white/25 bg-white/70 px-4 py-3 text-sm text-[var(--kc-ink-2)]">
                  <Truck size={16} className="mr-2 inline" /> Order tracking and concierge coordination provided post-confirmation.
                </div>
                
                <div className="form-card" style={{ padding: 'var(--kc-gap-lg)' }}>
                  <h3 className="text-lg font-semibold mb-4 text-[var(--kc-ink)]">Additional Information</h3>
                  <div className="space-y-4">
                    <div className="form-field">
                      <label className="form-label">Gift Message (Optional)</label>
                      <textarea
                        name="giftMessage"
                        value={form.giftMessage}
                        onChange={handleInput}
                        rows="3"
                        placeholder="Add a personal message for gift orders..."
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">Order Notes (Optional)</label>
                      <textarea
                        name="orderNotes"
                        value={form.orderNotes}
                        onChange={handleInput}
                        rows="3"
                        placeholder="Special delivery instructions or notes..."
                        className="form-input"
                      />
                    </div>
                    <div className="form-field">
                      <label className="form-label">GST Number (Optional - for B2B orders)</label>
                      <input
                        type="text"
                        name="gstNumber"
                        value={form.gstNumber}
                        onChange={handleInput}
                        placeholder="29ABCDE1234F1Z5"
                        className="form-input"
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : null}

            {stepIndex === 2 ? (
              <motion.div
                key="payment"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.98 }}
                transition={{ duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE }}
                role="region"
                aria-labelledby="payment-step-heading"
              >
                <KCCard className="space-y-4">
                  <div className="flex items-center gap-3 rounded-[var(--kc-radius)] border border-white/25 bg-white/70 px-4 py-3 text-sm text-[var(--kc-ink-2)]">
                    <Lock size={16} /> All transactions are secured with PCI DSS compliance and AES-256 encryption. Payment powered by Razorpay.
                  </div>
                  <div className="grid gap-4">
                    <label className="flex items-center gap-3 rounded-[var(--kc-radius)] border border-white/25 px-4 py-3 text-sm text-[var(--kc-ink)] cursor-pointer hover:bg-white/80 transition-colors focus-within:outline-2 focus-within:outline-[var(--kc-gold-200)] focus-within:outline-offset-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={form.paymentMethod === 'card'}
                        onChange={handleInput}
                        aria-label="Credit / Debit Card, UPI, Netbanking payment method"
                      />
                      <div className="flex-1">
                        <span className="font-semibold">Credit / Debit Card, UPI, Netbanking</span>
                        <p className="text-xs text-[var(--kc-ink-2)] mt-1">Secure payment via Razorpay checkout</p>
                      </div>
                    </label>
                    <label className="flex items-center gap-3 rounded-[var(--kc-radius)] border border-white/25 px-4 py-3 text-sm text-[var(--kc-ink)] cursor-pointer hover:bg-white/80 transition-colors focus-within:outline-2 focus-within:outline-[var(--kc-gold-200)] focus-within:outline-offset-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={form.paymentMethod === 'cod'}
                        onChange={handleInput}
                        aria-label="Cash on Delivery / Bank Transfer payment method"
                      />
                      <div className="flex-1">
                        <span>Cash on Delivery / Bank Transfer</span>
                        <p className="text-xs text-[var(--kc-ink-2)] mt-1">We&apos;ll share payment instructions after order confirmation</p>
                      </div>
                    </label>
                  </div>
                  <div className="form-field">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        name="sameAsShipping"
                        checked={form.sameAsShipping}
                        onChange={(e) => setForm(prev => ({ ...prev, sameAsShipping: e.target.checked }))}
                        className="form-checkbox"
                      />
                      <span className="text-sm text-[var(--kc-ink)]">Billing address same as shipping address</span>
                    </label>
                  </div>
                  <p className="text-sm text-[var(--kc-ink-2)]">
                    {form.paymentMethod === 'card' 
                      ? 'Click "Place Order" to proceed with secure payment. You will be redirected to Razorpay checkout for payment.'
                      : 'Click "Place Order" to create your order. Payment instructions will be sent via email.'}
                  </p>
                </KCCard>
              </motion.div>
            ) : null}
          </AnimatePresence>

          <div className="flex flex-wrap gap-3">
            {stepIndex > 0 ? <KCButton variant="ghost" onClick={prevStep}>Back</KCButton> : null}
            {stepIndex < steps.length - 1 ? (
              <KCButton 
                variant="primary" 
                onClick={nextStep} 
                disabled={loading}
                icon={loading ? <LoadingSpinner size={16} /> : null}
              >
                {loading ? 'Processing...' : 'Continue'}
              </KCButton>
            ) : (
              <KCButton
                variant="primary"
                onClick={handleOrder}
                disabled={loading || items.length === 0}
                icon={loading ? <LoadingSpinner size={16} /> : null}
              >
                {loading ? 'Placing Order...' : 'Place Order'}
              </KCButton>
            )}
          </div>
        </section>

        <aside className="space-y-6 lg:sticky lg:top-24">
          <KCCard className="space-y-4">
            <h2 className="text-lg font-semibold text-[var(--kc-ink)]">Order Summary</h2>
            <div className="space-y-3 text-sm text-[var(--kc-ink-2)]">
              {items.map((item) => (
                <div key={item.id || item.key} className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--kc-ink)]">{item.title || item.name}</p>
                    <p className="text-xs text-[var(--kc-ink-2)]">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm text-[var(--kc-ink)]">₹{(Number(item.price || 0) * Number(item.quantity || 1)).toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>
            <div className="space-y-2 text-sm text-[var(--kc-ink-2)]">
              {summaryLines.map((row) => (
                <div key={row.label} className="flex items-center justify-between">
                  <span>{row.label}</span>
                  <span>₹{row.value.toLocaleString('en-IN')}</span>
                </div>
              ))}
              <div className="flex items-center justify-between border-t border-[var(--kc-border)] pt-3 text-base font-semibold text-[var(--kc-ink)]">
                <span>Total</span>
                <span>₹{finalTotal.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </KCCard>

          <KCCard muted className="text-sm text-[var(--kc-ink-2)]">
            <p className="font-semibold text-[var(--kc-ink)]">Need assistance?</p>
            <p>Our concierge team can help with measurements, gifting, and international documentation. WhatsApp +91 98765 43210.</p>
          </KCCard>
        </aside>
      </div>
    </main>
  );
};

const StepIndicator = ({ current }) => (
  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
    <div className="flex items-center gap-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold ${
            index <= current
              ? 'border-[var(--kc-navy)] bg-[var(--kc-grad-primary)] text-white'
              : 'border-white/25 text-[var(--kc-ink-2)]'
          }`}>
            {index + 1}
          </div>
          <span className={`text-xs uppercase tracking-[0.3em] ${index <= current ? 'text-[var(--kc-navy)]' : 'text-[var(--kc-ink-2)]'}`}>{step}</span>
        </div>
      ))}
    </div>
    <p className="text-xs uppercase tracking-[0.3em] text-[var(--kc-ink-2)]">Secure checkout powered by The Kapda Co.</p>
  </div>
);

export default Checkout;
