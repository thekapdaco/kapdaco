import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "./AuthContext";
import { api } from "../lib/api.js";
import { trackAddToCart, trackRemoveFromCart } from "../lib/analytics";
import { useToast } from "../components/Toast";

const CartContext = createContext();

const LOCAL_KEY = "kapda_cart_v1";

function computeTotals(items, coupon) {
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price || 0) * Number(it.quantity || 1)), 0);
  const cartDiscount = coupon?.type === 'percent' ? Math.round(subtotal * (coupon.value / 100)) : (coupon?.type === 'flat' ? coupon.value : 0);
  const discounted = Math.max(0, subtotal - cartDiscount);
  const shipping = discounted >= 999 ? 0 : 49;
  const tax = Math.round(discounted * 0.18);
  const total = Math.max(0, discounted + shipping + tax);
  return { subtotal, cartDiscount, shipping, tax, total };
}

export const CartProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const toast = useToast();
  const [cart, setCart] = useState({ items: [], coupon: null, totals: { subtotal: 0, cartDiscount: 0, shipping: 0, tax: 0, total: 0 } });
  const [loading, setLoading] = useState(false);
  const prevTokenRef = useRef(null);

  const persistLocal = (data) => {
    try { localStorage.setItem(LOCAL_KEY, JSON.stringify(data)); } catch {}
  };
  const readLocal = () => {
    try { const raw = localStorage.getItem(LOCAL_KEY); return raw ? JSON.parse(raw) : { items: [], coupon: null }; } catch { return { items: [], coupon: null }; }
  };

  // Transform backend cart items to frontend format
  const transformCartItems = (items) => {
    if (!items || !Array.isArray(items)) return [];
    return items.map((item) => {
      // If item already has frontend format (has title/name), return as is
      if (item.title || item.name) {
        return item;
      }
      
      // If item has populated productId from backend
      const product = item.productId;
      if (product && typeof product === 'object' && product.title) {
        return {
          ...item,
          id: item._id?.toString() || item.id,
          productId: product._id?.toString() || product.id || item.productId,
          title: product.title,
          name: product.title,
          price: product.discountPrice || product.price || 0,
          image: product.mainImage || product.images?.[0] || product.image || '',
          images: product.images || [],
          sizes: product.sizes || [],
          colors: product.colors || [],
          variants: product.variants || [],
        };
      }
      
      // If productId is just an ID, return item as is (will need to fetch product later)
      return {
        ...item,
        id: item._id?.toString() || item.id,
        productId: typeof item.productId === 'object' ? item.productId._id?.toString() || item.productId.id : item.productId,
      };
    });
  };

  const recalcAndSet = (next) => {
    const transformedItems = transformCartItems(next.items || []);
    const totals = computeTotals(transformedItems, next.coupon);
    const updated = { ...next, items: transformedItems, totals };
    setCart(updated);
    return updated;
  };

  const loadCart = async () => {
    if (!isAuthenticated) {
      const local = readLocal();
      recalcAndSet({ items: local.items || [], coupon: local.coupon || null });
      return;
    }
    
    setLoading(true);
    try {
      const c = await api("/api/cart");
      
      // Merge backend cart items with local custom items (products that don't have MongoDB ObjectIds)
      const local = readLocal();
      const isMongoId = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
      const customItems = (local.items || []).filter(it => !isMongoId(it.productId));
      
      // Combine backend items with custom items
      const allItems = [...(c.items || []), ...customItems];
      
      const withTotals = recalcAndSet({ items: allItems, coupon: c.coupon || local.coupon || null });
      return withTotals;
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('403')) {
        // Only log in development
        if (import.meta.env.DEV) {
          console.warn('Authentication required - loading local cart');
        }
        const local = readLocal();
        return recalcAndSet({ items: local.items || [], coupon: local.coupon || null });
      }
      // Only log in development
      if (import.meta.env.DEV) {
        console.error('Error loading cart:', error);
      }
      throw error;
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    const wasLoggedIn = !!prevTokenRef.current;
    const isLoggedIn = isAuthenticated;
    // Merge guest cart into user cart on login
    (async () => {
      if (!wasLoggedIn && isLoggedIn) {
        const local = readLocal();
        if (local.items?.length) {
          const isMongoId = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
          const serverItems = local.items.filter(it => isMongoId(it.productId));
          const customItems = local.items.filter(it => !isMongoId(it.productId));
          for (const it of serverItems) {
            try {
              await api("/api/cart/add", { method: "POST", body: { productId: it.productId, quantity: it.quantity, size: it.size, color: it.color } });
            } catch {}
          }
          // Preserve custom items locally for logged-in users
          if (customItems.length) {
            persistLocal({ items: customItems, coupon: local.coupon });
          } else {
            localStorage.removeItem(LOCAL_KEY);
          }
        }
      }
      await loadCart();
      prevTokenRef.current = isLoggedIn;
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Keep local storage in sync - store custom items for logged-in users too
  useEffect(() => {
    if (!isAuthenticated) {
      // For guests, store all items
      persistLocal({ items: cart.items, coupon: cart.coupon });
    } else {
      // For logged-in users, only store custom items (non-MongoDB ObjectIds) locally
      const isMongoId = (v) => typeof v === 'string' && /^[a-fA-F0-9]{24}$/.test(v);
      const customItems = (cart.items || []).filter(it => !isMongoId(it.productId));
      if (customItems.length > 0) {
        persistLocal({ items: customItems, coupon: cart.coupon });
      }
    }
  }, [isAuthenticated, cart.items, cart.coupon]);

  const addToCart = async ({ productId, title, price, image, quantity = 1, size, color, variantId, minQty = 1, maxQty = 99, step = 1, ...extras }) => {
    const isMongoId = typeof productId === 'string' && /^[a-fA-F0-9]{24}$/.test(productId);
    if (!isAuthenticated || !isMongoId) {
      const items = [...(cart.items || [])];
      // Include variantId in key for proper variant distinction
      const key = `${productId}__${size || ''}__${color || ''}__${variantId || ''}`;
      const idx = items.findIndex(i => i.key === key);
      if (idx >= 0) {
        const nextQty = Math.max(minQty, Math.min(maxQty, items[idx].quantity + quantity));
        const normalized = Math.max(minQty, Math.min(maxQty, Math.round(nextQty / step) * step));
        items[idx] = { ...items[idx], quantity: normalized };
      } else {
        const normalized = Math.max(minQty, Math.min(maxQty, Math.round(quantity / step) * step));
        // Preserve any extra fields like customization payloads and previews for custom items
        items.push({ key, productId, title, price, image, quantity: normalized, size, color, variantId, minQty, maxQty, step, ...extras });
      }
      recalcAndSet({ ...cart, items });
      
      // Show success toast for guest users
      toast.success('Item added to cart successfully!', 3000);
      return;
    }
    const c = await api("/api/cart/add", { method: "POST", body: { productId, quantity, size, color, variantId } });
    recalcAndSet({ items: c.items || [], coupon: c.coupon || null });
    
    // Track analytics event
    trackAddToCart(productId, title || 'Product', price || 0, quantity);
    
    // Show success toast with customer name
    const customerName = user?.name || 'Customer';
    toast.success(`${customerName}, item added to cart successfully!`, 3000);
  };

  const updateItem = async (itemRef, quantity) => {
    if (!isAuthenticated) {
      const items = [...(cart.items || [])];
      const idx = items.findIndex(i => i.key === itemRef || i.id === itemRef);
      if (idx === -1) return;
      const { minQty = 1, maxQty = 99, step = 1 } = items[idx];
      const normalized = Math.max(minQty, Math.min(maxQty, Math.round(quantity / step) * step));
      items[idx] = { ...items[idx], quantity: normalized };
      recalcAndSet({ ...cart, items });
      return;
    }
    const c = await api(`/api/cart/item/${itemRef}`, { method: "PATCH", body: { quantity } });
    recalcAndSet({ items: c.items || [], coupon: c.coupon || null });
  };

  const removeItem = async (itemRef) => {
    // Find item before removing for analytics
    const itemToRemove = cart.items?.find(i => (i.key === itemRef || i.id === itemRef));
    
    if (!isAuthenticated) {
      const items = (cart.items || []).filter(i => (i.key !== itemRef && i.id !== itemRef));
      recalcAndSet({ ...cart, items });
      
      // Track analytics
      if (itemToRemove) {
        trackRemoveFromCart(itemToRemove.productId || itemToRemove.id, itemToRemove.title || itemToRemove.name || 'Product');
      }
      return;
    }
    const c = await api(`/api/cart/item/${itemRef}`, { method: "DELETE" });
    recalcAndSet({ items: c.items || [], coupon: c.coupon || null });
    
    // Track analytics
    if (itemToRemove) {
      trackRemoveFromCart(itemToRemove.productId || itemToRemove.id, itemToRemove.title || itemToRemove.name || 'Product');
    }
  };

  const clearCart = async () => {
    if (!isAuthenticated) { recalcAndSet({ items: [], coupon: null }); return; }
    const c = await api(`/api/cart/clear`, { method: "DELETE" });
    recalcAndSet({ items: c.items || [], coupon: c.coupon || null });
  };

  const applyCoupon = async (code) => {
    if (!isAuthenticated) {
      const coupon = code === 'WELCOME10' ? { code, type: 'percent', value: 10 } : { code, type: 'flat', value: 0 };
      recalcAndSet({ ...cart, coupon });
      return coupon;
    }
    const c = await api(`/api/cart/coupon`, { method: "POST", body: { code } });
    recalcAndSet({ items: c.items || [], coupon: c.coupon || null });
    return c.coupon;
  };

  const removeCoupon = async () => {
    if (!isAuthenticated) { recalcAndSet({ ...cart, coupon: null }); return; }
    const c = await api(`/api/cart/coupon`, { method: "DELETE" });
    recalcAndSet({ items: c.items || [], coupon: c.coupon || null });
  };

  const value = useMemo(() => ({
    cart,
    loading,
    loadCart,
    addToCart,
    updateItem,
    removeItem,
    clearCart,
    applyCoupon,
    removeCoupon,
  }), [cart, loading]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
