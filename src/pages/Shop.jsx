import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { Filter, ChevronDown, X, SlidersHorizontal, Star, Loader2, Check, Eye } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { KCButton, KCCard, KCInput, GridSkeleton, ProductCardSkeleton } from '../components/ui';
import { api } from '../lib/api';
import { getCachedProducts, setCachedProducts } from '../lib/productCache';

const baseCategories = [
  { id: 'mens', label: 'Menswear', count: 0, query: 'men' },
  { id: 'womens', label: 'Womenswear', count: 0, query: 'women' },
  { id: 'accessories', label: 'Accoutrements', count: 0, query: 'accessories' },
];

const topLevelCategories = [
  { id: 'all', label: 'All' },
  { id: 't-shirts', label: 'T-Shirts' },
  { id: 'hoodies', label: 'Hoodies' },
  { id: 'accessories', label: 'Accessories' },
  { id: 'limited', label: 'Limited' },
];

const sortOptions = [
  { value: 'featured', label: 'Recommended' },
  { value: 'new', label: 'Latest' },
  { value: 'price-low', label: 'Price: Low → High' },
  { value: 'price-high', label: 'Price: High → Low' },
  { value: 'popular', label: 'Popular' },
];

// Mock designer avatars for hero
const featuredDesigners = [
  { id: 1, name: 'Atelier Noir', avatar: 'https://ui-avatars.com/api/?name=Atelier+Noir&background=D3A75F&color=fff&size=40' },
  { id: 2, name: 'Heritage', avatar: 'https://ui-avatars.com/api/?name=Heritage&background=1C2D48&color=fff&size=40' },
  { id: 3, name: 'Studio Luxe', avatar: 'https://ui-avatars.com/api/?name=Studio+Luxe&background=32495F&color=fff&size=40' },
  { id: 4, name: 'Couture', avatar: 'https://ui-avatars.com/api/?name=Couture&background=D9C8BC&color=000&size=40' },
];

const formatMaterial = (input = '') =>
  input
    .toString()
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
    .replace(/(^|\s)\w/g, (match) => match.toUpperCase());

