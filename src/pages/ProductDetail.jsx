import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import { useLocation, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from 'framer-motion';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api.js';
import { KCButton, KCCard, LoadingSpinner, ProductCardSkeleton } from '../components/ui';
import ReviewForm from '../components/ReviewForm';
import { getProductReviews, getMyReview, formatReviewDate } from '../lib/reviews';
import SEO from '../components/SEO';
import { ANIMATION_DURATIONS, ANIMATION_EASE } from '../lib/animationConstants';
import { cardVariants } from '../lib/motionVariants';
import { getProductJsonLd, getBreadcrumbJsonLd, getOrganizationJsonLd } from '../lib/seoHelpers';
import {
  getColorValues,
  getSizeValues,
  getMediaForColor,
  getAvailableSizesForColor,
  resolveVariant,
  getDefaultColor,
  getDefaultSizeForColor,
  formatProductForDisplay
} from '../lib/productVariants.js';
import {
  ShieldCheck,
  Truck,
  RefreshCcw,
  Lock,
  Info,
  ChevronLeft,
  ChevronRight,
  X,
  ZoomIn,
  Star,
  Plus,
  Minus,
} from 'lucide-react';

const tabs = ['Description', 'Materials & Care', 'Reviews', 'Shipping & Returns'];

// Image preloader utility
const preloadImages = (urls) => {
  urls.forEach((url) => {
    const img = new Image();
    img.src = url;
  });
};

const ProductDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navProduct = location.state || {};
  const { addToCart } = useCart();
  const { token, isAuthenticated } = useAuth();
  const { scrollY } = useScroll();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const galleryRef = useRef(null);

  // Product state - formatted for display (supports both new and legacy formats)
  const [product, setProduct] = useState(() => {
    if (navProduct && navProduct.price) {
      return formatProductForDisplay(navProduct);
    }
    return {
      id: id,
      title: '',
      basePrice: 0,
      options: [],
      variants: [],
      media: [],
      colors: [],
      sizes: [],
      images: [],
      productId: id,
    };
  });
  
  const [loading, setLoading] = useState(!navProduct || !navProduct.price);
  
  // New variant system state
  const [selectedColorId, setSelectedColorId] = useState(null);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [resolvedVariant, setResolvedVariant] = useState(null);
  
  // Legacy state (for backwards compatibility)
  const [size, setSize] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null); // Legacy format
  
  const [qty, setQty] = useState(1);
  const [error, setError] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [isImageTransitioning, setIsImageTransitioning] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const colorSelectorRef = useRef(null);
  const [completeLookProducts, setCompleteLookProducts] = useState([]);
  
  // Reviews state
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [myReview, setMyReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewsPagination, setReviewsPagination] = useState({ current: 1, total: 0, totalReviews: 0 });
  const [ratingDistribution, setRatingDistribution] = useState({ 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
  const [averageRating, setAverageRating] = useState(0);

  // Show sticky bar on scroll
  useMotionValueEvent(scrollY, 'change', (latest) => {
    setShowStickyBar(latest > 300);
  });

  // Get available colors using new variant utilities
  const colorValues = useMemo(() => {
    return getColorValues(product);
  }, [product]);

  // Get available sizes using new variant utilities
  const sizeValues = useMemo(() => {
    return getSizeValues(product);
  }, [product]);

  // Get available sizes for selected color
  const availableSizesForColor = useMemo(() => {
    if (!selectedColorId) return sizeValues;
    return getAvailableSizesForColor(product, selectedColorId);
  }, [product, selectedColorId, sizeValues]);

  // Get media/images for selected color
  const currentMedia = useMemo(() => {
    if (!selectedColorId) {
      // Fallback to product media or legacy images
      if (product.media && product.media.length > 0) {
        return product.media.map(m => m.url || m.src || m);
      }
      if (product.images && product.images.length > 0) {
        return product.images;
      }
      if (product.image) {
        return [product.image];
      }
      if (navProduct?.images) {
        return navProduct.images;
      }
      return [];
    }
    return getMediaForColor(product, selectedColorId);
  }, [product, selectedColorId, navProduct]);

  // Resolve variant based on selected color and size
  useEffect(() => {
    if (!selectedColorId) return;
    
    const variant = resolveVariant(product, selectedColorId, selectedSizeId);
    
    if (variant) {
      setResolvedVariant(variant);
      setSelectedVariantId(variant.variantId || variant._id || variant.id);
      
      // Update legacy format for backwards compatibility
      setSelectedVariant({
        id: variant.variantId || variant._id || variant.id,
        color: variant.color?.value || variant.color,
        size: variant.size?.value || variant.size,
        images: currentMedia,
      });
      
      // Update legacy size
      if (variant.size) {
        setSize(variant.size.value || variant.size);
      }
    }
  }, [product, selectedColorId, selectedSizeId, currentMedia]);

  // Set default color on product load
  useEffect(() => {
    if (colorValues.length > 0 && !selectedColorId) {
      const defaultColor = getDefaultColor(product);
      if (defaultColor) {
        setSelectedColorId(defaultColor.valueId || defaultColor.id);
        
        // Set default size for this color
        const defaultSize = getDefaultSizeForColor(product, defaultColor.valueId || defaultColor.id);
        if (defaultSize) {
          setSelectedSizeId(defaultSize.valueId || defaultSize.id);
        }
      }
    }
  }, [product, colorValues, selectedColorId]);

  // Preload all variant images
  useEffect(() => {
    if (colorValues.length > 0) {
      const allImages = colorValues.flatMap((color) => {
        const media = getMediaForColor(product, color.valueId || color.id);
        return media;
      });
      const uniqueImages = [...new Set(allImages)];
      preloadImages(uniqueImages);
    }
  }, [colorValues, product]);

  // Get current images - use new media system
  const images = useMemo(() => {
    return currentMedia.length > 0 ? currentMedia : (product.images || [product.image] || []);
  }, [currentMedia, product.images, product.image]);

  // Reset active image when color changes
  useEffect(() => {
    setActiveImage(0);
  }, [selectedColorId]);

  useEffect(() => {
    let ignore = false;
    const fetchProduct = async () => {
      // Only use navProduct if it has sufficient data (title/name and at least one identifier field)
      // If navProduct is missing critical fields like images, variants, etc., fetch from API
      const hasSufficientData = navProduct && 
        (navProduct.title || navProduct.name) && 
        (navProduct.price || navProduct.basePrice) &&
        (navProduct.images || navProduct.image || navProduct.mainImage || navProduct.media);
      
      if (hasSufficientData) { 
        // Format navProduct using utility
        const formatted = formatProductForDisplay(navProduct);
        if (!ignore) {
          setProduct(formatted);
          setLoading(false);
        }
        return; 
      }
      
      // Always fetch from API to ensure we have complete product data
      setLoading(true);
      try {
        const res = await api(`/api/public/products/${id}`);
        const p = res?.product;
        if (p && !ignore) {
          // Format product using utility (supports both new and legacy formats)
          const formatted = formatProductForDisplay(p);
          setProduct(formatted);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        if (!ignore) setError('Failed to load product details');
      } finally {
        if (!ignore) setLoading(false);
      }
    };
    fetchProduct();
    return () => { ignore = true; };
  }, [id, navProduct]);

  // Fetch "Complete the Look" products from the catalog (exclude current)
  useEffect(() => {
    const fetchRelated = async () => {
      try {
        const res = await api('/api/public/products?limit=12');
        const items = res?.products || res?.data || [];
        const filtered = items
          .filter((p) => (p.id || p._id) !== (product.id || product._id))
          .slice(0, 4)
          .map((p) => ({
            id: p.id || p._id,
            name: p.title || p.name,
            price: p.price || p.basePrice || 0,
            image: p.mainImage || p.image || p.images?.[0],
            discount: p.discount || 0,
          }))
          .filter((p) => p.image);
        setCompleteLookProducts(filtered);
      } catch (e) {
        // silently ignore; section will hide if empty
      }
    };
    fetchRelated();
  }, [product.id]);

  const title = product.title || product.name || 'Product';

  // Get current price (from resolved variant or base price)
  const currentPrice = useMemo(() => {
    if (resolvedVariant?.price) {
      return resolvedVariant.price;
    }
    return product.basePrice || product.price || 0;
  }, [resolvedVariant, product.basePrice, product.price]);

  // Handle color selection - now uses colorId
  const handleColorSelect = (colorValue) => {
    const colorId = colorValue.valueId || colorValue.id;
    if (colorId === selectedColorId) return;
    
    setIsImageTransitioning(true);
    setTimeout(() => {
      setSelectedColorId(colorId);
      
      // Auto-select first available size for this color
      const sizesForColor = getAvailableSizesForColor(product, colorId);
      if (sizesForColor.length > 0 && !selectedSizeId) {
        const defaultSize = sizesForColor[0];
        setSelectedSizeId(defaultSize.valueId || defaultSize.id);
        setSize(defaultSize.value || defaultSize.name);
      }
      
      setTimeout(() => setIsImageTransitioning(false), 50);
    }, ANIMATION_DURATIONS.sm * 1000);
  };

  // Keyboard navigation for color selector
  const handleColorKeyDown = (event, colorValue) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleColorSelect(colorValue);
    } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      const currentIndex = colorValues.findIndex((c) => (c.valueId || c.id) === selectedColorId);
      const direction = event.key === 'ArrowRight' ? 1 : -1;
      const nextIndex = (currentIndex + direction + colorValues.length) % colorValues.length;
      handleColorSelect(colorValues[nextIndex]);
      const buttons = colorSelectorRef.current?.querySelectorAll('button');
      if (buttons && buttons[nextIndex]) {
        buttons[nextIndex].focus();
      }
    }
  };

  const handleAddToCart = async () => {
    setError('');
    
    // Validate selection
    if (!selectedColorId) {
      setError('Please select a color');
      return;
    }
    if (!selectedSizeId && availableSizesForColor.length > 0) {
      setError('Please select a size');
      return;
    }
    
    setIsAddingToCart(true);
    try {
      // Get resolved variant for pricing and variantId
      const variant = resolvedVariant || resolveVariant(product, {
        colorId: selectedColorId,
        sizeId: selectedSizeId,
      });
      
      // Calculate price (variant price or base price)
      const itemPrice = variant?.price || product.basePrice || product.price || 0;
      
      // Get color and size values for display
      const selectedColor = colorValues.find(c => (c.valueId || c.id) === selectedColorId);
      const selectedSize = sizeValues.find(s => (s.valueId || s.id) === selectedSizeId);
      
      await addToCart({
        productId: product.productId || product.id,
        title,
        price: itemPrice,
        image: images[0] || product.image,
        quantity: qty,
        size: selectedSize?.value || selectedSize?.name || size,
        color: selectedColor?.value || selectedColor?.name || selectedVariant?.color,
        variantId: resolvedVariant?.variantId || resolvedVariant?._id || resolvedVariant?.id || selectedVariantId,
      });
    } catch (e) {
      setError(e.message || 'Failed to add to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Lightbox handlers
  const openLightbox = (index) => {
    setLightboxImage(index);
    setLightboxOpen(true);
    setZoomLevel(1);
    document.body.style.overflow = 'hidden';
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setZoomLevel(1);
    document.body.style.overflow = '';
  };

  const nextImage = () => {
    setLightboxImage((prev) => (prev + 1) % images.length);
    setZoomLevel(1);
  };

  const prevImage = () => {
    setLightboxImage((prev) => (prev - 1 + images.length) % images.length);
    setZoomLevel(1);
  };

  // Touch handlers for mobile swipe
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) nextImage();
    if (isRightSwipe) prevImage();
  };

  // Keyboard handlers for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setLightboxOpen(false);
        setZoomLevel(1);
        document.body.style.overflow = '';
      } else if (e.key === 'ArrowLeft') {
        setLightboxImage((prev) => (prev - 1 + images.length) % images.length);
        setZoomLevel(1);
      } else if (e.key === 'ArrowRight') {
        setLightboxImage((prev) => (prev + 1) % images.length);
        setZoomLevel(1);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen, images.length]);

  // Check if size is in stock
  const isSizeInStock = (sizeOption) => {
    if (!product.inventory || Object.keys(product.inventory).length === 0) return true;
    return (product.inventory[sizeOption] || 0) > 0;
  };

  // Fetch reviews when Reviews tab is active
  const fetchReviews = useCallback(async () => {
    const productId = product.productId || product.id;
    if (!productId) return;
    setReviewsLoading(true);
    setReviewsError('');
    try {
      const data = await getProductReviews(productId, {
        page: 1,
        limit: 10,
        sort: 'newest'
      });
      setReviews(data.reviews || []);
      setAverageRating(data.averageRating || 0);
      setRatingDistribution(data.ratingDistribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 });
      setReviewsPagination(data.pagination || { current: 1, total: 0, totalReviews: 0 });
    } catch (err) {
      setReviewsError(err.message || 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  }, [product.productId, product.id]);

  const fetchMyReview = useCallback(async () => {
    if (!isAuthenticated || !token) return;
    const productId = product.productId || product.id;
    if (!productId) return;
    try {
      const review = await getMyReview(productId, token);
      setMyReview(review);
    } catch (err) {
      setMyReview(null);
    }
  }, [isAuthenticated, token, product.productId, product.id]);

  // Fetch reviews when Reviews tab is active
  useEffect(() => {
    if (activeTab === 'Reviews') {
      fetchReviews();
    }
  }, [activeTab, fetchReviews]);

  // Fetch user's review when authenticated and Reviews tab is active
  useEffect(() => {
    if (activeTab === 'Reviews' && isAuthenticated) {
      fetchMyReview();
    }
  }, [activeTab, isAuthenticated, fetchMyReview]);

  const handleReviewSuccess = () => {
    setShowReviewForm(false);
    fetchReviews();
    if (isAuthenticated) {
      fetchMyReview();
    }
  };

  // SEO data (using existing title variable from line 197)
  const seoDescription = product.description || `Shop ${title} at The Kapda Co. Premium customizable fashion and designer streetwear.`;
  const seoImage = images[0] || product.image || '';
  const seoUrl = `${import.meta.env.VITE_SITE_URL || 'https://thekapdaco.com'}/product/${id}`;

  // Generate JSON-LD structured data
  const productJsonLd = useMemo(() => {
    if (!product || !product.id) return null;
    
    return getProductJsonLd({
      id: product.id,
      name: title,
      price: currentPrice,
      originalPrice: product.originalPrice || product.compareAtPrice,
      image: seoImage,
      images: images,
      description: seoDescription,
      rating: averageRating,
      reviewCount: reviewsPagination.totalReviews,
      currency: 'INR',
      availability: resolvedVariant?.inventory > 0 ? 'InStock' : 'OutOfStock',
      brand: product.brand || 'The Kapda Co.',
      category: product.category || product.subcategory,
    });
  }, [product, title, currentPrice, seoImage, images, seoDescription, averageRating, reviewsPagination.totalReviews, resolvedVariant]);

  // Breadcrumb JSON-LD
  const breadcrumbJsonLd = useMemo(() => {
    return getBreadcrumbJsonLd([
      { name: 'Home', url: '/' },
      { name: 'Shop', url: '/shop' },
      { name: title, url: `/product/${id}` },
    ]);
  }, [title, id]);

  // Organization JSON-LD (global)
  const organizationJsonLd = useMemo(() => getOrganizationJsonLd(), []);

  return (
    <>
      <SEO 
        title={title}
        description={seoDescription}
        image={seoImage}
        url={seoUrl}
        type="product"
        keywords={`${title}, customizable fashion, designer streetwear, custom clothing`}
        canonical={seoUrl}
        jsonLd={[productJsonLd, breadcrumbJsonLd, organizationJsonLd].filter(Boolean)}
      />
    <main 
      className="bg-[var(--kc-bg-gradient)] min-h-screen"
      style={{ paddingTop: 'var(--nav-height, 110px)' }}
    >
      <div className="kc-container" style={{ paddingTop: 'var(--kc-gap-md)', paddingBottom: '120px' }}>
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex items-center gap-2 text-sm text-white/60">
            <li><Link to="/" className="hover:text-white/90 transition-colors">Home</Link></li>
            <li>/</li>
            <li><Link to="/shop" className="hover:text-white/90 transition-colors">Shop</Link></li>
            <li>/</li>
            <li className="text-white/90" aria-current="page">{title}</li>
          </ol>
        </nav>

        {loading ? (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="relative overflow-hidden rounded-[var(--kc-radius-md)] border border-white/15 bg-white/10" style={{ aspectRatio: '4/5' }}>
                <ProductCardSkeleton className="h-full w-full" />
              </div>
              <div className="flex gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-20 w-20 lg:h-24 lg:w-24 rounded-[var(--kc-radius-sm)] bg-white/10 animate-pulse" />
                ))}
              </div>
            </div>
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="h-4 w-24 bg-white/10 rounded animate-pulse" />
                <div className="h-8 w-3/4 bg-white/10 rounded animate-pulse" />
                <div className="h-6 w-32 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-white/10 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-white/10 rounded animate-pulse" />
              </div>
              <div className="h-12 w-full bg-white/10 rounded-[var(--kc-radius-md)] animate-pulse" />
              <div className="h-12 w-full bg-white/10 rounded-[var(--kc-radius-md)] animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
            {/* Gallery Section */}
            <section className="space-y-4">
              {/* Main Image */}
              <div 
                className="relative overflow-hidden rounded-[16px] border border-white/15 bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.12)] backdrop-blur-sm cursor-pointer group"
                style={{ aspectRatio: '4/5' }}
                onClick={() => openLightbox(activeImage)}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
                ref={galleryRef}
              >
                <AnimatePresence mode="wait">
                  {isImageTransitioning ? (
                    <motion.div
                      key="loading"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 flex items-center justify-center bg-white/5"
                    >
                      <LoadingSpinner size={32} color="var(--kc-gold-200)" />
                    </motion.div>
                  ) : (
                    <motion.img
                      key={images[activeImage] || 'default'}
                      src={images[activeImage] || product.image}
                      alt={`${title} - ${colorValues.find(c => (c.valueId || c.id) === selectedColorId)?.value || colorValues.find(c => (c.valueId || c.id) === selectedColorId)?.name || ''}`}
                      className="h-full w-full object-cover"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }}
                      loading={activeImage === 0 ? 'eager' : 'lazy'}
                    />
                  )}
                </AnimatePresence>
                
                {/* Zoom Icon Overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
                  <ZoomIn className="opacity-0 group-hover:opacity-100 transition-opacity text-white" size={32} />
                </div>

                {/* ETA Micro-card */}
                <div className="absolute bottom-4 right-4 rounded-[12px] border border-white/30 bg-white/90 backdrop-blur-sm px-3 py-2 text-xs text-[var(--kc-navy)] shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  <p className="font-semibold">Est. 3-5 days</p>
                  <p className="text-[10px] text-[var(--kc-ink-2)]">Free shipping</p>
                </div>
              </div>

              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto lg:flex-col lg:max-h-[400px] lg:overflow-y-auto">
                  {images.map((img, index) => (
                    <button
                      key={`${img}-${index}`}
                      type="button"
                      className={`relative h-20 w-20 lg:h-24 lg:w-24 flex-shrink-0 overflow-hidden rounded-[12px] border-2 transition-all duration-150 ${
                        index === activeImage 
                          ? 'border-[var(--kc-gold-200)] shadow-[0_2px_8px_rgba(211,167,95,0.3)]' 
                          : 'border-white/20 hover:border-white/40'
                      }`}
                      onClick={() => setActiveImage(index)}
                      aria-label={`View image ${index + 1} of ${images.length}`}
                    >
                      <img 
                        src={img} 
                        alt={`Product thumbnail ${index + 1}`} 
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Product Info Section */}
            <section className="space-y-6">
              <header className="space-y-3">
                <span className="kc-pill bg-white/20 text-white text-xs tracking-[0.3em]">Kapda Atelier</span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl text-white font-serif">{title}</h1>
                <p className="text-2xl font-bold text-[var(--kc-gold-200)]">₹{currentPrice?.toLocaleString('en-IN') || '0'}</p>
              </header>

              <div className="space-y-3 text-sm text-white/80">
                <p>Crafted on demand with archival-grade threads, each piece undergoes bespoke finishing before dispatch.</p>
                <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
                  <span>Made To Order</span>
                  <span>•</span>
                  <span>Free Shipping</span>
                  <span>•</span>
                  <span>Limited Edition</span>
                </div>
              </div>

              {/* Color Variant Selector */}
              {colorValues.length > 0 && (
                <ColorVariantSelector
                  ref={colorSelectorRef}
                  colorValues={colorValues}
                  selectedColorId={selectedColorId}
                  onSelect={handleColorSelect}
                  onKeyDown={handleColorKeyDown}
                />
              )}

              {/* Size Selector */}
              {availableSizesForColor.length > 0 && (
                <SizeSelector
                  label="Sizing"
                  options={availableSizesForColor}
                  value={selectedSizeId || size}
                  onChange={(sizeValue) => {
                    const sizeObj = typeof sizeValue === 'string' 
                      ? availableSizesForColor.find(s => (s.valueId || s.id) === sizeValue || s.value === sizeValue || s.name === sizeValue)
                      : sizeValue;
                    if (sizeObj) {
                      setSelectedSizeId(sizeObj.valueId || sizeObj.id);
                      setSize(sizeObj.value || sizeObj.name);
                    }
                  }}
                  inventory={product.inventory}
                  isInStock={isSizeInStock}
                />
              )}

              {/* Quantity Selector */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Quantity</p>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setQty(Math.max(1, qty - 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={18} />
                  </button>
                  <input 
                    type="number" 
                    min={1} 
                    max={10} 
                    step={1} 
                    value={qty} 
                    onChange={(event) => setQty(Math.max(1, Math.min(10, Number(event.target.value))))}
                    className="kc-input w-20 text-center"
                    aria-label="Quantity"
                  />
                  <button
                    type="button"
                    onClick={() => setQty(Math.min(10, qty + 1))}
                    className="flex h-10 w-10 items-center justify-center rounded-[12px] border border-white/20 bg-white/10 text-white hover:bg-white/20 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
                    aria-label="Increase quantity"
                  >
                    <Plus size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-[16px] border border-[var(--kc-danger)] bg-[var(--kc-danger)]/10 p-4 text-sm text-[var(--kc-danger)]">
                  {error}
                </div>
              )}

              {/* Primary CTAs */}
              <div className="flex flex-col gap-3">
                <KCButton 
                  className="flex-1 bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold py-3"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  icon={isAddingToCart ? <LoadingSpinner size={16} color="var(--kc-navy-900)" /> : null}
                >
                  {isAddingToCart ? 'Adding...' : 'Add To Bag'}
                </KCButton>
                <KCButton 
                  as={Link} 
                  to={`/customize/${product.id}`} 
                  variant="secondary" 
                  className="flex-1 border-2 border-[var(--kc-gold-200)] text-[var(--kc-gold-200)] hover:bg-[var(--kc-gold-200)]/10 py-3"
                >
                  Customise In Studio
                </KCButton>
              </div>

              {/* Trust Badges - Smaller 2x2 Grid */}
              <div className="grid grid-cols-2 gap-3">
                <TrustBadge icon={ShieldCheck} title="Premium Assurance" description="27-point inspection" />
                <TrustBadge icon={Truck} title="Insured Dispatch" description="Climate-controlled" />
                <TrustBadge icon={RefreshCcw} title="Flexible Exchanges" description="14-day policy" />
                <TrustBadge icon={Lock} title="Secure Payment" description="AES-256 encrypted" />
              </div>

              {/* Tabs */}
              <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
              <TabContent 
                activeTab={activeTab} 
                description={product.description}
                productId={product.productId || product.id}
                reviews={reviews}
                reviewsLoading={reviewsLoading}
                reviewsError={reviewsError}
                averageRating={averageRating}
                ratingDistribution={ratingDistribution}
                reviewsPagination={reviewsPagination}
                myReview={myReview}
                showReviewForm={showReviewForm}
                setShowReviewForm={setShowReviewForm}
                onReviewSuccess={handleReviewSuccess}
              />
            </section>
          </div>
        )}

        {/* Complete the Look Carousel */}
        {!loading && completeLookProducts.length > 0 && (
          <section className="mt-16 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-serif text-white">Complete the Look</h2>
              <Link to="/shop" className="text-sm text-white/60 hover:text-white/90 transition-colors">
                View All →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {completeLookProducts.map((item) => (
                <Link
                  key={item.id}
                  to={`/product/${item.id}`}
                  className="group relative overflow-hidden rounded-[16px] border border-white/15 bg-white/10 shadow-[0_4px_16px_rgba(0,0,0,0.12)] transition-all duration-200 hover:translate-y-[-4px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.18)]"
                >
                  <div className="relative aspect-[4/5] overflow-hidden">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                    <div className="absolute top-3 right-3">
                      <span className="rounded-full bg-[var(--kc-gold-200)] px-2 py-1 text-xs font-semibold text-[var(--kc-navy-900)]">
                        {item.discount ? `Buy the set -${item.discount}%` : 'Buy the set'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    <h3 className="text-sm font-semibold text-white truncate">{item.name}</h3>
                    <p className="text-sm font-bold text-[var(--kc-gold-200)]">₹{item.price.toLocaleString('en-IN')}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Sticky Purchase Bar */}
      <AnimatePresence>
        {showStickyBar && !loading && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: ANIMATION_DURATIONS.sm, ease: ANIMATION_EASE }}
            className="fixed inset-x-0 bottom-0 z-50 border-t border-white/20 bg-white/95 backdrop-blur-xl shadow-[0_-8px_32px_rgba(0,0,0,0.2)]"
          >
            <div className="kc-container">
              <div className="flex items-center gap-4 py-4">
                <div className="hidden md:block flex-1 min-w-0">
                  <div className="flex items-center gap-4">
                    {images[0] && (
                      <img
                        src={images[0]}
                        alt={title}
                        className="h-16 w-16 rounded-[12px] object-cover"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-semibold text-[var(--kc-navy)] truncate">{title}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-sm font-bold text-[var(--kc-gold-200)]">₹{currentPrice?.toLocaleString('en-IN') || '0'}</p>
                        {selectedColorId && (
                          <span className="text-xs text-[var(--kc-ink-2)]">• {colorValues.find(c => (c.valueId || c.id) === selectedColorId)?.value || colorValues.find(c => (c.valueId || c.id) === selectedColorId)?.name || ''}</span>
                        )}
                        <span className="text-xs text-[var(--kc-ink-2)]">• Size {size}</span>
                        <span className="text-xs text-[var(--kc-ink-2)]">• Qty {qty}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex-1 md:flex-none flex items-center gap-3">
                  <div className="md:hidden flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--kc-navy)] truncate">{title}</p>
                    <p className="text-xs font-bold text-[var(--kc-gold-200)]">₹{currentPrice?.toLocaleString('en-IN') || '0'}</p>
                  </div>
                  <KCButton 
                    className="flex-1 md:flex-none md:min-w-[200px] bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] hover:bg-[var(--kc-gold-300)] font-semibold py-3"
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    icon={isAddingToCart ? <LoadingSpinner size={16} color="var(--kc-navy-900)" /> : null}
                  >
                    {isAddingToCart ? 'Adding...' : 'Add To Bag'}
                  </KCButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-sm"
              onClick={closeLightbox}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-[61] flex items-center justify-center p-4"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                aria-label="Close lightbox"
              >
                <X size={24} />
              </button>
              <button
                onClick={prevImage}
                className="absolute left-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                aria-label="Previous image"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors focus-visible:outline-2 focus-visible:outline-white focus-visible:outline-offset-2"
                aria-label="Next image"
              >
                <ChevronRight size={24} />
              </button>
              <motion.img
                src={images[lightboxImage]}
                alt={`${title} - Image ${lightboxImage + 1}`}
                className="max-h-[90vh] max-w-[90vw] object-contain"
                style={{ transform: `scale(${zoomLevel})` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onWheel={(e) => {
                  e.preventDefault();
                  const delta = e.deltaY > 0 ? -0.1 : 0.1;
                  setZoomLevel((prev) => Math.max(1, Math.min(3, prev + delta)));
                }}
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">
                {lightboxImage + 1} / {images.length}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
    </>
  );
};

// Color Variant Selector with Swatches - Updated for new variant system
const ColorVariantSelector = React.forwardRef(({ colorValues, selectedColorId, onSelect, onKeyDown }, ref) => {
  const getColorValue = (colorName, hexValue) => {
    // Use hex value if provided, otherwise map from name
    if (hexValue) return hexValue;
    
    const colorMap = {
      'white': '#FFFFFF', 'off-white': '#F5F5DC', 'cream': '#FFFDD0', 'ivory': '#FFFFF0',
      'black': '#000000', 'charcoal': '#36454F', 'navy': '#000080', 'gray': '#808080',
      'slate': '#708090', 'pink': '#FFC0CB', 'rose': '#FF007F', 'blush': '#DE5D83',
      'brown': '#8B4513', 'tan': '#D2B48C', 'beige': '#F5F5DC', 'onyx': '#000000',
    };
    return colorMap[colorName?.toLowerCase().trim()] || '#CCCCCC';
  };

  // Support both new format (colorValues) and legacy format (variants)
  const colors = colorValues || [];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span>Colourway</span>
        {selectedColorId && (
          <span className="text-xs text-white/60">
            Selected: {colors.find(c => (c.valueId || c.id) === selectedColorId)?.value || colors.find(c => (c.valueId || c.id) === selectedColorId)?.name || ''}
          </span>
        )}
      </div>
      <div
        ref={ref}
        role="radiogroup"
        aria-label="Select color variant"
        className="flex flex-wrap gap-3"
      >
        {colors.map((colorValue) => {
          const colorId = colorValue.valueId || colorValue.id;
          const colorName = colorValue.value || colorValue.name || colorValue.color || '';
          const isSelected = colorId === selectedColorId;
          
          return (
            <button
              key={colorId}
              type="button"
              role="radio"
              aria-pressed={isSelected}
              aria-label={`Select color ${colorName}`}
              className="flex flex-col items-center gap-2 group"
              onClick={() => onSelect(colorValue)}
              onKeyDown={(e) => onKeyDown && onKeyDown(e, colorValue)}
            >
              <div
                className={`h-12 w-12 rounded-full border-2 transition-all duration-150 ${
                  isSelected
                    ? 'border-[var(--kc-gold-200)] shadow-[0_0_0_2px_rgba(211,167,95,0.3)] scale-110'
                    : 'border-white/40 hover:border-white/60'
                }`}
                style={{ backgroundColor: getColorValue(colorName, colorValue.hexValue || colorValue.hex) }}
              />
              {isSelected && (
                <span className="text-xs font-medium text-[var(--kc-gold-200)]">{colorName}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
});

ColorVariantSelector.displayName = 'ColorVariantSelector';

// Size Selector with Inventory - Updated for new variant system
const SizeSelector = ({ label, options = [], value, onChange, inventory = {}, isInStock }) => {
  // Support both new format (objects with valueId) and legacy format (strings)
  const normalizeOption = (option) => {
    if (typeof option === 'string') {
      return { valueId: option, value: option, name: option, id: option };
    }
    return option;
  };

  const normalizeValue = (val) => {
    if (!val) return null;
    if (typeof val === 'string') return val;
    return val.valueId || val.id || val.value || val.name;
  };

  const normalizedOptions = options.map(normalizeOption);
  const normalizedValue = normalizeValue(value);

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <span>{label}</span>
        {normalizedValue && (
          <span className="text-xs text-white/60">
            Selected: {normalizedOptions.find(o => (o.valueId || o.id) === normalizedValue)?.value || 
                       normalizedOptions.find(o => (o.valueId || o.id) === normalizedValue)?.name || 
                       normalizedValue}
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {normalizedOptions.map((option) => {
          const optionValue = option.value || option.name || option.valueId || option.id;
          const optionId = option.valueId || option.id || optionValue;
          const inStock = isInStock ? isInStock(optionValue) : (inventory[optionValue] || 0) > 0;
          const stockCount = inventory[optionValue] || 0;
          const isSelected = optionId === normalizedValue || optionValue === normalizedValue;
          
          return (
            <button
              key={optionId}
              type="button"
              disabled={!inStock}
              className={`rounded-full border-2 px-4 py-2 text-sm font-medium transition-all duration-150 ${
                isSelected
                  ? 'border-[var(--kc-gold-200)] bg-[var(--kc-gold-200)]/20 text-[var(--kc-gold-200)] shadow-[0_2px_8px_rgba(211,167,95,0.3)]'
                  : inStock
                  ? 'border-white/30 bg-white/10 text-white hover:border-white/50 hover:bg-white/15'
                  : 'border-white/10 bg-white/5 text-white/30 cursor-not-allowed opacity-50'
              } focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2`}
              onClick={() => inStock && onChange && onChange(option)}
              aria-label={`Select size ${optionValue}${!inStock ? ' (out of stock)' : ''}`}
              title={!inStock ? 'Out of stock' : stockCount > 0 ? `${stockCount} available` : ''}
            >
              {optionValue}
              {!inStock && <span className="ml-1 text-[10px]">(OOS)</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Trust Badge - Smaller
const TrustBadge = ({ icon: Icon, title, description }) => (
  <KCCard 
    muted 
    className="flex items-start gap-2 bg-white/10 border border-white/15 rounded-[16px] p-3 transition-all duration-200 hover:translate-y-[-4px] hover:shadow-[0_4px_16px_rgba(0,0,0,0.12)]"
  >
    <span className="inline-flex h-8 w-8 items-center justify-center rounded-[12px] border border-white/20 bg-white/20 text-[var(--kc-gold-200)] flex-shrink-0">
      <Icon size={14} />
    </span>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-white truncate">{title}</p>
      <p className="text-[10px] text-white/60 truncate">{description}</p>
    </div>
  </KCCard>
);

// Tabs
const Tabs = ({ activeTab, setActiveTab }) => (
  <div className="flex flex-wrap gap-2 border-b border-white/20 pb-2">
    {tabs.map((tab) => (
      <button
        key={tab}
        type="button"
        className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-150 ${
          activeTab === tab
            ? 'bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] shadow-[0_2px_8px_rgba(211,167,95,0.3)]'
            : 'text-white/70 hover:text-white hover:bg-white/10'
        } focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2`}
        onClick={() => {
          setActiveTab(tab);
          // Scroll to tab content
          const element = document.getElementById('tab-content');
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }}
        aria-label={`View ${tab} tab`}
      >
        {tab}
      </button>
    ))}
  </div>
);

// Tab Content with Enhanced Reviews
const TabContent = ({ 
  activeTab, 
  description, 
  productId,
  reviews = [], 
  reviewsLoading = false,
  reviewsError = '',
  averageRating = 0,
  ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
  reviewsPagination = { totalReviews: 0 },
  myReview = null,
  showReviewForm = false,
  setShowReviewForm = () => {},
  onReviewSuccess = () => {}
}) => {
  const [showAllReviews, setShowAllReviews] = useState(false);
  const displayedReviews = showAllReviews ? reviews : reviews.slice(0, 3);

  if (activeTab === 'Description') {
    return (
      <div id="tab-content" className="space-y-3 text-sm text-white/80">
        <p>{description || 'This piece is crafted in limited batches with artisanal finishing and bespoke detailing. Each garment is numbered and accompanied by a certificate of provenance.'}</p>
        <ul className="list-disc space-y-2 pl-5 text-white/70">
          <li>Signature satin-bound seams, hand-finished hems</li>
          <li>Inclusive of garment care kit and archival storage bag</li>
          <li>Complimentary alterations within 30 days</li>
        </ul>
      </div>
    );
  }

  if (activeTab === 'Materials & Care') {
    return (
      <div id="tab-content" className="space-y-3 text-sm text-white/80">
        <p>Handloom linen blend with eco-friendly dyes. Dry clean recommended to preserve weave integrity.</p>
        <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.3em] text-white/60">
          <Info size={14} /> Care concierge available for bespoke advice.
        </p>
      </div>
    );
  }

  if (activeTab === 'Reviews') {
    const totalReviews = reviewsPagination.totalReviews || reviews.length;
    
    return (
      <div id="tab-content" className="space-y-6">
        {/* Rating Summary */}
        <div className="rounded-[16px] border border-white/15 bg-white/10 p-4">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-3xl font-bold text-white">{averageRating.toFixed(1)}</p>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={16}
                    className={star <= Math.round(averageRating) ? 'fill-[var(--kc-gold-200)] text-[var(--kc-gold-200)]' : 'text-white/30'}
                  />
                ))}
              </div>
              <p className="text-xs text-white/60 mt-1">{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}</p>
            </div>
            <div className="flex-1 space-y-1">
              {[5, 4, 3, 2, 1].map((rating) => {
                const count = ratingDistribution[rating] || 0;
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
                return (
                  <div key={rating} className="flex items-center gap-2 text-xs">
                    <span className="w-8 text-white/60">{rating}★</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[var(--kc-gold-200)] transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-white/60">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Review Form */}
        <AnimatePresence>
          {showReviewForm && (
            <ReviewForm
              productId={productId}
              existingReview={myReview}
              onSuccess={onReviewSuccess}
              onCancel={() => setShowReviewForm(false)}
            />
          )}
        </AnimatePresence>

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size={32} color="var(--kc-gold-200)" />
          </div>
        ) : reviewsError ? (
          <div className="rounded-[16px] border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">
            {reviewsError}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-[16px] border border-white/15 bg-white/10 p-6 text-center">
            <p className="text-white/80 mb-4">No reviews yet. Be the first to review this product!</p>
            {!showReviewForm && (
              <KCButton 
                variant="secondary" 
                onClick={() => setShowReviewForm(true)}
                className="border-2 border-[var(--kc-gold-200)] text-[var(--kc-gold-200)] hover:bg-[var(--kc-gold-200)]/10"
              >
                Write a Review
              </KCButton>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedReviews.map((review) => (
              <div key={review.id} className="rounded-[16px] border border-white/15 bg-white/10 p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-white">{review.userName || 'Anonymous'}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          className={star <= review.rating ? 'fill-[var(--kc-gold-200)] text-[var(--kc-gold-200)]' : 'text-white/30'}
                        />
                      ))}
                      <span className="text-xs text-white/60">{formatReviewDate(review.createdAt)}</span>
                    </div>
                  </div>
                </div>
                {review.comment && (
                  <p className="text-sm text-white/80 mt-2">{review.comment}</p>
                )}
              </div>
            ))}
            {reviews.length > 3 && (
              <button
                onClick={() => setShowAllReviews(!showAllReviews)}
                className="text-sm text-[var(--kc-gold-200)] hover:text-[var(--kc-gold-300)] transition-colors"
              >
                {showAllReviews ? 'Show Less' : `View All ${reviews.length} Reviews`}
              </button>
            )}
            {!showReviewForm && (
              <KCButton 
                variant="secondary" 
                onClick={() => setShowReviewForm(true)}
                className="mt-4 border-2 border-[var(--kc-gold-200)] text-[var(--kc-gold-200)] hover:bg-[var(--kc-gold-200)]/10"
              >
                {myReview ? 'Edit Your Review' : 'Write a Review'}
              </KCButton>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div id="tab-content" className="space-y-3 text-sm text-white/80">
      <p>Ships within 3-5 business days via insured logistics. Returns accepted within 14 days with original packaging.</p>
      <p>International orders receive tailored documentation for customs facilitation.</p>
    </div>
  );
};

export default ProductDetail;
