// lib/reviews.js - Reviews API service
import { api } from './api.js';

/**
 * Get reviews for a product
 * @param {string} productId - Product ID
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.limit - Items per page (default: 10)
 * @param {string} options.sort - Sort option: 'newest' | 'oldest' | 'rating-high' | 'rating-low'
 * @returns {Promise<Object>} Reviews data with pagination
 */
export const getProductReviews = async (productId, options = {}) => {
  const { page = 1, limit = 10, sort = 'newest' } = options;
  
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sort
  });

  const response = await api(`/api/reviews/product/${productId}?${params}`);
  return response;
};

/**
 * Get user's review for a product
 * @param {string} productId - Product ID
 * @param {string} token - Auth token
 * @returns {Promise<Object|null>} User's review or null
 */
export const getMyReview = async (productId, token) => {
  try {
    const response = await api(`/api/reviews/product/${productId}/my-review`, {
      token
    });
    return response.review || null;
  } catch (error) {
    if (error.message.includes('404') || error.message.includes('not found')) {
      return null; // User hasn't reviewed yet
    }
    throw error;
  }
};

/**
 * Create a review
 * @param {Object} reviewData - Review data
 * @param {string} reviewData.productId - Product ID
 * @param {number} reviewData.rating - Rating (1-5)
 * @param {string} reviewData.comment - Review comment (optional)
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Created review
 */
export const createReview = async (reviewData, token) => {
  const { productId, rating, comment } = reviewData;

  if (!productId || !rating) {
    throw new Error('Product ID and rating are required');
  }

  if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
    throw new Error('Rating must be an integer between 1 and 5');
  }

  const response = await api('/api/reviews', {
    method: 'POST',
    token,
    body: {
      productId,
      rating: parseInt(rating, 10),
      comment: comment?.trim() || null
    }
  });

  return response.review;
};

/**
 * Update a review
 * @param {string} reviewId - Review ID
 * @param {Object} updates - Fields to update
 * @param {number} updates.rating - New rating (1-5)
 * @param {string} updates.comment - New comment
 * @param {string} token - Auth token
 * @returns {Promise<Object>} Updated review
 */
export const updateReview = async (reviewId, updates, token) => {
  const { rating, comment } = updates;

  const body = {};
  if (rating !== undefined) {
    body.rating = parseInt(rating, 10);
  }
  if (comment !== undefined) {
    body.comment = comment?.trim() || null;
  }

  const response = await api(`/api/reviews/${reviewId}`, {
    method: 'PATCH',
    token,
    body
  });

  return response.review;
};

/**
 * Delete a review
 * @param {string} reviewId - Review ID
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const deleteReview = async (reviewId, token) => {
  await api(`/api/reviews/${reviewId}`, {
    method: 'DELETE',
    token
  });
};

/**
 * Flag a review
 * @param {string} reviewId - Review ID
 * @param {string} token - Auth token
 * @returns {Promise<void>}
 */
export const flagReview = async (reviewId, token) => {
  await api(`/api/reviews/${reviewId}/flag`, {
    method: 'POST',
    token
  });
};

/**
 * Format date for display
 * @param {string|Date} date - Date to format
 * @returns {string} Formatted date (e.g., "2 weeks ago")
 */
export const formatReviewDate = (date) => {
  if (!date) return '';
  
  const now = new Date();
  const reviewDate = new Date(date);
  const diffInSeconds = Math.floor((now - reviewDate) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  }
  if (diffInSeconds < 2592000) {
    const weeks = Math.floor(diffInSeconds / 604800);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  }
  if (diffInSeconds < 31536000) {
    const months = Math.floor(diffInSeconds / 2592000);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  }
  
  const years = Math.floor(diffInSeconds / 31536000);
  return `${years} ${years === 1 ? 'year' : 'years'} ago`;
};