const Shop = () => {
  const shouldReduceMotion = useReducedMotion();
  const [searchParams, setSearchParams] = useSearchParams();
  const [categoryMeta, setCategoryMeta] = useState(baseCategories);
  const [materials, setMaterials] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 15000 });
  const [priceStops, setPriceStops] = useState([]);
  const [inventory, setInventory] = useState({ all: [], mens: [], womens: [], accessories: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [livePreviewOpen, setLivePreviewOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const itemsPerPage = 12;

  // Initialize filters from URL params or defaults
  const [activeFilters, setActiveFilters] = useState(() => {
    const categoriesParam = searchParams.get('categories');
    const fabricsParam = searchParams.get('fabrics');
    const priceParam = searchParams.get('price');
    const ratingParam = searchParams.get('rating');
    
    return {
      categories: categoriesParam ? new Set(categoriesParam.split(',')) : new Set(baseCategories.map((cat) => cat.id)),
      fabrics: fabricsParam ? new Set(fabricsParam.split(',')) : new Set(),
      price: priceParam ? Number(priceParam) : 0,
      rating: ratingParam ? Number(ratingParam) : 0,
    };
  });

  const [sortBy, setSortBy] = useState(() => searchParams.get('sort') || 'featured');
  const [activeTopCategory, setActiveTopCategory] = useState(() => searchParams.get('topCategory') || 'all');

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (activeFilters.categories.size > 0) {
      params.set('categories', Array.from(activeFilters.categories).join(','));
    }
    if (activeFilters.fabrics.size > 0) {
      params.set('fabrics', Array.from(activeFilters.fabrics).join(','));
    }
    if (activeFilters.price > 0) {
      params.set('price', activeFilters.price.toString());
    }
    if (activeFilters.rating > 0) {
      params.set('rating', activeFilters.rating.toString());
    }
    if (sortBy !== 'featured') {
      params.set('sort', sortBy);
    }
    if (activeTopCategory !== 'all') {
      params.set('topCategory', activeTopCategory);
    }
    setSearchParams(params, { replace: true });
  }, [activeFilters, sortBy, activeTopCategory, setSearchParams]);

  useEffect(() => {
    let ignore = false;
    const mapProducts = (products = [], categoryKey) =>
      products.map((product) => {
        const rawMaterials = Array.isArray(product.materials)
          ? product.materials
          : product.material
          ? [product.material]
          : [];
        const formattedMaterials = rawMaterials.map(formatMaterial).filter(Boolean);

        const variants = product.variants || [];
        const availableColors = product.colors || [];
        
        const firstVariant = variants.find(v => v.images && v.images.length > 0);
        const variantImage = firstVariant?.images?.[0] || product.mainImage || product.images?.[0] || '';
        const hoverVariantImage = firstVariant?.images?.[1] || product.images?.[1] || '';

        return {
          id: product._id,
          name: product.title || product.name || 'Untitled Piece',
          price: Number(product.price) || 0,
          originalPrice: product.discountPrice || product.compareAtPrice || product.originalPrice || null,
          image: variantImage,
          hoverImage: hoverVariantImage,
          badge: product.badge || (product.isLimited ? 'Limited' : product.isNew ? 'New Arrival' : undefined),
          rating: Number(product.averageRating ?? product.rating) || undefined,
          reviewCount: product.reviewCount ?? product.totalReviews ?? undefined,
          currency: product.currency || '₹',
          categoryKey,
          materials: formattedMaterials,
          images: product.images,
          variants: variants,
          colors: availableColors,
          sizes: product.sizes || [],
          raw: product,
        };
      });

    const derivePriceStops = (maxPrice) => {
      if (!maxPrice) return [];
      const step = Math.max(1000, Math.round(maxPrice / 5 / 100) * 100);
      return Array.from({ length: 4 }, (_, index) => Math.min(maxPrice, step * (index + 1)));
    };

    const loadProducts = async () => {
      // Check cache first
      const cacheKey = 'shop-products-all';
      const cached = getCachedProducts(cacheKey);
      
      if (cached && !ignore) {
        const segmented = baseCategories.reduce((acc, category) => {
          acc[category.id] = cached[category.id] || [];
          return acc;
        }, {});
        segmented.all = [...(segmented.mens || []), ...(segmented.womens || []), ...(segmented.accessories || [])];
        
        setInventory(segmented);
        setCategoryMeta((prev) =>
          prev.map((category) => ({
            ...category,
            count: segmented[category.id]?.length || 0,
          })),
        );
        
        const materialSet = new Set();
        segmented.all.forEach((product) => {
          product.materials?.forEach((material) => {
            if (material) materialSet.add(material);
          });
        });
        
        const maxPrice = segmented.all.reduce((max, product) => Math.max(max, product.price || 0), 0);
        const normalizedMax = maxPrice ? Math.ceil(maxPrice / 500) * 500 : 12000;
        
        setMaterials(Array.from(materialSet).sort());
        setPriceRange({ min: 0, max: normalizedMax });
        setPriceStops(derivePriceStops(normalizedMax));
        
        const categoriesParam = searchParams.get('categories');
        const initialCategories = categoriesParam 
          ? new Set(categoriesParam.split(','))
          : new Set(
              baseCategories
                .filter((category) => (segmented[category.id] || []).length)
                .map((category) => category.id) || baseCategories.map((category) => category.id)
            );
        
        setActiveFilters((prev) => ({
          ...prev,
          categories: initialCategories,
          price: prev.price || normalizedMax,
        }));
        
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError('');
      try {
        // Parallel fetch all categories at once
        const responses = await Promise.all(
          baseCategories.map((category) => 
            api(`/api/public/products?category=${category.query}&limit=100`).catch(err => {
              console.error(`Failed to fetch ${category.query}:`, err);
              return { products: [] };
            })
          ),
        );

        if (ignore) return;

        const segmented = baseCategories.reduce((acc, category, index) => {
          const items = responses[index]?.products || [];
          acc[category.id] = mapProducts(items, category.id);
          return acc;
        }, {});

        const combined = [...(segmented.mens || []), ...(segmented.womens || []), ...(segmented.accessories || [])];
        segmented.all = combined;

        const materialSet = new Set();
        combined.forEach((product) => {
          product.materials?.forEach((material) => {
            if (material) materialSet.add(material);
          });
        });

        const maxPrice = combined.reduce((max, product) => Math.max(max, product.price || 0), 0);
        const normalizedMax = maxPrice ? Math.ceil(maxPrice / 500) * 500 : 12000;

        setInventory(segmented);
        setCategoryMeta((prev) =>
          prev.map((category) => ({
            ...category,
            count: segmented[category.id]?.length || 0,
          })),
        );
        setMaterials(Array.from(materialSet).sort());
        setPriceRange({ min: 0, max: normalizedMax });
        setPriceStops(derivePriceStops(normalizedMax));
        
        // Cache the results
        setCachedProducts(cacheKey, segmented);
        
        // Initialize filters from URL or defaults
        const categoriesParam = searchParams.get('categories');
        const initialCategories = categoriesParam 
          ? new Set(categoriesParam.split(','))
          : new Set(
              baseCategories
                .filter((category) => (segmented[category.id] || []).length)
                .map((category) => category.id) || baseCategories.map((category) => category.id)
            );
        
        setActiveFilters((prev) => ({
          ...prev,
          categories: initialCategories,
          price: prev.price || normalizedMax,
        }));
      } catch (err) {
        console.error('Failed to load shop products', err);
        if (!ignore) {
          setError(err.message || 'Unable to load the marketplace right now.');
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    };

    loadProducts();
    return () => {
      ignore = true;
    };
    // Only re-fetch if searchParams actually change (not on every render)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  const toggledSet = (set, value) => {
    const clone = new Set(set);
    clone.has(value) ? clone.delete(value) : clone.add(value);
    return clone;
  };

  const hasActiveFilters = useMemo(() => {
    const totalCategories = categoryMeta.filter((category) => category.count > 0).length;
    return (
      (activeFilters.categories.size > 0 && activeFilters.categories.size !== totalCategories) ||
      activeFilters.fabrics.size > 0 ||
      (activeFilters.price > 0 && activeFilters.price < priceRange.max) ||
      activeFilters.rating > 0
    );
  }, [activeFilters, categoryMeta, priceRange.max]);

  const appliedFilterTags = useMemo(() => {
    const tags = [];
    const totalCategories = categoryMeta.filter((category) => category.count > 0).length;
    if (activeFilters.categories.size && activeFilters.categories.size !== totalCategories) {
      activeFilters.categories.forEach((id) => {
        const label = categoryMeta.find((category) => category.id === id)?.label;
        if (label) tags.push(label);
      });
    }
    if (activeFilters.fabrics.size) {
      activeFilters.fabrics.forEach((fabric) => tags.push(fabric));
    }
    if (activeFilters.price && activeFilters.price < priceRange.max) {
      tags.push(`₹0–₹${activeFilters.price.toLocaleString('en-IN')}`);
    }
    if (activeFilters.rating) {
      tags.push(`${activeFilters.rating}★+`);
    }
    return tags;
  }, [activeFilters, categoryMeta, priceRange.max]);

  const filteredProducts = useMemo(() => {
    let list = inventory.all || [];

    // Apply top-level category filter
    if (activeTopCategory !== 'all') {
      if (activeTopCategory === 'limited') {
        list = list.filter((product) => product.badge === 'Limited' || product.raw?.isLimited);
      } else {
        // Filter by subcategory (simplified - would need actual subcategory data)
        list = list.filter((product) => {
          const name = (product.name || '').toLowerCase();
          const category = activeTopCategory.toLowerCase();
          return name.includes(category.replace('-', ' '));
        });
      }
    }

    if (activeFilters.categories.size) {
      list = list.filter((product) => activeFilters.categories.has(product.categoryKey));
    }

    if (activeFilters.fabrics.size) {
      list = list.filter((product) =>
        product.materials?.some((material) => activeFilters.fabrics.has(material)),
      );
    }

    if (activeFilters.price) {
      list = list.filter((product) => (product.price || 0) <= activeFilters.price);
    }

    if (activeFilters.rating) {
      list = list.filter((product) => (product.rating || 0) >= activeFilters.rating);
    }

    const sorted = [...list];
    if (sortBy === 'price-low') {
      sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
    } else if (sortBy === 'price-high') {
      sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
    } else if (sortBy === 'rating' || sortBy === 'popular') {
      sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'new') {
      sorted.sort((a, b) => new Date(b.raw?.createdAt || 0) - new Date(a.raw?.createdAt || 0));
    }

    return sorted;
  }, [inventory.all, activeFilters, sortBy, activeTopCategory]);

  // Pagination
  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, page * itemsPerPage);
  }, [filteredProducts, page]);

  const handleLoadMore = useCallback(() => {
    setPage((prev) => prev + 1);
  }, []);

  useEffect(() => {
    setHasMore(displayedProducts.length < filteredProducts.length);
  }, [displayedProducts.length, filteredProducts.length]);

  const handleQuickView = useCallback((product) => {
    setPreviewProduct(product);
    setLivePreviewOpen(true);
  }, []);

  const resetFilters = useCallback(() => {
    setActiveFilters({
      categories: new Set(categoryMeta.filter((category) => category.count > 0).map((category) => category.id)),
      fabrics: new Set(),
      price: priceRange.max,
      rating: 0,
    });
    setPage(1);
  }, [categoryMeta, priceRange.max]);

  const clearAllFilters = useCallback(() => {
    resetFilters();
    setActiveTopCategory('all');
    setSortBy('featured');
  }, [resetFilters]);

  // Custom Checkbox Component
  const CustomCheckbox = ({ checked, onChange, id, label, count }) => (
    <label
      htmlFor={id}
      className="flex items-center gap-3 cursor-pointer group"
            style={{ padding: 'var(--kc-gap-xs) 0' }}
    >
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={onChange}
          className="sr-only"
          aria-label={label}
        />
        <div
          className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ease-in-out flex items-center justify-center ${
            checked
              ? 'bg-[var(--kc-navy-700)] border-[var(--kc-navy-700)]'
              : 'bg-transparent border-white/40 group-hover:border-white/60'
          }`}
          style={{ boxShadow: checked ? '0 0 0 2px rgba(28, 45, 72, 0.1)' : 'none' }}
        >
          {checked && (
            <Check size={12} className="text-[var(--kc-gold-200)]" strokeWidth={3} />
          )}
        </div>
      </div>
      <span className="text-sm text-white/85 flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-white/55">{count}</span>}
    </label>
  );

  const FiltersContent = (
    <div className="flex flex-col gap-4 text-white/85">
      <div className="space-y-4">
        <FilterSection title="Category" defaultOpen={true}>
          {categoryMeta.map((category) => (
            <CustomCheckbox
              key={category.id}
              id={`filter-category-${category.id}`}
              checked={activeFilters.categories.has(category.id)}
              onChange={() => {
                setActiveFilters((prev) => ({
                  ...prev,
                  categories: toggledSet(prev.categories, category.id),
                }));
                setPage(1);
              }}
              label={category.label}
              count={category.count}
            />
          ))}
        </FilterSection>

        <div className="h-px bg-white/10" />

        <FilterSection title="Fabrication" defaultOpen={false}>
          {materials.length ? (
            <div className="space-y-2">
              {materials.map((fabric) => (
                <CustomCheckbox
                  key={fabric}
                  id={`filter-fabric-${fabric}`}
                  checked={activeFilters.fabrics.has(fabric)}
                  onChange={() => {
                    setActiveFilters((prev) => ({
                      ...prev,
                      fabrics: toggledSet(prev.fabrics, fabric),
                    }));
                    setPage(1);
                  }}
                  label={fabric}
                />
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/50 py-2">Materials surface once listings are available.</p>
          )}
        </FilterSection>

        <div className="h-px bg-white/10" />

        <FilterSection title="Price" defaultOpen={false}>
          <div className="space-y-3 py-2">
            <KCInput
              type="range"
              min={priceRange.min}
              max={priceRange.max || 5000}
              step={1000}
              value={activeFilters.price || priceRange.max}
              onChange={(event) => {
                setActiveFilters((prev) => ({ ...prev, price: Number(event.target.value) }));
                setPage(1);
              }}
              className="w-full"
            />
            <div className="flex items-center justify-between text-xs text-white/55">
              <span>₹{priceRange.min.toLocaleString('en-IN')}</span>
              <span>₹{(activeFilters.price || priceRange.max || 0).toLocaleString('en-IN')}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {(priceStops.length ? priceStops : [3000, 6000, 9000, 12000]).map((step) => (
                <button
                  key={step}
                  type="button"
                  className={`rounded-full border px-3 py-1 text-xs transition-all duration-150 ease-in-out ${
                    activeFilters.price === step
                      ? 'border-[var(--kc-gold-200)] text-[var(--kc-gold-200)] bg-[var(--kc-gold-200)]/10'
                      : 'border-white/25 text-white/60 hover:border-white/40'
                  }`}
                  onClick={() => {
                    setActiveFilters((prev) => ({ ...prev, price: step }));
                    setPage(1);
                  }}
                >
                  ≤ ₹{step.toLocaleString('en-IN')}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        <div className="h-px bg-white/10" />

        <FilterSection title="Rating" defaultOpen={false}>
          <div className="flex flex-col gap-2 py-2">
            {[5, 4, 3].map((rating) => (
              <button
                key={rating}
                type="button"
                className={`flex items-center justify-between rounded-[var(--kc-radius)] border px-3 py-2 text-sm transition-all duration-150 ease-in-out ${
                  activeFilters.rating === rating
                    ? 'border-[var(--kc-gold-200)] text-[var(--kc-gold-200)] bg-[var(--kc-gold-200)]/10'
                    : 'border-white/20 text-white/70 hover:border-white/30'
                }`}
                onClick={() => {
                  setActiveFilters((prev) => ({ ...prev, rating: prev.rating === rating ? 0 : rating }));
                  setPage(1);
                }}
              >
                <span className="flex items-center gap-2">
                  <Star size={16} className={activeFilters.rating === rating ? 'fill-[var(--kc-gold-200)] text-[var(--kc-gold-200)]' : ''} /> {rating} &amp; up
                </span>
                {activeFilters.rating === rating ? <span className="text-xs uppercase tracking-[0.3em]">Selected</span> : null}
              </button>
            ))}
          </div>
        </FilterSection>
      </div>

      <div className="flex gap-2 pt-2">
        <KCButton
          variant="secondary"
          onClick={resetFilters}
          className="flex-1"
        >
          Reset Filters
        </KCButton>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-4 py-2 rounded-full border border-white/25 bg-white/10 text-xs font-medium text-white/85 hover:bg-white/15 transition-all duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[var(--kc-bg-gradient)]" style={{ paddingTop: 'var(--nav-height, 110px)' }}>
      {/* Hero Section */}
      <section className="premium-noise relative overflow-hidden">
        <div className="kc-container" style={{ paddingTop: 'var(--kc-gap-lg)', paddingBottom: 'var(--kc-gap-md)' }}>
          <div 
            className="relative rounded-[var(--kc-radius-lg)] border border-white/15 p-10 text-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] backdrop-blur-2xl"
            style={{ 
              background: 'radial-gradient(circle at top, var(--kc-navy-700), transparent 65%), linear-gradient(135deg, rgba(4,8,16,0.9), rgba(4,4,9,0.65))',
              minHeight: '280px',
              paddingLeft: 'var(--kc-gap-md)',
              paddingRight: 'var(--kc-gap-md)',
            }}
          >
            {/* Gradient backdrop */}
            <div 
              className="absolute inset-0 opacity-[0.07] pointer-events-none rounded-[var(--kc-radius-lg)]"
              style={{
                background: 'linear-gradient(90deg, var(--kc-navy-900) 0%, var(--kc-navy-700) 100%)',
              }}
            />
            
            <motion.div 
              className="relative z-10 flex flex-col gap-8 md:flex-row md:items-end md:justify-between"
              initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
              animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="space-y-5">
                <motion.p 
                  className="kc-pill bg-white/10 text-xs tracking-[0.4em]"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                >
                  The Kapda Edit
                </motion.p>
                <motion.h1 
                  className="text-[clamp(2.4rem,4vw,4.4rem)] leading-tight"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 20 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  Designer Marketplace
                </motion.h1>
                <motion.p 
                  className="max-w-2xl text-base text-white/80"
                  initial={shouldReduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={shouldReduceMotion ? {} : { opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                >
                  Shop curated drops from resident ateliers, limited capsules, and collaborative collections. Filters adapt instantly as you explore.
                </motion.p>
                
                {/* Featured Designer Avatars */}
                <motion.div 
                  className="flex items-center gap-3 pt-2"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                >
                  {featuredDesigners.map((designer, index) => (
                    <motion.div
                      key={designer.id}
                      className="flex items-center gap-2"
                      title={designer.name}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.5 + index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                      whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                    >
                      <img
                        src={designer.avatar}
                        alt={designer.name}
                        className="w-10 h-10 rounded-full border-2 border-white/20 hover:border-[var(--kc-gold-200)] transition-colors duration-200"
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="kc-container" style={{ paddingTop: '24px', paddingBottom: '16px' }}>
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          {/* Filter Sidebar */}
          <aside 
            className="hidden h-max rounded-[var(--kc-radius)] border border-white/15 bg-white/8 p-6 text-white shadow-[var(--kc-shadow-sm)] backdrop-blur-2xl lg:block"
            style={{
              position: 'sticky',
              top: 'calc(var(--nav-height, 110px) + 16px)',
              maxHeight: 'calc(100vh - var(--nav-height, 110px) - 32px)',
              overflowY: 'auto',
            }}
          >
            {FiltersContent}
          </aside>

          {/* Products Section */}
          <section className="space-y-6">
            {/* Top Controls Bar */}
            <div className="flex flex-col gap-4 pb-2">
              {/* Category Chips & Sort */}
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  {topLevelCategories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => {
                        setActiveTopCategory(category.id);
                        setPage(1);
                      }}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 shop-category-chip ${
                        activeTopCategory === category.id
                          ? 'bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)]'
                          : 'bg-white/10 text-white/85 border border-white/20 hover:bg-white/15'
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                
                <div className="flex items-center gap-3">
                  <div className="relative shop-sort-select">
                    <select
                      value={sortBy}
                      onChange={(e) => {
                        setSortBy(e.target.value);
                        setPage(1);
                      }}
                      className="appearance-none bg-white/10 border border-white/20 rounded-[var(--kc-radius)] px-4 py-2 pr-10 text-sm text-white/85 focus:outline-2 focus:outline-[var(--kc-gold-200)] focus:outline-offset-2 transition-all duration-180 ease-in-out hover:bg-white/15"
                      aria-label="Sort products"
                    >
                      {sortOptions.map((option) => (
                        <option key={option.value} value={option.value} className="bg-[var(--kc-navy-900)]">
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/60" size={16} />
                  </div>
                </div>
              </div>

              {/* Results Count & Selected Filters */}
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-sm text-white/70" aria-live="polite" aria-atomic="true">
                    {loading ? 'Loading pieces…' : `${filteredProducts.length} result${filteredProducts.length === 1 ? '' : 's'}`}
                  </span>
                  {appliedFilterTags.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap">
                      {appliedFilterTags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs text-white/85"
                        >
                          {tag}
                          <button
                            type="button"
                            onClick={() => {
                              if (tag.includes('★')) {
                                setActiveFilters((prev) => ({ ...prev, rating: 0 }));
                              } else if (tag.includes('₹')) {
                                setActiveFilters((prev) => ({ ...prev, price: priceRange.max }));
                              } else if (categoryMeta.some((c) => c.label === tag)) {
                                const cat = categoryMeta.find((c) => c.label === tag);
                                if (cat) {
                                  setActiveFilters((prev) => ({
                                    ...prev,
                                    categories: toggledSet(prev.categories, cat.id),
                                  }));
                                }
                              } else {
                                setActiveFilters((prev) => ({
                                  ...prev,
                                  fabrics: toggledSet(prev.fabrics, tag),
                                }));
                              }
                              setPage(1);
                            }}
                            className="hover:text-white transition-colors"
                            aria-label={`Remove filter ${tag}`}
                          >
                            <X size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Error State */}
            {error ? (
              <KCCard className="border border-white/20 bg-white/10 py-10 text-center text-[var(--kc-navy)]">
                <h3 className="text-lg font-semibold">Marketplace temporarily unavailable</h3>
                <p className="mt-2 text-sm text-[var(--kc-ink-2)]">{error}</p>
                <KCButton className="mt-4" onClick={() => window.location.reload()}>
                  Retry
                </KCButton>
              </KCCard>
            ) : null}

            {/* Loading State */}
            {loading ? (
              <GridSkeleton items={6} columns={3} renderItem={ProductCardSkeleton} />
            ) : null}

            {/* Empty State */}
            {!loading && !error && filteredProducts.length === 0 ? (
              <KCCard className="border border-dashed border-white/25 bg-white/10 py-16 text-center text-[var(--kc-navy)]">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/20 text-[var(--kc-gold-1)]">
                  <Loader2 className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">We couldn't find matches</h3>
                <p className="mt-2 text-sm text-[var(--kc-ink-2)]">Adjust filters to explore more designer drops.</p>
              </KCCard>
            ) : null}

            {/* Product Grid */}
            {!loading && !error && displayedProducts.length > 0 ? (
              <>
                <div className="grid gap-8 sm:grid-cols-2 xl:grid-cols-3 shop-products-grid">
                  {displayedProducts.map((product, index) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.18, delay: index * 0.03, ease: [0.16, 1, 0.3, 1] }}
                      className="shop-product-card-wrapper"
                    >
                      <ProductCard 
                        {...product} 
                        onQuickView={handleQuickView}
                      />
                    </motion.div>
                  ))}
                </div>

                {/* Load More Button */}
                {hasMore && (
                  <div className="flex justify-center pt-8">
                    <KCButton
                      variant="secondary"
                      onClick={handleLoadMore}
                      className="px-8"
                    >
                      Load More
                    </KCButton>
                  </div>
                )}
              </>
            ) : null}
          </section>
        </div>
      </section>

      {/* Mobile Filters */}
      <MobileFilters open={filterDrawerOpen} onClose={() => setFilterDrawerOpen(false)}>
        {FiltersContent}
      </MobileFilters>

      {/* Live Preview Panel */}
      <LivePreviewPanel
        open={livePreviewOpen}
        onClose={() => setLivePreviewOpen(false)}
        product={previewProduct}
      />

      {/* Mobile Filter Button */}
      <button
        type="button"
        onClick={() => setFilterDrawerOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 lg:hidden px-6 py-3 rounded-full bg-[var(--kc-gold-200)] text-[var(--kc-navy-900)] font-semibold text-sm shadow-[0_4px_16px_rgba(211,167,95,0.4)] hover:bg-[var(--kc-gold-300)] hover:shadow-[0_6px_20px_rgba(211,167,95,0.5)] transition-all duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 active:scale-95 shop-mobile-filter-button"
        aria-label="Open filters"
      >
        <Filter size={18} className="inline-block mr-2" />
        Filters
      </button>
    </main>
  );
};

const FilterSection = ({ title, children, defaultOpen = false }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="space-y-3">
      <button
        type="button"
        className="flex w-full items-center justify-between text-sm font-semibold text-white py-1 focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2 rounded"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-label={`${open ? 'Collapse' : 'Expand'} ${title} filter`}
      >
        {title}
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-180 ease-in-out ${open ? 'rotate-180' : ''}`} 
        />
      </button>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {children}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
};

const MobileFilters = ({ open, onClose, children }) => (
  <AnimatePresence>
    {open ? (
      <motion.div 
        className="fixed inset-0 z-50 lg:hidden" 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
      >
        <button
          type="button"
          className="absolute inset-0 bg-black/40 border-0 p-0 cursor-pointer"
          onClick={onClose}
          aria-label="Close filter drawer"
        />
        <motion.aside
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-y-0 right-0 w-full max-w-xs overflow-y-auto border-l border-white/15 bg-[rgba(7,12,20,0.95)] p-6 text-white shadow-[var(--kc-shadow-md)] backdrop-blur-2xl"
        >
          <div className="mb-6 flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">Filters</h2>
            <button 
              type="button" 
              onClick={onClose} 
              className="rounded-[var(--kc-radius)] border border-white/20 p-2 text-white/70 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
              aria-label="Close filters"
            >
              <X size={16} />
            </button>
          </div>
          {children}
        </motion.aside>
      </motion.div>
    ) : null}
  </AnimatePresence>
);

const LivePreviewPanel = ({ open, onClose, product }) => {
  const navigate = useNavigate();
  
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose]);

  if (!product) return null;

  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-[var(--kc-navy-900)] border-l border-white/15 shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">Live Preview</h2>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-[var(--kc-radius)] border border-white/20 p-2 text-white/70 hover:bg-white/10 transition-colors focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
                  aria-label="Close preview"
                >
                  <X size={16} />
                </button>
              </div>
              
              {product.image && (
                <div className="relative aspect-[4/5] rounded-[var(--kc-radius-lg)] overflow-hidden mb-6 bg-white/5">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                  <p className="text-xl font-bold text-[var(--kc-gold-200)]">
                    {product.currency}{product.price?.toLocaleString('en-IN')}
                  </p>
                </div>

                {product.colors && product.colors.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/85 mb-2">Color</label>
                    <div className="flex gap-2 flex-wrap">
                      {product.colors.map((color, idx) => (
                        <button
                          key={idx}
                          type="button"
                          className="w-10 h-10 rounded-full border-2 border-white/30 hover:border-[var(--kc-gold-200)] transition-colors"
                          style={{ backgroundColor: color.toLowerCase() === 'white' ? 'var(--kc-white)' : color.toLowerCase() === 'black' ? 'var(--kc-ink)' : 'var(--kc-gray-500)' }}
                          aria-label={`Select color ${color}`}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {product.sizes && product.sizes.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-white/85 mb-2">Size</label>
                    <div className="flex gap-2 flex-wrap">
                      {product.sizes.map((size) => (
                        <button
                          key={size}
                          type="button"
                          className="px-4 py-2 rounded-[var(--kc-radius)] border border-white/20 bg-white/10 text-white/85 hover:bg-white/15 hover:border-[var(--kc-gold-200)] transition-all duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-[var(--kc-gold-200)] focus-visible:outline-offset-2"
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  <KCButton
                    className="flex-1"
                    onClick={() => {
                      onClose();
                      navigate(`/product/${product.id}`, {
                        state: {
                          id: product.id,
                          name: product.name,
                          price: product.price,
                          image: product.image,
                          images: product.images,
                          variants: product.variants,
                          colors: product.colors,
                          sizes: product.sizes,
                          ...product.raw
                        }
                      });
                    }}
                  >
                    View Details
                  </KCButton>
                  <KCButton
                    variant="secondary"
                    onClick={() => {
                      onClose();
                      navigate(`/customize/${product.id}`);
                    }}
                  >
                    Customize
                  </KCButton>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
};

export default Shop;
