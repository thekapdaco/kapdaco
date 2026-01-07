/**
 * Image URL utility functions
 * Ensures all image URLs use relative paths to work with Vite proxy
 */

/**
 * Normalizes an image URL to use a relative path
 * Converts absolute URLs (like http://localhost:5000/uploads/...) to relative paths (/uploads/...)
 * @param {string} url - The image URL (can be absolute or relative)
 * @returns {string} - Normalized relative path
 */
export const normalizeImageUrl = (url) => {
  if (!url) return '';
  
  // If it's already a relative path starting with /, return as is
  if (url.startsWith('/')) {
    return url;
  }
  
  // If it's an absolute URL, extract the pathname
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const urlObj = new URL(url);
      return urlObj.pathname; // Returns /uploads/products/filename.png
    } catch (e) {
      // If URL parsing fails, try to extract path manually
      const match = url.match(/\/uploads\/[^/]+\/[^/]+/);
      if (match) {
        return match[0];
      }
      // Fallback: return as relative path
      return url.startsWith('/') ? url : `/${url}`;
    }
  }
  
  // If it doesn't start with /, add it
  return url.startsWith('/') ? url : `/${url}`;
};

/**
 * Normalizes an array of image URLs
 * @param {string[]} urls - Array of image URLs
 * @returns {string[]} - Array of normalized relative paths
 */
export const normalizeImageUrls = (urls) => {
  if (!Array.isArray(urls)) return [];
  return urls.map(normalizeImageUrl).filter(Boolean);
};

