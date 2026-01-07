import React, { useState, useMemo, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ShoppingCart, Star } from 'lucide-react';
import { KCButton, KCCard, LoadingSpinner } from './ui';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';
import { cardVariants, gridItemVariants } from '../lib/motionVariants';
import { useCart } from '../context/CartContext';
import OptimizedImage from './OptimizedImage';

const ProductCard = ({
  id,
  name,
  price,
  image,
  hoverImage,
  originalPrice,
  badge,
  rating,
  reviewCount,
  currency = '₹',
  onAddToCart,
  onQuickView,
  variants = [],
  colors = [],
  ...rest
}) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [isHovering, setIsHovering] = useState(false);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const hasDiscount = Boolean(originalPrice && originalPrice > price);
  const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  
  // Get color variants grouped by color
  const colorVariants = useMemo(() => {
    if (!variants || variants.length === 0) {
      // Fallback to simple color array
      return colors.map((color, idx) => ({
        id: `color-${idx}`,
        color,
        slug: color.toLowerCase().replace(/\s+/g, '-'),
        images: rest?.images || [image],
      }));
    }
    
    const colorMap = new Map();
    variants.forEach((variant) => {
      if (variant.color) {
        if (!colorMap.has(variant.color)) {
          colorMap.set(variant.color, {
            id: variant._id || variant.id || `variant-${variant.color}`,
            color: variant.color,
            slug: variant.slug || variant.color.toLowerCase().replace(/\s+/g, '-'),
            images: variant.images && variant.images.length > 0 
              ? variant.images 
              : (rest?.images || [image]),
          });
        }
      }
    });
    return Array.from(colorMap.values());
  }, [variants, colors, rest?.images, image]);

  // Get current variant images based on selected color
  const currentVariant = colorVariants[selectedColorIndex] || colorVariants[0];
  const primaryImage = currentVariant?.images?.[0] || image || '/placeholder-product.jpg';
  const secondaryImage = currentVariant?.images?.[1] || hoverImage || rest?.secondaryImage || rest?.images?.[1];

  const shouldReduceMotion = useReducedMotion();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  const handleAddToCart = async (event) => {
    event.preventDefault();
    event.stopPropagation();
    
    setIsAddingToCart(true);
    
    // If a custom onAddToCart handler is provided, use it
    if (onAddToCart) {
      try {
        await onAddToCart({ id, name, price, image, ...rest });
      } finally {
        setIsAddingToCart(false);
      }
      return;
    }
    
    // Otherwise, use the cart context
    const selectedColor = currentVariant?.color || colors?.[0] || null;
    const variantId = currentVariant?.id || null;
    
    try {
      await addToCart({
        productId: id,
        title: name,
        name: name,
        price: price,
        image: primaryImage,
        quantity: 1,
        size: rest?.sizes?.[0] || null,
        color: selectedColor,
        variantId: variantId,
        ...rest
      });
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <motion.div
      className="group relative product-card"
      variants={shouldReduceMotion ? {} : gridItemVariants}
      initial="initial"
      animate="animate"
      whileHover={shouldReduceMotion ? {} : { y: -2, transition: { duration: 0.22, ease: ANIMATION_EASE } }}
      style={{ height: '100%', padding: '5px' }}
    >
      <div
        className="relative overflow-hidden product-card-glass"
        style={{
          background: 'transparent',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(255,255,255,0.03)',
          padding: 0,
          transition: shouldReduceMotion ? 'none' : 'all 260ms var(--kc-ease)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <Link 
          to={`/product/${id}`} 
          state={{ 
            id, 
            name, 
            price, 
            image: primaryImage, 
            images: currentVariant?.images || rest?.images,
            variants: variants,
            colors: colors,
            ...rest 
          }} 
          className="block focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 focus-visible:rounded-[24px]"
          aria-label={`View product details for ${name}`}
        >
          {/* Image Container - Fixed 4:5 Aspect Ratio with OptimizedImage */}
          <div 
            className="relative overflow-hidden product-card__image flex-shrink-0"
            style={{ 
              borderRadius: '16px 16px 0 0',
              background: 'transparent',
              marginBottom: 0,
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={`${primaryImage}-${selectedColorIndex}`}
                initial={{ opacity: 0, scale: 1 }}
                animate={{ 
                  opacity: 1, 
                  scale: isHovering && !shouldReduceMotion ? 1.03 : 1,
                  transition: { 
                    opacity: { duration: 0.3, ease: ANIMATION_EASE },
                    scale: { duration: 0.4, ease: ANIMATION_EASE }
                  }
                }}
                exit={{ 
                  opacity: 0,
                  transition: { duration: 0.2, ease: ANIMATION_EASE }
                }}
                style={{ width: '100%', height: '100%' }}
              >
                <OptimizedImage
                  src={primaryImage}
                  alt={name}
                  aspectRatio="4/5"
                  priority={false}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  objectFit="cover"
                  className="product-card-image"
              />
              </motion.div>
            </AnimatePresence>
            {secondaryImage && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: isHovering ? 1 : 0,
                  transition: shouldReduceMotion ? { duration: 0 } : { duration: 0.28, ease: ANIMATION_EASE }
                }}
              >
                <OptimizedImage
                  src={secondaryImage}
                  alt={`${name} - alternate view`}
                  aspectRatio="4/5"
                  priority={false}
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  objectFit="cover"
                  className="product-card-image-hover"
                />
              </motion.div>
            )}

            {/* Rating Badge - Top Left (Reference Style) */}
            {rating && (
              <div 
                className="absolute top-3 left-3 z-20 flex items-center gap-1.5 rounded-full px-2.5 py-1"
                style={{
                  background: 'rgba(248,244,238,0.98)',
                  fontSize: '12px',
                  fontWeight: 500,
                  color: 'var(--kc-navy-700)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15), 0 2px 6px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                }}
              >
                <Star size={14} className="text-[var(--kc-gold-200)]" fill="var(--kc-gold-200)" />
                <span>{rating.toFixed(1)}</span>
                {reviewCount && (
                  <span style={{ color: 'var(--kc-ink-2)', fontSize: '11px', marginLeft: '2px' }}>
                    ({reviewCount})
                  </span>
                )}
              </div>
            )}

            {/* Discount Badge - Top Right (if rating exists, otherwise top-left) */}
            {hasDiscount && (
              <div 
                className={`absolute ${rating ? 'top-3 right-3' : 'top-3 left-3'} z-20 rounded-full px-2.5 py-1`}
                style={{
                  background: 'rgba(9,15,28,0.95)',
                  border: '1px solid rgba(255,255,255,0.25)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: 'var(--kc-cream-100)',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.25), 0 2px 6px rgba(0,0,0,0.15)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                -{discountPercent}%
              </div>
            )}

            {/* Color Dots - Top Right (Only when no discount badge) */}
            {colorVariants.length > 1 && !hasDiscount && (
              <div 
                className="absolute top-3 right-3 flex gap-1.5 z-20"
                onClick={(e) => e.preventDefault()}
              >
                {colorVariants.map((variant, index) => {
                  const isSelected = selectedColorIndex === index;
                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setSelectedColorIndex(index);
                      }}
                      className="rounded-full transition-all focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
                      style={{
                        width: '16px',
                        height: '16px',
                        backgroundColor: getColorValue(variant.color),
                        border: isSelected 
                          ? '2px solid var(--kc-gold-200)' 
                          : '2px solid rgba(255,255,255,0.7)',
                        boxShadow: isSelected
                          ? '0 0 0 2px rgba(211,167,95,0.3), 0 2px 6px rgba(0,0,0,0.25)'
                          : '0 2px 6px rgba(0,0,0,0.2)',
                        transform: isSelected && !shouldReduceMotion ? 'scale(1.1)' : 'scale(1)',
                        transition: shouldReduceMotion ? 'none' : 'all 220ms var(--kc-ease)',
                      }}
                      aria-label={`Select color ${variant.color}`}
                      aria-pressed={isSelected}
                      title={variant.color}
                      tabIndex={0}
                      onMouseEnter={() => {
                        setSelectedColorIndex(index);
                      }}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Card Content - Bottom Section (Reference Style) */}
          <div 
            className="px-4 pb-4 pt-3 flex flex-col gap-3 relative product-card__content rounded-b-[16px]"
            style={{ 
              background: 'var(--kc-navy-900)',
              zIndex: 3,
              flex: '0 0 auto',
              minHeight: '120px',
            }}
          >
              {/* Product Name */}
              <h3 
              className="text-[15px] font-semibold leading-tight line-clamp-2"
                style={{ 
                  fontWeight: 600,
                letterSpacing: '0.01em',
                  color: 'var(--kc-cream-100)',
                lineHeight: '1.4',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minHeight: '42px',
                maxHeight: '42px',
                }}
                title={name}
              >
                {name}
              </h3>
              
              {/* Price */}
            <div className="flex items-center gap-2">
                <span 
                className="text-[16px] font-bold"
                  style={{ 
                    fontWeight: 700,
                    color: 'var(--kc-gold-200)',
                  }}
                >
                  {currency}{price?.toLocaleString('en-IN') ?? price}
                </span>
                {hasDiscount && originalPrice && (
                  <span 
                  className="text-sm line-through"
                    style={{ 
                      color: 'var(--kc-ink-2)',
                    opacity: 0.6,
                    }}
                  >
                    {currency}{originalPrice?.toLocaleString('en-IN') ?? originalPrice}
                  </span>
                )}
            </div>

            {/* Add to Bag Button - Always Visible (Reference Style) */}
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="add-to-bag-btn inline-flex items-center justify-center gap-2 rounded-lg focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
              style={{
                padding: '10px 16px',
                fontSize: '14px',
                fontWeight: 600,
                color: 'var(--kc-navy-900)',
                background: 'linear-gradient(135deg, var(--kc-gold-200), var(--kc-gold-100))',
                border: 'none',
                boxShadow: '0 2px 8px rgba(211,167,95,0.3)',
                transition: shouldReduceMotion ? 'none' : 'all 220ms var(--kc-ease)',
                cursor: isAddingToCart ? 'not-allowed' : 'pointer',
                opacity: isAddingToCart ? 0.7 : 1,
              }}
              aria-label={`Add ${name} to bag`}
            >
              {isAddingToCart ? (
                <>
                  <LoadingSpinner size={16} />
                  <span>Adding...</span>
                </>
              ) : (
                <>
                  <ShoppingCart size={16} strokeWidth={2} />
                  <span>Add to Bag</span>
                </>
              )}
            </button>
          </div>
        </Link>
      </div>
    </motion.div>
  );
};

const AnimateFadeIn = ({ visible, children }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: visible ? 1 : 0, y: visible ? 0 : 18 }}
    transition={{ duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }}
  >
    {visible ? children : null}
  </motion.div>
);

// Helper function to convert color name to hex value for swatches
const getColorValue = (colorName) => {
  const colorMap = {
    'white': '#FFFFFF',
    'off-white': '#F5F5DC',
    'cream': '#FFFDD0',
    'ivory': '#FFFFF0',
    'black': '#000000',
    'charcoal': '#36454F',
    'navy': '#000080',
    'gray': '#808080',
    'heather gray': '#B6B6B6',
    'slate': '#708090',
    'pink': '#FFC0CB',
    'rose': '#FF007F',
    'blush': '#DE5D83',
    'brown': '#8B4513',
    'tan': '#D2B48C',
    'beige': '#F5F5DC',
    'red': '#FF0000',
    'blue': '#0000FF',
    'green': '#008000',
    'yellow': '#FFFF00',
    'orange': '#FFA500',
    'purple': '#800080',
  };
  
  const normalized = colorName.toLowerCase().trim();
  return colorMap[normalized] || '#CCCCCC'; // Default gray if color not found
};

// Memoize ProductCard to prevent unnecessary re-renders
export default memo(ProductCard, (prevProps, nextProps) => {
  // Only re-render if these props change
  return (
    prevProps.id === nextProps.id &&
    prevProps.name === nextProps.name &&
    prevProps.price === nextProps.price &&
    prevProps.image === nextProps.image &&
    prevProps.rating === nextProps.rating &&
    prevProps.originalPrice === nextProps.originalPrice
  );
});
