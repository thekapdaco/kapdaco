import React, { useEffect, useMemo, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api.js';
import { KCButton, KCCard, LoadingSpinner } from '../components/ui';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { Plus, Minus, X, RefreshCcw, ShieldCheck, Truck, Lock, CheckCircle, Eye, Star } from 'lucide-react';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';
import { useToast } from '../components/Toast';

const SAVED_KEY = 'kapda_saved_v1';
const FREE_SHIPPING_THRESHOLD = 7500;

// Mock recommended products for empty cart
const recommendedProducts = [
  { id: 1, name: 'Oversized Atelier Tee', price: 999, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop' },
  { id: 2, name: 'Handloom Heritage Hoodie', price: 1499, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop' },
  { id: 3, name: 'Monogram Atelier Tote', price: 599, image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=500&fit=crop' },
  { id: 4, name: 'Signature Blazer', price: 3499, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop' },
];

const Cart = () => {
  const { cart, updateItem, removeItem, clearCart, applyCoupon, removeCoupon, addToCart: addToCartContext } = useCart();
  const { token, user } = useAuth();
  const { scrollY } = useScroll();
  const toast = useToast();
  const [coupon, setCoupon] = useState('');
  const [applying, setApplying] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState([]);
  const [removedItem, setRemovedItem] = useState(null);
  const [undoTimer, setUndoTimer] = useState(null);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [animatingTotals, setAnimatingTotals] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());

  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowStickyBar(latest > 200);
  });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      setSaved(raw ? JSON.parse(raw) : []);
    } catch {
      setSaved([]);
    }
  }, []);

  const persistSaved = (next) => {
    try { localStorage.setItem(SAVED_KEY, JSON.stringify(next)); } catch { /* ignore */ }
    setSaved(next);
  };

  const totals = cart?.totals || { subtotal: 0, cartDiscount: 0, shipping: 0, tax: 0, total: 0 };
  const items = cart?.items || [];

  const lineTotal = (item) => Number(item.price || 0) * Number(item.quantity || 1);

  const increment = async (item) => {
    const itemId = item.id || item.key;
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      const value = Math.min(item.maxQty ?? 10, (item.quantity || 1) + (item.step || 1));
      await updateItem(itemId, value);
      setAnimatingTotals(true);
      setTimeout(() => setAnimatingTotals(false), ANIMATION_DURATIONS.sm * 1000);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const decrement = async (item) => {
    const itemId = item.id || item.key;
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      const value = Math.max(item.minQty ?? 1, (item.quantity || 1) - (item.step || 1));
      await updateItem(itemId, value);
      setAnimatingTotals(true);
      setTimeout(() => setAnimatingTotals(false), ANIMATION_DURATIONS.sm * 1000);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleQtyInput = async (item, value) => {
    const itemId = item.id || item.key;
    setUpdatingItems(prev => new Set(prev).add(itemId));
    try {
      const parsed = Math.max(item.minQty ?? 1, Math.min(item.maxQty ?? 10, Number(value) || 0));
      await updateItem(itemId, parsed);
      setAnimatingTotals(true);
      setTimeout(() => setAnimatingTotals(false), ANIMATION_DURATIONS.sm * 1000);
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev);
        next.delete(itemId);
        return next;
      });
    }
  };

  const handleApplyCoupon = async () => {
    if (coupon.trim().length < 3) {
      setCouponError('Code must be at least 3 characters');
      toast.error('Code must be at least 3 characters');
      return;
    }
    setApplying(true);
    setCouponError('');
    setCouponSuccess(false);
    try {
      await applyCoupon(coupon.trim());
      setCoupon('');
      setCouponSuccess(true);
      toast.success('Coupon applied successfully!');
      setTimeout(() => setCouponSuccess(false), 3000);
    } catch (e) {
      const errorMsg = e.message || 'Unable to apply coupon';
      setCouponError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setApplying(false);
    }
  };

  const handleRemoveItem = (item) => {
    setRemovedItem(item);
    removeItem(item.id || item.key);
    toast.info(`${item.title || item.name} removed from cart`, 5000);
    
    // Auto-dismiss after 5 seconds
    const timer = setTimeout(() => {
      setRemovedItem(null);
    }, 5000);
    setUndoTimer(timer);
  };

  const handleUndo = async () => {
    if (removedItem && undoTimer) {
      clearTimeout(undoTimer);
      // Re-add item to cart
      await addToCartContext({
        productId: removedItem.productId || removedItem.id,
        title: removedItem.title || removedItem.name,
        price: removedItem.price,
        image: removedItem.image,
        quantity: removedItem.quantity || 1,
        size: removedItem.size,
        color: removedItem.color,
        variantId: removedItem.variantId,
        minQty: removedItem.minQty,
        maxQty: removedItem.maxQty,
        step: removedItem.step,
      });
      toast.success('Item restored to cart');
      setRemovedItem(null);
      setUndoTimer(null);
    }
  };

  const moveToSaved = (item) => {
    removeItem(item.id || item.key);
    const next = [...saved, item];
    persistSaved(next);
    toast.info(`${item.title || item.name} saved for later`);
  };

  const moveFromSaved = (item) => {
    const next = saved.filter((entry) => (entry.id || entry.key) !== (item.id || item.key));
    persistSaved(next);
    // Re-add to cart
    const { id, key, ...rest } = item;
    updateItem(id || key, item.quantity || 1);
    toast.success(`${item.title || item.name} added back to cart`);
  };

  const validateAndCheckout = async () => {
    setError('');
    try {
      if (!token) {
        window.location.href = '/login?next=/checkout';
        return;
      }

      // Check if cart has any items
      if (!items || items.length === 0) {
        setError('Cart is empty');
        return;
      }

      // Check if cart has any regular products (MongoDB ObjectIds)
      const hasRegularProducts = items.some(item => {
        const productId = item.productId || item.id;
        return typeof productId === 'string' && /^[a-fA-F0-9]{24}$/.test(productId);
      });

      // Only validate with backend if there are regular products
      // Custom products (non-MongoDB IDs) are stored locally and will be handled in checkout
      if (hasRegularProducts) {
        try {
          await api('/api/cart/validate', { method: 'POST', token });
        } catch (e) {
          // If validation fails, check if it's because backend cart is empty but we have custom items
          if (e.message?.includes('Cart is empty')) {
            // If we have items but backend cart is empty, they're likely all custom items
            // Allow checkout to proceed - custom items will be handled in checkout
            console.log('Backend cart is empty, but frontend has items (likely custom products)');
          } else {
            throw e;
          }
        }
      }

      window.location.href = '/checkout';
    } catch (e) {
      setError(e.message || 'Stock validation failed');
    }
  };

  const summaryLines = useMemo(() => ([
    { label: 'Subtotal', value: totals.subtotal },
    { label: 'Savings', value: -totals.cartDiscount },
    { label: 'Shipping', value: totals.shipping },
    { label: 'Tax', value: totals.tax },
  ]), [totals]);

  const freeShippingRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - totals.subtotal);
  const freeShippingProgress = Math.min(100, (totals.subtotal / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <main 
      className="bg-[var(--kc-bg-gradient)] min-h-screen"
      style={{ paddingTop: 'var(--nav-height, 110px)' }}
    >
      <div className="kc-container" style={{ paddingTop: 'var(--kc-gap-lg)', paddingBottom: '140px' }}>
        <header className="space-y-4 text-center md:text-left mb-12">
          <p className="kc-pill mx-auto md:mx-0 bg-white/20 text-white text-xs tracking-[0.3em]">Your Selection</p>
          <h1 className="text-4xl md:text-5xl lg:text-6xl text-white font-serif">Shopping Bag</h1>
          {user?.name && (
            <p className="text-xl md:text-2xl text-white/90 font-medium">
              {user.name}
            </p>
          )}
          <p className="max-w-2xl text-white/80 md:text-base">
            Secure your pieces with complimentary insured shipping, atelier inspection, and flexible exchanges.
          </p>
          {error && (
            <div className="mx-auto max-w-2xl rounded-[16px] border border-[var(--kc-danger)] bg-[var(--kc-danger)]/10 p-4 text-sm text-[var(--kc-danger)] md:mx-0">
              {error}
            </div>
          )}
        </header>

        {items.length === 0 ? (
          <EmptyCartState recommendedProducts={recommendedProducts} />
        ) : (
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_400px]">
            {/* Cart Items */}
            <section className="space-y-6" aria-label="Shopping cart items">
              <AnimatePresence mode="popLayout">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id || item.key}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ 
                      opacity: 0, 
                      x: -100, 
                      scale: 0.9,
                      transition: { duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE } 
                    }}
                    transition={{ 
                      layout: { duration: ANIMATION_DURATIONS.md, ease: ANIMATION_EASE },
                      opacity: { duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE },
                      scale: { duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }
                    }}
                  >
                    <ProductCard
                      item={item}
                      index={index}
                      onIncrement={() => increment(item)}
                      onDecrement={() => decrement(item)}
                      onQtyChange={(value) => handleQtyInput(item, value)}
                      onRemove={() => handleRemoveItem(item)}
                      onSaveForLater={() => moveToSaved(item)}
                      lineTotal={lineTotal(item)}
                      isUpdating={updatingItems.has(item.id || item.key)}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </section>

            {/* Order Summary - Sticky */}
            <aside 
              className="space-y-6 lg:sticky"
              style={{ top: 'calc(var(--nav-height, 110px) + var(--kc-gap-md))' }}
            >
              <OrderSummary
                cart={cart}
                totals={totals}
                summaryLines={summaryLines}
                coupon={coupon}
                setCoupon={setCoupon}
                applying={applying}
                couponError={couponError}
                couponSuccess={couponSuccess}
                onApplyCoupon={handleApplyCoupon}
                onRemoveCoupon={removeCoupon}
                onCheckout={validateAndCheckout}
                onClearCart={clearCart}
                freeShippingRemaining={freeShippingRemaining}
                freeShippingProgress={freeShippingProgress}
                animatingTotals={animatingTotals}
              />
            </aside>
          </div>
        )}

        {/* Saved For Later */}
        {saved.length > 0 && (
          <section className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif text-white">Saved For Later</h2>
              <button 
                type="button" 
                className="text-sm text-white/60 hover:text-white/90 uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 focus-visible:rounded"
                onClick={() => persistSaved([])}
                aria-label="Clear saved items"
              >
                Clear
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {saved.map((item) => (
                <SavedItem
                  key={`${item.id || item.key}-saved`}
                  item={item}
                  onMoveToBag={() => moveFromSaved(item)}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Undo Toast */}
      <AnimatePresence>
        {removedItem && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            transition={{ duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 rounded-[16px] border border-white/20 bg-white/95 backdrop-blur-xl px-6 py-4 shadow-[0_8px_32px_rgba(0,0,0,0.2)]"
            role="status"
            aria-live="polite"
            aria-atomic="true"
          >
            <div className="flex items-center gap-4">
              <span className="text-sm text-[var(--kc-navy)]">
                Item removed
              </span>
              <button
                onClick={handleUndo}
                className="text-sm font-semibold text-[var(--kc-gold-200)] hover:text-[var(--kc-gold-300)] transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 focus-visible:rounded"
                aria-label="Undo item removal"
              >
                Undo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Sticky Checkout Bar */}
      <AnimatePresence>
        {showStickyBar && items.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-white/20 bg-white/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.2)] lg:hidden"
          >
            <div className="kc-container">
              <div className="flex items-center gap-4 py-4">
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[var(--kc-ink-2)] uppercase tracking-[0.2em]">
                    {items.length} {items.length === 1 ? 'item' : 'items'}
                  </p>
                  <p className="text-lg font-bold text-[var(--kc-gold-200)]">
                    ₹{totals.total.toLocaleString('en-IN')}
                  </p>
                </div>
                <KCButton
                  className="flex-1 min-w-[160px] bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold py-3 rounded-[14px] shadow-[0_4px_16px_rgba(211,167,95,0.3)]"
                  onClick={validateAndCheckout}
                >
                  Checkout
                </KCButton>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

// Product Card Component - Compact horizontal layout
const ProductCard = ({ item, index, onIncrement, onDecrement, onQtyChange, onRemove, onSaveForLater, lineTotal, isUpdating = false }) => {
  const [isHovering, setIsHovering] = useState(false);

  // Extract productId - handle both productId field and key format
  const getProductId = () => {
    if (item.productId) return item.productId;
    if (item.id && !item.id.includes('__')) return item.id;
    // If key format is like "productId__size__color__variantId", extract productId
    if (item.key && item.key.includes('__')) {
      return item.key.split('__')[0];
    }
    return item.id || item.key;
  };

  const productId = getProductId();
  const productImage = item?.previews?.front?.startsWith('data:image') ? item.previews.front : item.image;
  const discountPercent = item.discount || item.originalPrice ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100) : 0;
  const rating = item.rating || 4.7;
  
  // Mock color options - in real app, get from item.colors or item.variants
  const colorOptions = item.colors || ['Black', 'White', 'Grey'];
  const selectedColor = item.color || colorOptions[0];

  const getColorValue = (colorName) => {
    const colorMap = {
      'black': '#000000', 'white': '#FFFFFF', 'grey': '#808080', 'gray': '#808080',
      'navy': '#000080', 'beige': '#F5F5DC', 'tan': '#D2B48C', 'brown': '#8B4513',
      'sage': '#87AE73', 'cloud': '#E8E8E8', 'noir': '#000000',
    };
    return colorMap[colorName?.toLowerCase()] || '#CCCCCC';
  };

  return (
    <div 
      className="relative overflow-hidden rounded-[var(--kc-radius-lg)] border border-white/15 bg-white/5 backdrop-blur-sm shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_6px_24px_rgba(0,0,0,0.2)] transition-all duration-300"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div className="flex flex-col md:flex-row gap-4 p-4 md:p-5">
        {/* Product Image - Left Side */}
        <Link
          to={`/product/${productId}`}
          state={{
            id: productId,
            name: item.title || item.name,
            title: item.title || item.name,
            price: item.price,
            image: productImage,
            images: item.images || [productImage],
            size: item.size,
            color: item.color,
            variants: item.variants || [],
            colors: item.colors || [],
            sizes: item.sizes || [],
          }}
          className="relative flex-shrink-0 w-full md:w-[140px] h-[180px] md:h-[140px] rounded-[12px] overflow-hidden border border-white/10 bg-white/5 group"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={productImage}
            alt={item.title || 'Product'}
            className="h-full w-full object-cover transition-transform duration-500"
            style={{
              transform: isHovering ? 'scale(1.08)' : 'scale(1)',
            }}
            loading="lazy"
            decoding="async"
          />
          {/* Rating Badge - Top Left */}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded-[6px] shadow-md z-10">
            <Star size={12} className="fill-[var(--kc-gold-200)] text-[var(--kc-gold-200)]" />
            <span className="text-xs font-semibold text-[var(--kc-navy-900)]">{rating}</span>
          </div>
          {/* Discount Badge - Top Right */}
          {discountPercent > 0 && (
            <div className="absolute top-2 right-2 bg-[#2a2a2a]/95 backdrop-blur-sm px-2 py-1 rounded-full border border-white/20 z-10">
              <span className="text-[10px] font-bold text-white">-{discountPercent}%</span>
            </div>
          )}
        </Link>

        {/* Product Details - Middle Section */}
        <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
          <div className="space-y-2">
            {/* Product Name */}
            <Link
              to={`/product/${productId}`}
              state={{
                id: productId,
                name: item.title || item.name,
                title: item.title || item.name,
                price: item.price,
                image: productImage,
                images: item.images || [productImage],
                size: item.size,
                color: item.color,
                variants: item.variants || [],
                colors: item.colors || [],
                sizes: item.sizes || [],
              }}
              className="block"
            >
              <h3 className="text-lg md:text-xl font-serif font-semibold text-white leading-tight hover:text-[var(--kc-gold-200)] transition-colors">
                {item.title || item.name}
              </h3>
            </Link>

            {/* Price */}
            <div className="flex items-center gap-2">
              <p className="text-lg font-bold text-[var(--kc-gold-200)]">
                ₹{Number(item.price || 0).toLocaleString('en-IN')}
              </p>
              {item.originalPrice && item.originalPrice > item.price && (
                <span className="text-sm text-white/50 line-through">
                  ₹{Number(item.originalPrice).toLocaleString('en-IN')}
                </span>
              )}
            </div>

            {/* Attributes */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
              {item.size && (
                <span className="uppercase tracking-[0.1em]">Size {item.size}</span>
              )}
              {item.color && (
                <span className="uppercase tracking-[0.1em]">• {item.color}</span>
              )}
              <span className="uppercase tracking-[0.1em]">• Qty {item.quantity}</span>
            </div>

            {/* Color Options */}
            {colorOptions.length > 0 && (
              <div className="flex items-center gap-2 pt-1">
                {colorOptions.slice(0, 3).map((color, idx) => {
                  const isSelected = color === selectedColor;
                  return (
                    <div
                      key={idx}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${
                        isSelected 
                          ? 'border-[var(--kc-gold-200)] shadow-[0_0_0_2px_rgba(211,167,95,0.3)] scale-110' 
                          : 'border-white/40'
                      }`}
                      style={{ backgroundColor: getColorValue(color) }}
                      aria-label={`Color option ${color}`}
                      title={color}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Service Badges */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <div className="flex items-center gap-1.5 text-[11px] text-white/65">
              <ShieldCheck size={12} className="text-[var(--kc-gold-200)]" />
              <span>Atelier-grade quality check</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-white/65">
              <Truck size={12} className="text-[var(--kc-gold-200)]" />
              <span>Insured dispatch</span>
            </div>
          </div>
        </div>

        {/* Actions & Line Total - Right Side */}
        <div className="flex flex-col justify-between gap-4 md:w-[140px] flex-shrink-0">
          {/* Quantity Controls */}
          <div className="flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-[10px] p-1.5 border border-white/20 justify-center">
            <button
              type="button"
              onClick={onDecrement}
              disabled={isUpdating || item.quantity <= 1}
              className="flex h-7 w-7 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label={`Decrease quantity`}
            >
              {isUpdating ? <LoadingSpinner size={12} color="white" /> : <Minus size={14} />}
            </button>
            <span className="text-sm font-semibold text-white min-w-[28px] text-center">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={onIncrement}
              disabled={isUpdating}
              className="flex h-7 w-7 items-center justify-center rounded text-white hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              aria-label={`Increase quantity`}
            >
              {isUpdating ? <LoadingSpinner size={12} color="white" /> : <Plus size={14} />}
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={onSaveForLater}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-white text-xs font-medium py-2 px-3 rounded-[10px] hover:bg-white/15 transition-all uppercase tracking-[0.1em]"
            >
              Save
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="w-full bg-white/10 backdrop-blur-sm border border-white/20 text-[var(--kc-danger)] text-xs font-medium py-2 px-3 rounded-[10px] hover:bg-white/15 transition-all uppercase tracking-[0.1em] flex items-center justify-center gap-1"
              aria-label="Remove item"
            >
              <X size={14} />
              <span>Remove</span>
            </button>
          </div>

          {/* Line Total */}
          <motion.div
            key={lineTotal}
            initial={{ scale: 1.02, opacity: 0.9 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: ANIMATION_DURATIONS.sm }}
            className="pt-3 border-t border-white/15"
          >
            <div className="text-center space-y-1">
              <span className="text-[10px] text-white/60 uppercase tracking-[0.15em] block">Line total</span>
              <strong className="text-white text-lg font-bold block">₹{lineTotal.toLocaleString('en-IN')}</strong>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// Order Summary Component
const OrderSummary = ({
  cart,
  totals,
  summaryLines,
  coupon,
  setCoupon,
  applying,
  couponError,
  couponSuccess,
  onApplyCoupon,
  onRemoveCoupon,
  onCheckout,
  onClearCart,
  freeShippingRemaining,
  freeShippingProgress,
  animatingTotals,
}) => {
  return (
    <>
      <KCCard className="bg-white/10 border border-white/15 rounded-[20px] p-6 space-y-6 shadow-[0_18px_80px_rgba(0,0,0,0.35)]">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className="kc-pill bg-white/15 text-[11px] uppercase tracking-[0.28em] text-white/80 w-fit">
              Curated for you
            </span>
            <h2 className="text-xl font-semibold text-white">Order Summary</h2>
            <p className="text-xs text-white/60">Insured dispatch · Atelier inspection · Flexible exchanges</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.24em] text-white/50">Secured</p>
            <p className="text-sm font-semibold text-[var(--kc-gold-200)]">AES-256 encrypted</p>
          </div>
        </div>

        {/* Promo Code */}
        {cart?.coupon ? (
          <div className="flex items-center justify-between rounded-[12px] border border-[var(--kc-gold-200)] bg-[var(--kc-gold-200)]/10 px-4 py-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={16} className="text-[var(--kc-gold-200)]" />
              <span className="text-sm font-medium text-white">Coupon {cart.coupon.code}</span>
            </div>
            <button
              type="button"
              onClick={onRemoveCoupon}
              className="text-xs text-white/60 hover:text-white transition-colors uppercase tracking-[0.2em]"
            >
              Remove
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(event) => {
                  setCoupon(event.target.value);
                  if (couponError) setCouponError('');
                }}
                placeholder="Gift or promo code"
                className="kc-input flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/40"
                aria-label="Promo code input"
              />
              <KCButton
                variant="secondary"
                onClick={onApplyCoupon}
                disabled={applying || coupon.trim().length < 3}
                className="border-white/30 text-white hover:bg-white/10"
                icon={applying ? <LoadingSpinner size={16} color="white" /> : null}
              >
                {applying ? 'Applying…' : 'Apply'}
              </KCButton>
            </div>
            {couponError && (
              <p className="text-xs text-[var(--kc-danger)]">{couponError}</p>
            )}
            {couponSuccess && (
              <p className="text-xs text-[var(--kc-success)] flex items-center gap-1">
                <CheckCircle size={12} />
                Coupon applied successfully
              </p>
            )}
          </div>
        )}

        {/* Summary Lines */}
        <div className="space-y-3 text-sm text-white/80">
          {summaryLines.map((row) => (
            <div key={row.label} className="flex items-center justify-between">
              <span>{row.label}</span>
              <span>₹{row.value.toLocaleString('en-IN')}</span>
            </div>
          ))}
          <div className="h-px bg-white/20 my-3" />
          <motion.div
            key={totals.total}
            initial={animatingTotals ? { scale: 1.05 } : false}
            animate={{ scale: 1 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between border-t border-white/20 pt-3 text-lg font-bold text-white"
          >
            <div className="flex flex-col">
              <span>Total</span>
              <span className="text-[11px] font-normal text-white/60">All duties & taxes included</span>
            </div>
            <div className="text-right">
              <span aria-live="polite" aria-atomic="true" className="block">
                ₹{totals.total.toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] font-medium text-[var(--kc-gold-200)]">Complimentary insured shipping</span>
            </div>
          </motion.div>
        </div>

        {/* Primary CTA */}
        <KCButton
          variant="primary"
          className="w-full bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold py-4 rounded-[14px] shadow-[0_6px_26px_rgba(211,167,95,0.35)] hover:shadow-[0_10px_30px_rgba(211,167,95,0.45)] hover:-translate-y-[2px] active:scale-[0.985]"
          onClick={onCheckout}
        >
          Proceed to Checkout
        </KCButton>

        {/* Clear Bag - Text Link */}
        <button
          type="button"
          onClick={onClearCart}
          className="w-full text-center text-sm text-white/60 hover:text-white/90 uppercase tracking-[0.2em] focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 rounded"
        >
          Clear Bag
        </button>

        {/* Mini Trust Indicators */}
        <div className="grid grid-cols-2 gap-3 pt-4 border-t border-white/10">
          <TrustIndicator icon={RefreshCcw} text="Free Returns" />
          <TrustIndicator icon={Truck} text="Insured Dispatch" />
          <TrustIndicator icon={ShieldCheck} text="Atelier Inspection" />
          <TrustIndicator icon={Lock} text="Secure Payments" />
        </div>
      </KCCard>

      {/* Free Shipping Progress */}
      <KCCard className="bg-white/10 border border-white/15 rounded-[16px] p-6 space-y-3">
        {freeShippingRemaining > 0 ? (
          <>
            <p className="text-sm font-semibold text-white">
              ₹{freeShippingRemaining.toLocaleString('en-IN')} to go for <span className="text-[var(--kc-gold-200)]">FREE</span> express shipping
            </p>
            <div className="h-2 w-full rounded-full bg-white/20 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-[var(--kc-gold-200)]"
                initial={{ width: 0 }}
                animate={{ width: `${freeShippingProgress}%` }}
                transition={{ duration: 0.12, ease: 'linear' }}
              />
            </div>
            <p className="text-xs text-white/60 uppercase tracking-[0.2em]">
              Exclusive benefits unlock at ₹{FREE_SHIPPING_THRESHOLD.toLocaleString('en-IN')}
            </p>
          </>
        ) : (
          <div className="flex items-center gap-2 text-sm text-[var(--kc-gold-200)]">
            <CheckCircle size={16} />
            <span className="font-semibold">You qualify for FREE express shipping!</span>
          </div>
        )}
      </KCCard>
    </>
  );
};

// Trust Indicator Component
const TrustIndicator = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-2">
    <Icon size={14} className="text-[var(--kc-gold-200)] flex-shrink-0" />
    <span className="text-[12px] text-white/70">{text}</span>
  </div>
);

// Saved Item Component
const SavedItem = ({ item, onMoveToBag }) => (
  <KCCard muted className="bg-white/10 border border-white/15 rounded-[16px] p-4 flex items-center justify-between gap-4">
    <div className="flex items-center gap-3 min-w-0 flex-1">
      <div className="overflow-hidden rounded-[12px] border border-white/20 bg-white/10 flex-shrink-0" style={{ width: '64px', height: '80px' }}>
        <img
          src={item?.previews?.front?.startsWith('data:image') ? item.previews.front : item.image}
          alt={item.title || 'Product'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white truncate">{item.title || item.name}</p>
        <p className="text-xs text-[var(--kc-gold-200)] font-semibold">₹{Number(item.price || 0).toLocaleString('en-IN')}</p>
      </div>
    </div>
    <KCButton
      variant="ghost"
      onClick={onMoveToBag}
      className="border-white/30 text-white hover:bg-white/10 text-xs px-3 py-2"
    >
      Move to bag
    </KCButton>
  </KCCard>
);

// Empty Cart State
const EmptyCartState = ({ recommendedProducts }) => (
  <div className="text-center space-y-8 py-16">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.12, ease: 'linear' }}
      className="space-y-4"
    >
      <h2 className="text-3xl md:text-4xl font-serif text-white">Your bag is empty</h2>
      <p className="text-white/70 max-w-md mx-auto">
        Continue exploring our curated collections to add your first piece.
      </p>
      <KCButton
        as={Link}
        to="/shop"
        className="bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold px-8 py-3 rounded-[14px] shadow-[0_4px_16px_rgba(211,167,95,0.3)]"
      >
        Continue Shopping
      </KCButton>
    </motion.div>

    {/* Recommended Products Carousel */}
    <div className="mt-16 space-y-6">
      <h3 className="text-2xl font-serif text-white">You might also like</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommendedProducts.map((product) => (
          <Link
            key={product.id}
            to={`/product/${product.id}`}
            className="group relative overflow-hidden rounded-[16px] border border-white/15 bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
          >
            <div className="relative aspect-[4/5] overflow-hidden">
              <img
                src={product.image}
                alt={product.name}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <div className="p-4 space-y-1">
              <h4 className="text-sm font-semibold text-white truncate">{product.name}</h4>
              <p className="text-sm font-bold text-[var(--kc-gold-200)]">₹{product.price.toLocaleString('en-IN')}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  </div>
);

export default Cart;
