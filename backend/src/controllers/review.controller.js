// controllers/review.controller.js
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import logger from '../utils/logger.js';

/**
 * Update product rating based on all reviews
 */
const updateProductRating = async (productId) => {
  try {
    const reviews = await Review.find({ productId, flagged: false });
    
    if (reviews.length === 0) {
      await Product.findByIdAndUpdate(productId, { rating: 0 });
      return 0;
    }

    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
    const roundedRating = Math.round(averageRating * 10) / 10; // Round to 1 decimal place

    await Product.findByIdAndUpdate(productId, { rating: roundedRating });
    
    logger.info('Product rating updated', { productId, rating: roundedRating, reviewCount: reviews.length });
    return roundedRating;
  } catch (error) {
    logger.error('Failed to update product rating', { productId, error: error.message });
    throw error;
  }
};

/**
 * Check if user has purchased the product (can review)
 */
const hasUserPurchasedProduct = async (userId, productId) => {
  try {
    const order = await Order.findOne({
      userId,
      'items.productId': productId,
      paymentStatus: 'paid',
      status: { $in: ['processing', 'shipped', 'delivered'] }
    });
    return !!order;
  } catch (error) {
    logger.error('Failed to check purchase status', { userId, productId, error: error.message });
    return false;
  }
};

/**
 * Get reviews for a product
 * GET /api/reviews/product/:productId
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, sort = 'newest' } = req.query;

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Build query - exclude flagged reviews unless admin
    const query = { productId, flagged: false };
    
    // Admins can see flagged reviews
    if (req.user?.role === 'admin' && req.query.includeFlagged === 'true') {
      delete query.flagged;
    }

    // Sorting options
    let sortOption = { createdAt: -1 }; // Default: newest first
    if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    } else if (sort === 'rating-high') {
      sortOption = { rating: -1, createdAt: -1 };
    } else if (sort === 'rating-low') {
      sortOption = { rating: 1, createdAt: -1 };
    }

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const [reviews, total] = await Promise.all([
      Review.find(query)
        .populate('userId', 'name email')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Review.countDocuments(query)
    ]);

    // Get rating distribution
    const ratingDistribution = await Review.aggregate([
      { $match: { productId: product._id, flagged: false } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      }
    ]);

    const distribution = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0
    };
    ratingDistribution.forEach(item => {
      distribution[item._id] = item.count;
    });

    res.json({
      reviews: reviews.map(review => ({
        id: review._id,
        productId: review.productId,
        userId: review.userId?._id,
        userName: review.userId?.name || 'Anonymous',
        userEmail: review.userId?.email,
        rating: review.rating,
        comment: review.comment,
        flagged: review.flagged,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      })),
      pagination: {
        current: pageNum,
        total: Math.ceil(total / limitNum),
        hasNext: skip + reviews.length < total,
        hasPrev: pageNum > 1,
        totalReviews: total
      },
      ratingDistribution: distribution,
      averageRating: product.rating || 0
    });
  } catch (error) {
    logger.error('Get product reviews error', { error: error.message, productId: req.params.productId });
    res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

/**
 * Get user's review for a product
 * GET /api/reviews/product/:productId/my-review
 */
export const getMyReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user.id;

    const review = await Review.findOne({ productId, userId })
      .populate('userId', 'name email')
      .lean();

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    res.json({
      review: {
        id: review._id,
        productId: review.productId,
        userId: review.userId?._id,
        userName: review.userId?.name,
        rating: review.rating,
        comment: review.comment,
        flagged: review.flagged,
        createdAt: review.createdAt,
        updatedAt: review.updatedAt
      }
    });
  } catch (error) {
    logger.error('Get my review error', { error: error.message, userId: req.user.id, productId: req.params.productId });
    res.status(500).json({ message: 'Failed to fetch review' });
  }
};

/**
 * Create a new review
 * POST /api/reviews
 */
