// Simple in-memory cache for products with TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map();

export const getCachedProducts = (key) => {
  const cached = cache.get(key);
  if (!cached) return null;
  
  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
};

export const setCachedProducts = (key, data) => {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
};

export const clearCache = () => {
  cache.clear();
};

// Clear cache on window focus (optional - for fresh data on return)
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    // Optionally clear cache when user returns to tab
    // clearCache();
  });
}

