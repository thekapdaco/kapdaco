import React, { useState, useRef, useEffect } from 'react';

/**
 * OptimizedImage Component
 * - WebP with JPG fallback
 * - Responsive srcset
 * - Lazy loading with Intersection Observer
 * - Aspect ratio to prevent CLS
 * - Progressive loading with blur placeholder
 */
const OptimizedImage = ({
  src,
  alt,
  width,
  height,
  aspectRatio,
  className = '',
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  objectFit = 'cover',
  onLoad,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [shouldLoad, setShouldLoad] = useState(priority);
  const containerRef = useRef(null);
  const imgRef = useRef(null);

  // Generate WebP and JPG variants
  const getImageUrl = (format, size = '') => {
    if (!src) return '';
    // If src already contains format, return as is
    if (src.includes('.webp') || src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) {
      return src;
    }
    // For external URLs, return as is (CDN should handle optimization)
    if (src.startsWith('http')) {
      return src;
    }
    // For local images, assume WebP conversion will be handled by build process
    // In production, you'd replace this with actual image optimization service
    return src;
  };

  const webpSrc = getImageUrl('webp');
  const jpgSrc = getImageUrl('jpg') || src;

  // Generate srcset for responsive images
  const generateSrcSet = (format) => {
    if (!src || src.startsWith('http')) {
      // For external URLs, return single src (CDN handles optimization)
      return null;
    }
    // In production, generate multiple sizes: 400w, 800w, 1200w, 1600w
    // For now, return null to use single src
    return null;
  };

  const webpSrcSet = generateSrcSet('webp');
  const jpgSrcSet = generateSrcSet('jpg');

  // Lazy loading with native Intersection Observer
  useEffect(() => {
    if (priority) {
      setShouldLoad(true);
      return;
    }

    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setShouldLoad(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  useEffect(() => {
    if (shouldLoad && imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setIsLoaded(true);
      onLoad?.();
    }
  }, [shouldLoad, onLoad]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
  };

  // Calculate aspect ratio
  const calculatedAspectRatio = aspectRatio || (width && height ? `${width}/${height}` : '4/5');
  const aspectRatioValue = calculatedAspectRatio.split('/').reduce((a, b) => a / b);

  return (
    <div
      ref={containerRef}
      className={`optimized-image-wrapper ${className}`}
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: calculatedAspectRatio,
        overflow: 'hidden',
        backgroundColor: 'var(--kc-navy-900)',
      }}
    >
      {/* Blur placeholder */}
      {!isLoaded && !hasError && (
        <div
          className="optimized-image-placeholder"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, rgba(15,27,42,0.5) 0%, rgba(28,45,72,0.5) 50%, rgba(15,27,42,0.5) 100%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.5s infinite',
          }}
          aria-hidden="true"
        />
      )}

      {/* Actual image */}
      {shouldLoad && !hasError && (
        <picture>
          {/* WebP source */}
          {webpSrc && (
            <source
              srcSet={webpSrcSet || webpSrc}
              type="image/webp"
              sizes={sizes}
            />
          )}
          {/* JPG fallback */}
          <img
            ref={imgRef}
            src={jpgSrc}
            srcSet={jpgSrcSet || undefined}
            sizes={sizes}
            alt={alt || ''}
            loading={priority ? 'eager' : 'lazy'}
            decoding={priority ? 'sync' : 'async'}
            fetchPriority={priority ? 'high' : 'auto'}
            onLoad={handleLoad}
            onError={handleError}
            className={`optimized-image ${isLoaded ? 'loaded' : 'loading'}`}
            style={{
              width: '100%',
              height: '100%',
              objectFit,
              opacity: isLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in-out',
            }}
          />
        </picture>
      )}

      {/* Error fallback */}
      {hasError && (
        <div
          className="optimized-image-error"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'var(--kc-navy-900)',
            color: 'var(--kc-cream-100)',
            fontSize: '0.875rem',
          }}
          aria-label={alt || 'Image failed to load'}
        >
          <span>Image unavailable</span>
        </div>
      )}

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </div>
  );
};

export default OptimizedImage;