export const createReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user.id;

    // Validation
    if (!productId || !rating) {
      return res.status(400).json({ message: 'Product ID and rating are required' });
    }

    if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
      return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
    }

    // Validate product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check if user already reviewed this product
    const existingReview = await Review.findOne({ productId, userId });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this product. Update your existing review instead.' });
    }

    // Optional: Check if user has purchased the product (can be enabled for verified reviews)
    // const hasPurchased = await hasUserPurchasedProduct(userId, productId);
    // if (!hasPurchased && req.user.role !== 'admin') {
    //   return res.status(403).json({ message: 'You must purchase this product before reviewing it' });
    // }

    // Create review
    const review = await Review.create({
      productId,
      userId,
      rating: parseInt(rating, 10),
      comment: comment?.trim() || null,
      flagged: false
    });

    // Update product rating
    await updateProductRating(productId);

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'name email')
      .lean();

    logger.info('Review created', { reviewId: review._id, productId, userId, rating });

    res.status(201).json({
      message: 'Review created successfully',
      review: {
        id: populatedReview._id,
        productId: populatedReview.productId,
        userId: populatedReview.userId?._id,
        userName: populatedReview.userId?.name,
        rating: populatedReview.rating,
        comment: populatedReview.comment,
        createdAt: populatedReview.createdAt,
        updatedAt: populatedReview.updatedAt
      }
    });
  } catch (error) {
    logger.error('Create review error', { error: error.message, userId: req.user?.id, productId: req.body.productId });
    res.status(500).json({ message: 'Failed to create review' });
  }
};

/**
 * Update a review
 * PATCH /api/reviews/:reviewId
 */
export const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership (unless admin)
    if (review.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only update your own reviews' });
    }

    // Update fields
    if (rating !== undefined) {
      if (rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
        return res.status(400).json({ message: 'Rating must be an integer between 1 and 5' });
      }
      review.rating = parseInt(rating, 10);
    }

    if (comment !== undefined) {
      review.comment = comment?.trim() || null;
    }

    await review.save();

    // Update product rating
    await updateProductRating(review.productId);

    const populatedReview = await Review.findById(review._id)
      .populate('userId', 'name email')
      .lean();

    logger.info('Review updated', { reviewId, productId: review.productId, userId });

    res.json({
      message: 'Review updated successfully',
      review: {
        id: populatedReview._id,
        productId: populatedReview.productId,
        userId: populatedReview.userId?._id,
        userName: populatedReview.userId?.name,
        rating: populatedReview.rating,
        comment: populatedReview.comment,
        flagged: populatedReview.flagged,
        createdAt: populatedReview.createdAt,
        updatedAt: populatedReview.updatedAt
      }
    });
  } catch (error) {
    logger.error('Update review error', { error: error.message, reviewId: req.params.reviewId, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to update review' });
  }
};

/**
 * Delete a review
 * DELETE /api/reviews/:reviewId
 */
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    // Check ownership (unless admin)
    if (review.userId.toString() !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    const productId = review.productId;

    await Review.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductRating(productId);

    logger.info('Review deleted', { reviewId, productId, userId });

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    logger.error('Delete review error', { error: error.message, reviewId: req.params.reviewId, userId: req.user?.id });
    res.status(500).json({ message: 'Failed to delete review' });
  }
};

/**
 * Flag a review (for moderation)
 * POST /api/reviews/:reviewId/flag
 */
export const flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.flagged = true;
    await review.save();

    // Update product rating (exclude flagged review)
    await updateProductRating(review.productId);

    logger.info('Review flagged', { reviewId, productId: review.productId, flaggedBy: req.user.id });

    res.json({ message: 'Review flagged for moderation' });
  } catch (error) {
    logger.error('Flag review error', { error: error.message, reviewId: req.params.reviewId });
    res.status(500).json({ message: 'Failed to flag review' });
  }
};

/**
 * Unflag a review (admin only)
 * POST /api/reviews/:reviewId/unflag
 */
export const unflagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    review.flagged = false;
    await review.save();

    // Update product rating (include unflagged review)
    await updateProductRating(review.productId);

    logger.info('Review unflagged', { reviewId, productId: review.productId, unflaggedBy: req.user.id });

    res.json({ message: 'Review unflagged successfully' });
  } catch (error) {
    logger.error('Unflag review error', { error: error.message, reviewId: req.params.reviewId });
    res.status(500).json({ message: 'Failed to unflag review' });
  }
};

