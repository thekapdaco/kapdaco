// Analytics helper for Google Analytics 4 and other tracking
// Usage: import { trackPageView, trackEvent } from '../lib/analytics';

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_ID;

/**
 * Initialize Google Analytics
 * Call this once on app mount if GA ID is provided
 */
export const initAnalytics = () => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') {
    return;
  }

  // Load gtag script
  const script1 = document.createElement('script');
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  // Initialize gtag
  window.dataLayer = window.dataLayer || [];
  function gtag() {
    window.dataLayer.push(arguments);
  }
  window.gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    page_path: window.location.pathname,
  });
};

/**
 * Track a page view
 * @param {string} path - The page path (e.g., '/shop', '/product/123')
 * @param {string} title - Optional page title
 */
export const trackPageView = (path, title = null) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Page view:', path, title);
    }
    return;
  }

  try {
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: path,
      page_title: title || document.title,
    });
  } catch (error) {
    console.error('[Analytics] Error tracking page view:', error);
  }
};

/**
 * Track a custom event
 * @param {string} eventName - Event name (e.g., 'add_to_cart', 'purchase')
 * @param {object} eventData - Event parameters
 */
export const trackEvent = (eventName, eventData = {}) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined' || !window.gtag) {
    if (import.meta.env.DEV) {
      console.log('[Analytics] Event:', eventName, eventData);
    }
    return;
  }

  try {
    window.gtag('event', eventName, eventData);
  } catch (error) {
    console.error('[Analytics] Error tracking event:', error);
  }
};

// Convenience functions for common e-commerce events
export const trackAddToCart = (productId, productName, price, quantity = 1) => {
  trackEvent('add_to_cart', {
    currency: 'INR',
    value: price * quantity,
    items: [{
      item_id: productId,
      item_name: productName,
      price: price,
      quantity: quantity,
    }],
  });
};

export const trackRemoveFromCart = (productId, productName) => {
  trackEvent('remove_from_cart', {
    items: [{
      item_id: productId,
      item_name: productName,
    }],
  });
};

export const trackBeginCheckout = (items, total) => {
  trackEvent('begin_checkout', {
    currency: 'INR',
    value: total,
    items: items.map(item => ({
      item_id: item.productId || item.id,
      item_name: item.name || item.title,
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
};

export const trackPurchase = (orderId, items, total, shipping = 0, tax = 0) => {
  trackEvent('purchase', {
    transaction_id: orderId,
    value: total,
    currency: 'INR',
    shipping: shipping,
    tax: tax,
    items: items.map(item => ({
      item_id: item.productId || item.id,
      item_name: item.name || item.title || 'Product',
      price: item.price,
      quantity: item.quantity || 1,
    })),
  });
};

export const trackViewItem = (productId, productName, price, category = null) => {
  trackEvent('view_item', {
    currency: 'INR',
    value: price,
    items: [{
      item_id: productId,
      item_name: productName,
      price: price,
      category: category,
    }],
  });
};

export const trackSearch = (searchTerm) => {
  trackEvent('search', {
    search_term: searchTerm,
  });
};

export default {
  initAnalytics,
  trackPageView,
  trackEvent,
  trackAddToCart,
  trackRemoveFromCart,
  trackBeginCheckout,
  trackPurchase,
  trackViewItem,
  trackSearch,
};

