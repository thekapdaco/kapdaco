// components/ReviewForm.jsx
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { KCButton, KCInput, LoadingSpinner } from './ui';
import { Star, X } from 'lucide-react';
import { createReview, updateReview } from '../lib/reviews';
import { motion, AnimatePresence } from 'framer-motion';

const ReviewForm = ({ productId, existingReview, onSuccess, onCancel }) => {
  const { token, isAuthenticated } = useAuth();
  const [comment, setComment] = useState(existingReview?.comment || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ratingState, setRatingState] = useState(existingReview?.rating || 0);
  const [hoverState, setHoverState] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      setError('Please log in to write a review');
      return;
    }

    if (ratingState < 1 || ratingState > 5) {
      setError('Please select a rating');
      return;
    }

    setError('');
    setLoading(true);

    try {
      if (existingReview) {
        // Update existing review
        await updateReview(existingReview.id, {
          rating: ratingState,
          comment: comment.trim()
        }, token);
      } else {
        // Create new review
        await createReview({
          productId,
          rating: ratingState,
          comment: comment.trim()
        }, token);
      }

      onSuccess?.();
    } catch (err) {
      setError(err.message || 'Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="rounded-[16px] border border-white/15 bg-white/10 p-6 text-center">
        <p className="text-white/80 mb-4">Please log in to write a review</p>
        <KCButton as="a" href="/login" variant="secondary">
          Log In
        </KCButton>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[16px] border border-white/15 bg-white/10 p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          {existingReview ? 'Edit Your Review' : 'Write a Review'}
        </h3>
        {onCancel && (
          <button
            onClick={onCancel}
            className="text-white/60 hover:text-white transition-colors"
            aria-label="Cancel"
          >
            <X size={20} />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-white mb-2">
            Rating <span className="text-white/60">(required)</span>
          </label>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => {
              const displayRating = hoverState || ratingState;
              const isActive = star <= displayRating;
              
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRatingState(star)}
                  onMouseEnter={() => setHoverState(star)}
                  onMouseLeave={() => setHoverState(0)}
                  className="transition-transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 rounded"
                  aria-label={`Rate ${star} star${star !== 1 ? 's' : ''}`}
                >
                  <Star
                    size={32}
                    className={isActive ? 'fill-[var(--kc-gold-200)] text-[var(--kc-gold-200)]' : 'text-white/30'}
                  />
                </button>
              );
            })}
            {ratingState > 0 && (
              <span className="text-sm text-white/60 ml-2">
                {ratingState === 1 && 'Poor'}
                {ratingState === 2 && 'Fair'}
                {ratingState === 3 && 'Good'}
                {ratingState === 4 && 'Very Good'}
                {ratingState === 5 && 'Excellent'}
              </span>
            )}
          </div>
        </div>

        {/* Comment */}
        <div>
          <label htmlFor="review-comment" className="block text-sm font-medium text-white mb-2">
            Your Review <span className="text-white/60">(optional)</span>
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your thoughts about this product..."
            rows={4}
            maxLength={1000}
            className="w-full rounded-[12px] border border-white/20 bg-white/10 px-4 py-3 text-white placeholder-white/50 focus:border-[var(--kc-gold-200)] focus:outline-none focus:ring-2 focus:ring-[var(--kc-gold-200)]/20 transition-colors resize-none"
          />
          <p className="text-xs text-white/60 mt-1">
            {comment.length}/1000 characters
          </p>
        </div>

        {error && (
          <div className="rounded-[12px] border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <KCButton
            type="submit"
            disabled={loading || ratingState < 1}
            className="flex-1 bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold"
            icon={loading ? <LoadingSpinner size={16} color="var(--kc-navy-900)" /> : null}
          >
            {loading ? 'Submitting...' : existingReview ? 'Update Review' : 'Submit Review'}
          </KCButton>
          {onCancel && (
            <KCButton
              type="button"
              variant="secondary"
              onClick={onCancel}
              disabled={loading}
              className="border-2 border-white/30 text-white hover:bg-white/10"
            >
              Cancel
            </KCButton>
          )}
        </div>
      </form>
    </motion.div>
  );
};

export default ReviewForm;

